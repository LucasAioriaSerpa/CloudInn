const { ROOM_STATUSES } = require('../../../../domain/room');
const { ValidationError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class ListRoomsHandler {
  constructor({ roomRepository }) {
    this.roomRepository = assertPort('roomRepository', roomRepository, ['findAll']);
  }

  async execute({ hotelId, status } = {}) {
    if (status !== undefined && !ROOM_STATUSES.includes(status)) {
      throw new ValidationError(`status deve ser um de: ${ROOM_STATUSES.join(', ')}.`);
    }
    return this.roomRepository.findAll({ hotelId, status });
  }
}

module.exports = { ListRoomsHandler };
