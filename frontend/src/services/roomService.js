/**
 * @fileoverview Serviço de Quartos em conformidade com o Swagger e arc42 (RF06, RF10, RF11)
 * Comunicação direta com as Azure Functions e MongoDB sem mascaramento de erro por fallback local.
 */
import { apiClient } from "./apiClient.js";

export const roomService = {
  /**
   * Lista todos os quartos com filtro opcional por status
   * SELECT / fc_gp_cloudInn_select (GET /room?status=...)
   * @param {string} [status]
   * @returns {Promise<Array>}
   */
  async getRooms(status) {
    const data = await apiClient.select("room", { status });
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  },

  /**
   * Busca quarto por ID
   * SELECT / fc_gp_cloudInn_select (GET /room/{roomId})
   * @param {number|string} roomId
   * @returns {Promise<Object>}
   */
  async getRoomById(roomId) {
    const data = await apiClient.select("room", { id: roomId });
    return data;
  },

  /**
   * Atualiza o status do quarto para limpeza ou disponibilização (RF06, RF10, RF11)
   * UPDATE / fc_gp_cloudInn_update (POST /room/{roomId}?status={status})
   * @param {number|string} roomId
   * @param {string} status - available, reserved, occupied, dirty, cleaning
   * @returns {Promise<Object>}
   */
  async updateRoomStatus(roomId, status) {
    const res = await apiClient.update("room", roomId, {}, { status });
    return res;
  },

  /**
   * Cadastra um novo quarto
   * INSERT / fc_gp_cloudInn_insert (POST /room)
   * @param {Object} roomData
   * @returns {Promise<Object>}
   */
  async createRoom(roomData) {
    const res = await apiClient.insert("room", roomData);
    return res;
  },

  /**
   * Exclui um quarto
   * DELETE / fc_gp_cloudInn_delete
   * @param {number|string} roomId
   * @returns {Promise<Object>}
   */
  async deleteRoom(roomId) {
    const res = await apiClient.deleteRecord("room", roomId);
    return res;
  },
};
