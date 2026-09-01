/**
 * @fileoverview Centralização das URLs de integração com as Azure Functions e API do CloudInn
 * Configuração estrita de import.meta.env conforme especificações da arquitetura
 */

export const API_URLS = {
  insert: import.meta.env.VITE_CLOUDINN_INSERT_URL || "",
  select: import.meta.env.VITE_CLOUDINN_SELECT_URL || "",
  update: import.meta.env.VITE_CLOUDINN_UPDATE_URL || "",
  delete: import.meta.env.VITE_CLOUDINN_DELETE_URL || "",
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://mock.apidog.com/m1/1365796-1370036-1426621";

export const API_KEY = import.meta.env.VITE_API_KEY || "";
