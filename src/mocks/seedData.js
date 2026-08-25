/**
 * @fileoverview Dados iniciais realistas para o sistema CloudInn, em total conformidade com o Swagger
 */

export const INITIAL_GUESTS = [
  {
    id: 1,
    name: 'João Silva',
    document: '123.456.789-00',
    email: 'joao.silva@email.com',
    phone: '+55 41 99999-9999',
  },
  {
    id: 2,
    name: 'Maria Fernandes',
    document: '987.654.321-11',
    email: 'maria.fernandes@corp.com',
    phone: '+55 11 98888-7777',
  },
  {
    id: 3,
    name: 'Carlos Eduardo Souza',
    document: '456.789.123-22',
    email: 'carlos.souza@tech.io',
    phone: '+55 21 97777-6666',
  },
  {
    id: 4,
    name: 'Ana Beatriz Lima',
    document: '321.654.987-33',
    email: 'ana.lima@design.com',
    phone: '+55 31 96666-5555',
  },
  {
    id: 5,
    name: 'Roberto Alvarez',
    document: 'PASS-BR908123',
    email: 'roberto.alvarez@viagens.com.br',
    phone: '+55 47 95555-4444',
  },
  {
    id: 6,
    name: 'Juliana Mendes',
    document: '654.321.789-44',
    email: 'juliana.mendes@advocacia.com',
    phone: '+55 61 94444-3333',
  },
];

export const INITIAL_ROOMS = [
  { id: 101, number: '101A', roomType: 'STD', status: 'occupied' },
  { id: 102, number: '102A', roomType: 'STD', status: 'available' },
  { id: 103, number: '103A', roomType: 'STD', status: 'dirty' },
  { id: 104, number: '104A', roomType: 'STD', status: 'cleaning' },
  { id: 201, number: '201B', roomType: 'DLX', status: 'reserved' },
  { id: 202, number: '202B', roomType: 'DLX', status: 'available' },
  { id: 203, number: '203B', roomType: 'DLX', status: 'occupied' },
  { id: 204, number: '204B', roomType: 'DLX', status: 'dirty' },
  { id: 301, number: '301C', roomType: 'SUI', status: 'reserved' },
  { id: 302, number: '302C', roomType: 'SUI', status: 'available' },
  { id: 401, number: '401P', roomType: 'PRE', status: 'available' },
  { id: 402, number: '402P', roomType: 'PRE', status: 'occupied' },
];

export const INITIAL_RESERVATIONS = [
  {
    id: 1001,
    guest: INITIAL_GUESTS[0],
    room: INITIAL_ROOMS[0],
    checkInDate: '2026-08-24T14:00:00Z',
    checkOutDate: '2026-08-28T12:00:00Z',
    status: 'active',
  },
  {
    id: 1002,
    guest: INITIAL_GUESTS[1],
    room: INITIAL_ROOMS[4],
    checkInDate: '2026-08-25T14:00:00Z',
    checkOutDate: '2026-08-30T11:00:00Z',
    status: 'pending',
  },
  {
    id: 1003,
    guest: INITIAL_GUESTS[2],
    room: INITIAL_ROOMS[6],
    checkInDate: '2026-08-23T15:00:00Z',
    checkOutDate: '2026-08-26T10:00:00Z',
    status: 'active',
  },
  {
    id: 1004,
    guest: INITIAL_GUESTS[3],
    room: INITIAL_ROOMS[8],
    checkInDate: '2026-08-26T14:00:00Z',
    checkOutDate: '2026-08-29T12:00:00Z',
    status: 'pending',
  },
  {
    id: 1005,
    guest: INITIAL_GUESTS[4],
    room: INITIAL_ROOMS[2],
    checkInDate: '2026-08-20T14:00:00Z',
    checkOutDate: '2026-08-24T11:00:00Z',
    status: 'completed',
  },
  {
    id: 1006,
    guest: INITIAL_GUESTS[5],
    room: INITIAL_ROOMS[11],
    checkInDate: '2026-08-22T16:00:00Z',
    checkOutDate: '2026-08-27T12:00:00Z',
    status: 'active',
  },
];
