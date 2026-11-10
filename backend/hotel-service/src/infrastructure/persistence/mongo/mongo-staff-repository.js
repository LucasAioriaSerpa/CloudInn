const { Staff, OPTIONAL_TEXT_FIELDS } = require('../../../domain/staff');
const { toObjectId, translateWriteError } = require('./object-id');

const DUPLICATE_MESSAGE = 'username ou email já cadastrado.';
const BASE_FIELDS = ['hotelId', 'name', 'username', 'role', 'status', 'createdAt', 'updatedAt'];

const pick = (source, fields) => Object.fromEntries(fields.filter(field => source[field] !== undefined).map(field => [field, source[field]]));

const toStaff = doc => new Staff({
  id: doc._id.toHexString(),
  ...pick(doc, [...BASE_FIELDS, ...OPTIONAL_TEXT_FIELDS]),
  passwordHash: doc.passwordHash
});

// passwordHash não é enumerável na entidade, por isso é copiado explicitamente.
const toDocument = staff => ({
  ...pick(staff, [...BASE_FIELDS, ...OPTIONAL_TEXT_FIELDS]),
  passwordHash: staff.passwordHash
});

class MongoStaffRepository {
  constructor(db) {
    this.collection = db.collection('staff');
  }

  async findById(id) {
    const _id = toObjectId(id);
    if (!_id) return null;
    const doc = await this.collection.findOne({ _id });
    return doc ? toStaff(doc) : null;
  }

  async findByLogin(login) {
    const doc = await this.collection.findOne({ $or: [{ username: login }, { email: login }] });
    return doc ? toStaff(doc) : null;
  }

  async findAll({ hotelId, role, status, department } = {}) {
    const filter = pick({ hotelId, role, status, department }, ['hotelId', 'role', 'status', 'department']);
    const docs = await this.collection.find(filter).sort({ name: 1 }).toArray();
    return docs.map(toStaff);
  }

  async create(staff) {
    try {
      const { insertedId } = await this.collection.insertOne(toDocument(staff));
      return new Staff({ ...staff, id: insertedId.toHexString(), passwordHash: staff.passwordHash });
    } catch (error) {
      throw translateWriteError(error, DUPLICATE_MESSAGE);
    }
  }

  async save(staff) {
    const document = toDocument(staff);
    const unset = Object.fromEntries(OPTIONAL_TEXT_FIELDS.filter(field => document[field] === undefined).map(field => [field, '']));
    try {
      await this.collection.updateOne(
        { _id: toObjectId(staff.id) },
        { $set: document, ...(Object.keys(unset).length ? { $unset: unset } : {}) }
      );
    } catch (error) {
      throw translateWriteError(error, DUPLICATE_MESSAGE);
    }
  }

  async delete(id) {
    await this.collection.deleteOne({ _id: toObjectId(id) });
  }
}

module.exports = { MongoStaffRepository };
