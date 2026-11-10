const crypto = require('node:crypto');
const { sql, createRequest } = require('./connection');
const { Reservation } = require('../../domain/reservation');
const { ValidationError } = require('../../domain/errors');
const { isGuid, lowerGuid, toSqlDate, translateSqlError } = require('./sql-helpers');

// No banco os status ficam em maiúsculas (CHECK do ERD); na API e no domínio, em minúsculas.
const COLUMNS = `
  Id, Code, GuestId, HotelIdRef, RoomIdRef,
  CONVERT(char(10), CheckInDate, 23) AS CheckInDate,
  CONVERT(char(10), CheckOutDate, 23) AS CheckOutDate,
  Status, TotalAmount, OriginChannel, ActualCheckInAt, ActualCheckOutAt, CreatedAt, UpdatedAt`;

const toReservation = row => new Reservation({
  id: lowerGuid(row.Id),
  code: row.Code,
  guestId: lowerGuid(row.GuestId),
  hotelId: row.HotelIdRef,
  roomId: row.RoomIdRef,
  checkInDate: row.CheckInDate,
  checkOutDate: row.CheckOutDate,
  status: String(row.Status).toLowerCase(),
  totalAmount: Number(row.TotalAmount),
  originChannel: row.OriginChannel,
  actualCheckInAt: row.ActualCheckInAt,
  actualCheckOutAt: row.ActualCheckOutAt,
  createdAt: row.CreatedAt,
  updatedAt: row.UpdatedAt
});

const ERRORS = {
  duplicate: 'Código de reserva duplicado; tente novamente.',
  foreignKey: new ValidationError('guestId não corresponde a um hóspede cadastrado.')
};

function bindMutableFields(request, reservation) {
  request.input('RoomIdRef', sql.VarChar(50), reservation.roomId);
  request.input('CheckInDate', sql.Date, toSqlDate(reservation.checkInDate));
  request.input('CheckOutDate', sql.Date, toSqlDate(reservation.checkOutDate));
  request.input('Status', sql.VarChar(20), reservation.status.toUpperCase());
  request.input('TotalAmount', sql.Decimal(10, 2), reservation.totalAmount);
  request.input('OriginChannel', sql.VarChar(50), reservation.originChannel);
  request.input('ActualCheckInAt', sql.DateTime2(0), reservation.actualCheckInAt);
  request.input('ActualCheckOutAt', sql.DateTime2(0), reservation.actualCheckOutAt);
  request.input('UpdatedAt', sql.DateTime2(0), reservation.updatedAt);
}

class SqlReservationRepository {
  // Dentro de uma transação, bloqueia a linha para atualização (evita alterações concorrentes).
  async findById(id, transaction) {
    if (!isGuid(id)) return null;
    const request = await createRequest(transaction);
    request.input('Id', sql.UniqueIdentifier, id);
    const { recordset } = await request.query(`
      SELECT ${COLUMNS} FROM dbo.Reservations ${transaction ? 'WITH (UPDLOCK, ROWLOCK)' : ''} WHERE Id = @Id;`);
    return recordset[0] ? toReservation(recordset[0]) : null;
  }

  async findAll({ hotelId, roomId, guestId, status, date } = {}) {
    if (guestId !== undefined && !isGuid(guestId)) return [];
    const request = await createRequest();
    const conditions = [];
    if (hotelId) { request.input('HotelIdRef', sql.VarChar(50), hotelId); conditions.push('HotelIdRef = @HotelIdRef'); }
    if (roomId) { request.input('RoomIdRef', sql.VarChar(50), roomId); conditions.push('RoomIdRef = @RoomIdRef'); }
    if (guestId) { request.input('GuestId', sql.UniqueIdentifier, guestId); conditions.push('GuestId = @GuestId'); }
    if (status) { request.input('Status', sql.VarChar(20), status.toUpperCase()); conditions.push('Status = @Status'); }
    if (date) { request.input('Day', sql.Date, toSqlDate(date)); conditions.push('CheckInDate <= @Day AND CheckOutDate > @Day'); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { recordset } = await request.query(`SELECT TOP (1000) ${COLUMNS} FROM dbo.Reservations ${where} ORDER BY CheckInDate, Code;`);
    return recordset.map(toReservation);
  }

  // Prevenção de overbooking (RF05): UPDLOCK + HOLDLOCK bloqueia o intervalo consultado até o fim
  // da transação SERIALIZABLE, então uma reserva concorrente para o mesmo quarto espera e depois vê esta.
  async hasOverlap(reservation, transaction) {
    const request = await createRequest(transaction);
    request.input('RoomIdRef', sql.VarChar(50), reservation.roomId);
    request.input('CheckInDate', sql.Date, toSqlDate(reservation.checkInDate));
    request.input('CheckOutDate', sql.Date, toSqlDate(reservation.checkOutDate));
    request.input('ExcludeId', sql.UniqueIdentifier, reservation.id ?? null);
    const { recordset } = await request.query(`
      SELECT TOP (1) 1 AS found
      FROM dbo.Reservations WITH (UPDLOCK, HOLDLOCK)
      WHERE RoomIdRef = @RoomIdRef
        AND Status IN ('CONFIRMED', 'ACTIVE')
        AND CheckInDate < @CheckOutDate
        AND CheckOutDate > @CheckInDate
        AND (@ExcludeId IS NULL OR Id <> @ExcludeId);`);
    return recordset.length > 0;
  }

  async create(reservation, transaction) {
    const id = crypto.randomUUID();
    const request = await createRequest(transaction);
    request.input('Id', sql.UniqueIdentifier, id);
    request.input('Code', sql.VarChar(20), reservation.code);
    request.input('GuestId', sql.UniqueIdentifier, reservation.guestId);
    request.input('HotelIdRef', sql.VarChar(50), reservation.hotelId);
    request.input('CreatedAt', sql.DateTime2(0), reservation.createdAt);
    bindMutableFields(request, reservation);
    try {
      await request.query(`
        INSERT INTO dbo.Reservations
          (Id, Code, GuestId, HotelIdRef, RoomIdRef, CheckInDate, CheckOutDate, Status, TotalAmount,
           OriginChannel, ActualCheckInAt, ActualCheckOutAt, CreatedAt, UpdatedAt)
        VALUES
          (@Id, @Code, @GuestId, @HotelIdRef, @RoomIdRef, @CheckInDate, @CheckOutDate, @Status, @TotalAmount,
           @OriginChannel, @ActualCheckInAt, @ActualCheckOutAt, @CreatedAt, @UpdatedAt);`);
    } catch (error) {
      throw translateSqlError(error, ERRORS);
    }
    return new Reservation({ ...reservation, id });
  }

  async save(reservation, transaction) {
    const request = await createRequest(transaction);
    request.input('Id', sql.UniqueIdentifier, reservation.id);
    bindMutableFields(request, reservation);
    try {
      await request.query(`
        UPDATE dbo.Reservations
        SET RoomIdRef = @RoomIdRef, CheckInDate = @CheckInDate, CheckOutDate = @CheckOutDate, Status = @Status,
            TotalAmount = @TotalAmount, OriginChannel = @OriginChannel, ActualCheckInAt = @ActualCheckInAt,
            ActualCheckOutAt = @ActualCheckOutAt, UpdatedAt = @UpdatedAt
        WHERE Id = @Id;`);
    } catch (error) {
      throw translateSqlError(error, ERRORS);
    }
  }
}

module.exports = { SqlReservationRepository };
