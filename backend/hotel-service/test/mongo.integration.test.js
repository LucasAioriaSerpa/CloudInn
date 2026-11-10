// Teste de integração com MongoDB REAL. Só roda com MONGODB_TEST_URI definida:
//   MONGODB_TEST_URI="<uri do Atlas ou mongodb://localhost:27017>" npm run test:mongo
// Usa um banco temporário com nome único (cloudinn_test_<timestamp>) e o apaga ao final;
// nunca toca no banco configurado em MONGODB_DB_NAME.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { connectMongo } = require('../src/infrastructure/persistence/mongo/client');
const { ensureIndexes } = require('../src/infrastructure/persistence/mongo/indexes');
const { MongoRoomRepository } = require('../src/infrastructure/persistence/mongo/mongo-room-repository');
const { MongoStaffRepository } = require('../src/infrastructure/persistence/mongo/mongo-staff-repository');
const { MongoHotelRepository } = require('../src/infrastructure/persistence/mongo/mongo-hotel-repository');
const { MongoEventInbox } = require('../src/infrastructure/persistence/mongo/mongo-event-inbox');
const { BcryptPasswordHasher } = require('../src/infrastructure/security/bcrypt-password-hasher');
const { createHandlers } = require('../src/application/create-handlers');
const { createHttpServer } = require('../src/api/http-server');
const { withServer, jsonClient, silentLogger } = require('./support/fakes');

const uri = process.env.MONGODB_TEST_URI;
const skip = uri ? false : 'defina MONGODB_TEST_URI para rodar contra um MongoDB real';
const dbName = `cloudinn_test_${Date.now()}`;

function startApp(db) {
  const handlers = createHandlers({
    roomRepository: new MongoRoomRepository(db),
    staffRepository: new MongoStaffRepository(db),
    hotelRepository: new MongoHotelRepository(db),
    passwordHasher: new BcryptPasswordHasher({ rounds: 4 }),
    eventPublisher: { publish: async () => undefined },
    eventInbox: new MongoEventInbox(db),
    clock: { now: () => new Date() }
  });
  return createHttpServer({ handlers, logger: silentLogger, readinessCheck: async () => db.command({ ping: 1 }) });
}

test('MongoDB real: CRUD persiste após reconectar, índices únicos e seed idempotente', { skip, timeout: 120000 }, async () => {
  let first = await connectMongo({ uri, dbName });
  try {
    await ensureIndexes(first.db);
    const { insertedId } = await first.db.collection('hotels').insertOne({ code: 'TESTE-INTEGRACAO', name: 'Hotel de Teste' });
    const hotelId = insertedId.toHexString();
    let roomId;
    let staffId;

    await withServer(startApp(first.db), async baseUrl => {
      const call = jsonClient(baseUrl);
      const room = await call('POST', '/rooms', { hotelId, number: '101', roomType: 'STD' });
      assert.equal(room.status, 201);
      roomId = room.body.id;
      assert.equal((await call('POST', '/rooms', { hotelId, number: '101', roomType: 'STD' })).status, 409, 'índice único do quarto');
      assert.equal((await call('PATCH', `/rooms/${roomId}/status`, { status: 'reserved' })).status, 200);

      const staff = await call('POST', '/staff', { hotelId, name: 'Teste', username: 'teste', role: 'manager', password: 'senha-teste-1' });
      assert.equal(staff.status, 201);
      staffId = staff.body.id;
      assert.equal((await call('POST', '/staff', { hotelId, name: 'Outro', username: 'teste', role: 'manager', password: 'senha-teste-1' })).status, 409);
      assert.equal((await call('GET', '/health/ready')).status, 200);
    });

    // Simula o reinício do serviço: fecha a conexão e abre outra.
    await first.client.close();
    first = await connectMongo({ uri, dbName });

    await withServer(startApp(first.db), async baseUrl => {
      const call = jsonClient(baseUrl);
      const room = await call('GET', `/rooms/${roomId}`);
      assert.equal(room.status, 200);
      assert.equal(room.body.status, 'reserved', 'status persistido');
      assert.equal((await call('POST', '/staff/verify-credentials', { login: 'teste', password: 'senha-teste-1' })).status, 200, 'hash persistido');
      const stored = await first.db.collection('staff').findOne({ username: 'teste' });
      assert.match(stored.passwordHash, /^\$2[aby]\$/, 'senha gravada como hash bcrypt');
      assert.equal((await call('GET', `/hotels/${hotelId}/catalog`)).body.summary.totalRooms, 1);
      assert.equal((await call('DELETE', `/staff/${staffId}`)).status, 204);
      assert.equal((await call('PATCH', `/rooms/${roomId}/status`, { status: 'available' })).status, 200);
      assert.equal((await call('DELETE', `/rooms/${roomId}`)).status, 204);
      assert.equal((await call('GET', `/rooms/${roomId}`)).status, 404);
    });

    // Seed: duas execuções seguidas não duplicam registros.
    const env = { ...process.env, MONGODB_URI: uri, MONGODB_DB_NAME: dbName, SEED_STAFF_PASSWORD: 'senha-demo-123' };
    const run = () => promisify(execFile)(process.execPath, ['scripts/seed.js', '--yes'], { cwd: path.join(__dirname, '..'), env });
    await run();
    const second = await run();
    assert.match(second.stdout, /Quartos criados: 0/);
    assert.match(second.stdout, /Funcionários criados: 0/);
    assert.equal(await first.db.collection('rooms').countDocuments({ seed: 'demo' }), 16);
    assert.equal(await first.db.collection('rooms').countDocuments({ id: { $exists: true } }), 0, 'seed não grava campo id');
  } finally {
    await first.db.dropDatabase().catch(() => undefined);
    await first.client.close();
  }
});
