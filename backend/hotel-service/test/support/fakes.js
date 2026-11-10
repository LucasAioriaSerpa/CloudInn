// Repositórios falsos para testes: guardam cópias (como um banco) e aplicam as mesmas regras de unicidade dos índices.
const { Room } = require('../../src/domain/room');
const { Staff } = require('../../src/domain/staff');
const { Hotel } = require('../../src/domain/hotel');
const { ConflictError } = require('../../src/domain/errors');
const { createHandlers } = require('../../src/application/create-handlers');
const { createHttpServer } = require('../../src/api/http-server');

let sequence = 0;
const newId = () => (++sequence).toString(16).padStart(24, '0');
const copyRoom = room => new Room({ ...room });
const copyStaff = staff => new Staff({ ...staff, passwordHash: staff.passwordHash });

class FakeRoomRepository {
  constructor() { this.items = new Map(); }
  async findById(id) { return this.items.has(id) ? copyRoom(this.items.get(id)) : null; }
  async findAll({ hotelId, status } = {}) {
    return [...this.items.values()]
      .filter(room => (!hotelId || room.hotelId === hotelId) && (!status || room.status === status))
      .map(copyRoom);
  }
  assertUnique(room) {
    const duplicate = [...this.items.values()].some(item => item.id !== room.id && item.hotelId === room.hotelId && item.number === room.number);
    if (duplicate) throw new ConflictError('Já existe um quarto com este número neste hotel.');
  }
  async create(room) {
    this.assertUnique(room);
    const saved = new Room({ ...room, id: newId() });
    this.items.set(saved.id, saved);
    return copyRoom(saved);
  }
  async save(room) { this.assertUnique(room); this.items.set(room.id, copyRoom(room)); }
  async delete(id) { this.items.delete(id); }
}

class FakeStaffRepository {
  constructor() { this.items = new Map(); }
  async findById(id) { return this.items.has(id) ? copyStaff(this.items.get(id)) : null; }
  async findByLogin(login) {
    const found = [...this.items.values()].find(staff => staff.username === login || staff.email === login);
    return found ? copyStaff(found) : null;
  }
  async findAll(filters = {}) {
    return [...this.items.values()]
      .filter(staff => Object.entries(filters).every(([key, value]) => value === undefined || staff[key] === value))
      .map(copyStaff);
  }
  assertUnique(staff) {
    const duplicate = [...this.items.values()].some(item => item.id !== staff.id
      && (item.username === staff.username || (staff.email && item.email === staff.email)));
    if (duplicate) throw new ConflictError('username ou email já cadastrado.');
  }
  async create(staff) {
    this.assertUnique(staff);
    const saved = copyStaff(staff);
    saved.id = newId();
    this.items.set(saved.id, saved);
    return copyStaff(saved);
  }
  async save(staff) { this.assertUnique(staff); this.items.set(staff.id, copyStaff(staff)); }
  async delete(id) { this.items.delete(id); }
}

class FakeHotelRepository {
  constructor(hotels) { this.items = new Map(hotels.map(hotel => [hotel.id, hotel])); }
  async findById(id) { return this.items.get(id) ?? null; }
}

class FakeEventInbox {
  constructor() { this.ids = new Set(); }
  async has(id) { return this.ids.has(id); }
  async markProcessed(id) { this.ids.add(id); }
}

const fakePasswordHasher = {
  hash: async password => `hash:${password}`,
  compare: async (password, passwordHash) => passwordHash === `hash:${password}`
};

const silentLogger = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined };

function buildTestServer({ readinessCheck, internalApiKey } = {}) {
  const hotel = new Hotel({ id: newId(), code: 'TESTE', name: 'Hotel de Teste' });
  const events = [];
  const ports = {
    roomRepository: new FakeRoomRepository(),
    staffRepository: new FakeStaffRepository(),
    hotelRepository: new FakeHotelRepository([hotel]),
    passwordHasher: fakePasswordHasher,
    eventPublisher: { publish: async event => { events.push(event); } },
    eventInbox: new FakeEventInbox(),
    clock: { now: () => new Date('2026-11-10T12:00:00Z') }
  };
  const server = createHttpServer({
    handlers: createHandlers(ports),
    logger: silentLogger,
    healthDetails: { persistence: 'mongodb' },
    readinessCheck,
    internalApiKey
  });
  return { server, ports, events, hotelId: hotel.id };
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
  return async (method, path, body) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  };
}

module.exports = { buildTestServer, withServer, jsonClient, silentLogger, fakePasswordHasher, newId, FakeRoomRepository, FakeEventInbox };
