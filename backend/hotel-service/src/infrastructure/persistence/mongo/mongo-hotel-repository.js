const { Hotel } = require('../../../domain/hotel');
const { toObjectId } = require('./object-id');

class MongoHotelRepository {
  constructor(db) {
    this.collection = db.collection('hotels');
  }

  async findById(id) {
    const _id = toObjectId(id);
    if (!_id) return null;
    const doc = await this.collection.findOne({ _id });
    if (!doc) return null;
    const { _id: objectId, seed, ...fields } = doc;
    return new Hotel({ ...fields, id: objectId.toHexString() });
  }
}

module.exports = { MongoHotelRepository };
