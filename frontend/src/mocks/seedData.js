/**
 * @fileoverview Dados iniciais realistas para o sistema CloudInn, em total conformidade com o Swagger
 */

export const INITIAL_GUESTS = [
  {
    id: 1,
    name: "João Silva",
    document: "123.456.789-00",
    email: "joao.silva@email.com",
    phone: "+55 41 99999-9999",
  },
  {
    id: 2,
    name: "Maria Fernandes",
    document: "987.654.321-11",
    email: "maria.fernandes@corp.com",
    phone: "+55 11 98888-7777",
  },
  {
    id: 3,
    name: "Carlos Eduardo Souza",
    document: "456.789.123-22",
    email: "carlos.souza@tech.io",
    phone: "+55 21 97777-6666",
  },
  {
    id: 4,
    name: "Ana Beatriz Lima",
    document: "321.654.987-33",
    email: "ana.lima@design.com",
    phone: "+55 31 96666-5555",
  },
  {
    id: 5,
    name: "Roberto Alvarez",
    document: "PASS-BR908123",
    email: "roberto.alvarez@viagens.com.br",
    phone: "+55 47 95555-4444",
  },
  {
    id: 6,
    name: "Juliana Mendes",
    document: "654.321.789-44",
    email: "juliana.mendes@advocacia.com",
    phone: "+55 61 94444-3333",
  },
];

export const FIXED_ROOMS = [
  // 10x - 1º Andar (Standard)
  { id: 101, number: "101", roomType: "STD", status: "occupied" },
  { id: 102, number: "102", roomType: "STD", status: "available" },
  { id: 103, number: "103", roomType: "STD", status: "dirty" },
  { id: 104, number: "104", roomType: "STD", status: "cleaning" },
  // 20x - 2º Andar (Deluxe)
  { id: 201, number: "201", roomType: "DLX", status: "reserved" },
  { id: 202, number: "202", roomType: "DLX", status: "available" },
  { id: 203, number: "203", roomType: "DLX", status: "occupied" },
  { id: 204, number: "204", roomType: "DLX", status: "dirty" },
  // 30x - 3º Andar (Suíte Master)
  { id: 301, number: "301", roomType: "SUI", status: "reserved" },
  { id: 302, number: "302", roomType: "SUI", status: "available" },
  { id: 303, number: "303", roomType: "SUI", status: "available" },
  { id: 304, number: "304", roomType: "SUI", status: "available" },
  // 40x - 4º Andar (Presidencial)
  { id: 401, number: "401", roomType: "PRE", status: "available" },
  { id: 402, number: "402", roomType: "PRE", status: "occupied" },
  { id: 403, number: "403", roomType: "PRE", status: "available" },
  { id: 404, number: "404", roomType: "PRE", status: "available" },
];

export const INITIAL_ROOMS = FIXED_ROOMS;

export const INITIAL_RESERVATIONS = [
  {
    id: 1001,
    guest: INITIAL_GUESTS[0],
    room: INITIAL_ROOMS[0],
    checkInDate: "2026-08-24T14:00:00Z",
    checkOutDate: "2026-08-28T12:00:00Z",
    status: "active",
  },
  {
    id: 1002,
    guest: INITIAL_GUESTS[1],
    room: INITIAL_ROOMS[4],
    checkInDate: "2026-08-25T14:00:00Z",
    checkOutDate: "2026-08-30T11:00:00Z",
    status: "pending",
  },
  {
    id: 1003,
    guest: INITIAL_GUESTS[2],
    room: INITIAL_ROOMS[6],
    checkInDate: "2026-08-23T15:00:00Z",
    checkOutDate: "2026-08-26T10:00:00Z",
    status: "active",
  },
  {
    id: 1004,
    guest: INITIAL_GUESTS[3],
    room: INITIAL_ROOMS[8],
    checkInDate: "2026-08-26T14:00:00Z",
    checkOutDate: "2026-08-29T12:00:00Z",
    status: "pending",
  },
  {
    id: 1005,
    guest: INITIAL_GUESTS[4],
    room: INITIAL_ROOMS[2],
    checkInDate: "2026-08-20T14:00:00Z",
    checkOutDate: "2026-08-24T11:00:00Z",
    status: "completed",
  },
  {
    id: 1006,
    guest: INITIAL_GUESTS[5],
    room: INITIAL_ROOMS[13],
    checkInDate: "2026-08-22T16:00:00Z",
    checkOutDate: "2026-08-27T12:00:00Z",
    status: "active",
  },
];
