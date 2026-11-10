const { NotFoundError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class GetReservationHandler {
  constructor({ reservationRepository }) {
    this.reservationRepository = assertPort('reservationRepository', reservationRepository, ['findById']);
  }

  async execute({ reservationId }) {
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) throw new NotFoundError('Reserva não encontrada.');
    return reservation;
  }
}

module.exports = { GetReservationHandler };
