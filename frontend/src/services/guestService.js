/**
 * @fileoverview Serviço de Hóspedes em conformidade com o Swagger e arc42 (RF02)
 * Comunicação direta com as Azure Functions e MongoDB sem mascaramento de erro por fallback local.
 */
import { apiClient } from "./apiClient.js";

export const guestService = {
  /**
   * Obtém lista de hóspedes
   * SELECT / fc_gp_cloudInn_select (GET /guest ou ?entity=guest)
   * @param {string} [search]
   * @returns {Promise<Array>}
   */
  async getGuests(search = "") {
    const data = await apiClient.select("guest", { search });
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  },

  /**
   * Busca um hóspede pelo ID
   * SELECT / fc_gp_cloudInn_select (GET /guest/{guestId})
   * @param {number|string} guestId
   * @returns {Promise<Object>}
   */
  async getGuestById(guestId) {
    const data = await apiClient.select("guest", { id: guestId });
    return data;
  },

  /**
   * Cadastra os dados de um novo hóspede (RF02)
   * INSERT / fc_gp_cloudInn_insert (POST /guest)
   * @param {Object} guestData - { name, document, email, phone }
   * @returns {Promise<Object>}
   */
  async createGuest(guestData) {
    const res = await apiClient.insert("guest", guestData);
    return res;
  },

  /**
   * Atualiza os dados de um hóspede
   * UPDATE / fc_gp_cloudInn_update (PUT /guest/{guestId})
   * @param {number|string} guestId
   * @param {Object} guestData
   * @returns {Promise<Object>}
   */
  async updateGuest(guestId, guestData) {
    const res = await apiClient.update("guest", guestId, guestData);
    return res;
  },

  /**
   * Exclui um hóspede
   * DELETE / fc_gp_cloudInn_delete (DELETE /guest/{guestId})
   * @param {number|string} guestId
   * @returns {Promise<Object>}
   */
  async deleteGuest(guestId) {
    const res = await apiClient.deleteRecord("guest", guestId);
    return res;
  },
};
