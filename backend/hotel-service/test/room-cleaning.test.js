const test = require('node:test');
const assert = require('node:assert/strict');
const { Room } = require('../src/domain/room');
const { SetRoomCleaningStatusHandler } = require('../src/features/rooms/set-room-cleaning-status/handler');

test('Hotel Service permite concluir limpeza e publica evento', async () => {
  const room = new Room({ id: 'r1', status: 'cleaning' });
  const events = [];
  const handler = new SetRoomCleaningStatusHandler({
    roomRepository: { findById: async () => room, save: async () => undefined },
    eventPublisher: { publish: async event => events.push(event) }
  });
  const result = await handler.execute({ roomId: 'r1', status: 'available', staffId: 's1' });
  assert.equal(result.status, 'available');
  assert.equal(events[0].type, 'RoomCleaningCompleted');
});

test('Hotel Service rejeita transição de status inválida', () => {
  const room = new Room({ id: 'r1', status: 'available' });
  assert.throws(() => room.changeStatus('cleaning'), /Invalid room transition/);
});
