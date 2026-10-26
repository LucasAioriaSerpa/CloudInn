class CreateReservationCommand {
  constructor({ id, guestId, hotelId, roomId, checkInDate, checkOutDate, idempotencyKey }) {
    Object.assign(this, { id, guestId, hotelId, roomId, checkInDate, checkOutDate, idempotencyKey });
  }
}

module.exports = { CreateReservationCommand };
