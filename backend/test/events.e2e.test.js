// Fluxo de eventos ponta a ponta, em memória (sem Service Bus real):
// check-in pelo HTTP do Reservas Service → Outbox → OutboxRelay → "broker" em memória (mesmas
// conversões CloudEvents ↔ mensagem do Service Bus) → consumidor do Hotel → quarto ocupado,
// com o mesmo correlationId da requisição HTTP.
const test = require('node:test');
const assert = require('node:assert/strict');

const reservations = {
  fakes: require('../reservations-service/test/support/fakes'),
  handlers: require('../reservations-service/src/application/create-handlers'),
  http: require('../reservations-service/src/api/http-server'),
  relay: require('../reservations-service/src/infrastructure/messaging/outbox-relay'),
  cloudEvents: require('../reservations-service/src/infrastructure/messaging/cloud-events')
};
const hotel = {
  fakes: require('../hotel-service/test/support/fakes'),
  room: require('../hotel-service/src/domain/room'),
  handler: require('../hotel-service/src/application/features/rooms/apply-reservation-event/handler'),
  cloudEvents: require('../hotel-service/src/infrastructure/messaging/cloud-events')
};

test('Check-in muda o quarto no Hotel por evento, com o mesmo correlationId', async () => {
  // Hotel Service: quarto disponível e consumidor de eventos.
  const rooms = new hotel.fakes.FakeRoomRepository();
  const room = await rooms.create(new hotel.room.Room({ hotelId: 'h1', number: '101', roomType: 'STD', status: 'available' }));
  const consumer = new hotel.handler.ApplyReservationEventHandler({
    roomRepository: rooms,
    eventInbox: new hotel.fakes.FakeEventInbox(),
    clock: { now: () => new Date('2026-11-10T12:00:00Z') }
  });
  const consumed = [];

  // Broker em memória: serializa como o Service Bus e entrega ao consumidor do Hotel.
  const broker = {
    publish: async event => {
      const message = reservations.cloudEvents.toServiceBusMessage(event);
      const delivered = hotel.cloudEvents.fromServiceBusMessage({ body: Buffer.from(JSON.stringify(message.body)) });
      consumed.push({ event: delivered, result: await consumer.execute(delivered) });
    }
  };

  // Reservas Service: HTTP real, Outbox em memória e relay apontando para o broker.
  const ports = reservations.fakes.buildPorts();
  const outboxRows = [];
  ports.outbox = { add: async event => { outboxRows.push({ id: event.id, retryCount: 0, status: 'PENDING', event }); } };
  const relay = new reservations.relay.OutboxRelay({
    publisher: broker,
    logger: reservations.fakes.silentLogger,
    store: {
      withTransaction: operation => operation({}),
      fetchPending: async limit => outboxRows.filter(row => row.status === 'PENDING').slice(0, limit),
      markPublished: async id => { outboxRows.find(row => row.id === id).status = 'PUBLISHED'; },
      markFailed: async () => undefined
    }
  });
  const server = reservations.http.createHttpServer({ handlers: reservations.handlers.createHandlers(ports), logger: reservations.fakes.silentLogger });

  await reservations.fakes.withServer(server, async baseUrl => {
    const call = reservations.fakes.jsonClient(baseUrl);
    const guest = await call('POST', '/guests', { name: 'Ana', document: '111' });
    const created = await call('POST', '/reservations',
      { guestId: guest.body.id, hotelId: 'h1', roomId: room.id, checkInDate: '2026-11-10', checkOutDate: '2026-11-12', totalAmount: 400 },
      { 'idempotency-key': 'e2e-1', 'x-correlation-id': 'demo-criacao' });
    await relay.tick();
    assert.equal((await rooms.findById(room.id)).status, 'reserved', 'ReservationCreated → reserved');

    const checkin = await call('POST', `/reservations/${created.body.id}/checkin`, undefined, { 'x-correlation-id': 'demo-checkin' });
    assert.equal(checkin.status, 200);
    assert.equal((await rooms.findById(room.id)).status, 'reserved', 'antes do relay, o Hotel ainda não sabe');

    await relay.tick();
    const updated = await rooms.findById(room.id);
    assert.deepEqual([updated.status, updated.currentReservationId], ['occupied', created.body.id]);

    const checkinEvent = consumed.find(item => item.event.type === 'CheckInCompleted');
    assert.equal(checkinEvent.event.correlationid, 'demo-checkin', 'mesmo correlationId da requisição HTTP');
    assert.equal(checkinEvent.result.outcome, 'applied');
    assert.ok(outboxRows.every(row => row.status === 'PUBLISHED'));
  });
});
