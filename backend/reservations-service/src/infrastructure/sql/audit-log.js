const { sql, createRequest } = require('./connection');

// Histórico de mudanças de status (RF03), tabela ReservationAudits do ERD.
class SqlAuditLog {
  async record({ reservationId, previousStatus, newStatus, changedBy, reason }, transaction) {
    const request = await createRequest(transaction);
    request.input('ReservationId', sql.UniqueIdentifier, reservationId);
    request.input('PreviousStatus', sql.VarChar(20), previousStatus ? previousStatus.toUpperCase() : null);
    request.input('NewStatus', sql.VarChar(20), newStatus.toUpperCase());
    request.input('ChangedBy', sql.VarChar(80), String(changedBy).slice(0, 80));
    request.input('Reason', sql.NVarChar(255), reason ?? null);
    await request.query(`
      INSERT INTO dbo.ReservationAudits (Id, ReservationId, PreviousStatus, NewStatus, ChangedBy, Reason, ChangedAt)
      VALUES (NEWID(), @ReservationId, @PreviousStatus, @NewStatus, @ChangedBy, @Reason, SYSUTCDATETIME());`);
  }
}

module.exports = { SqlAuditLog };
