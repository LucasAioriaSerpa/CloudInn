#!/usr/bin/env node
// Compara o banco real com as colunas que o serviço usa. SOMENTE LEITURA.
//
// Uso (na pasta backend/reservations-service, com o banco configurado no .env):
//   npm run db:check
const { withDatabase } = require('./db-common');
const { compareSchema, EXPECTED_SCHEMA } = require('../src/infrastructure/sql/schema');

withDatabase(async pool => {
  const tables = Object.keys(EXPECTED_SCHEMA).map(table => `'${table}'`).join(', ');
  const { recordset } = await pool.request().query(`
    SELECT TABLE_NAME AS [table], COLUMN_NAME AS [column], DATA_TYPE AS [type]
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME IN (${tables})
  `);
  const { recordset: migrations } = await pool.request().query(
    "SELECT CASE WHEN OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NULL THEN 0 ELSE 1 END AS hasTable"
  );

  const problems = compareSchema(recordset);
  if (!migrations[0].hasTable) console.log('Aviso: dbo.SchemaMigrations não existe (migrações nunca aplicadas por npm run db:migrate).');
  if (!problems.length) {
    console.log('Schema compatível com o serviço.');
    return;
  }
  console.log('Divergências encontradas:');
  for (const problem of problems) console.log(` - ${problem}`);
  console.log('Colunas e tabelas ausentes são criadas por: npm run db:migrate -- --yes. Tipos divergentes precisam de ajuste manual.');
  process.exitCode = 1;
});
