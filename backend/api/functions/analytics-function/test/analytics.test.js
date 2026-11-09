const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate, mask, validateCloudEvent, ValidationError } = require('../src/lib/analytics');

test('calcula ocupação, ADR, RevPAR e projeção', () => {
  const r = calculate({ hotelId: 'h1', totalRooms: 10, occupiedRooms: 8, roomRevenue: 1600, daysInMonth: 30 });
  assert.equal(r.occupancyRate, 80);
  assert.equal(r.adr, 200);
  assert.equal(r.revPar, 160);
  assert.equal(r.projectedRevenue, 48000);
});

test('hotel sem ocupação não divide por zero', () => {
  assert.equal(calculate({ totalRooms: 5, occupiedRooms: 0, roomRevenue: 0 }).adr, 0);
});

test('rejeita entradas inválidas', () => {
  assert.throws(() => calculate({ totalRooms: 0, occupiedRooms: 0 }), ValidationError);
  assert.throws(() => calculate({ totalRooms: 5, occupiedRooms: 6 }), ValidationError);
  assert.throws(() => calculate({ totalRooms: -1, occupiedRooms: 0 }), ValidationError);
});

test('máscara de CPF nos logs', () => {
  assert.equal(mask('hóspede 123.456.789-09 chegou'), 'hóspede ***.***.***-** chegou');
});

test('valida o envelope CloudEvents', () => {
  const ok = { specversion: '1.0', id: '1', source: '/x', type: 'CheckInCompleted', time: '2026-11-09T00:00:00Z' };
  assert.equal(validateCloudEvent(ok), ok);
  assert.throws(() => validateCloudEvent({ ...ok, id: undefined }), ValidationError);
  assert.throws(() => validateCloudEvent({ ...ok, specversion: '2.0' }), ValidationError);
});
