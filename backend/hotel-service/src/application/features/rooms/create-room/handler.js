const { Room } = require('../../../../domain/room');
const { ValidationError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class CreateRoomHandler {
  constructor({ roomRepository, hotelRepository }) {
    this.roomRepository = assertPort('roomRepository', roomRepository, ['create']);
    this.hotelRepository = assertPort('hotelRepository', hotelRepository);
  }

  async execute(command) {
    const room = Room.create(command);
    if (!(await this.hotelRepository.findById(room.hotelId))) {
      throw new ValidationError('hotelId não corresponde a um hotel cadastrado.');
    }
    return this.roomRepository.create(room);
  }
}

module.exports = { CreateRoomHandler };
