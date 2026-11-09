const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CreateReservationHandler
} = require('../src/features/reservations/create-reservation/handler');

function createHandler({ hasConflict = false } = {}) {
  const savedReservations = [];
  const savedKeys = new Map();

  const handler = new CreateReservationHandler({
    reservationRepository: {
      createConfirmed: async command => {
        if (hasConflict) {
          const error = new Error('Quarto indisponível');
          error.statusCode = 409;
          throw error;
        }

        const reservation = {
          id: 'uuid-reserva-1',
          code: command.code,
          status: 'CONFIRMED'
        };

        savedReservations.push(reservation);

        return reservation;
      }
    },

    idempotencyRepository: {
      find: async (consumer, key) => {
        return savedKeys.get(`${consumer}:${key}`) || null;
      },

      save: async (consumer, key, value) => {
        savedKeys.set(`${consumer}:${key}`, value);
      }
    },

    unitOfWork: {
      transaction: async operation => operation({})
    }
  });

  return {
    handler,
    savedReservations
  };
}

const command = {
  guestId: '11111111-1111-1111-1111-111111111111',
  hotelId: 'hotel-1',
  roomId: 'room-1',
  checkInDate: '2026-11-10',
  checkOutDate: '2026-11-13',
  totalAmount: 450,
  originChannel: 'WEB',
  idempotencyKey: 'teste-001'
};

test('Cria reserva confirmada com idempotência', async () => {
  const { handler, savedReservations } = createHandler();

  const first = await handler.execute(command);
  const second = await handler.execute(command);

  assert.equal(first.status, 'CONFIRMED');
  assert.equal(second.reservationId, first.reservationId);
  assert.equal(savedReservations.length, 1);
});

test('Retorna conflito quando o quarto não está disponível', async () => {
  const { handler } = createHandler({
    hasConflict: true
  });

  await assert.rejects(
    () => handler.execute({
      ...command,
      idempotencyKey: 'teste-002'
    }),
    error => error.statusCode === 409
  );
});

test('Não permite valor total negativo', async () => {
  const { handler } = createHandler();

  await assert.rejects(
    () => handler.execute({
      ...command,
      totalAmount: -100,
      idempotencyKey: 'teste-003'
    }),
    error => error.statusCode === 400
  );
});