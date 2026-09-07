/**
 * @fileoverview Centralização das URLs de integração com as Azure Functions e API do CloudInn
 * Configuração estrita de import.meta.env conforme especificações da arquitetura
 */

export const API_URLS = {
  insert:
    import.meta.env.VITE_CLOUDINN_INSERT_URL || "/api/httpTriggerInsert",
  select:
    import.meta.env.VITE_CLOUDINN_SELECT_URL || "/api/httpTriggerSelect",
  update:
    import.meta.env.VITE_CLOUDINN_UPDATE_URL || "/api/httpTriggerUpdate",
  delete:
    import.meta.env.VITE_CLOUDINN_DELETE_URL || "/api/httpTriggerDelete",
  health:
    import.meta.env.VITE_CLOUDINN_HEALTH_URL || "/api/httpTriggerHealth",
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const API_KEY = import.meta.env.VITE_API_KEY || "";
