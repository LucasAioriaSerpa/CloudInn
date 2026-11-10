const test = require('node:test');
const assert = require('node:assert/strict');
const { Room } = require('../src/domain/room');
const { ChangeRoomStatusHandler } = require('../src/application/features/rooms/change-room-status/handler');

const clock = { now: () => new Date('2026-11-10T12:00:00Z') };

test('Hotel Service permite concluir limpeza e publica evento CloudEvents', async () => {
  const room = new Room({ id: 'r1', hotelId: 'h1', status: 'cleaning' });
  const events = [];
  const handler = new ChangeRoomStatusHandler({
    roomRepository: { findById: async () => room, save: async () => undefined },
    eventPublisher: { publish: async event => events.push(event) },
    clock
  });
  const result = await handler.execute({ roomId: 'r1', status: 'available', staffId: 's1', correlationId: 'demo-1' });
  assert.equal(result.status, 'available');
  const [event] = events;
  assert.equal(event.specversion, '1.0');
  assert.equal(event.type, 'RoomCleaningCompleted');
  assert.equal(event.source, '/cloudinn/hotel-service');
  assert.equal(event.correlationid, 'demo-1');
  assert.deepEqual(event.data, { roomId: 'r1', hotelId: 'h1', staffId: 's1', status: 'available' });
});

test('Hotel Service rejeita transição de status inválida', () => {
  const room = new Room({ id: 'r1', status: 'available' });
  assert.throws(() => room.changeStatus('cleaning'), error => error.name === 'ConflictError' && /Invalid room transition/.test(error.message));
});

test('Hotel Service sinaliza quarto inexistente com erro de domínio', async () => {
  const handler = new ChangeRoomStatusHandler({
    roomRepository: { findById: async () => undefined, save: async () => undefined },
    eventPublisher: { publish: async () => undefined },
    clock
  });
  await assert.rejects(() => handler.execute({ roomId: 'x', status: 'available' }), error => error.name === 'NotFoundError');
});
