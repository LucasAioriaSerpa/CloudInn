const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { compareSchema, EXPECTED_SCHEMA } = require('../src/infrastructure/sql/schema');
const { isTransient } = require('../src/infrastructure/sql/connection');

const migrationsDir = path.join(__dirname, '..', 'migrations');

test('Schema: aponta tabelas, colunas e tipos divergentes', () => {
  const complete = Object.entries(EXPECTED_SCHEMA).flatMap(([table, columns]) =>
    Object.entries(columns).map(([column, type]) => ({ table, column, type })));
  assert.deepEqual(compareSchema(complete), []);

  const broken = complete
    .filter(item => item.table !== 'OutboxMessages' && !(item.table === 'Reservations' && item.column === 'ActualCheckInAt'))
    .map(item => (item.table === 'Guests' && item.column === 'VipStatus' ? { ...item, type: 'int' } : item));
  const problems = compareSchema(broken);
  assert.ok(problems.includes('Tabela dbo.OutboxMessages não existe.'));
  assert.ok(problems.includes('dbo.Reservations.ActualCheckInAt não existe.'));
  assert.ok(problems.includes('dbo.Guests.VipStatus é int; esperado bit.'));
});

test('Migrações: toda tabela e coluna esperada aparece nas migrações', () => {
  const sql = fs.readdirSync(migrationsDir).map(file => fs.readFileSync(path.join(migrationsDir, file), 'utf8')).join('\n');
  for (const [table, columns] of Object.entries(EXPECTED_SCHEMA)) {
    assert.match(sql, new RegExp(`CREATE TABLE dbo\\.${table}\\b`), `migração sem dbo.${table}`);
    for (const column of Object.keys(columns)) assert.match(sql, new RegExp(`\\b${column}\\b`), `migração sem ${table}.${column}`);
  }
});

test('Migrações: são idempotentes e nunca apagam dados', () => {
  for (const file of fs.readdirSync(migrationsDir)) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    assert.doesNotMatch(sql, /\b(DROP|TRUNCATE|DELETE)\b/i, `${file} contém comando destrutivo`);
    const creates = sql.match(/CREATE (UNIQUE )?(TABLE|INDEX)/g) || [];
    const guards = sql.match(/IF (OBJECT_ID|NOT EXISTS)/g) || [];
    assert.ok(guards.length >= creates.length, `${file}: todo CREATE precisa de verificação de existência`);
  }
});

test('Conexão: erros do Azure SQL em pausa são transitórios; login inválido não é', () => {
  assert.equal(isTransient({ number: 40613 }), true);
  assert.equal(isTransient({ originalError: { info: { number: 40613 } } }), true);
  assert.equal(isTransient({ code: 'ETIMEOUT' }), true);
  assert.equal(isTransient({ number: 18456, code: 'ELOGIN' }), false);
});
