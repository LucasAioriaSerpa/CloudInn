const { test, describe, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { handler } = require("../src/functions/httpTriggerInsert");
const {
  createMockDb,
  createMockContext,
  createMockRequest,
} = require("../../test-helpers/mockDb");

describe("fc_gp_cloudInn_insert - Testes Unitários", () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
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

    const req = createMockRequest({ method: "POST", body: {} });
    const context = createMockContext();

    const res = await handler(req, context, { mongoUri: null });
    assert.equal(res.status, 500);
    const body = JSON.parse(res.body);
    assert.equal(body.code, "500");
  });

  test("Deve retornar 400 quando campos obrigatórios da reserva estiverem ausentes", async () => {
    const { client } = createMockDb();
    const req = createMockRequest({
      method: "POST",
      body: { guest: { name: "Lucas" } }, // faltam datas
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 400);
    const body = JSON.parse(res.body);
    assert.match(
      body.message,
      /campos 'guest', 'checkInDate' e 'checkOutDate' são obrigatórios/,
    );
  });

  test("Deve retornar 422 quando guest.name ou guest.document forem omitidos", async () => {
    const { client } = createMockDb();
    const req = createMockRequest({
      method: "POST",
      body: {
        guest: { name: "Lucas" }, // falta document
        checkInDate: "2026-09-01T14:00:00.000Z",
        checkOutDate: "2026-09-05T11:00:00.000Z",
      },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 422);
    const body = JSON.parse(res.body);
    assert.match(
      body.message,
      /guest.name' e 'guest.document' são obrigatórios/,
    );
  });

  test("Deve retornar 400 quando check-out for anterior ou igual ao check-in", async () => {
    const { client } = createMockDb();
    const req = createMockRequest({
      method: "POST",
      body: {
        guest: { name: "Lucas Serpa", document: "12345678900" },
        checkInDate: "2026-09-10T14:00:00.000Z",
        checkOutDate: "2026-09-05T11:00:00.000Z", // data retroativa
      },
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 400);
    const body = JSON.parse(res.body);
    assert.match(body.message, /posterior à data de check-in/);
  });

  test("Deve inserir reserva com sucesso e sincronizar hóspede e quarto (200)", async () => {
    const { client, collections } = createMockDb({
      rooms: [{ number: "201", roomType: "STD", status: "available" }],
    });
    const payload = {
      guest: {
        name: "Carlos Ferreira",
        document: "55566677788",
        email: "carlos@example.com",
        phone: "(11) 98888-7777",
      },
      room: { number: "201", roomType: "STD" },
      checkInDate: "2026-09-10T14:00:00.000Z",
      checkOutDate: "2026-09-15T11:00:00.000Z",
      status: "pending",
    };

    const req = createMockRequest({ method: "POST", body: payload });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
      body: payload,
    });

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.guest.name, "Carlos Ferreira");
    assert.equal(body.status, "pending");
    assert.ok(body.id);

    // Verifica persistência na coleção de reservas
    assert.equal(collections.reservations.length, 1);
    // Verifica atualização no quarto
    const updatedRoom = collections.rooms.find((r) => r.number === "201");
    assert.equal(updatedRoom.status, "reserved");
    // Verifica upsert no catálogo de hóspedes
    assert.equal(collections.guests.length, 1);
    assert.equal(collections.guests[0].document, "55566677788");
  });

  test("Deve inserir novo hóspede diretamente via entity=guest (200)", async () => {
    const { client, collections } = createMockDb();
    const payload = {
      name: "Ana Nogueira",
      document: "11122233344",
      email: "ana@example.com",
    };

    const req = createMockRequest({
      method: "POST",
      query: { entity: "guest" },
      body: payload,
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
      body: payload,
    });

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.name, "Ana Nogueira");
    assert.equal(collections.guests.length, 1);
  });

  test("Deve retornar 400 ao cadastrar hóspede sem campos obrigatórios", async () => {
    const { client } = createMockDb();
    const payload = { name: "Ana Nogueira" }; // falta document

    const req = createMockRequest({
      method: "POST",
      query: { entity: "guest" },
      body: payload,
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
      body: payload,
    });

    assert.equal(res.status, 400);
    const body = JSON.parse(res.body);
    assert.match(body.message, /name' e 'document' são campos obrigatórios/);
  });

  test("Deve cadastrar quarto com sucesso via entity=room (200)", async () => {
    const { client, collections } = createMockDb();
    const payload = {
      number: "305",
      roomType: "STE",
      status: "available",
    };

    const req = createMockRequest({
      method: "POST",
      query: { entity: "room" },
      body: payload,
    });
    const context = createMockContext();

    const res = await handler(req, context, {
      client,
      mongoUri: "mongodb://fake:27017/cloudinn",
      body: payload,
    });

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.number, "305");
    assert.equal(collections.rooms.length, 1);
  });
});
