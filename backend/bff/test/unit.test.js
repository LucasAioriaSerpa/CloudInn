const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCalculationInput, daysInMonth } = require('../src/application/features/aggregated-data/occupancy');
const { GetAggregatedDataQuery } = require('../src/application/features/aggregated-data/query');
const { loadConfig, ConfigError } = require('../src/config');

const VALID_ENV = {
  HOTEL_SERVICE_URL: 'https://hotel.exemplo.net',
  RESERVATIONS_SERVICE_URL: 'https://reservas.exemplo.net',
  ANALYTICS_FUNCTION_URL: 'https://funcao.exemplo.net/api/httpTriggerAnalytics',
  ANALYTICS_FUNCTION_KEY: 'k',
  INTERNAL_API_KEY: 'i',
  JWT_SECRET: 'x'.repeat(32)
};

test('Ocupação: conta só reservas confirmed/active de quartos do catálogo e usa a diária média', () => {
  const catalog = { rooms: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], summary: { totalRooms: 3 } };
  const reservations = [
    { roomId: 'a', status: 'active', totalAmount: 300, checkInDate: '2026-11-09', checkOutDate: '2026-11-12' },
    { roomId: 'a', status: 'confirmed', totalAmount: 100, checkInDate: '2026-11-10', checkOutDate: '2026-11-11' },
    { roomId: 'b', status: 'cancelled', totalAmount: 999, checkInDate: '2026-11-09', checkOutDate: '2026-11-12' },
    { roomId: 'removido', status: 'active', totalAmount: 999, checkInDate: '2026-11-09', checkOutDate: '2026-11-12' }
  ];
  assert.deepEqual(buildCalculationInput({ hotelId: 'h', date: '2026-11-10', catalog, reservations }), {
    hotelId: 'h', date: '2026-11-10', totalRooms: 3, occupiedRooms: 1, roomRevenue: 200, daysInMonth: 30
  });
});

test('Dias do mês consideram ano bissexto', () => {
  assert.equal(daysInMonth('2028-02-10'), 29);
  assert.equal(daysInMonth('2026-02-10'), 28);
  assert.equal(daysInMonth('2026-12-31'), 31);
});

test('Consulta: valida hotelId e data real no formato AAAA-MM-DD', () => {
  assert.throws(() => new GetAggregatedDataQuery({ date: '2026-11-10' }), /hotelId/);
  assert.throws(() => new GetAggregatedDataQuery({ hotelId: 'h', date: '10/11/2026' }), /date/);
  assert.throws(() => new GetAggregatedDataQuery({ hotelId: 'h', date: '2026-02-30' }), /date/);
  assert.equal(new GetAggregatedDataQuery({ hotelId: 'h', date: '2026-11-10', includeCalculations: 'false' }).includeCalculations, false);
});

test('Configuração: lista ausentes, recusa URL com chave e segredo curto, sem expor valores', () => {
  assert.throws(() => loadConfig({}), error => error instanceof ConfigError
    && ['HOTEL_SERVICE_URL', 'RESERVATIONS_SERVICE_URL', 'ANALYTICS_FUNCTION_URL', 'ANALYTICS_FUNCTION_KEY', 'INTERNAL_API_KEY', 'JWT_SECRET']
      .every(name => error.missing.includes(name)));

  assert.throws(
    () => loadConfig({ ...VALID_ENV, ANALYTICS_FUNCTION_URL: 'https://funcao.exemplo.net/api/x?code=segredo', JWT_SECRET: 'curto' }),
    error => error.invalid.includes('ANALYTICS_FUNCTION_URL') && error.invalid.includes('JWT_SECRET') && !error.message.includes('segredo')
  );
  assert.throws(() => loadConfig({ ...VALID_ENV, NODE_ENV: 'production' }), error => error.missing.includes('CORS_ORIGINS'));
  assert.throws(() => loadConfig({ ...VALID_ENV, CORS_ORIGINS: 'https://ok.net/caminho' }), error => error.invalid.includes('CORS_ORIGINS'));

  const config = loadConfig({ ...VALID_ENV, CORS_ORIGINS: 'https://a.net, https://b.net/' });
  assert.deepEqual(config.corsOrigins, ['https://a.net', 'https://b.net']);
  assert.equal(config.downstreamTimeoutMs, 10000);
});
