const crypto = require('node:crypto');
const { sql, createRequest } = require('./connection');
const { Guest } = require('../../domain/guest');
const { ConflictError } = require('../../domain/errors');
const { isGuid, lowerGuid, translateSqlError } = require('./sql-helpers');

const COLUMNS = 'Id, Name, Document, Email, Phone, VipStatus, CreatedAt, UpdatedAt';

const toGuest = row => new Guest({
  id: lowerGuid(row.Id),
  name: row.Name,
  document: row.Document,
  email: row.Email,
  phone: row.Phone,
  vip: Boolean(row.VipStatus),
  createdAt: row.CreatedAt,
  updatedAt: row.UpdatedAt
});

const ERRORS = { duplicate: 'Já existe um hóspede com este documento.' };

function bindFields(request, guest) {
  request.input('Name', sql.NVarChar(150), guest.name);
  request.input('Document', sql.VarChar(30), guest.document);
  request.input('Email', sql.VarChar(120), guest.email);
  request.input('Phone', sql.VarChar(25), guest.phone);
  request.input('VipStatus', sql.Bit, guest.vip);
  request.input('UpdatedAt', sql.DateTime2(0), guest.updatedAt);
}

class SqlGuestRepository {
  async findById(id, transaction) {
    if (!isGuid(id)) return null;
    const request = await createRequest(transaction);
    request.input('Id', sql.UniqueIdentifier, id);
    const { recordset } = await request.query(`SELECT ${COLUMNS} FROM dbo.Guests WHERE Id = @Id;`);
    return recordset[0] ? toGuest(recordset[0]) : null;
  }

  async findByDocument(document) {
    const request = await createRequest();
    request.input('Document', sql.VarChar(30), document);
    const { recordset } = await request.query(`SELECT ${COLUMNS} FROM dbo.Guests WHERE Document = @Document;`);
    return recordset[0] ? toGuest(recordset[0]) : null;
  }

  async findAll({ search, document } = {}) {
    const request = await createRequest();
    const conditions = [];
    if (document) { request.input('Document', sql.VarChar(30), document); conditions.push('Document = @Document'); }
    if (search) {
      request.input('Search', sql.NVarChar(160), `%${search.replace(/[%_[]/g, '[$&]')}%`);
      conditions.push('(Name LIKE @Search OR Email LIKE @Search OR Document LIKE @Search)');
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { recordset } = await request.query(`SELECT TOP (500) ${COLUMNS} FROM dbo.Guests ${where} ORDER BY Name;`);
    return recordset.map(toGuest);
  }

  async create(guest) {
    const id = crypto.randomUUID();
    const request = await createRequest();
    request.input('Id', sql.UniqueIdentifier, id);
    request.input('CreatedAt', sql.DateTime2(0), guest.createdAt);
    bindFields(request, guest);
    try {
      await request.query(`
        INSERT INTO dbo.Guests (Id, Name, Document, Email, Phone, VipStatus, CreatedAt, UpdatedAt)
        VALUES (@Id, @Name, @Document, @Email, @Phone, @VipStatus, @CreatedAt, @UpdatedAt);`);
    } catch (error) {
      throw translateSqlError(error, ERRORS);
    }
    return new Guest({ ...guest, id });
  }

  async save(guest) {
    const request = await createRequest();
    request.input('Id', sql.UniqueIdentifier, guest.id);
    bindFields(request, guest);
    try {
      await request.query(`
        UPDATE dbo.Guests
        SET Name = @Name, Document = @Document, Email = @Email, Phone = @Phone, VipStatus = @VipStatus, UpdatedAt = @UpdatedAt
        WHERE Id = @Id;`);
    } catch (error) {
      throw translateSqlError(error, ERRORS);
    }
  }

  async hasReservations(id) {
    const request = await createRequest();
    request.input('Id', sql.UniqueIdentifier, id);
    const { recordset } = await request.query('SELECT TOP (1) 1 AS found FROM dbo.Reservations WHERE GuestId = @Id;');
    return recordset.length > 0;
  }

  async delete(id) {
    const request = await createRequest();
    request.input('Id', sql.UniqueIdentifier, id);
    try {
      await request.query('DELETE FROM dbo.Guests WHERE Id = @Id;');
    } catch (error) {
      throw translateSqlError(error, { foreignKey: new ConflictError('Hóspede com reservas não pode ser excluído.') });
    }
  }
}

module.exports = { SqlGuestRepository };
