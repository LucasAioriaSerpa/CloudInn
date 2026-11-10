// Adaptadores falsos para testes. Guardam cópias (como um banco) e reproduzem as regras do SQL:
// sobreposição só considera confirmed/active, documento único e transações serializadas.
const crypto = require('node:crypto');
const { Reservation } = require('../../src/domain/reservation');
const { Guest } = require('../../src/domain/guest');
const { ConflictError } = require('../../src/domain/errors');
const { createHandlers } = require('../../src/application/create-handlers');
const { createHttpServer } = require('../../src/api/http-server');

const copyReservation = reservation => new Reservation({ ...reservation });
const copyGuest = guest => new Guest({ ...guest });

class FakeReservationRepository {
  constructor() { this.items = new Map(); }
  async findById(id) { return this.items.has(id) ? copyReservation(this.items.get(id)) : null; }
  async findAll({ hotelId, roomId, guestId, status, date } = {}) {
    return [...this.items.values()]
      .filter(item => (!hotelId || item.hotelId === hotelId) && (!roomId || item.roomId === roomId)
        && (!guestId || item.guestId === guestId) && (!status || item.status === status)
        && (!date || (item.checkInDate <= date && item.checkOutDate > date)))
      .map(copyReservation);
  }
  async hasOverlap(reservation) {
    return [...this.items.values()].some(item => item.id !== reservation.id && item.roomId === reservation.roomId
      && ['confirmed', 'active'].includes(item.status)
      && item.checkInDate < reservation.checkOutDate && item.checkOutDate > reservation.checkInDate);
  }
  async create(reservation) {
    const saved = new Reservation({ ...reservation, id: crypto.randomUUID() });
    this.items.set(saved.id, saved);
    return copyReservation(saved);
  }
  async save(reservation) { this.items.set(reservation.id, copyReservation(reservation)); }
}

class FakeGuestRepository {
  constructor(reservations) { this.items = new Map(); this.reservations = reservations; }
  async findById(id) { return this.items.has(id) ? copyGuest(this.items.get(id)) : null; }
  async findByDocument(document) {
    const found = [...this.items.values()].find(guest => guest.document === document);
    return found ? copyGuest(found) : null;
  }
  async findAll({ search, document } = {}) {
    return [...this.items.values()]
      .filter(guest => (!document || guest.document === document)
        && (!search || [guest.name, guest.email, guest.document].some(value => value?.includes(search))))
      .map(copyGuest);
  }
  async create(guest) {
    if (await this.findByDocument(guest.document)) throw new ConflictError('Já existe um hóspede com este documento.');
    const saved = new Guest({ ...guest, id: crypto.randomUUID() });
    this.items.set(saved.id, saved);
    return copyGuest(saved);
  }
  async save(guest) { this.items.set(guest.id, copyGuest(guest)); }
  async hasReservations(id) { return [...this.reservations.items.values()].some(item => item.guestId === id); }
  async delete(id) { this.items.delete(id); }
}

class FakeIdempotencyRepository {
  constructor() { this.items = new Map(); }
  async find(consumer, key) { return this.items.get(`${consumer}:${key}`) ?? null; }
  async save(consumer, key, response) { this.items.set(`${consumer}:${key}`, { response: JSON.parse(JSON.stringify(response)) }); }
}

// Executa uma transação por vez, como o SERIALIZABLE + bloqueios faz no SQL Server para o mesmo quarto.
class FakeUnitOfWork {
  constructor() { this.queue = Promise.resolve(); }
  transaction(operation) {
    const run = this.queue.then(() => operation({}));
    this.queue = run.catch(() => undefined);
    return run;
  }
}

const silentLogger = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined };

function buildPorts({ now = '2026-11-10T12:00:00Z' } = {}) {
  const reservationRepository = new FakeReservationRepository();
  const audits = [];
  const outboxEvents = [];
  return {
    reservationRepository,
    guestRepository: new FakeGuestRepository(reservationRepository),
    idempotencyRepository: new FakeIdempotencyRepository(),
    auditLog: { record: async entry => { audits.push(entry); }, entries: audits },
    outbox: { add: async event => { outboxEvents.push(event); }, events: outboxEvents },
    unitOfWork: new FakeUnitOfWork(),
    clock: { now: () => new Date(now) }
  };
}

function buildTestServer(options = {}) {
  const ports = buildPorts(options);
  const server = createHttpServer({
    handlers: createHandlers(ports),
    logger: silentLogger,
    healthDetails: { persistence: 'azure-sql' },
    readinessCheck: options.readinessCheck,
    internalApiKey: options.internalApiKey
  });
  return { server, ports };
}

async function withServer(server, run) {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

function jsonClient(baseUrl) {
  return async (method, path, body, headers = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body === undefined ? headers : { 'content-type': 'application/json', ...headers },
      body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  };
}

module.exports = { buildPorts, buildTestServer, withServer, jsonClient, silentLogger };
