const { test, describe, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { handler, checkHealth } = require("../src/functions/httpTriggerHealth");
let mockHelpers;
try {
  mockHelpers = require("./mockDb");
} catch {
  mockHelpers = require("../../test-helpers/mockDb");
}
const { createMockDb, createMockContext, createMockRequest } = mockHelpers;

describe("fc_gp_cloudInn_health - Testes Unitários", () => {
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
    assert.match(res.headers["Access-Control-Allow-Methods"], /GET/);
  });

  test("Deve retornar status UP e NOT_CONFIGURED quando MONGO_BD_URI não estiver definida", async () => {
    delete process.env.MONGO_BD_URI;
    delete process.env.MONGO_URI;

    const req = createMockRequest({ method: "GET" });
    const context = createMockContext();

    const res = await handler(req, context, { mongoUri: null });
    assert.equal(res.status, 200);

    const body = JSON.parse(res.body);
    assert.equal(body.status, "UP");
    assert.equal(body.service, "fc_gp_cloudInn_health");
    assert.equal(body.checks.api.status, "UP");
    assert.equal(body.checks.database.status, "NOT_CONFIGURED");
    assert.ok(body.checks.system.memory.heapUsedMb > 0);
    assert.ok(typeof body.uptimeSeconds === "number");
  });

  test("Deve retornar status UP e CONNECTED com latência quando o banco responder ao ping", async () => {
    const { client } = createMockDb();
    const req = createMockRequest({ method: "GET" });
    const context = createMockContext();

    const res = await handler(req, context, {
      mongoClient: client,
      mongoUri: "mongodb://localhost:27017/cloudinn",
    });

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.status, "UP");
    assert.equal(body.checks.database.status, "CONNECTED");
    assert.equal(body.checks.database.provider, "MongoDB");
    assert.ok(typeof body.checks.database.latencyMs === "number");
  });

  test("Deve retornar status DEGRADED e código HTTP 503 quando o MongoDB falhar ao responder ping", async () => {
    const brokenClient = {
      db: () => ({
        command: async () => {
          throw new Error("Connection timeout to Mongo Cluster");
        },
      }),
    };

    const req = createMockRequest({ method: "GET" });
    const context = createMockContext();

    const res = await handler(req, context, {
      mongoClient: brokenClient,
      mongoUri: "mongodb://fake:27017/cloudinn",
    });

    assert.equal(res.status, 503);
    const body = JSON.parse(res.body);
    assert.equal(body.status, "DEGRADED");
    assert.equal(body.checks.database.status, "UNREACHABLE");
    assert.match(body.checks.database.error, /Connection timeout/);
  });

  test("checkHealth deve incluir métricas de sistema do Node.js", async () => {
    const result = await checkHealth({ mongoUri: null });
    assert.ok(result.checks.system.nodeVersion);
    assert.ok(result.checks.system.platform);
    assert.ok(result.checks.system.memory.rssMb > 0);
    assert.ok(result.checks.system.memory.heapTotalMb > 0);
  });
});
