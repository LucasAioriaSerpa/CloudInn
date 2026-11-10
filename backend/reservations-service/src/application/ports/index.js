// Contratos (portas) que os adaptadores de infraestrutura precisam cumprir.
// Cada handler declara os métodos que usa; um adaptador incompleto falha na inicialização.
// Métodos de repositório aceitam a transação como último argumento opcional.
const PORTS = {
  reservationRepository: ['findById', 'findAll', 'hasOverlap', 'create', 'save'],
  guestRepository: ['findById', 'findAll', 'findByDocument', 'create', 'save', 'delete', 'hasReservations'],
  idempotencyRepository: ['find', 'save'],
  auditLog: ['record'],
  outbox: ['add'],
  unitOfWork: ['transaction'],
  clock: ['now']
};

function assertPort(name, adapter, methods = PORTS[name]) {
  const missing = methods.filter(method => typeof adapter?.[method] !== 'function');
  if (missing.length) {
    throw new TypeError(`O adaptador "${name}" não implementa: ${missing.join(', ')}`);
  }
  return adapter;
}

module.exports = { PORTS, assertPort };
