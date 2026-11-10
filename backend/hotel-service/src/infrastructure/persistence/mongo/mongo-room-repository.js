const { Room } = require('../../../domain/room');
const { toObjectId, translateWriteError } = require('./object-id');

const DUPLICATE_MESSAGE = 'Já existe um quarto com este número neste hotel.';

const toRoom = doc => new Room({
  id: doc._id.toHexString(),
  hotelId: doc.hotelId,
  number: doc.number,
  roomType: doc.roomType,
  floor: doc.floor ?? null,
  amenities: doc.amenities ?? [],
  status: doc.status,
  currentReservationId: doc.currentReservationId ?? null,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

const toDocument = room => ({
  hotelId: room.hotelId,
  number: room.number,
  roomType: room.roomType,
  floor: room.floor,
  amenities: room.amenities,
  status: room.status,
  currentReservationId: room.currentReservationId ?? null,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt
});

class MongoRoomRepository {
  constructor(db) {
    this.collection = db.collection('rooms');
  }

  async findById(id) {
    const _id = toObjectId(id);
    if (!_id) return null;
    const doc = await this.collection.findOne({ _id });
    return doc ? toRoom(doc) : null;
  }

  async findAll({ hotelId, status } = {}) {
    const filter = {};
    if (hotelId) filter.hotelId = hotelId;
    if (status) filter.status = status;
    const docs = await this.collection.find(filter).sort({ hotelId: 1, number: 1 }).toArray();
    return docs.map(toRoom);
  }

  async create(room) {
    try {
      const { insertedId } = await this.collection.insertOne(toDocument(room));
      return new Room({ ...room, id: insertedId.toHexString() });
    } catch (error) {
      throw translateWriteError(error, DUPLICATE_MESSAGE);
    }
  }

  async save(room) {
    try {
      // $set preserva campos que não pertencem ao modelo (ex.: marcação de seed).
      await this.collection.updateOne({ _id: toObjectId(room.id) }, { $set: toDocument(room) });
    } catch (error) {
      throw translateWriteError(error, DUPLICATE_MESSAGE);
    }
  }

  async delete(id) {
    await this.collection.deleteOne({ _id: toObjectId(id) });
  }
}

module.exports = { MongoRoomRepository };
