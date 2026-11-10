// Publica em segundo plano os eventos pendentes da Outbox (entrega pelo menos uma vez).
// Falha de publicação incrementa RetryCount; após maxAttempts, o evento fica FAILED para análise.
class OutboxRelay {
  constructor({ store, publisher, logger, intervalMs = 2000, batchSize = 20, maxAttempts = 10 }) {
    Object.assign(this, { store, publisher, logger, intervalMs, batchSize, maxAttempts });
    this.running = false;
    this.timer = null;
  }

  start() {
    this.timer = setInterval(() => { this.tick().catch(() => undefined); }, this.intervalMs);
    this.timer.unref?.();
  }

  async stop() {
    clearInterval(this.timer);
    while (this.running) await new Promise(resolve => setTimeout(resolve, 50));
  }

  async tick() {
    if (this.running) return { published: 0, failed: 0 };
    this.running = true;
    const counts = { published: 0, failed: 0 };
    try {
      await this.store.withTransaction(async transaction => {
        const items = await this.store.fetchPending(this.batchSize, transaction);
        for (const item of items) {
          try {
            await this.publisher.publish(item.event);
            await this.store.markPublished(item.id, transaction);
            counts.published += 1;
          } catch (error) {
            const attempts = item.retryCount + 1;
            const final = attempts >= this.maxAttempts;
            await this.store.markFailed(item.id, attempts, final, transaction);
            counts.failed += 1;
            this.logger.warn(final ? 'Evento da Outbox marcado como FAILED' : 'Falha ao publicar evento da Outbox; nova tentativa depois', {
              error, eventId: item.event.id, eventType: item.event.type, attempts, correlationId: item.event.correlationid
            });
          }
        }
      });
    } catch (error) {
      this.logger.error('Falha no ciclo da Outbox', { error });
    } finally {
      this.running = false;
    }
    if (counts.published) this.logger.info('Eventos publicados da Outbox', counts);
    return counts;
  }
}

module.exports = { OutboxRelay };
