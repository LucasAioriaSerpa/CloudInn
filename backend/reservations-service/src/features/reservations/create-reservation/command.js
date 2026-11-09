class CreateReservationCommand {
  constructor({
    guestId,
    hotelId,
    roomId,
    checkInDate,
    checkOutDate,
    totalAmount,
    originChannel,
    idempotencyKey,
    consumer
  }) {
    Object.assign(this, {
      guestId,
      hotelId,
      roomId,
      checkInDate,
      checkOutDate,
      totalAmount,
      originChannel,
      idempotencyKey,
      consumer
    });
  }
}

module.exports = {
  CreateReservationCommand
};