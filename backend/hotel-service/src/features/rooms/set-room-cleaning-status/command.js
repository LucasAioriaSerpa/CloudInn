class SetRoomCleaningStatusCommand {
  constructor({ roomId, status, staffId }) {
    this.roomId = roomId;
    this.status = status;
    this.staffId = staffId;
  }
}

module.exports = { SetRoomCleaningStatusCommand };
