// Contratos (portas) que os adaptadores de infraestrutura precisam cumprir.
// Cada handler declara os métodos que usa; um adaptador incompleto falha na inicialização.
const PORTS = {
  roomRepository: ['findById', 'findAll', 'create', 'save', 'delete'],
  staffRepository: ['findById', 'findAll', 'findByLogin', 'create', 'save', 'delete'],
  hotelRepository: ['findById'],
  eventPublisher: ['publish'],
  passwordHasher: ['hash', 'compare'],
  eventInbox: ['has', 'markProcessed'],
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
