// Teste de integração com SQL Server/Azure SQL REAL. Só roda com as duas variáveis:
//   SQL_TEST_CONNECTION_STRING="<connection string de um banco DESCARTÁVEL>"
//   SQL_TEST_ALLOW_WRITE=yes
//   npm run test:sql
// Aplica as migrações nesse banco e grava dados de teste, apagando ao final só o que criou.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { configureConnection, getConnection, closeConnection, sql } = require('../src/infrastructure/sql/connection');
const { SqlUnitOfWork } = require('../src/infrastructure/sql/unit-of-work');
const { SqlReservationRepository } = require('../src/infrastructure/sql/reservation-repository');
const { SqlGuestRepository } = require('../src/infrastructure/sql/guest-repository');
const { SqlIdempotencyRepository } = require('../src/infrastructure/sql/idempotency-repository');
const { SqlAuditLog } = require('../src/infrastructure/sql/audit-log');
const { SqlOutbox } = require('../src/infrastructure/sql/outbox');
const { createHandlers } = require('../src/application/create-handlers');
const { createHttpServer } = require('../src/api/http-server');
const { withServer, jsonClient, silentLogger } = require('./support/fakes');

const connectionString = process.env.SQL_TEST_CONNECTION_STRING;
const skip = connectionString && process.env.SQL_TEST_ALLOW_WRITE === 'yes'
  ? false
  : 'defina SQL_TEST_CONNECTION_STRING (banco descartável) e SQL_TEST_ALLOW_WRITE=yes';

test('Azure SQL real: overbooking concorrente, idempotência e ciclo da reserva', { skip, timeout: 180000 }, async () => {
  const env = { ...process.env, AZURE_SQL_CONNECTION_STRING: connectionString };
  await promisify(execFile)(process.execPath, ['scripts/migrate.js', '--yes'], { cwd: path.join(__dirname, '..'), env });

  configureConnection({ mode: 'connection-string', connectionString });
  const pool = await getConnection();
  const runId = crypto.randomUUID().slice(0, 8);
  const roomId = `test-room-${runId}`;
  let guestId;

  try {
    const handlers = createHandlers({
      reservationRepository: new SqlReservationRepository(),
      guestRepository: new SqlGuestRepository(),
      idempotencyRepository: new SqlIdempotencyRepository(),
      auditLog: new SqlAuditLog(),
      outbox: new SqlOutbox(),
      unitOfWork: new SqlUnitOfWork(),
      clock: { now: () => new Date() }
    });
    const server = createHttpServer({ handlers, logger: silentLogger });

    await withServer(server, async baseUrl => {
      const call = jsonClient(baseUrl);
      const guest = await call('POST', '/guests', { name: 'Hóspede de Teste', document: `TEST-${runId}` });
      assert.equal(guest.status, 201);
      guestId = guest.body.id;

      const today = new Date().toISOString().slice(0, 10);
      const later = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
      const body = { guestId, hotelId: `test-hotel-${runId}`, roomId, checkInDate: today, checkOutDate: later, totalAmount: 300 };

      // 10 requisições simultâneas para o mesmo quarto e período: exatamente uma 201 (RF05).
      const responses = await Promise.all(Array.from({ length: 10 }, (_, index) =>
        call('POST', '/reservations', body, { 'idempotency-key': `test-${runId}-${index}` })));
      const statuses = responses.map(response => response.status).sort();
      assert.deepEqual(statuses, [201, 409, 409, 409, 409, 409, 409, 409, 409, 409]);
      const created = responses.find(response => response.status === 201).body;

      // Mesma chave de novo: devolve a mesma reserva, sem duplicar.
      const winnerIndex = responses.findIndex(response => response.status === 201);
      const repeat = await call('POST', '/reservations', body, { 'idempotency-key': `test-${runId}-${winnerIndex}` });
      assert.equal(repeat.body.id, created.id);
      const count = await pool.request().input('RoomIdRef', sql.VarChar(50), roomId)
        .query('SELECT COUNT(*) AS total FROM dbo.Reservations WHERE RoomIdRef = @RoomIdRef');
      assert.equal(count.recordset[0].total, 1);

      assert.equal((await call('POST', `/reservations/${created.id}/checkin`)).body.status, 'active');
      assert.equal((await call('POST', `/reservations/${created.id}/checkout`)).body.status, 'completed');
      const audits = await pool.request().input('Id', sql.UniqueIdentifier, created.id)
        .query('SELECT COUNT(*) AS total FROM dbo.ReservationAudits WHERE ReservationId = @Id');
      assert.equal(audits.recordset[0].total, 3);
      const outbox = await pool.request().input('AggregateId', sql.VarChar(50), created.id)
        .query('SELECT EventType FROM dbo.OutboxMessages WHERE AggregateId = @AggregateId');
      assert.deepEqual(outbox.recordset.map(row => row.EventType).sort(), ['CheckInCompleted', 'CheckOutCompleted', 'ReservationCreated']);
    });
  } finally {
    // Limpa apenas o que este teste criou.
    await pool.request().input('RoomIdRef', sql.VarChar(50), roomId).query(`
      DELETE a FROM dbo.ReservationAudits a JOIN dbo.Reservations r ON r.Id = a.ReservationId WHERE r.RoomIdRef = @RoomIdRef;
      DELETE o FROM dbo.OutboxMessages o JOIN dbo.Reservations r ON o.AggregateId = LOWER(CONVERT(varchar(50), r.Id)) WHERE r.RoomIdRef = @RoomIdRef;
      DELETE FROM dbo.Reservations WHERE RoomIdRef = @RoomIdRef;`).catch(() => undefined);
    await pool.request().input('Prefix', sql.NVarChar(255), `test-${runId}-%`)
      .query('DELETE FROM dbo.IdempotencyKeys WHERE IdempotencyKey LIKE @Prefix').catch(() => undefined);
    if (guestId) await pool.request().input('Id', sql.UniqueIdentifier, guestId).query('DELETE FROM dbo.Guests WHERE Id = @Id').catch(() => undefined);
    await closeConnection();
  }
});
