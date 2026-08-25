/**
 * @fileoverview Constantes do sistema CloudInn, contratos de dados, enums e tokens de status
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://mock.apidog.com/m1/1365796-1370036-1426621';
export const API_KEY = import.meta.env.VITE_API_KEY || '';

/**
 * Status de Reservas conforme Swagger
 */
export const RESERVATION_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const RESERVATION_STATUS_LABELS = {
  [RESERVATION_STATUS.PENDING]: 'Pendente',
  [RESERVATION_STATUS.ACTIVE]: 'Ativa',
  [RESERVATION_STATUS.COMPLETED]: 'Concluída',
  [RESERVATION_STATUS.CANCELLED]: 'Cancelada',
};

export const RESERVATION_STATUS_BADGES = {
  [RESERVATION_STATUS.PENDING]: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    label: 'Pendente',
  },
  [RESERVATION_STATUS.ACTIVE]: {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-600',
    label: 'Ativa',
  },
  [RESERVATION_STATUS.COMPLETED]: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-600',
    label: 'Concluída',
  },
  [RESERVATION_STATUS.CANCELLED]: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Cancelada',
  },
};

/**
 * Status de Quartos conforme Swagger
 */
export const ROOM_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  OCCUPIED: 'occupied',
  DIRTY: 'dirty',
  CLEANING: 'cleaning',
};

export const ROOM_STATUS_LABELS = {
  [ROOM_STATUS.AVAILABLE]: 'Disponível',
  [ROOM_STATUS.RESERVED]: 'Reservado',
  [ROOM_STATUS.OCCUPIED]: 'Ocupado',
  [ROOM_STATUS.DIRTY]: 'Sujo',
  [ROOM_STATUS.CLEANING]: 'Em Limpeza',
};

export const ROOM_STATUS_BADGES = {
  [ROOM_STATUS.AVAILABLE]: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Disponível',
    actionLabel: 'Disponibilizar',
  },
  [ROOM_STATUS.RESERVED]: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    label: 'Reservado',
    actionLabel: 'Reservar',
  },
  [ROOM_STATUS.OCCUPIED]: {
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-600',
    label: 'Ocupado',
    actionLabel: 'Ocupar',
  },
  [ROOM_STATUS.DIRTY]: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Sujo',
    actionLabel: 'Marcar como Sujo',
  },
  [ROOM_STATUS.CLEANING]: {
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    label: 'Em Limpeza',
    actionLabel: 'Iniciar Limpeza',
  },
};

/**
 * Tipos de quarto comuns suportados pelo sistema
 */
export const ROOM_TYPES = [
  { value: 'STD', label: 'Standard (STD)' },
  { value: 'DLX', label: 'Deluxe (DLX)' },
  { value: 'SUI', label: 'Suíte (SUI)' },
  { value: 'PRE', label: 'Presidencial (PRE)' },
];

export const ROOM_TYPE_LABELS = {
  STD: 'Standard',
  DLX: 'Deluxe',
  SUI: 'Suíte Master',
  PRE: 'Presidencial',
};

/**
 * Rotas da aplicação
 */
export const ROUTES = {
  DASHBOARD: '/',
  RESERVATIONS: '/reservas',
  ROOMS: '/quartos',
  GUESTS: '/hospedes',
};
