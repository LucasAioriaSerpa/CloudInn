// DADOS DE DEMONSTRAÇÃO. Origem, sem valores inventados:
// - quartos: frontend/src/mocks/seedData.js (FIXED_ROOMS); o andar é o primeiro dígito do número;
// - funcionários: frontend/src/config/auth.js (DEFAULT_EMPLOYEES); o username é a parte do e-mail antes do @.
// A senha não fica aqui: vem de SEED_STAFF_PASSWORD.

const DEMO_HOTEL = {
  code: 'CLOUDINN-DEMO',
  name: 'CloudInn Hotel (demonstração)'
};

const DEMO_ROOMS = [
  ['101', 'STD', 'occupied'], ['102', 'STD', 'available'], ['103', 'STD', 'dirty'], ['104', 'STD', 'cleaning'],
  ['201', 'DLX', 'reserved'], ['202', 'DLX', 'available'], ['203', 'DLX', 'occupied'], ['204', 'DLX', 'dirty'],
  ['301', 'SUI', 'reserved'], ['302', 'SUI', 'available'], ['303', 'SUI', 'available'], ['304', 'SUI', 'available'],
  ['401', 'PRE', 'available'], ['402', 'PRE', 'occupied'], ['403', 'PRE', 'available'], ['404', 'PRE', 'available']
].map(([number, roomType, status]) => ({ number, roomType, status, floor: Number(number[0]) }));

const DEMO_STAFF = [
  { name: 'Mariana Costa', email: 'gerente@cloudinn.com', role: 'manager', roleLabel: 'Gerente Geral', department: 'Diretoria & Gestão Geral', avatar: 'MC', color: '#14248A' },
  { name: 'Fernando Albuquerque', email: 'subgerente@cloudinn.com', role: 'sub_manager', roleLabel: 'Sub-Gerente', department: 'Supervisão Operacional', avatar: 'FA', color: '#28262C' },
  { name: 'Lucas Oliveira', email: 'recepcao@cloudinn.com', role: 'receptionist', roleLabel: 'Recepcionista', department: 'Recepção & Front Desk', avatar: 'LO', color: '#998FC7' },
  { name: 'Claudia Santos', email: 'governanca@cloudinn.com', role: 'housekeeper', roleLabel: 'Governanta Chefe', department: 'Governança & Higienização', avatar: 'CS', color: '#059669' }
].map(staff => ({ ...staff, username: staff.email.split('@')[0], status: 'active' }));

module.exports = { DEMO_HOTEL, DEMO_ROOMS, DEMO_STAFF };
