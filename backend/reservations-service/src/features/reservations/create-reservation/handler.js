const { DateRange } = require('../../../domain/date-range');

class CreateReservationHandler {
  constructor({ reservationRepository, idempotencyRepository, unitOfWork }) {
    this.reservationRepository = reservationRepository;
    this.idempotencyRepository = idempotencyRepository;
    this.unitOfWork = unitOfWork;
  }

  async execute(command) {
    return this.unitOfWork.transaction(async () => {
      const previous = await this.idempotencyRepository.find(command.idempotencyKey);
      if (previous) return previous.response;
      const dateRange = new DateRange(command.checkInDate, command.checkOutDate);
      if (await this.reservationRepository.hasOverlap(command.roomId, dateRange)) {
        const error = new Error('Room is not available');
        error.statusCode = 409;
        throw error;
      }
      const reservation = { ...command, dateRange, status: 'confirmed' };
      await this.reservationRepository.save(reservation);
      await this.idempotencyRepository.save(command.idempotencyKey, { response: reservation });
      return reservation;
    });
  }
}

module.exports = { CreateReservationHandler };
