const crypto = require('node:crypto');
const { DateRange } = require('../../../../domain/date-range');
const {
  MissingIdempotencyKeyError,
  InvalidTotalAmountError
} = require('../../../../domain/errors');

class CreateReservationHandler {
  constructor({
    reservationRepository,
    idempotencyRepository,
    unitOfWork
  }) {
    this.reservationRepository = reservationRepository;
    this.idempotencyRepository = idempotencyRepository;
    this.unitOfWork = unitOfWork;
  }

  async execute(command) {
    return this.unitOfWork.transaction(async transaction => {
      const consumer = command.consumer || 'reservations-api';

      if (!command.idempotencyKey) {
        throw new MissingIdempotencyKeyError();
      }

      // Verifica se essa requisição já foi processada.
      const previous = await this.idempotencyRepository.find(
        consumer,
        command.idempotencyKey,
        transaction
      );

      if (previous) {
        return previous.response;
      }

      // Valida as datas.
      new DateRange(command.checkInDate, command.checkOutDate);

      // Valida o valor recebido.
      if (
        command.totalAmount === undefined ||
        command.totalAmount === null ||
        !Number.isFinite(Number(command.totalAmount)) ||
        Number(command.totalAmount) < 0
      ) {
        throw new InvalidTotalAmountError();
      }

      // Gera um código para a reserva.
      const code = `RSV-${crypto.randomBytes(5)
        .toString('hex')
        .toUpperCase()}`;

      // Cria a reserva no Azure SQL.
      const created = await this.reservationRepository.createConfirmed(
        {
          ...command,
          totalAmount: Number(command.totalAmount),
          code
        },
        transaction
      );

      const response = {
        reservationId: created.id,
        code: created.code,
        guestId: command.guestId,
        hotelId: command.hotelId,
        roomId: command.roomId,
        checkInDate: command.checkInDate,
        checkOutDate: command.checkOutDate,
        totalAmount: Number(command.totalAmount),
        status: created.status
      };

      // Salva a resposta para evitar duplicidade.
      await this.idempotencyRepository.save(
        consumer,
        command.idempotencyKey,
        {
          statusCode: 201,
          response
        },
        transaction
      );

      return response;
    });
  }
}

module.exports = {
  CreateReservationHandler
};
