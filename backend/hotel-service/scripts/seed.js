#!/usr/bin/env node
// Carrega os dados de DEMONSTRAÇÃO no MongoDB. Nunca roda automaticamente.
//
// Uso (na pasta backend/hotel-service, com MONGODB_URI, MONGODB_DB_NAME e SEED_STAFF_PASSWORD no .env):
//   npm run seed -- --yes
//
// É idempotente: registros já existentes (mesmo código de hotel, número de quarto ou username)
// não são alterados. Todos os documentos criados recebem seed: "demo".
const fs = require('node:fs');
const path = require('node:path');
const { loadConfig, ConfigError } = require('../src/config');
const { Room } = require('../src/domain/room');
const { Staff, assertPasswordPolicy } = require('../src/domain/staff');
const { connectMongo } = require('../src/infrastructure/persistence/mongo/client');
const { ensureIndexes } = require('../src/infrastructure/persistence/mongo/indexes');
const { BcryptPasswordHasher } = require('../src/infrastructure/security/bcrypt-password-hasher');
const { DEMO_HOTEL, DEMO_ROOMS, DEMO_STAFF } = require('./seed-data');

// Remove campos indefinidos (como o id ainda inexistente) antes de gravar.
const withoutUndefined = entity => Object.fromEntries(Object.entries(entity).filter(([, value]) => value !== undefined));

const envFile = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

async function main() {
  if (!process.argv.includes('--yes')) {
    console.log('Este comando grava dados de DEMONSTRAÇÃO no MongoDB configurado. Para confirmar: npm run seed -- --yes');
    process.exitCode = 1;
    return;
  }

  const config = loadConfig();
  const password = process.env.SEED_STAFF_PASSWORD;
  if (!password) throw new ConfigError({ missing: ['SEED_STAFF_PASSWORD'] });
  assertPasswordPolicy(password);

  const mongo = await connectMongo({ ...config.mongo, appName: 'cloudinn-hotel-seed' });
  try {
    const { db } = mongo;
    await ensureIndexes(db);
    const now = new Date();

    await db.collection('hotels').updateOne(
      { code: DEMO_HOTEL.code },
      { $setOnInsert: { ...DEMO_HOTEL, createdAt: now, seed: 'demo' } },
      { upsert: true }
    );
    const hotel = await db.collection('hotels').findOne({ code: DEMO_HOTEL.code });
    const hotelId = hotel._id.toHexString();

    let roomsCreated = 0;
    for (const data of DEMO_ROOMS) {
      const room = Room.create({ ...data, hotelId }, now); // valida tipo e status pelo domínio
      const result = await db.collection('rooms').updateOne(
        { hotelId, number: room.number },
        { $setOnInsert: { ...withoutUndefined(room), seed: 'demo' } },
        { upsert: true }
      );
      roomsCreated += result.upsertedCount;
    }

    const passwordHash = await new BcryptPasswordHasher().hash(password);
    let staffCreated = 0;
    for (const data of DEMO_STAFF) {
      const staff = Staff.create({ ...data, hotelId }, passwordHash, now); // valida papel e status pelo domínio
      const result = await db.collection('staff').updateOne(
        { username: staff.username },
        { $setOnInsert: { ...withoutUndefined(staff), passwordHash, seed: 'demo' } },
        { upsert: true }
      );
      staffCreated += result.upsertedCount;
    }

    console.log(`Hotel de demonstração: ${hotelId} (use este id em CHECK_HOTEL_ID e nas chamadas do BFF)`);
    console.log(`Quartos criados: ${roomsCreated} | já existentes: ${DEMO_ROOMS.length - roomsCreated}`);
    console.log(`Funcionários criados: ${staffCreated} | já existentes: ${DEMO_STAFF.length - staffCreated}`);
    console.log(`Logins de demonstração: ${DEMO_STAFF.map(staff => staff.username).join(', ')} (senha = SEED_STAFF_PASSWORD)`);
  } finally {
    await mongo.client.close();
  }
}

main().catch(error => {
  if (error instanceof ConfigError) {
    console.error(`Configuração incompleta. Ausentes: ${error.missing.join(', ') || 'nenhuma'}. Inválidas: ${error.invalid.join(', ') || 'nenhuma'}.`);
  } else {
    console.error(`Falha no seed: ${error.name}: ${error.message.replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s:@/]+:[^\s@/]+@/gi, '$1***:***@')}`);
  }
  process.exitCode = 1;
});
