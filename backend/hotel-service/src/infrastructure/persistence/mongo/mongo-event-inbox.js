// Registro dos eventos já processados (idempotência do consumidor). O índice TTL apaga após 30 dias.
class MongoEventInbox {
  constructor(db) {
    this.collection = db.collection('processedEvents');
  }

  async has(eventId) {
    return Boolean(await this.collection.findOne({ _id: eventId }, { projection: { _id: 1 } }));
  }

  async markProcessed(eventId, type) {
    try {
      await this.collection.insertOne({ _id: eventId, type, processedAt: new Date() });
    } catch (error) {
      if (error?.code !== 11000) throw error; // já registrado por uma entrega concorrente
    }
  }
}

module.exports = { MongoEventInbox };
