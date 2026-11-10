const { NotFoundError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class DeleteRoomHandler {
  constructor({ roomRepository }) {
    this.roomRepository = assertPort('roomRepository', roomRepository, ['findById', 'delete']);
  }

  async execute({ roomId }) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new NotFoundError('Room not found');
    room.assertCanBeDeleted();
    await this.roomRepository.delete(room.id);
  }
}

module.exports = { DeleteRoomHandler };
