const { CreateReservationHandler } = require('./features/reservations/create-reservation/handler');
const { ListReservationsHandler } = require('./features/reservations/list-reservations/handler');
const { GetReservationHandler } = require('./features/reservations/get-reservation/handler');
const { UpdateReservationHandler } = require('./features/reservations/update-reservation/handler');
const { CancelReservationHandler } = require('./features/reservations/cancel-reservation/handler');
const { CheckInReservationHandler } = require('./features/reservations/check-in-reservation/handler');
const { CheckOutReservationHandler } = require('./features/reservations/check-out-reservation/handler');
const { CreateGuestHandler } = require('./features/guests/create-guest/handler');
const { ListGuestsHandler } = require('./features/guests/list-guests/handler');
const { GetGuestHandler } = require('./features/guests/get-guest/handler');
const { UpdateGuestHandler } = require('./features/guests/update-guest/handler');
const { DeleteGuestHandler } = require('./features/guests/delete-guest/handler');

// Monta todos os casos de uso a partir dos adaptadores (portas) recebidos.
function createHandlers(ports) {
  return {
    createReservation: new CreateReservationHandler(ports),
    listReservations: new ListReservationsHandler(ports),
    getReservation: new GetReservationHandler(ports),
    updateReservation: new UpdateReservationHandler(ports),
    cancelReservation: new CancelReservationHandler(ports),
    checkInReservation: new CheckInReservationHandler(ports),
    checkOutReservation: new CheckOutReservationHandler(ports),
    createGuest: new CreateGuestHandler(ports),
    listGuests: new ListGuestsHandler(ports),
    getGuest: new GetGuestHandler(ports),
    updateGuest: new UpdateGuestHandler(ports),
    deleteGuest: new DeleteGuestHandler(ports)
  };
}

module.exports = { createHandlers };
