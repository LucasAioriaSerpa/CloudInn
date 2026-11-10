const { ROOM_STATUSES } = require('../../../../domain/room');
const { NotFoundError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

// Catálogo consumido pelo BFF: dados do hotel, quartos e contagem por status
// (base de totalRooms e occupiedRooms para o cálculo da Function).
class GetHotelCatalogHandler {
  constructor({ hotelRepository, roomRepository }) {
    this.hotelRepository = assertPort('hotelRepository', hotelRepository);
    this.roomRepository = assertPort('roomRepository', roomRepository, ['findAll']);
  }

  async execute({ hotelId }) {
    const hotel = await this.hotelRepository.findById(hotelId);
    if (!hotel) throw new NotFoundError('Hotel not found');
    const rooms = await this.roomRepository.findAll({ hotelId: hotel.id });
    const byStatus = Object.fromEntries(ROOM_STATUSES.map(status => [status, rooms.filter(room => room.status === status).length]));
    return { hotel, rooms, summary: { totalRooms: rooms.length, byStatus } };
  }
}

module.exports = { GetHotelCatalogHandler };
