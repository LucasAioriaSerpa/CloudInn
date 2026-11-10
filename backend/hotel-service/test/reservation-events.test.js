const test = require('node:test');
const assert = require('node:assert/strict');
const { Room } = require('../src/domain/room');
const { ApplyReservationEventHandler } = require('../src/application/features/rooms/apply-reservation-event/handler');
const { FakeRoomRepository, FakeEventInbox } = require('./support/fakes');
const { toServiceBusMessage, fromServiceBusMessage, InvalidEventError } = require('../src/infrastructure/messaging/cloud-events');
const { loadConfig, ConfigError } = require('../src/config');

const TODAY = '2026-11-10';

async function setup(status = 'available') {
  const rooms = new FakeRoomRepository();
  const room = await rooms.create(new Room({ hotelId: 'h1', number: '101', roomType: 'STD', status }));
  const handler = new ApplyReservationEventHandler({
    roomRepository: rooms,
    eventInbox: new FakeEventInbox(),
    clock: { now: () => new Date(`${TODAY}T12:00:00Z`) }
  });
  let sequence = 0;
  const event = (type, data = {}) => ({
    specversion: '1.0', id: `evt-${++sequence}`, source: '/cloudinn/reservations-service', type, time: new Date().toISOString(),
    data: { roomId: room.id, reservationId: 'res-1', checkInDate: TODAY, ...data }
  });
  return { rooms, roomId: room.id, handler, event };
}

test('Ciclo completo por eventos: reservado → ocupado → sujo, com a reserva vinculada', async () => {
  const { rooms, roomId, handler, event } = await setup();

  assert.equal((await handler.execute(event('ReservationCreated'))).outcome, 'applied');
  let room = await rooms.findById(roomId);
  assert.deepEqual([room.status, room.currentReservationId], ['reserved', 'res-1']);

  assert.equal((await handler.execute(event('CheckInCompleted'))).outcome, 'applied');
  room = await rooms.findById(roomId);
  assert.deepEqual([room.status, room.currentReservationId], ['occupied', 'res-1']);

  assert.equal((await handler.execute(event('CheckOutCompleted'))).outcome, 'applied');
  room = await rooms.findById(roomId);
  assert.deepEqual([room.status, room.currentReservationId], ['dirty', null]);
});

test('Check-in sem reserva prévia leva o quarto de available direto para occupied (arc42 RF07)', async () => {
  const { rooms, roomId, handler, event } = await setup();
  assert.equal((await handler.execute(event('CheckInCompleted'))).outcome, 'applied');
  assert.equal((await rooms.findById(roomId)).status, 'occupied');
});

test('Evento repetido (mesmo id) é ignorado: idempotência', async () => {
  const { rooms, roomId, handler, event } = await setup();
  const created = event('ReservationCreated');
  await handler.execute(created);
  await rooms.save(Object.assign(await rooms.findById(roomId), { status: 'available', currentReservationId: null }));
  assert.equal((await handler.execute(created)).outcome, 'duplicate');
  assert.equal((await rooms.findById(roomId)).status, 'available', 'não reaplicou');
});

test('Reserva futura não muda o status físico do quarto', async () => {
  const { rooms, roomId, handler, event } = await setup();
  const result = await handler.execute(event('ReservationCreated', { checkInDate: '2026-12-01' }));
  assert.deepEqual([result.outcome, result.reason], ['ignored', 'reserva futura']);
  assert.equal((await rooms.findById(roomId)).status, 'available');
});

test('Cancelamento libera só o quarto reservado para a mesma reserva', async () => {
  const { rooms, roomId, handler, event } = await setup();
  await handler.execute(event('ReservationCreated'));
  assert.equal((await handler.execute(event('ReservationCancelled', { reservationId: 'outra' }))).outcome, 'ignored');
  assert.equal((await handler.execute(event('ReservationCancelled'))).outcome, 'applied');
  assert.equal((await rooms.findById(roomId)).status, 'available');
});

test('Regra do quarto que impede a mudança: evento ignorado com motivo, sem erro', async () => {
  const { handler, event } = await setup('dirty');
  const result = await handler.execute(event('CheckInCompleted'));
  assert.equal(result.outcome, 'ignored');
  assert.match(result.reason, /status atual: dirty/);
});

test('Quarto inexistente e tipo desconhecido são ignorados', async () => {
  const { handler, event } = await setup();
  assert.equal((await handler.execute(event('CheckOutCompleted', { roomId: 'nao-existe' }))).reason, 'quarto não encontrado');
  assert.equal((await handler.execute(event('RoomCleaningCompleted'))).outcome, 'ignored');
});

test('Mensagem do Service Bus: CloudEvent ida e volta, envelope inválido é rejeitado', () => {
  const event = { specversion: '1.0', id: 'e1', source: '/s', type: 'CheckInCompleted', time: 't', correlationid: 'c1', data: {} };
  const message = toServiceBusMessage(event);
  assert.deepEqual([message.messageId, message.correlationId, message.subject], ['e1', 'c1', 'CheckInCompleted']);
  assert.deepEqual(fromServiceBusMessage({ body: Buffer.from(JSON.stringify(event)) }), event);
  assert.throws(() => fromServiceBusMessage({ body: '{x' }), InvalidEventError);
  assert.throws(() => fromServiceBusMessage({ body: { ...event, specversion: '0.3' } }), InvalidEventError);
});

test('Configuração de eventos: log é recusado em produção e servicebus exige a connection string', () => {
  const base = { MONGODB_URI: 'mongodb://servidor/banco', MONGODB_DB_NAME: 'cloudinn', INTERNAL_API_KEY: 'k' };
  assert.equal(loadConfig(base).eventPublisher, 'log');
  assert.throws(() => loadConfig({ ...base, NODE_ENV: 'production' }), error => error instanceof ConfigError && error.invalid.includes('EVENT_PUBLISHER'));
  assert.throws(() => loadConfig({ ...base, EVENT_PUBLISHER: 'servicebus' }), error => error.missing.includes('SERVICEBUS_CONNECTION'));
  const config = loadConfig({ ...base, NODE_ENV: 'production', EVENT_PUBLISHER: 'servicebus', SERVICEBUS_CONNECTION: 'Endpoint=sb://x/' });
  assert.deepEqual([config.serviceBus.topic, config.serviceBus.subscription], ['cloudinn.domain.events', 'sub-hotel-service']);
});
