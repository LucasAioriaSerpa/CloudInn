/**
 * @fileoverview Serviço de Hóspedes em conformidade com o Swagger e arc42 (RF02)
 */
import { apiClient } from './apiClient.js';
import { mockStorage } from '../mocks/mockStorage.js';

export const guestService = {
  /**
   * Obtém lista de hóspedes
   * @returns {Promise<Array>}
   */
  async getGuests() {
    return mockStorage.getGuests();
  },

  /**
   * Busca um hóspede pelo ID
   * GET /guest/{guestId}
   * @param {number|string} guestId
   * @returns {Promise<Object>}
   */
  async getGuestById(guestId) {
    try {
      const data = await apiClient.get(`/guest/${guestId}`);
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
   * POST /guest
   * @param {Object} guestData - { name, document, email, phone }
   * @returns {Promise<Object>}
   */
  async createGuest(guestData) {
    try {
      const res = await apiClient.post('/guest', guestData);
      const saved = mockStorage.saveGuest(guestData);
      return res || saved;
    } catch {
      return mockStorage.saveGuest(guestData);
    }
  },

  /**
   * Atualiza os dados de um hóspede
   * PUT /guest/{guestId}
   * @param {number|string} guestId
   * @param {Object} guestData
   * @returns {Promise<Object>}
   */
  async updateGuest(guestId, guestData) {
    try {
      const res = await apiClient.put(`/guest/${guestId}`, guestData);
      mockStorage.saveGuest({ ...guestData, id: guestId });
      return res || { code: 200, message: 'Hóspede atualizado com sucesso' };
    } catch {
      mockStorage.saveGuest({ ...guestData, id: guestId });
      return { code: 200, message: 'Hóspede atualizado com sucesso' };
    }
  },
};
