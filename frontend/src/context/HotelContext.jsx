/**
 * @fileoverview Serviço de Quartos em conformidade com o Swagger e arc42 (RF06, RF10, RF11)
 */
import { apiClient } from "./apiClient.js";
import { mockStorage } from "../mocks/mockStorage.js";

export const roomService = {
  /**
   * Lista todos os quartos com filtro opcional por status
   * SELECT / fc_gp_cloudInn_select (GET /room?status=...)
   * @param {string} [status]
   * @returns {Promise<Array>}
   */
  async getRooms(status) {
    try {
      const data = await apiClient.select("room", { status });
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
   * SELECT / fc_gp_cloudInn_select (GET /room/{roomId})
   * @param {number|string} roomId
   * @returns {Promise<Object>}
   */
  async getRoomById(roomId) {
    try {
      const data = await apiClient.select("room", { id: roomId });
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
   * UPDATE / fc_gp_cloudInn_update (POST /room/{roomId}?status={status})
   * @param {number|string} roomId
   * @param {string} status - available, reserved, occupied, dirty, cleaning
   * @returns {Promise<Object>}
   */
  async updateRoomStatus(roomId, status) {
    try {
      const res = await apiClient.update("room", roomId, {}, { status });
      mockStorage.updateRoomStatus(roomId, status);
      return res;
    } catch {
      return mockStorage.updateRoomStatus(roomId, status);
    }
  },

  /**
   * Cadastra um novo quarto
   * INSERT / fc_gp_cloudInn_insert (POST /room)
   * @param {Object} roomData
   * @returns {Promise<Object>}
   */
  async createRoom(roomData) {
    try {
      const res = await apiClient.insert("room", roomData);
      return res;
    } catch {
      return roomData;
    }
  },

  /**
   * Exclui um quarto
   * DELETE / fc_gp_cloudInn_delete
   * @param {number|string} roomId
   * @returns {Promise<Object>}
   */
  async deleteRoom(roomId) {
    try {
      const res = await apiClient.deleteRecord("room", roomId);
      return res;
    } catch {
      return { code: 200, message: "Quarto excluído" };
    }
  },
};
