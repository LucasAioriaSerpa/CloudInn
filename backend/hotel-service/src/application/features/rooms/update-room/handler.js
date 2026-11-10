const { NotFoundError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class UpdateRoomHandler {
  constructor({ roomRepository }) {
    this.roomRepository = assertPort('roomRepository', roomRepository, ['findById', 'save']);
  }

  async execute({ roomId, changes }) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new NotFoundError('Room not found');
    room.update(changes);
    await this.roomRepository.save(room);
    return room;
  }
}

module.exports = { UpdateRoomHandler };
