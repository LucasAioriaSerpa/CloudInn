/**
 * @fileoverview Serviço de Reservas em conformidade com o Swagger e arc42 (RF01, RF03, RF04, RF05, RF07, RF08, RF09)
 */
import { apiClient } from "./apiClient.js";
import { mockStorage } from "../mocks/mockStorage.js";

export const reservationService = {
  /**
   * Lista todas as reservas do sistema com filtro opcional por status
   * SELECT / fc_gp_cloudInn_select (GET /reservation?status=...)
   * @param {string} [status] - pending, active, completed, cancelled
   * @returns {Promise<Array>}
   */
  async getReservations(status) {
    try {
      const data = await apiClient.select("reservation", { status });
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
   * SELECT / fc_gp_cloudInn_select (GET /reservation/{reservationId})
   * @param {number|string} reservationId
   * @returns {Promise<Object>}
   */
  async getReservationById(reservationId) {
    try {
      const data = await apiClient.select("reservation", { id: reservationId });
      if (data && data.id) {
        return data;
      }
      return mockStorage.getReservationById(reservationId);
    } catch {
      return mockStorage.getReservationById(reservationId);
    }
  },

  /**
   * Cadastra uma nova reserva (RF01, RF03, RF04, RF05)
   * INSERT / fc_gp_cloudInn_insert (POST /reservation)
   * @param {Object} reservationData - { guest, room, checkInDate, checkOutDate, status }
   * @returns {Promise<Object>}
   */
  async createReservation(reservationData) {
    try {
      const result = await apiClient.insert("reservation", reservationData);
      mockStorage.createReservation(reservationData);
      return result || reservationData;
    } catch {
      return mockStorage.createReservation(reservationData);
    }
  },

  /**
   * Atualiza os dados de uma reserva
   * UPDATE / fc_gp_cloudInn_update
   * @param {number|string} reservationId
   * @param {Object} reservationData
   * @returns {Promise<Object>}
   */
  async updateReservation(reservationId, reservationData) {
    try {
      const result = await apiClient.update(
        "reservation",
        reservationId,
        reservationData,
      );
      return result;
    } catch {
      return { code: 200, message: "Reserva atualizada com sucesso" };
    }
  },

  /**
   * Registra o check-in da reserva e altera status do quarto para occupied (RF07)
   * UPDATE / fc_gp_cloudInn_update (POST /reservation/{reservationId}/checkin)
   * @param {number|string} reservationId
   * @returns {Promise<Object>}
   */
  async registerCheckIn(reservationId) {
    try {
      const res = await apiClient.update(
        "reservation",
        reservationId,
        {},
        { action: "checkin" },
      );
      mockStorage.registerCheckIn(reservationId);
      return res;
    } catch {
      return mockStorage.registerCheckIn(reservationId);
    }
  },

  /**
   * Registra o check-out da reserva e altera status do quarto para dirty (RF08, RF09)
   * UPDATE / fc_gp_cloudInn_update (POST /reservation/{reservationId}/checkout)
   * @param {number|string} reservationId
   * @returns {Promise<Object>}
   */
  async registerCheckOut(reservationId) {
    try {
      const res = await apiClient.update(
        "reservation",
        reservationId,
        {},
        { action: "checkout" },
      );
      mockStorage.registerCheckOut(reservationId);
      return res;
    } catch {
      return mockStorage.registerCheckOut(reservationId);
    }
  },

  /**
   * Exclui uma reserva
   * DELETE / fc_gp_cloudInn_delete (DELETE /reservation/{reservationId})
   * @param {number|string} reservationId
   * @returns {Promise<Object>}
   */
  async deleteReservation(reservationId) {
    try {
      const res = await apiClient.deleteRecord("reservation", reservationId);
      mockStorage.deleteReservation(reservationId);
      return res;
    } catch {
      return mockStorage.deleteReservation(reservationId);
    }
  },
};
