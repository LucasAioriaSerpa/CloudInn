const { ConflictError, NotFoundError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class UpdateReservationHandler {
  constructor({ reservationRepository, unitOfWork, clock }) {
    this.reservationRepository = assertPort('reservationRepository', reservationRepository, ['findById', 'hasOverlap', 'save']);
    this.unitOfWork = assertPort('unitOfWork', unitOfWork);
    this.clock = assertPort('clock', clock);
  }

  execute({ reservationId, changes }) {
    return this.unitOfWork.transaction(async transaction => {
      const reservation = await this.reservationRepository.findById(reservationId, transaction);
      if (!reservation) throw new NotFoundError('Reserva não encontrada.');
      reservation.update(changes, this.clock.now());
      // Revalida o calendário do quarto, ignorando a própria reserva.
      if (reservation.blocksRoom && await this.reservationRepository.hasOverlap(reservation, transaction)) {
        throw new ConflictError('Quarto indisponível nesse período.');
      }
      await this.reservationRepository.save(reservation, transaction);
      return reservation;
    });
  }
}

module.exports = { UpdateReservationHandler };
