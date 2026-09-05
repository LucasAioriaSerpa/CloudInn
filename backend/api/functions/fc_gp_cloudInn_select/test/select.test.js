const { test, describe, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { handler } = require("../src/functions/httpTriggerSelect");
const {
  createMockDb,
  createMockContext,
  createMockRequest,
} = require("../../test-helpers/mockDb");

describe("fc_gp_cloudInn_select - Testes Unitários", () => {
  let originalEnv;
  let mockReservations;
  let mockRooms;
  let mockGuests;

  beforeEach(() => {
    originalEnv = { ...process.env };
    mockReservations = [
      {
        id: 1,
        guest: {
          id: 1,
          name: "Lucas Serpa",
          document: "12345678900",
          email: "lucas@example.com",
        },
        room: { id: 101, number: "101", roomType: "STD", status: "occupied" },
        checkInDate: "2026-09-01T14:00:00.000Z",
        checkOutDate: "2026-09-05T11:00:00.000Z",
        status: "active",
      },
      {
        id: 2,
        guest: {
          id: 2,
          name: "Maria Silva",
          document: "98765432100",
          email: "maria@example.com",
        },
        room: { id: 102, number: "102", roomType: "LUX", status: "reserved" },
        checkInDate: "2026-09-10T14:00:00.000Z",
        checkOutDate: "2026-09-15T11:00:00.000Z",
        status: "pending",
      },
    ];

    mockRooms = [
      { id: 101, number: "101", roomType: "STD", status: "occupied" },
      { id: 102, number: "102", roomType: "LUX", status: "reserved" },
      { id: 103, number: "103", roomType: "STE", status: "available" },
    ];

    mockGuests = [
      {
        id: 1,
        name: "Lucas Serpa",
        document: "12345678900",
        email: "lucas@example.com",
      },
      {
        id: 2,
        name: "Maria Silva",
        document: "98765432100",
        email: "maria@example.com",
      },
    ];
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("Deve responder requisição OPTIONS (CORS preflight) com status 204", async () => {
    const req = createMockRequest({ method: "OPTIONS" });
    const context = createMockContext();

    const res = await handler(req, context);
    assert.equal(res.status, 204);
    assert.equal(res.headers["Access-Control-Allow-Origin"], "*");
  });

  test("Deve retornar erro 500 quando MONGO_BD_URI não estiver configurada", async () => {
    delete process.env.MONGO_BD_URI;
    delete process.env.MONGO_URI;

    const req = createMockRequest({ method: "GET" });
    const context = createMockContext();

    const res = await handler(req, context, { mongoUri: null });
    assert.equal(res.status, 500);
    const body = JSON.parse(res.body);
    assert.equal(body.code, "500");
    assert.match(body.message, /MONGO_BD_URI/);
  });

  test("Deve consultar lista completa de reservas (entity=reservation)", async () => {
    const { client } = createMockDb({ reservations: mockReservations });
    const req = createMockRequest({
      method: "GET",
      query: { entity: "reservation" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.ok(Array.isArray(body));
    assert.equal(body.length, 2);
    assert.equal(body[0].id, 2); // ordenação decrescente por id
  });

  test("Deve consultar reserva individual por ID numérico (200)", async () => {
    const { client } = createMockDb({ reservations: mockReservations });
    const req = createMockRequest({
      method: "GET",
      query: { entity: "reservation", id: "1" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.id, 1);
    assert.equal(body.guest.name, "Lucas Serpa");
  });

  test("Deve retornar 404 quando buscar reserva inexistente", async () => {
    const { client } = createMockDb({ reservations: mockReservations });
    const req = createMockRequest({
      method: "GET",
      query: { entity: "reservation", id: "999" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 404);
    const body = JSON.parse(res.body);
    assert.equal(body.code, "404");
  });

  test("Deve filtrar reservas por status (status=active)", async () => {
    const { client } = createMockDb({ reservations: mockReservations });
    const req = createMockRequest({
      method: "GET",
      query: { entity: "reservation", status: "active" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.length, 1);
    assert.equal(body[0].status, "active");
  });

  test("Deve consultar catálogo de quartos (entity=room)", async () => {
    const { client } = createMockDb({ rooms: mockRooms });
    const req = createMockRequest({
      method: "GET",
      query: { entity: "room" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.length, 3);
  });

  test("Deve consultar catálogo de hóspedes e buscar por documento", async () => {
    const { client } = createMockDb({ guests: mockGuests });
    const req = createMockRequest({
      method: "GET",
      query: { entity: "guest", document: "12345678900" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.ok(Array.isArray(body));
    assert.equal(body.length, 1);
    assert.equal(body[0].name, "Lucas Serpa");
  });

  test("Deve retornar 400 para entidade não suportada", async () => {
    const { client } = createMockDb();
    const req = createMockRequest({
      method: "GET",
      query: { entity: "unsupported_table" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 400);
    const body = JSON.parse(res.body);
    assert.match(body.message, /Entidade desconhecida/);
  });
});
