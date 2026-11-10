const { CreateRoomHandler } = require('./features/rooms/create-room/handler');
const { ListRoomsHandler } = require('./features/rooms/list-rooms/handler');
const { GetRoomHandler } = require('./features/rooms/get-room/handler');
const { UpdateRoomHandler } = require('./features/rooms/update-room/handler');
const { ChangeRoomStatusHandler } = require('./features/rooms/change-room-status/handler');
const { DeleteRoomHandler } = require('./features/rooms/delete-room/handler');
const { CreateStaffHandler } = require('./features/staff/create-staff/handler');
const { ListStaffHandler } = require('./features/staff/list-staff/handler');
const { GetStaffHandler } = require('./features/staff/get-staff/handler');
const { UpdateStaffHandler } = require('./features/staff/update-staff/handler');
const { DeleteStaffHandler } = require('./features/staff/delete-staff/handler');
const { VerifyStaffCredentialsHandler } = require('./features/staff/verify-staff-credentials/handler');
const { ApplyReservationEventHandler } = require('./features/rooms/apply-reservation-event/handler');
const { GetHotelCatalogHandler } = require('./features/hotels/get-hotel-catalog/handler');

// Monta todos os casos de uso a partir dos adaptadores (portas) recebidos.
function createHandlers(ports) {
  return {
    createRoom: new CreateRoomHandler(ports),
    listRooms: new ListRoomsHandler(ports),
    getRoom: new GetRoomHandler(ports),
    updateRoom: new UpdateRoomHandler(ports),
    changeRoomStatus: new ChangeRoomStatusHandler(ports),
    deleteRoom: new DeleteRoomHandler(ports),
    createStaff: new CreateStaffHandler(ports),
    listStaff: new ListStaffHandler(ports),
    getStaff: new GetStaffHandler(ports),
    updateStaff: new UpdateStaffHandler(ports),
    deleteStaff: new DeleteStaffHandler(ports),
    verifyStaffCredentials: new VerifyStaffCredentialsHandler(ports),
    getHotelCatalog: new GetHotelCatalogHandler(ports),
    applyReservationEvent: new ApplyReservationEventHandler(ports)
  };
}

module.exports = { createHandlers };
