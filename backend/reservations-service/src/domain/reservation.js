const { DateRange } = require('./date-range');
const { ConflictError, ValidationError } = require('./errors');

// Ciclo de vida (arc42, seção 1.3): pending → confirmed → active → completed; cancelamento a partir de pending ou confirmed.
const RESERVATION_STATUSES = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
const BLOCKING_STATUSES = ['confirmed', 'active']; // ocupam o calendário do quarto (arc42, seção 1.3)
const EDITABLE_STATUSES = ['pending', 'confirmed'];
// Origens conforme o ERD do arc42.
const ORIGIN_CHANNELS = ['DIRECT', 'BOOKING', 'AIRBNB', 'EXPEDIA'];

// Datas de estadia são dias (coluna DATE). Aceita "2026-11-10" ou um ISO com horário.
function toDateOnly(value, field) {
  if (typeof value !== 'string' || Number.isNaN(new Date(value).getTime())) {
    throw new ValidationError(`O campo ${field} deve ser uma data válida.`);
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date(value).toISOString().slice(0, 10);
}

function requireText(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`O campo ${field} é obrigatório.`);
  }
  return value.trim();
}

function toAmount(value) {
  const amount = Number(value);
  if (value === undefined || value === null || value === '' || !Number.isFinite(amount) || amount < 0) {
    throw new ValidationError('Valor total inválido.');
  }
  return Math.round(amount * 100) / 100;
}

class Reservation {
  // O construtor apenas reidrata dados já persistidos; use Reservation.create para novas reservas.
  constructor(props) {
    const fields = ['id', 'code', 'guestId', 'hotelId', 'roomId', 'checkInDate', 'checkOutDate', 'status', 'totalAmount',
      'originChannel', 'actualCheckInAt', 'actualCheckOutAt', 'createdAt', 'updatedAt'];
    for (const field of fields) this[field] = props[field] ?? null;
  }

  static create(props, { code, now = new Date() }) {
    const reservation = new Reservation({
      code,
      guestId: requireText(props.guestId, 'guestId'),
      hotelId: requireText(props.hotelId, 'hotelId'),
      roomId: requireText(props.roomId, 'roomId'),
      checkInDate: toDateOnly(props.checkInDate, 'checkInDate'),
      checkOutDate: toDateOnly(props.checkOutDate, 'checkOutDate'),
      totalAmount: toAmount(props.totalAmount),
      originChannel: props.originChannel ?? 'DIRECT',
      status: 'confirmed',
      createdAt: now,
      updatedAt: now
    });
    reservation.validate();
    return reservation;
  }

  get dateRange() {
    return new DateRange(this.checkInDate, this.checkOutDate);
  }

  get blocksRoom() {
    return BLOCKING_STATUSES.includes(this.status);
  }

  update(changes, now = new Date()) {
    if (!EDITABLE_STATUSES.includes(this.status)) {
      throw new ConflictError(`Reserva com status ${this.status} não pode ser alterada.`);
    }
    if (changes.roomId !== undefined) this.roomId = requireText(changes.roomId, 'roomId');
    if (changes.checkInDate !== undefined) this.checkInDate = toDateOnly(changes.checkInDate, 'checkInDate');
    if (changes.checkOutDate !== undefined) this.checkOutDate = toDateOnly(changes.checkOutDate, 'checkOutDate');
    if (changes.totalAmount !== undefined) this.totalAmount = toAmount(changes.totalAmount);
    if (changes.originChannel !== undefined) this.originChannel = changes.originChannel;
    this.validate();
    this.updatedAt = now;
  }

  // A data de referência é o dia em UTC.
  checkIn(now = new Date()) {
    this.assertStatus('confirmed', 'check-in');
    const today = now.toISOString().slice(0, 10);
    if (today < this.checkInDate) throw new ConflictError(`Check-in permitido a partir de ${this.checkInDate}.`);
    if (today >= this.checkOutDate) throw new ConflictError('O período da reserva já terminou.');
    this.status = 'active';
    this.actualCheckInAt = now;
    this.updatedAt = now;
  }

  checkOut(now = new Date()) {
    this.assertStatus('active', 'check-out');
    this.status = 'completed';
    this.actualCheckOutAt = now;
    this.updatedAt = now;
  }

  cancel(now = new Date()) {
    if (!EDITABLE_STATUSES.includes(this.status)) {
      throw new ConflictError(`Reserva com status ${this.status} não pode ser cancelada.`);
    }
    this.status = 'cancelled';
    this.updatedAt = now;
  }

  assertStatus(expected, action) {
    if (this.status !== expected) {
      throw new ConflictError(`Não é possível fazer ${action} de uma reserva com status ${this.status}.`);
    }
  }

  validate() {
    this.dateRange; // valida as datas (check-out depois do check-in)
    if (!RESERVATION_STATUSES.includes(this.status)) {
      throw new ValidationError(`status deve ser um de: ${RESERVATION_STATUSES.join(', ')}.`);
    }
    if (!ORIGIN_CHANNELS.includes(this.originChannel)) {
      throw new ValidationError(`originChannel deve ser um de: ${ORIGIN_CHANNELS.join(', ')}.`);
    }
  }
}

module.exports = { Reservation, RESERVATION_STATUSES, ORIGIN_CHANNELS, toDateOnly };
