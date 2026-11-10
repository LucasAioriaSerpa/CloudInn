const { assertPort } = require('../../../ports');
const { changeReservationStatus } = require('../../../change-reservation-status');

class CheckInReservationHandler {
  constructor({ reservationRepository, auditLog, outbox, unitOfWork, clock }) {
    this.ports = {
      reservationRepository: assertPort('reservationRepository', reservationRepository, ['findById', 'save']),
      auditLog: assertPort('auditLog', auditLog),
      outbox: assertPort('outbox', outbox),
      unitOfWork: assertPort('unitOfWork', unitOfWork),
      clock: assertPort('clock', clock)
    };
  }

  execute({ reservationId, changedBy, correlationId }) {
    return changeReservationStatus(this.ports, { reservationId, changedBy, reason: 'Check-in', eventType: 'CheckInCompleted', correlationId }, (reservation, now) => reservation.checkIn(now));
  }
}

module.exports = { CheckInReservationHandler };
