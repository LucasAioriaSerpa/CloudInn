const isDevelopment = import.meta.env.DEV;

const getUrl = (envVar, fallback) => {
  const value = import.meta.env[envVar];
  if (value) {
    return value;
  }
  return isDevelopment ? fallback : "";
};

export const API_URLS = {
  insert: getUrl("VITE_CLOUDINN_INSERT_URL", "/api/httpTriggerInsert"),
  select: getUrl("VITE_CLOUDINN_SELECT_URL", "/api/httpTriggerSelect"),
  update: getUrl("VITE_CLOUDINN_UPDATE_URL", "/api/httpTriggerUpdate"),
  delete: getUrl("VITE_CLOUDINN_DELETE_URL", "/api/httpTriggerDelete"),
  health: getUrl("VITE_CLOUDINN_HEALTH_URL", "/api/httpTriggerHealth"),
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const API_KEY = import.meta.env.VITE_API_KEY || "";

if (!isDevelopment) {
  console.log(
    "[API Config] Production mode - using Azure Function URLs from environment",
  );
  Object.entries(API_URLS).forEach(([key, url]) => {
    if (!url) {
      console.warn(
        `[API Config] VITE_CLOUDINN_${key.toUpperCase()}_URL not configured`,
      );
    }
  });
}
