/**
 * @fileoverview Serviço de Funcionários / Staff em conformidade com o Swagger e RBAC
 * Comunicação direta com as Azure Functions e coleção 'staff' no MongoDB / Bridge Local.
 */
import { apiClient } from "./apiClient.js";

export const staffService = {
  /**
   * Obtém lista de colaboradores do hotel com filtros opcionais
   * SELECT / fc_gp_cloudInn_select (GET /staff ou ?entity=staff)
   * @param {Object} [params] - { role, department, status, search }
   * @returns {Promise<Array>}
   */
  async getStaff(params = {}) {
    const data = await apiClient.select("staff", params);
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  },

  /**
   * Busca um colaborador pelo ID
   * SELECT / fc_gp_cloudInn_select (GET /staff/{staffId})
   * @param {number|string} staffId
   * @returns {Promise<Object>}
   */
  async getStaffById(staffId) {
    const data = await apiClient.select("staff", { id: staffId });
    return data;
  },

  /**
   * Cadastra um novo colaborador no sistema RBAC
   * INSERT / fc_gp_cloudInn_insert (POST /staff)
   * @param {Object} staffData - { name, username, role, email, department, shift, phone, document }
   * @returns {Promise<Object>}
   */
  async createStaff(staffData) {
    const res = await apiClient.insert("staff", staffData);
    return res;
  },

  /**
   * Atualiza os dados ou cargo/permissões de um colaborador
   * UPDATE / fc_gp_cloudInn_update (PUT /staff/{staffId})
   * @param {number|string} staffId
   * @param {Object} staffData
   * @returns {Promise<Object>}
   */
  async updateStaff(staffId, staffData) {
    const res = await apiClient.update("staff", staffId, staffData);
    return res;
  },

  /**
   * Exclui um colaborador da equipe
   * DELETE / fc_gp_cloudInn_delete (DELETE /staff/{staffId})
   * @param {number|string} staffId
   * @returns {Promise<Object>}
   */
  async deleteStaff(staffId) {
    const res = await apiClient.delete("staff", staffId);
    return res;
  },
};
