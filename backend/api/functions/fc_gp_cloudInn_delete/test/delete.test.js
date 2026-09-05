const { test, describe, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { handler } = require("../src/functions/httpTriggerDelete");
const {
  createMockDb,
  createMockContext,
  createMockRequest,
} = require("../../test-helpers/mockDb");

describe("fc_gp_cloudInn_delete - Testes Unitários", () => {
  let originalEnv;
  let sampleReservation;
  let sampleRoom;
  let sampleGuest;

  beforeEach(() => {
    originalEnv = { ...process.env };
    sampleReservation = {
      id: 50,
      guest: { id: 1, name: "Lucas Serpa", document: "12345678900" },
      room: { id: 101, number: "101", roomType: "STD", status: "reserved" },
      status: "pending",
    };
    sampleRoom = {
      id: 101,
      number: "101",
      roomType: "STD",
      status: "reserved",
    };
    sampleGuest = { id: 1, name: "Lucas Serpa", document: "12345678900" };
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

    const req = createMockRequest({ method: "DELETE", query: { id: "50" } });
    const context = createMockContext();

    const res = await handler(req, context, { mongoUri: null });
    assert.equal(res.status, 500);
  });

  test("Deve retornar 400 se o ID não for informado", async () => {
    const { client } = createMockDb();
    const req = createMockRequest({ method: "DELETE" });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 400);
    const body = JSON.parse(res.body);
    assert.match(body.message, /Identificador \(id\) é obrigatório/);
  });

  test("Deve retornar 404 ao tentar excluir reserva inexistente", async () => {
    const { client } = createMockDb();
    const req = createMockRequest({
      method: "DELETE",
      query: { entity: "reservation", id: "999" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 404);
  });

  test("Deve excluir reserva ativa com sucesso e retornar deletedCount (200)", async () => {
    const activeReservation = {
      ...sampleReservation,
      id: 51,
      status: "active",
    };
    const { client, collections } = createMockDb({
      reservations: [activeReservation],
    });

    const req = createMockRequest({
      method: "DELETE",
      query: { entity: "reservation", id: "51" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.type, "success");
    assert.equal(body.deletedCount, 1);
    assert.equal(collections.reservations.length, 0);
  });

  test("Deve excluir reserva pendente e liberar o quarto para available (200)", async () => {
    const { client, collections } = createMockDb({
      reservations: [sampleReservation],
      rooms: [sampleRoom],
    });

    const req = createMockRequest({
      method: "DELETE",
      query: { entity: "reservation", id: "50" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.type, "success");

    // Reserva removida
    assert.equal(collections.reservations.length, 0);
    // Quarto liberado
    assert.equal(collections.rooms[0].status, "available");
  });

  test("Deve excluir quarto via entity=room (200)", async () => {
    const { client, collections } = createMockDb({ rooms: [sampleRoom] });

    const req = createMockRequest({
      method: "DELETE",
      query: { entity: "room", id: "101" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 200);
    assert.equal(collections.rooms.length, 0);
  });

  test("Deve excluir hóspede via entity=guest (200)", async () => {
    const { client, collections } = createMockDb({ guests: [sampleGuest] });

    const req = createMockRequest({
      method: "DELETE",
      query: { entity: "guest", id: "1" },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 200);
    assert.equal(collections.guests.length, 0);
  });
});
