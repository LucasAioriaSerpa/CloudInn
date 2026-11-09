const { sql } = require('./connection');

class SqlIdempotencyRepository {
  async find(consumer, key, transaction) {
    const request = new sql.Request(transaction);

    request.input('Consumer', sql.NVarChar(100), consumer);
    request.input('IdempotencyKey', sql.NVarChar(255), key);

    const result = await request.query(`
      SELECT TOP (1)
        ResponseStatusCode,
        ResponseBody,
        ExpiresAt
      FROM dbo.IdempotencyKeys WITH (UPDLOCK, HOLDLOCK)
      WHERE Consumer = @Consumer
        AND IdempotencyKey = @IdempotencyKey;
    `);

    const item = result.recordset[0];

    if (!item) {
      return null;
    }

    if (new Date(item.ExpiresAt) <= new Date()) {
      return null;
    }

    return {
      statusCode: item.ResponseStatusCode,
      response: JSON.parse(item.ResponseBody)
    };
  }

  async save(consumer, key, value, transaction) {
    const request = new sql.Request(transaction);

    request.input('Consumer', sql.NVarChar(100), consumer);
    request.input('IdempotencyKey', sql.NVarChar(255), key);
    request.input('ResponseStatusCode', sql.Int, value.statusCode);

    request.input(
      'ResponseBody',
      sql.NVarChar(sql.MAX),
      JSON.stringify(value.response)
    );

    await request.query(`
      IF EXISTS (
        SELECT 1
        FROM dbo.IdempotencyKeys WITH (UPDLOCK, HOLDLOCK)
        WHERE Consumer = @Consumer
          AND IdempotencyKey = @IdempotencyKey
      )
      BEGIN
        UPDATE dbo.IdempotencyKeys
        SET
          ResponseStatusCode = @ResponseStatusCode,
          ResponseBody = @ResponseBody,
          CreatedAt = SYSUTCDATETIME(),
          ExpiresAt = DATEADD(HOUR, 24, SYSUTCDATETIME())
        WHERE Consumer = @Consumer
          AND IdempotencyKey = @IdempotencyKey;
      END
      ELSE
      BEGIN
        INSERT INTO dbo.IdempotencyKeys (
          Id,
          Consumer,
          IdempotencyKey,
          ResponseStatusCode,
          ResponseBody,
          CreatedAt,
          ExpiresAt
        )
        VALUES (
          NEWID(),
          @Consumer,
          @IdempotencyKey,
          @ResponseStatusCode,
          @ResponseBody,
          SYSUTCDATETIME(),
          DATEADD(HOUR, 24, SYSUTCDATETIME())
        );
      END
    `);
  }
}

module.exports = {
  SqlIdempotencyRepository
};