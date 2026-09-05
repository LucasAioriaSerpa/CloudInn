const { test, describe, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { handler } = require("../src/functions/httpTriggerUpdate");
const {
  createMockDb,
  createMockContext,
  createMockRequest,
} = require("../../test-helpers/mockDb");

describe("fc_gp_cloudInn_update - Testes Unitários", () => {
  let originalEnv;
  let sampleReservation;
  let sampleRoom;
  let sampleGuest;

  beforeEach(() => {
    originalEnv = { ...process.env };
    sampleReservation = {
      id: 10,
      guest: { id: 1, name: "Lucas Serpa", document: "12345678900" },
      room: { id: 101, number: "101", roomType: "STD", status: "reserved" },
      checkInDate: "2026-09-01T14:00:00.000Z",
      checkOutDate: "2026-09-05T11:00:00.000Z",
      status: "pending",
    };
    sampleRoom = {
      id: 101,
      number: "101",
      roomType: "STD",
      status: "reserved",
    };
    sampleGuest = {
      id: 1,
      name: "Lucas Serpa",
      document: "12345678900",
      email: "old@example.com",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("Deve responder requisição OPTIONS (CORS preflight) com status 204", async () => {
    const req = createMockRequest({ method: "OPTIONS" });
    const context = createMockContext();

    const res = await handler(req, context);
    assert.equal(res.status, 204);
  });

  test("Deve retornar 500 quando MONGO_BD_URI não estiver configurada", async () => {
    delete process.env.MONGO_BD_URI;
    delete process.env.MONGO_URI;

    const req = createMockRequest({ method: "POST", body: {} });
    const context = createMockContext();

    const res = await handler(req, context, { mongoUri: null });
    assert.equal(res.status, 500);
  });

  test("Check-in: Deve retornar 400 se o ID da reserva não for informado", async () => {
    const { client } = createMockDb();
    const req = createMockRequest({
      method: "POST",
      query: { action: "checkin" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 400);
    const body = JSON.parse(res.body);
    assert.match(body.message, /Identificador da reserva é obrigatório/);
  });

  test("Check-in: Deve retornar 404 para reserva inexistente", async () => {
    const { client } = createMockDb();
    const req = createMockRequest({
      method: "POST",
      query: { action: "checkin", id: "999" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 404);
  });

  test("Check-in: Deve retornar 422 se a reserva já estiver completed ou cancelled", async () => {
    const completedRes = { ...sampleReservation, id: 11, status: "completed" };
    const { client } = createMockDb({ reservations: [completedRes] });

    const req = createMockRequest({
      method: "POST",
      query: { action: "checkin", id: "11" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 422);
  });

  test("Check-in: Deve realizar check-in com sucesso e alterar status do quarto para occupied (RF07)", async () => {
    const { client, collections } = createMockDb({
      reservations: [sampleReservation],
      rooms: [sampleRoom],
    });

    const req = createMockRequest({
      method: "POST",
      query: { action: "checkin", id: "10" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.type, "success");

    // Valida status da reserva
    assert.equal(collections.reservations[0].status, "active");
    assert.ok(collections.reservations[0].checkedInAt);

    // Valida status do quarto alterado para occupied
    assert.equal(collections.rooms[0].status, "occupied");
  });

  test("Check-out: Deve realizar check-out com sucesso e alterar quarto para dirty (RF08, RF09)", async () => {
    const activeRes = { ...sampleReservation, id: 12, status: "active" };
    const occupiedRoom = { ...sampleRoom, number: "101", status: "occupied" };
    const { client, collections } = createMockDb({
      reservations: [activeRes],
      rooms: [occupiedRoom],
    });

    const req = createMockRequest({
      method: "POST",
      query: { action: "checkout", id: "12" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 200);
    assert.equal(collections.reservations[0].status, "completed");
    assert.ok(collections.reservations[0].checkedOutAt);
    assert.equal(collections.rooms[0].status, "dirty");
  });

  test("Atualização de Quarto: Deve atualizar status para cleaning e validar transições (RF10, RF11)", async () => {
    const dirtyRoom = {
      id: 101,
      number: "101",
      roomType: "STD",
      status: "dirty",
    };
    const { client, collections } = createMockDb({ rooms: [dirtyRoom] });

    const req = createMockRequest({
      method: "POST",
      query: { entity: "room", id: "101", status: "cleaning" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 200);
    assert.equal(collections.rooms[0].status, "cleaning");
  });

  test("Atualização de Hóspede: Deve atualizar dados cadastrais do hóspede (RF02)", async () => {
    const { client, collections } = createMockDb({ guests: [sampleGuest] });
    const payload = {
      name: "Lucas Serpa Modificado",
      email: "novo@example.com",
    };

    const req = createMockRequest({
      method: "PUT",
      query: { entity: "guest", id: "1" },
      body: payload,
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
      body: payload,
    });

    assert.equal(res.status, 200);
    assert.equal(collections.guests[0].name, "Lucas Serpa Modificado");
    assert.equal(collections.guests[0].email, "novo@example.com");
  });
});
