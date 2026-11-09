const { sql } = require('./connection');

class SqlReservationRepository {
  async createConfirmed(command, transaction) {
    const request = new sql.Request(transaction);

    const code = command.code;

    request.input('Code', sql.NVarChar(50), code);
    request.input('GuestId', sql.UniqueIdentifier, command.guestId);
    request.input('HotelIdRef', sql.NVarChar(100), command.hotelId);
    request.input('RoomIdRef', sql.NVarChar(100), command.roomId);

    request.input(
      'CheckInDate',
      sql.DateTime2(0),
      new Date(command.checkInDate)
    );

    request.input(
      'CheckOutDate',
      sql.DateTime2(0),
      new Date(command.checkOutDate)
    );

    request.input(
      'TotalAmount',
      sql.Decimal(12, 2),
      command.totalAmount
    );

    request.input(
      'OriginChannel',
      sql.NVarChar(50),
      command.originChannel || null
    );

    request.output(
      'ReservationId',
      sql.UniqueIdentifier
    );

    try {
      const result = await request.execute(
        'dbo.CreateConfirmedReservation'
      );

      const reservation = result.recordset?.[0];

      return {
        id: result.output.ReservationId,
        code: reservation?.Code || code,
        status: reservation?.Status || 'CONFIRMED'
      };
    } catch (error) {
      if (error.number === 51003) {
        const conflict = new Error(
          'Quarto indisponível nesse período.'
        );

        conflict.statusCode = 409;

        throw conflict;
      }

      if (error.number === 51000 || error.number === 51001) {
        const validation = new Error(error.message);

        validation.statusCode = 400;

        throw validation;
      }

      throw error;
    }
  }
}

module.exports = {
  SqlReservationRepository
};