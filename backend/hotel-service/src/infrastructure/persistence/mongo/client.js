const { MongoClient } = require('mongodb');

// Conecta ao MongoDB (Atlas ou local) e confirma o acesso com um ping.
async function connectMongo({ uri, dbName, appName = 'cloudinn-hotel-service' }) {
  const client = new MongoClient(uri, { appName, serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = client.db(dbName);
  await db.command({ ping: 1 });
  return {
    client,
    db,
    ping: async () => { await db.command({ ping: 1 }); }
  };
}

module.exports = { connectMongo };
