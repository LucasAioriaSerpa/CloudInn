/**
 * @fileoverview Serviço de Reservas em conformidade com o Swagger e arc42 (RF01, RF03, RF04, RF05, RF07, RF08, RF09)
 * Comunicação direta com as Azure Functions e MongoDB sem mascaramento de erro por fallback local.
 */
import { apiClient } from "./apiClient.js";

export const reservationService = {
  /**
   * Lista todas as reservas do sistema com filtro opcional por status
   * SELECT / fc_gp_cloudInn_select (GET /reservation?status=...)
   * @param {string} [status] - pending, active, completed, cancelled
   * @returns {Promise<Array>}
   */
  async getReservations(status) {
    const data = await apiClient.select("reservation", { status });
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  },

  /**
   * Busca uma reserva pelo ID
   * SELECT / fc_gp_cloudInn_select (GET /reservation/{reservationId})
   * @param {number|string} reservationId
   * @returns {Promise<Object>}
   */
  async getReservationById(reservationId) {
    const data = await apiClient.select("reservation", { id: reservationId });
    return data;
  },

  /**
   * Cadastra uma nova reserva (RF01, RF03, RF04, RF05)
   * INSERT / fc_gp_cloudInn_insert (POST /reservation)
   * @param {Object} reservationData - { guest, room, checkInDate, checkOutDate, status }
   * @returns {Promise<Object>}
   */
  async createReservation(reservationData) {
    const result = await apiClient.insert("reservation", reservationData);
    return result || reservationData;
  },

  /**
   * Atualiza os dados de uma reserva
   * UPDATE / fc_gp_cloudInn_update
   * @param {number|string} reservationId
   * @param {Object} reservationData
   * @returns {Promise<Object>}
   */
  async updateReservation(reservationId, reservationData) {
    const result = await apiClient.update(
      "reservation",
      reservationId,
      reservationData,
    );
    return result;
  },

  /**
   * Registra o check-in da reserva e altera status do quarto para occupied (RF07)
   * UPDATE / fc_gp_cloudInn_update (POST /reservation/{reservationId}/checkin)
   * @param {number|string} reservationId
   * @returns {Promise<Object>}
   */
  async registerCheckIn(reservationId) {
    const res = await apiClient.update(
      "reservation",
      reservationId,
      {},
      { action: "checkin" },
    );
    return res;
  },

  /**
   * Registra o check-out da reserva e altera status do quarto para dirty (RF08, RF09)
   * UPDATE / fc_gp_cloudInn_update (POST /reservation/{reservationId}/checkout)
   * @param {number|string} reservationId
   * @returns {Promise<Object>}
   */
  async registerCheckOut(reservationId) {
    const res = await apiClient.update(
      "reservation",
      reservationId,
      {},
      { action: "checkout" },
    );
    return res;
  },

  /**
   * Exclui uma reserva
   * DELETE / fc_gp_cloudInn_delete (DELETE /reservation/{reservationId})
   * @param {number|string} reservationId
   * @returns {Promise<Object>}
   */
  async deleteReservation(reservationId) {
    const res = await apiClient.deleteRecord("reservation", reservationId);
    return res;
  },
};
