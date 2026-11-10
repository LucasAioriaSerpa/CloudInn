const { sql, createRequest } = require('./connection');

// Transactional Outbox (tabela OutboxMessages do ERD).
// SqlOutbox.add grava o evento na transação do caso de uso; SqlOutboxStore é usado pelo OutboxRelay.
class SqlOutbox {
  async add(event, transaction) {
    const request = await createRequest(transaction);
    request.input('Id', sql.UniqueIdentifier, event.id);
    request.input('EventType', sql.VarChar(80), event.type);
    request.input('AggregateId', sql.VarChar(50), String(event.subject ?? '').slice(0, 50));
    request.input('Payload', sql.NVarChar(sql.MAX), JSON.stringify(event));
    await request.query(`
      INSERT INTO dbo.OutboxMessages (Id, EventType, AggregateId, Payload, Status, RetryCount, CreatedAt)
      VALUES (@Id, @EventType, @AggregateId, @Payload, 'PENDING', 0, SYSUTCDATETIME());`);
  }
}

class SqlOutboxStore {
  constructor({ unitOfWork }) {
    this.unitOfWork = unitOfWork;
  }

  withTransaction(operation) {
    return this.unitOfWork.transaction(operation);
  }

  // READPAST pula linhas já travadas por outra réplica; UPDLOCK impede que duas peguem a mesma.
  async fetchPending(limit, transaction) {
    const request = await createRequest(transaction);
    request.input('Limit', sql.Int, limit);
    const { recordset } = await request.query(`
      SELECT TOP (@Limit) Id, Payload, RetryCount
      FROM dbo.OutboxMessages WITH (UPDLOCK, READPAST, ROWLOCK)
      WHERE Status = 'PENDING'
      ORDER BY CreatedAt;`);
    return recordset.map(row => ({ id: row.Id, retryCount: row.RetryCount, event: JSON.parse(row.Payload) }));
  }

  async markPublished(id, transaction) {
    const request = await createRequest(transaction);
    request.input('Id', sql.UniqueIdentifier, id);
    await request.query("UPDATE dbo.OutboxMessages SET Status = 'PUBLISHED', ProcessedAt = SYSUTCDATETIME() WHERE Id = @Id;");
  }

  async markFailed(id, attempts, final, transaction) {
    const request = await createRequest(transaction);
    request.input('Id', sql.UniqueIdentifier, id);
    request.input('RetryCount', sql.Int, attempts);
    request.input('Status', sql.VarChar(20), final ? 'FAILED' : 'PENDING');
    await request.query('UPDATE dbo.OutboxMessages SET RetryCount = @RetryCount, Status = @Status WHERE Id = @Id;');
  }
}

module.exports = { SqlOutbox, SqlOutboxStore };
