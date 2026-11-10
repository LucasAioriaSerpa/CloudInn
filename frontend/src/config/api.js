/**
 * Configuração de URLs das Azure Functions.
 * As URLs são lidas diretamente das Environment Variables configuradas no Azure:
 * - VITE_CLOUDINN_INSERT_URL
 * - VITE_CLOUDINN_SELECT_URL
 * - VITE_CLOUDINN_UPDATE_URL
 * - VITE_CLOUDINN_DELETE_URL
 * - VITE_CLOUDINN_HEALTH_URL
 *
 * Em desenvolvimento local (quando as variáveis de ambiente não forem informadas),
 * utiliza os endpoints do proxy local (/api/httpTrigger*).
 */

const env =
  (typeof import.meta !== "undefined" && import.meta.env) ||
  (typeof process !== "undefined" && process.env) ||
  {};

const getEnvUrl = (envVarName, localFallback) => {
  const envValue = env[envVarName];
  if (envValue && typeof envValue === "string" && envValue.trim() !== "") {
    return envValue.trim();
  }
  return localFallback;
};

export const API_URLS = {
  insert: getEnvUrl("VITE_CLOUDINN_INSERT_URL", "/api/httpTriggerInsert"),
  select: getEnvUrl("VITE_CLOUDINN_SELECT_URL", "/api/httpTriggerSelect"),
  update: getEnvUrl("VITE_CLOUDINN_UPDATE_URL", "/api/httpTriggerUpdate"),
  delete: getEnvUrl("VITE_CLOUDINN_DELETE_URL", "/api/httpTriggerDelete"),
  health: getEnvUrl("VITE_CLOUDINN_HEALTH_URL", "/api/httpTriggerHealth"),
};

export const API_BASE_URL = env.VITE_API_BASE_URL || "";
export const API_KEY = env.VITE_API_KEY || "";

export const MOCK_RESERVATION_URL =
  env.VITE_MOCK_API_URL ||
  "https://mock.apidog.com/m1/1365796-1370036-1444387/reservation";

if (env.PROD) {
  console.log(
    "[API Config] Azure Static Web App - URLs obtidas das Environment Variables:",
    API_URLS,
  );
}
