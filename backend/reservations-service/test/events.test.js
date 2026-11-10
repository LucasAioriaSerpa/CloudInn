const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandlers } = require('../src/application/create-handlers');
const { OutboxRelay } = require('../src/infrastructure/messaging/outbox-relay');
const { loadConfig, ConfigError } = require('../src/config');
const { buildPorts, silentLogger } = require('./support/fakes');

async function setup() {
  const ports = buildPorts();
  const handlers = createHandlers(ports);
  const guest = await handlers.createGuest.execute({ name: 'Ana', document: '111' });
  const command = {
    guestId: guest.id, hotelId: 'h1', roomId: 'r1', checkInDate: '2026-11-10', checkOutDate: '2026-11-12',
    totalAmount: 400, idempotencyKey: 'k1', correlationId: 'demo-123'
  };
  return { ports, handlers, command };
}

test('Cada mudança de reserva grava um CloudEvent na Outbox, com o correlationId da requisição', async () => {
  const { ports, handlers, command } = await setup();
  const reservation = await handlers.createReservation.execute(command);
  await handlers.checkInReservation.execute({ reservationId: reservation.id, correlationId: 'demo-456' });
  await handlers.checkOutReservation.execute({ reservationId: reservation.id });

  const events = ports.outbox.events;
  assert.deepEqual(events.map(event => event.type), ['ReservationCreated', 'CheckInCompleted', 'CheckOutCompleted']);
  assert.deepEqual(events.map(event => event.correlationid), ['demo-123', 'demo-456', undefined]);
  const [created] = events;
  assert.equal(created.specversion, '1.0');
  assert.equal(created.source, '/cloudinn/reservations-service');
  assert.equal(created.subject, reservation.id);
  assert.deepEqual(
    { reservationId: created.data.reservationId, roomId: created.data.roomId, checkInDate: created.data.checkInDate, status: created.data.status },
    { reservationId: reservation.id, roomId: 'r1', checkInDate: '2026-11-10', status: 'confirmed' }
  );
  assert.equal(new Set(events.map(event => event.id)).size, 3, 'ids únicos');
});

test('Cancelamento gera ReservationCancelled; repetição idempotente não gera evento novo', async () => {
  const { ports, handlers, command } = await setup();
  const reservation = await handlers.createReservation.execute(command);
  await handlers.createReservation.execute(command); // mesma Idempotency-Key
  await handlers.cancelReservation.execute({ reservationId: reservation.id });
  assert.deepEqual(ports.outbox.events.map(event => event.type), ['ReservationCreated', 'ReservationCancelled']);
});

function fakeStore(items) {
  const state = { items: items.map(item => ({ ...item, status: 'PENDING' })) };
  return {
    state,
    withTransaction: operation => operation({}),
    fetchPending: async limit => state.items.filter(item => item.status === 'PENDING').slice(0, limit),
    markPublished: async id => { state.items.find(item => item.id === id).status = 'PUBLISHED'; },
    markFailed: async (id, attempts, final) => Object.assign(state.items.find(item => item.id === id), { retryCount: attempts, status: final ? 'FAILED' : 'PENDING' })
  };
}

test('OutboxRelay publica pendentes e marca como publicados', async () => {
  const published = [];
  const store = fakeStore([
    { id: 'o1', retryCount: 0, event: { id: 'e1', type: 'ReservationCreated' } },
    { id: 'o2', retryCount: 0, event: { id: 'e2', type: 'CheckInCompleted' } }
  ]);
  const relay = new OutboxRelay({ store, publisher: { publish: async event => published.push(event.id) }, logger: silentLogger });
  assert.deepEqual(await relay.tick(), { published: 2, failed: 0 });
  assert.deepEqual(published, ['e1', 'e2']);
  assert.ok(store.state.items.every(item => item.status === 'PUBLISHED'));
});

test('OutboxRelay: falha incrementa tentativas e, no limite, marca FAILED', async () => {
  const store = fakeStore([{ id: 'o1', retryCount: 0, event: { id: 'e1', type: 'ReservationCreated' } }]);
  const relay = new OutboxRelay({
    store, logger: silentLogger, maxAttempts: 3,
    publisher: { publish: async () => { throw new Error('broker fora do ar'); } }
  });
  await relay.tick();
  assert.deepEqual([store.state.items[0].retryCount, store.state.items[0].status], [1, 'PENDING']);
  await relay.tick();
  await relay.tick();
  assert.deepEqual([store.state.items[0].retryCount, store.state.items[0].status], [3, 'FAILED']);
  assert.deepEqual(await relay.tick(), { published: 0, failed: 0 }, 'FAILED não é reenviado');
});

test('Configuração de eventos: log é recusado em produção e servicebus exige a connection string', () => {
  const base = { AZURE_SQL_CONNECTION_STRING: 'Server=tcp:x;Database=y;', INTERNAL_API_KEY: 'k' };
  assert.equal(loadConfig(base).eventPublisher, 'log');
  assert.throws(() => loadConfig({ ...base, NODE_ENV: 'production' }), error => error instanceof ConfigError && error.invalid.includes('EVENT_PUBLISHER'));
  assert.throws(() => loadConfig({ ...base, EVENT_PUBLISHER: 'servicebus' }), error => error.missing.includes('SERVICEBUS_CONNECTION'));
  const config = loadConfig({ ...base, NODE_ENV: 'production', EVENT_PUBLISHER: 'servicebus', SERVICEBUS_CONNECTION: 'Endpoint=sb://x/' });
  assert.equal(config.serviceBus.subscription, 'sub-reservations-service');
});
