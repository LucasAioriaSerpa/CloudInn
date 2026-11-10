const { assertPort } = require('../../../ports');
const { changeReservationStatus } = require('../../../change-reservation-status');

// DELETE /reservations/:id cancela (status cancelled) em vez de apagar, preservando o histórico (RF03).
class CancelReservationHandler {
  constructor({ reservationRepository, auditLog, outbox, unitOfWork, clock }) {
    this.ports = {
      reservationRepository: assertPort('reservationRepository', reservationRepository, ['findById', 'save']),
      auditLog: assertPort('auditLog', auditLog),
      outbox: assertPort('outbox', outbox),
      unitOfWork: assertPort('unitOfWork', unitOfWork),
      clock: assertPort('clock', clock)
    };
  }

  execute({ reservationId, changedBy, reason, correlationId }) {
    return changeReservationStatus(this.ports, { reservationId, changedBy, reason: reason || 'Cancelamento', eventType: 'ReservationCancelled', correlationId }, (reservation, now) => reservation.cancel(now));
  }
}

module.exports = { CancelReservationHandler };
