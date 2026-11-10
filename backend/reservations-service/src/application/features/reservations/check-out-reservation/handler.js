const { assertPort } = require('../../../ports');
const { changeReservationStatus } = require('../../../change-reservation-status');

class CheckOutReservationHandler {
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
    return changeReservationStatus(this.ports, { reservationId, changedBy, reason: 'Check-out', eventType: 'CheckOutCompleted', correlationId }, (reservation, now) => reservation.checkOut(now));
  }
}

module.exports = { CheckOutReservationHandler };
