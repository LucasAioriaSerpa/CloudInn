// Índices do modelo MongoDB do arc42. createIndex é idempotente: pode rodar a cada inicialização.
async function ensureIndexes(db) {
  await db.collection('hotels').createIndexes([
    { key: { code: 1 }, name: 'uniq_hotel_code', unique: true }
  ]);
  await db.collection('rooms').createIndexes([
    { key: { hotelId: 1, number: 1 }, name: 'uniq_room_number_per_hotel', unique: true },
    { key: { hotelId: 1, status: 1 }, name: 'rooms_by_hotel_status' }
  ]);
  await db.collection('staff').createIndexes([
    { key: { username: 1 }, name: 'uniq_staff_username', unique: true },
    { key: { email: 1 }, name: 'uniq_staff_email', unique: true, partialFilterExpression: { email: { $type: 'string' } } },
    { key: { hotelId: 1, role: 1 }, name: 'staff_by_hotel_role' }
  ]);
  // Idempotência do consumidor de eventos: registros expiram após 30 dias.
  await db.collection('processedEvents').createIndexes([
    { key: { processedAt: 1 }, name: 'processed_events_ttl', expireAfterSeconds: 30 * 24 * 3600 }
  ]);
}

module.exports = { ensureIndexes };
