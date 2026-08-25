/**
 * @fileoverview Serviço de Reservas em conformidade com o Swagger e arc42 (RF01, RF03, RF04, RF05, RF07, RF08, RF09)
 */
import { apiClient } from './apiClient.js';
import { mockStorage } from '../mocks/mockStorage.js';

export const reservationService = {
  /**
   * Lista todas as reservas do sistema com filtro opcional por status
   * GET /reservation?status={pending|active|completed|cancelled}
   * @param {string} [status] - pending, active, completed, cancelled
   * @returns {Promise<Array>}
   */
  async getReservations(status) {
    try {
      const data = await apiClient.get('/reservation', { status });
      if (Array.isArray(data)) {
        return data;
      }
      return mockStorage.getReservations(status);
    } catch {
      // Fallback gracioso para persistência local caso o endpoint remoto esteja offline
      return mockStorage.getReservations(status);
    }
  },

  /**
   * Busca uma reserva pelo ID
   * GET /reservation/{reservationId}
   * @param {number|string} reservationId
   * @returns {Promise<Object>}
   */
  async getReservationById(reservationId) {
    try {
      const data = await apiClient.get(`/reservation/${reservationId}`);
      if (data && data.id) {
        return data;
      }
      return mockStorage.getReservationById(reservationId);
    } catch {
      return mockStorage.getReservationById(reservationId);
    }
  },

  /**
   * Recebe notificação e cadastra uma nova reserva (RF01, RF03, RF04, RF05)
   * POST /reservation
   * @param {Object} reservationData - { guest, room, checkInDate, checkOutDate, status }
   * @returns {Promise<Object>}
   */
  async createReservation(reservationData) {
    try {
      const result = await apiClient.post('/reservation', reservationData);
      // Sincroniza localmente
      mockStorage.createReservation(reservationData);
      return result || reservationData;
    } catch {
      return mockStorage.createReservation(reservationData);
    }
  },

  /**
   * Registra o check-in da reserva e altera status do quarto para occupied (RF07)
   * POST /reservation/{reservationId}/checkin
   * @param {number|string} reservationId
   * @returns {Promise<Object>}
   */
  async registerCheckIn(reservationId) {
    try {
      const res = await apiClient.post(`/reservation/${reservationId}/checkin`);
      mockStorage.registerCheckIn(reservationId);
      return res;
    } catch {
      return mockStorage.registerCheckIn(reservationId);
    }
  },

  /**
   * Registra o check-out da reserva e altera status do quarto para dirty (RF08, RF09)
   * POST /reservation/{reservationId}/checkout
   * @param {number|string} reservationId
   * @returns {Promise<Object>}
   */
  async registerCheckOut(reservationId) {
    try {
      const res = await apiClient.post(`/reservation/${reservationId}/checkout`);
      mockStorage.registerCheckOut(reservationId);
      return res;
    } catch {
      return mockStorage.registerCheckOut(reservationId);
    }
  },
};
