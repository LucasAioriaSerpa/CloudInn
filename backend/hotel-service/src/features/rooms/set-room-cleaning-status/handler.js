class SetRoomCleaningStatusHandler {
  constructor({ roomRepository, eventPublisher }) {
    this.roomRepository = roomRepository;
    this.eventPublisher = eventPublisher;
  }

  async execute(command) {
    const room = await this.roomRepository.findById(command.roomId);
    if (!room) throw new Error('Room not found');
    room.changeStatus(command.status);
    await this.roomRepository.save(room);
    if (command.status === 'available') {
      await this.eventPublisher.publish({ type: 'RoomCleaningCompleted', roomId: room.id, staffId: command.staffId });
    }
    return room;
  }
}

module.exports = { SetRoomCleaningStatusHandler };
