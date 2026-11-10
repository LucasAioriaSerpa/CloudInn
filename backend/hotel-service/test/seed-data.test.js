const test = require('node:test');
const assert = require('node:assert/strict');
const { Room } = require('../src/domain/room');
const { Staff } = require('../src/domain/staff');
const { DEMO_ROOMS, DEMO_STAFF, DEMO_HOTEL } = require('../scripts/seed-data');

test('Seed: dados de demonstração respeitam as regras do domínio', () => {
  for (const room of DEMO_ROOMS) assert.doesNotThrow(() => Room.create({ ...room, hotelId: 'h1' }), `quarto ${room.number}`);
  for (const staff of DEMO_STAFF) assert.doesNotThrow(() => Staff.create({ ...staff, hotelId: 'h1' }, 'hash'), staff.username);
});

test('Seed: números de quarto e usernames são únicos e identificados como demonstração', () => {
  assert.equal(new Set(DEMO_ROOMS.map(room => room.number)).size, DEMO_ROOMS.length);
  assert.equal(new Set(DEMO_STAFF.map(staff => staff.username)).size, DEMO_STAFF.length);
  assert.match(DEMO_HOTEL.name, /demonstração/);
  assert.equal(DEMO_STAFF.some(staff => 'password' in staff), false, 'senhas não ficam no código');
});
