/**
 * @fileoverview Serviço de Quartos em conformidade com o Swagger e arc42 (RF06, RF10, RF11)
 */
import { apiClient } from "./apiClient.js";
import { mockStorage } from "../mocks/mockStorage.js";

export const roomService = {
  /**
   * Lista todos os quartos com filtro opcional por status
   * GET /room?status={available|reserved|occupied|dirty|cleaning}
   * @param {string} [status]
   * @returns {Promise<Array>}
   */
  async getRooms(status) {
    try {
      const data = await apiClient.get("/room", { status });
      if (Array.isArray(data)) {
        return data;
      }
      return mockStorage.getRooms(status);
    } catch {
      return mockStorage.getRooms(status);
    }
  },

  /**
   * Busca quarto por ID
   * GET /room/{roomId}
   * @param {number|string} roomId
   * @returns {Promise<Object>}
   */
  async getRoomById(roomId) {
    try {
      const data = await apiClient.get(`/room/${roomId}`);
      if (data && data.id) {
        return data;
      }
      return mockStorage.getRoomById(roomId);
    } catch {
      return mockStorage.getRoomById(roomId);
    }
  },

  /**
   * Atualiza o status do quarto para limpeza ou disponibilização (RF06, RF10, RF11)
   * POST /room/{roomId}?status={status}
   * @param {number|string} roomId
   * @param {string} status - available, reserved, occupied, dirty, cleaning
   * @returns {Promise<Object>}
   */
  async updateRoomStatus(roomId, status) {
    try {
      const res = await apiClient.post(`/room/${roomId}`, null, { status });
      mockStorage.updateRoomStatus(roomId, status);
      return res;
    } catch {
      return mockStorage.updateRoomStatus(roomId, status);
    }
  },
};
