const { createEvent } = require('./events');

const SOURCE = '/cloudinn/reservations-service';

// Eventos de domínio da reserva (CloudEvents 1.0), gravados na Outbox na mesma transação da mudança.
function reservationEvent(type, reservation, { correlationId, now }) {
  return createEvent({
    type,
    source: SOURCE,
    subject: reservation.id,
    correlationId,
    now,
    data: {
      reservationId: reservation.id,
      code: reservation.code,
      hotelId: reservation.hotelId,
      roomId: reservation.roomId,
      guestId: reservation.guestId,
      checkInDate: reservation.checkInDate,
      checkOutDate: reservation.checkOutDate,
      status: reservation.status,
      totalAmount: reservation.totalAmount
    }
  });
}

module.exports = { reservationEvent };
