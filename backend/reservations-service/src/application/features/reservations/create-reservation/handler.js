const crypto = require('node:crypto');
const { Reservation } = require('../../../../domain/reservation');
const { ConflictError, ValidationError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');
const { reservationEvent } = require('../../../reservation-events');

const generateCode = () => `RSV-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

// Tudo em uma transação SERIALIZABLE: idempotência, existência do hóspede, verificação de
// sobreposição com bloqueio (prevenção de overbooking), gravação e auditoria.
class CreateReservationHandler {
  constructor({ reservationRepository, guestRepository, idempotencyRepository, auditLog, outbox, unitOfWork, clock }) {
    this.reservationRepository = assertPort('reservationRepository', reservationRepository, ['hasOverlap', 'create']);
    this.guestRepository = assertPort('guestRepository', guestRepository, ['findById']);
    this.idempotencyRepository = assertPort('idempotencyRepository', idempotencyRepository);
    this.auditLog = assertPort('auditLog', auditLog);
    this.outbox = assertPort('outbox', outbox);
    this.unitOfWork = assertPort('unitOfWork', unitOfWork);
    this.clock = assertPort('clock', clock);
  }

  async execute({ idempotencyKey, consumer = 'reservations-api', changedBy, correlationId, ...props }) {
    if (!idempotencyKey) {
      throw new ValidationError('Idempotency-Key é obrigatória.');
    }

    return this.unitOfWork.transaction(async transaction => {
      // Verifica se essa requisição já foi processada.
      const previous = await this.idempotencyRepository.find(consumer, idempotencyKey, transaction);
      if (previous) return previous.response;

      const now = this.clock.now();
      const reservation = Reservation.create(props, { code: generateCode(), now });

      if (!(await this.guestRepository.findById(reservation.guestId, transaction))) {
        throw new ValidationError('guestId não corresponde a um hóspede cadastrado.');
      }
      if (await this.reservationRepository.hasOverlap(reservation, transaction)) {
        throw new ConflictError('Quarto indisponível nesse período.');
      }

      const created = await this.reservationRepository.create(reservation, transaction);
      await this.auditLog.record({
        reservationId: created.id,
        previousStatus: null,
        newStatus: created.status,
        changedBy: changedBy || consumer,
        reason: 'Reserva criada'
      }, transaction);

      // Evento na Outbox, na mesma transação (publicado depois pelo OutboxRelay).
      await this.outbox.add(reservationEvent('ReservationCreated', created, { correlationId, now }), transaction);

      // Salva a resposta para evitar duplicidade.
      await this.idempotencyRepository.save(consumer, idempotencyKey, created, transaction);
      return created;
    });
  }
}

module.exports = { CreateReservationHandler };
