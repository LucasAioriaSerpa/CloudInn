const { RESERVATION_STATUSES, toDateOnly } = require('../../../../domain/reservation');
const { ValidationError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

// Filtro date: reservas cuja estadia inclui o dia (check-in <= date < check-out).
class ListReservationsHandler {
  constructor({ reservationRepository }) {
    this.reservationRepository = assertPort('reservationRepository', reservationRepository, ['findAll']);
  }

  async execute({ hotelId, roomId, guestId, status, date } = {}) {
    if (status !== undefined && !RESERVATION_STATUSES.includes(status)) {
      throw new ValidationError(`status deve ser um de: ${RESERVATION_STATUSES.join(', ')}.`);
    }
    const day = date === undefined ? undefined : toDateOnly(date, 'date');
    return this.reservationRepository.findAll({ hotelId, roomId, guestId, status, date: day });
  }
}

module.exports = { ListReservationsHandler };
