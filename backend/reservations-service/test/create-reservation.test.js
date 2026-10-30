const test = require('node:test');
const assert = require('node:assert/strict');
const { CreateReservationHandler } = require('../src/features/reservations/create-reservation/handler');

test('Reservas Service cria reserva confirmada com idempotência', async () => {
  const saved = [];
  const keys = new Map();
  const handler = new CreateReservationHandler({
    reservationRepository: { hasOverlap: async () => false, save: async reservation => saved.push(reservation) },
    idempotencyRepository: { find: async key => keys.get(key), save: async (key, value) => keys.set(key, value) },
    unitOfWork: { transaction: operation => operation() }
  });
  const command = { id: 'r1', roomId: 'room-1', checkInDate: '2026-11-01', checkOutDate: '2026-11-03', idempotencyKey: 'ota-1' };
  const first = await handler.execute(command);
  const second = await handler.execute(command);
  assert.equal(first.status, 'confirmed');
  assert.equal(second.id, 'r1');
  assert.equal(saved.length, 1);
});

test('Reservas Service responde conflito para sobreposição', async () => {
  const handler = new CreateReservationHandler({
    reservationRepository: { hasOverlap: async () => true, save: async () => undefined },
    idempotencyRepository: { find: async () => undefined, save: async () => undefined },
    unitOfWork: { transaction: operation => operation() }
  });
  await assert.rejects(() => handler.execute({ roomId: 'room-1', checkInDate: '2026-11-01', checkOutDate: '2026-11-03', idempotencyKey: 'ota-2' }), error => error.statusCode === 409);
});
