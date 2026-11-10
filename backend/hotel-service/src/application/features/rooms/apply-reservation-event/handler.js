const { assertPort } = require('../../../ports');
const { ConflictError } = require('../../../../domain/errors');

// Consumidor da assinatura sub-hotel-service: aplica ao quarto físico os eventos do Reservas Service.
// Idempotente pelo id do evento (eventInbox). Quando a regra do quarto não permite a mudança,
// o evento é marcado como processado e o motivo é devolvido: reentregar não mudaria o resultado.
const HANDLED_TYPES = ['ReservationCreated', 'CheckInCompleted', 'CheckOutCompleted', 'ReservationCancelled'];

class ApplyReservationEventHandler {
  constructor({ roomRepository, eventInbox, clock }) {
    this.roomRepository = assertPort('roomRepository', roomRepository, ['findById', 'save']);
    this.eventInbox = assertPort('eventInbox', eventInbox);
    this.clock = assertPort('clock', clock);
  }

  async execute(event) {
    if (!HANDLED_TYPES.includes(event.type)) return { outcome: 'ignored', reason: 'tipo de evento não tratado por este serviço' };
    if (await this.eventInbox.has(event.id)) return { outcome: 'duplicate' };

    const { roomId, reservationId, checkInDate } = event.data ?? {};
    const room = roomId ? await this.roomRepository.findById(roomId) : null;
    let result;
    if (!room) {
      result = { outcome: 'ignored', reason: 'quarto não encontrado' };
    } else {
      const now = this.clock.now();
      result = this.apply(room, event.type, { reservationId, checkInDate, now });
      if (result.outcome === 'applied') await this.roomRepository.save(room);
    }

    await this.eventInbox.markProcessed(event.id, event.type);
    return { ...result, roomId: roomId ?? null };
  }

  apply(room, type, { reservationId, checkInDate, now }) {
    const before = room.status;
    try {
      switch (type) {
        case 'ReservationCreated':
          // O status físico só muda quando a estadia começa hoje; reservas futuras ficam no calendário (arc42 1.3).
          if (checkInDate > now.toISOString().slice(0, 10)) return { outcome: 'ignored', reason: 'reserva futura' };
          room.reserveFor(reservationId, now);
          break;
        case 'CheckInCompleted':
          if (room.status === 'occupied' && room.currentReservationId === reservationId) return { outcome: 'ignored', reason: 'já aplicado' };
          room.checkInFor(reservationId, now);
          break;
        case 'CheckOutCompleted':
          room.checkOut(now);
          break;
        case 'ReservationCancelled':
          room.releaseReservation(reservationId, now);
          break;
        default:
          return { outcome: 'ignored', reason: 'tipo de evento não tratado por este serviço' };
      }
    } catch (error) {
      if (error instanceof ConflictError) return { outcome: 'ignored', reason: `${error.message} (status atual: ${before})` };
      throw error;
    }
    return { outcome: 'applied', from: before, to: room.status };
  }
}

module.exports = { ApplyReservationEventHandler, HANDLED_TYPES };
