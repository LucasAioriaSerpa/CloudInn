#!/usr/bin/env node
// Aplica as migrações de migrations/*.sql ainda não registradas em dbo.SchemaMigrations.
//
// Uso (na pasta backend/reservations-service, com o banco configurado no .env):
//   npm run db:migrate              mostra o que seria aplicado (não altera nada)
//   npm run db:migrate -- --yes     aplica, cada arquivo em sua própria transação
const fs = require('node:fs');
const path = require('node:path');
const { withDatabase } = require('./db-common');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const apply = process.argv.includes('--yes');

// Divide o script nos lotes separados por GO (o driver não entende GO).
const batchesOf = sql => sql.split(/^\s*GO\s*$/im).map(batch => batch.trim()).filter(Boolean);

withDatabase(async pool => {
  await pool.request().batch(`
    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NULL
      CREATE TABLE dbo.SchemaMigrations (
        Id NVARCHAR(100) NOT NULL CONSTRAINT PK_SchemaMigrations PRIMARY KEY,
        AppliedAt DATETIME2(0) NOT NULL CONSTRAINT DF_SchemaMigrations_AppliedAt DEFAULT SYSUTCDATETIME()
      );
  `);
  const applied = new Set((await pool.request().query('SELECT Id FROM dbo.SchemaMigrations')).recordset.map(row => row.Id));
  const pending = fs.readdirSync(MIGRATIONS_DIR).filter(file => file.endsWith('.sql')).sort().filter(file => !applied.has(file));

  if (!pending.length) {
    console.log('Banco atualizado: nenhuma migração pendente.');
    return;
  }
  if (!apply) {
    console.log(`Migrações pendentes: ${pending.join(', ')}`);
    console.log('Nada foi alterado. Para aplicar: npm run db:migrate -- --yes');
    return;
  }

  for (const file of pending) {
    const transaction = pool.transaction();
    await transaction.begin();
    try {
      for (const batch of batchesOf(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'))) {
        await transaction.request().batch(batch);
      }
      await transaction.request().input('Id', file).query('INSERT INTO dbo.SchemaMigrations (Id) VALUES (@Id)');
      await transaction.commit();
      console.log(`Aplicada: ${file}`);
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw new Error(`migração ${file} falhou e foi desfeita: ${error.message}`);
    }
  }
});
