const { NotFoundError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class GetRoomHandler {
  constructor({ roomRepository }) {
    this.roomRepository = assertPort('roomRepository', roomRepository, ['findById']);
  }

  async execute({ roomId }) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new NotFoundError('Room not found');
    return room;
  }
}

module.exports = { GetRoomHandler };
