const transitions = {
  available: ['reserved'],
  reserved: ['occupied', 'available'],
  occupied: ['dirty'],
  dirty: ['cleaning'],
  cleaning: ['available']
};

class Room {
  constructor({ id, status = 'available' }) {
    this.id = id;
    this.status = status;
  }

  changeStatus(nextStatus) {
    if (!transitions[this.status]?.includes(nextStatus)) {
      throw new Error(`Invalid room transition: ${this.status} -> ${nextStatus}`);
    }
    this.status = nextStatus;
  }
}

module.exports = { Room };
