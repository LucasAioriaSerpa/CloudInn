const { ConflictError, ValidationError } = require('./errors');

// Tipos e status conforme DOC/api/swagger.yaml e o modelo MongoDB do arc42.
const ROOM_TYPES = ['STD', 'DLX', 'SUI', 'PRE'];
const ROOM_STATUSES = ['available', 'reserved', 'occupied', 'dirty', 'cleaning'];
const STATUSES_BLOCKING_DELETE = ['reserved', 'occupied'];
const STATUSES_WITH_RESERVATION = ['reserved', 'occupied'];

// available → occupied: check-in sem reserva prévia no quarto (arc42, RF07).
const transitions = {
  available: ['reserved', 'occupied'],
  reserved: ['occupied', 'available'],
  occupied: ['dirty'],
  dirty: ['cleaning'],
  cleaning: ['available']
};

function requireText(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`O campo ${field} é obrigatório.`);
  }
  return value.trim();
}

class Room {
  // O construtor apenas reidrata dados já persistidos; use Room.create para novos quartos.
  constructor({ id, hotelId, number, roomType, floor = null, amenities = [], status = 'available', currentReservationId = null, createdAt, updatedAt }) {
    Object.assign(this, { id, hotelId, number, roomType, floor, amenities, status, currentReservationId, createdAt, updatedAt });
  }

  static create(props, now = new Date()) {
    const room = new Room({
      hotelId: requireText(props.hotelId, 'hotelId'),
      number: requireText(props.number, 'number'),
      roomType: props.roomType,
      floor: props.floor ?? null,
      amenities: props.amenities ?? [],
      status: props.status ?? 'available',
      createdAt: now,
      updatedAt: now
    });
    room.validate();
    return room;
  }

  update(changes, now = new Date()) {
    if (changes.status !== undefined && changes.status !== this.status) {
      throw new ValidationError('Para alterar o status, use PATCH /rooms/{id}/status.');
    }
    if (changes.number !== undefined) this.number = requireText(changes.number, 'number');
    if (changes.roomType !== undefined) this.roomType = changes.roomType;
    if (changes.floor !== undefined) this.floor = changes.floor;
    if (changes.amenities !== undefined) this.amenities = changes.amenities;
    this.validate();
    this.updatedAt = now;
  }

  changeStatus(nextStatus, now = new Date()) {
    if (!transitions[this.status]?.includes(nextStatus)) {
      throw new ConflictError(`Invalid room transition: ${this.status} -> ${nextStatus}`);
    }
    this.status = nextStatus;
    if (!STATUSES_WITH_RESERVATION.includes(nextStatus)) this.currentReservationId = null;
    this.updatedAt = now;
  }

  // Reações aos eventos de reserva (Reservas Service → Service Bus → Hotel Service).
  reserveFor(reservationId, now = new Date()) {
    this.changeStatus('reserved', now);
    this.currentReservationId = reservationId;
  }

  checkInFor(reservationId, now = new Date()) {
    this.changeStatus('occupied', now);
    this.currentReservationId = reservationId;
  }

  checkOut(now = new Date()) {
    this.changeStatus('dirty', now);
  }

  releaseReservation(reservationId, now = new Date()) {
    if (this.status !== 'reserved' || (this.currentReservationId && this.currentReservationId !== reservationId)) {
      throw new ConflictError('O quarto não está reservado para esta reserva.');
    }
    this.changeStatus('available', now);
  }

  assertCanBeDeleted() {
    if (STATUSES_BLOCKING_DELETE.includes(this.status)) {
      throw new ConflictError(`Quarto com status ${this.status} não pode ser excluído.`);
    }
  }

  validate() {
    if (!ROOM_TYPES.includes(this.roomType)) {
      throw new ValidationError(`roomType deve ser um de: ${ROOM_TYPES.join(', ')}.`);
    }
    if (!ROOM_STATUSES.includes(this.status)) {
      throw new ValidationError(`status deve ser um de: ${ROOM_STATUSES.join(', ')}.`);
    }
    if (this.floor !== null && !Number.isInteger(this.floor)) {
      throw new ValidationError('floor deve ser um número inteiro.');
    }
    if (!Array.isArray(this.amenities) || this.amenities.some(item => typeof item !== 'string')) {
      throw new ValidationError('amenities deve ser uma lista de textos.');
    }
  }
}

module.exports = { Room, ROOM_TYPES, ROOM_STATUSES };
