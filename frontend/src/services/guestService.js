/**
 * @fileoverview Serviço de Hóspedes em conformidade com o Swagger e arc42 (RF02)
 */
import { apiClient } from "./apiClient.js";
import { mockStorage } from "../mocks/mockStorage.js";

export const guestService = {
  /**
   * Obtém lista de hóspedes
   * SELECT / fc_gp_cloudInn_select (GET /guest ou ?entity=guest)
   * @param {string} [search]
   * @returns {Promise<Array>}
   */
  async getGuests(search = "") {
    try {
      const data = await apiClient.select("guest", { search });
      if (Array.isArray(data)) {
        return data;
      }
      return mockStorage.getGuests();
    } catch {
      return mockStorage.getGuests();
    }
  },

  /**
   * Busca um hóspede pelo ID
   * SELECT / fc_gp_cloudInn_select (GET /guest/{guestId})
   * @param {number|string} guestId
   * @returns {Promise<Object>}
   */
  async getGuestById(guestId) {
    try {
      const data = await apiClient.select("guest", { id: guestId });
      if (data && data.id) {
        return data;
      }
      return mockStorage.getGuestById(guestId);
    } catch {
      return mockStorage.getGuestById(guestId);
    }
  },

  /**
   * Cadastra os dados de um novo hóspede (RF02)
   * INSERT / fc_gp_cloudInn_insert (POST /guest)
   * @param {Object} guestData - { name, document, email, phone }
   * @returns {Promise<Object>}
   */
  async createGuest(guestData) {
    try {
      const res = await apiClient.insert("guest", guestData);
      const saved = mockStorage.saveGuest(guestData);
      return res || saved;
    } catch {
      return mockStorage.saveGuest(guestData);
    }
  },

  /**
   * Atualiza os dados de um hóspede
   * UPDATE / fc_gp_cloudInn_update (PUT /guest/{guestId})
   * @param {number|string} guestId
   * @param {Object} guestData
   * @returns {Promise<Object>}
   */
  async updateGuest(guestId, guestData) {
    try {
      const res = await apiClient.update("guest", guestId, guestData);
      mockStorage.saveGuest({ ...guestData, id: guestId });
      return res || { code: 200, message: "Hóspede atualizado com sucesso" };
    } catch {
      mockStorage.saveGuest({ ...guestData, id: guestId });
      return { code: 200, message: "Hóspede atualizado com sucesso" };
    }
  },

  /**
   * Exclui um hóspede
   * DELETE / fc_gp_cloudInn_delete (DELETE /guest/{guestId})
   * @param {number|string} guestId
   * @returns {Promise<Object>}
   */
  async deleteGuest(guestId) {
    try {
      const res = await apiClient.deleteRecord("guest", guestId);
      mockStorage.deleteGuest(guestId);
      return res;
    } catch {
      return mockStorage.deleteGuest(guestId);
    }
  },
};
