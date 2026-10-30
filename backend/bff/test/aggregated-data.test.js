const test = require('node:test');
const assert = require('node:assert/strict');
const { GetAggregatedDataHandler } = require('../src/features/aggregated-data/handler');
const { AggregatedDataAssembler } = require('../src/features/aggregated-data/assembler');

test('BFF agrega hotel, reservas e analytics em paralelo', async () => {
  const calls = [];
  const gatewayClient = {
    fetchHotel: async () => { calls.push('hotel'); return { id: 'h1', rooms: [] }; },
    fetchReservations: async () => { calls.push('reservations'); return { guests: [], items: [{ id: 'r1' }] }; },
    fetchCalculations: async () => { calls.push('analytics'); return { occupancyRate: 80 }; }
  };
  const handler = new GetAggregatedDataHandler({ gatewayClient, assembler: new AggregatedDataAssembler() });
  const result = await handler.execute({ hotelId: 'h1', date: '2026-10-26', includeCalculations: true });
  assert.deepEqual(result.reservations, [{ id: 'r1' }]);
  assert.equal(result.metadata.partial, false);
  assert.deepEqual(calls.sort(), ['analytics', 'hotel', 'reservations']);
});

test('BFF marca resposta parcial quando analytics não é solicitado', async () => {
  const gatewayClient = {
    fetchHotel: async () => ({ id: 'h1' }),
    fetchReservations: async () => ({ guests: [], items: [] }),
    fetchCalculations: async () => { throw new Error('must not be called'); }
  };
  const handler = new GetAggregatedDataHandler({ gatewayClient, assembler: new AggregatedDataAssembler() });
  const result = await handler.execute({ hotelId: 'h1', date: '2026-10-26', includeCalculations: false });
  assert.equal(result.metadata.partial, true);
});
