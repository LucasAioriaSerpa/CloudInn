const { NotFoundError } = require('../domain/errors');
const { reservationEvent } = require('./reservation-events');

// Fluxo comum a check-in, check-out e cancelamento: carrega com bloqueio, aplica a regra do
// domínio, grava, registra a auditoria e o evento na Outbox, tudo na mesma transação.
async function changeReservationStatus({ reservationRepository, auditLog, outbox, unitOfWork, clock }, { reservationId, changedBy, reason, eventType, correlationId }, apply) {
  return unitOfWork.transaction(async transaction => {
    const reservation = await reservationRepository.findById(reservationId, transaction);
    if (!reservation) throw new NotFoundError('Reserva não encontrada.');
    const previousStatus = reservation.status;
    const now = clock.now();
    apply(reservation, now);
    await reservationRepository.save(reservation, transaction);
    await auditLog.record({
      reservationId: reservation.id,
      previousStatus,
      newStatus: reservation.status,
      changedBy: changedBy || 'reservations-api',
      reason
    }, transaction);
    await outbox.add(reservationEvent(eventType, reservation, { correlationId, now }), transaction);
    return reservation;
  });
}

module.exports = { changeReservationStatus };
