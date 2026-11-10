const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandlers } = require('../src/application/create-handlers');
const { buildPorts } = require('./support/fakes');

async function setup() {
  const ports = buildPorts();
  const handlers = createHandlers(ports);
  const guest = await handlers.createGuest.execute({ name: 'João Silva', document: '123.456.789-00' });
  const command = {
    guestId: guest.id,
    hotelId: 'hotel-1',
    roomId: 'room-1',
    checkInDate: '2026-11-10',
    checkOutDate: '2026-11-13',
    totalAmount: 450,
    originChannel: 'DIRECT',
    idempotencyKey: 'teste-001'
  };
  return { ports, handlers, command };
}

test('Cria reserva confirmada com idempotência', async () => {
  const { ports, handlers, command } = await setup();

  const first = await handlers.createReservation.execute(command);
  const second = await handlers.createReservation.execute(command);

  assert.equal(first.status, 'confirmed');
  assert.match(first.code, /^RSV-[0-9A-F]{10}$/);
  assert.equal(second.id, first.id);
  assert.equal(ports.reservationRepository.items.size, 1);
  assert.deepEqual(ports.auditLog.entries.map(entry => entry.newStatus), ['confirmed']);
});

test('Retorna conflito quando o quarto não está disponível', async () => {
  const { handlers, command } = await setup();
  await handlers.createReservation.execute(command);

  await assert.rejects(
    () => handlers.createReservation.execute({ ...command, checkInDate: '2026-11-12', checkOutDate: '2026-11-15', idempotencyKey: 'teste-002' }),
    error => error.name === 'ConflictError' && error.statusCode === undefined
  );
});

test('Permite reservar o mesmo quarto em período encostado (check-out = novo check-in)', async () => {
  const { handlers, command } = await setup();
  await handlers.createReservation.execute(command);
  const next = await handlers.createReservation.execute({ ...command, checkInDate: '2026-11-13', checkOutDate: '2026-11-15', idempotencyKey: 'teste-003' });
  assert.equal(next.status, 'confirmed');
});

test('Reservas concorrentes no mesmo quarto: exatamente uma confirmada', async () => {
  const { handlers, command } = await setup();
  const attempts = Array.from({ length: 10 }, (_, index) => handlers.createReservation.execute({ ...command, idempotencyKey: `concorrente-${index}` }));
  const results = await Promise.allSettled(attempts);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.ok(results.filter(result => result.status === 'rejected').every(result => result.reason.name === 'ConflictError'));
});

test('Não permite valor total negativo', async () => {
  const { handlers, command } = await setup();

  await assert.rejects(
    () => handlers.createReservation.execute({ ...command, totalAmount: -100, idempotencyKey: 'teste-004' }),
    error => error.name === 'ValidationError' && error.statusCode === undefined
  );
});

test('Exige chave de idempotência', async () => {
  const { handlers, command } = await setup();

  await assert.rejects(
    () => handlers.createReservation.execute({ ...command, idempotencyKey: undefined }),
    error => error.name === 'ValidationError'
  );
});

test('Rejeita check-out anterior ao check-in como erro de validação', async () => {
  const { handlers, command } = await setup();

  await assert.rejects(
    () => handlers.createReservation.execute({ ...command, checkInDate: '2026-11-13', checkOutDate: '2026-11-10', idempotencyKey: 'teste-005' }),
    error => error.name === 'ValidationError'
  );
});

test('Rejeita datas em formato inválido', async () => {
  const { ports, handlers, command } = await setup();

  await assert.rejects(
    () => handlers.createReservation.execute({ ...command, checkInDate: 'data-invalida', idempotencyKey: 'teste-006' }),
    error => error.name === 'ValidationError'
  );
  assert.equal(ports.reservationRepository.items.size, 0);
});

test('Rejeita hóspede inexistente e origem fora do ERD', async () => {
  const { handlers, command } = await setup();
  await assert.rejects(
    () => handlers.createReservation.execute({ ...command, guestId: '00000000-0000-0000-0000-000000000000', idempotencyKey: 'teste-007' }),
    error => error.name === 'ValidationError'
  );
  await assert.rejects(
    () => handlers.createReservation.execute({ ...command, originChannel: 'WEB', idempotencyKey: 'teste-008' }),
    error => error.name === 'ValidationError'
  );
});

test('Ciclo completo: check-in, check-out e auditoria', async () => {
  const { ports, handlers, command } = await setup();
  const reservation = await handlers.createReservation.execute(command);

  await assert.rejects(() => handlers.checkOutReservation.execute({ reservationId: reservation.id }), error => error.name === 'ConflictError');
  const active = await handlers.checkInReservation.execute({ reservationId: reservation.id, changedBy: 'recepcao' });
  assert.equal(active.status, 'active');
  assert.ok(active.actualCheckInAt);
  await assert.rejects(() => handlers.cancelReservation.execute({ reservationId: reservation.id }), error => error.name === 'ConflictError');

  const completed = await handlers.checkOutReservation.execute({ reservationId: reservation.id });
  assert.equal(completed.status, 'completed');
  assert.deepEqual(
    ports.auditLog.entries.map(entry => [entry.previousStatus, entry.newStatus]),
    [[null, 'confirmed'], ['confirmed', 'active'], ['active', 'completed']]
  );
});

test('Check-in fora do período da reserva é recusado', async () => {
  const { handlers, command } = await setup();
  const future = await handlers.createReservation.execute({ ...command, checkInDate: '2026-12-01', checkOutDate: '2026-12-03', idempotencyKey: 'futuro' });
  await assert.rejects(() => handlers.checkInReservation.execute({ reservationId: future.id }), /a partir de 2026-12-01/);
});

test('Cancelar libera o quarto para nova reserva', async () => {
  const { handlers, command } = await setup();
  const reservation = await handlers.createReservation.execute(command);
  await handlers.cancelReservation.execute({ reservationId: reservation.id });
  const again = await handlers.createReservation.execute({ ...command, idempotencyKey: 'depois-do-cancelamento' });
  assert.equal(again.status, 'confirmed');
});

test('Alterar datas revalida a disponibilidade, ignorando a própria reserva', async () => {
  const { handlers, command } = await setup();
  const first = await handlers.createReservation.execute(command);
  const second = await handlers.createReservation.execute({ ...command, checkInDate: '2026-11-20', checkOutDate: '2026-11-22', idempotencyKey: 'segunda' });

  const extended = await handlers.updateReservation.execute({ reservationId: first.id, changes: { checkOutDate: '2026-11-14' } });
  assert.equal(extended.checkOutDate, '2026-11-14');
  await assert.rejects(
    () => handlers.updateReservation.execute({ reservationId: second.id, changes: { checkInDate: '2026-11-12' } }),
    error => error.name === 'ConflictError'
  );
});
