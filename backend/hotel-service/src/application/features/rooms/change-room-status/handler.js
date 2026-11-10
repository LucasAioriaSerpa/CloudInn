const { NotFoundError, ValidationError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');
const { createEvent } = require('../../../events');

class ChangeRoomStatusHandler {
  constructor({ roomRepository, eventPublisher, clock }) {
    this.roomRepository = assertPort('roomRepository', roomRepository, ['findById', 'save']);
    this.eventPublisher = assertPort('eventPublisher', eventPublisher);
    this.clock = assertPort('clock', clock);
  }

  async execute({ roomId, status, staffId, correlationId }) {
    if (typeof status !== 'string' || status.trim() === '') {
      throw new ValidationError('O campo status é obrigatório.');
    }
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new NotFoundError('Room not found');
    const now = this.clock.now();
    room.changeStatus(status, now);
    await this.roomRepository.save(room);
    // Limpeza concluída: quarto liberado (RF11).
    if (status === 'available') {
      await this.eventPublisher.publish(createEvent({
        type: 'RoomCleaningCompleted',
        source: '/cloudinn/hotel-service',
        subject: room.id,
        correlationId,
        now,
        data: { roomId: room.id, hotelId: room.hotelId, staffId: staffId ?? null, status: room.status }
      }));
    }
    return room;
  }
}

module.exports = { ChangeRoomStatusHandler };
