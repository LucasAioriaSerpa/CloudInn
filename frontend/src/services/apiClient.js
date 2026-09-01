/**
 * @fileoverview Cliente HTTP centralizado para comunicação com as Azure Functions e API REST do CloudInn
 */
import { API_URLS, API_BASE_URL, API_KEY } from "../config/constants.js";

class ApiClient {
  constructor() {
    this.urls = API_URLS;
    this.baseUrl = API_BASE_URL;
    this.apiKey = API_KEY;
  }

  /**
   * Constrói cabeçalhos padrão incluindo segurança api_key
   */
  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.apiKey) {
      headers["api_key"] = this.apiKey;
    }
    return headers;
  }

  /**
   * Executa requisições HTTP genéricas com tratamento de status
   * @param {string} fullUrlOrEndpoint - URL completa ou endpoint relativo
   * @param {RequestInit} options - Opções do fetch (method, headers, body)
   */
  async request(fullUrlOrEndpoint, options = {}) {
    const isAbsolute =
      fullUrlOrEndpoint.startsWith("http://") ||
      fullUrlOrEndpoint.startsWith("https://");
    const url = isAbsolute
      ? fullUrlOrEndpoint
      : `${this.baseUrl}${fullUrlOrEndpoint.startsWith("/") ? "" : "/"}${fullUrlOrEndpoint}`;

    const mergedOptions = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, mergedOptions);

      // Tentativa de leitura do JSON
      let data = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text ? { message: text } : null;
        }
      }

      if (!response.ok) {
        const error = new Error(
          data?.message ||
            `Erro na requisição: ${response.status} ${response.statusText}`,
        );
        error.status = response.status;
        error.code = data?.code || String(response.status);
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.warn(
        `[ApiClient] Falha na chamada HTTP (${options.method || "GET"}) para ${url}:`,
        err.message,
      );
      throw err;
    }
  }

  /**
   * Operação SELECT centralizada (chama fc_gp_cloudInn_select ou fallback)
   */
  async select(entity, queryParams = {}) {
    const functionUrl = this.urls.select;
    const searchParams = new URLSearchParams();
    searchParams.append("entity", entity);

    Object.entries(queryParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "" && val !== "all") {
        searchParams.append(key, val);
      }
    });

    const queryString = searchParams.toString();

    if (functionUrl) {
      const fullUrl = `${functionUrl}${functionUrl.includes("?") ? "&" : "?"}${queryString}`;
      return this.request(fullUrl, { method: "GET" });
    }

    // Fallback REST endpoint
    let restEndpoint = `/${entity}`;
    if (queryParams.id) {
      restEndpoint = `/${entity}/${queryParams.id}`;
    }
    return this.get(restEndpoint, queryParams);
  }

  /**
   * Operação INSERT centralizada (chama fc_gp_cloudInn_insert ou fallback)
   */
  async insert(entity, body = {}, queryParams = {}) {
    const functionUrl = this.urls.insert;
    const searchParams = new URLSearchParams();
    searchParams.append("entity", entity);

    Object.entries(queryParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, val);
      }
    });

    const queryString = searchParams.toString();

    if (functionUrl) {
      const fullUrl = `${functionUrl}${functionUrl.includes("?") ? "&" : "?"}${queryString}`;
      return this.request(fullUrl, {
        method: "POST",
        body: JSON.stringify(body),
      });
    }

    // Fallback REST endpoint
    return this.post(`/${entity}`, body, queryParams);
  }

  /**
   * Operação UPDATE centralizada (chama fc_gp_cloudInn_update ou fallback)
   */
  async update(entity, id, body = {}, queryParams = {}) {
    const functionUrl = this.urls.update;
    const searchParams = new URLSearchParams();
    searchParams.append("entity", entity);
    if (id) searchParams.append("id", String(id));

    Object.entries(queryParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, val);
      }
    });

    const queryString = searchParams.toString();

    if (functionUrl) {
      const fullUrl = `${functionUrl}${functionUrl.includes("?") ? "&" : "?"}${queryString}`;
      return this.request(fullUrl, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    }

    // Fallback REST endpoint
    return this.put(`/${entity}/${id}`, body);
  }

  /**
   * Operação DELETE centralizada (chama fc_gp_cloudInn_delete ou fallback)
   */
  async deleteRecord(entity, id, queryParams = {}) {
    const functionUrl = this.urls.delete;
    const searchParams = new URLSearchParams();
    searchParams.append("entity", entity);
    if (id) searchParams.append("id", String(id));

    Object.entries(queryParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, val);
      }
    });

    const queryString = searchParams.toString();

    if (functionUrl) {
      const fullUrl = `${functionUrl}${functionUrl.includes("?") ? "&" : "?"}${queryString}`;
      return this.request(fullUrl, { method: "DELETE" });
    }

    // Fallback REST endpoint
    return this.delete(`/${entity}/${id}`);
  }

  get(endpoint, queryParams = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "" && val !== "all") {
        searchParams.append(key, val);
      }
    });
    const queryString = searchParams.toString();
    const path = queryString
      ? `${endpoint}${endpoint.includes("?") ? "&" : "?"}${queryString}`
      : endpoint;
    return this.request(path, { method: "GET" });
  }

  post(endpoint, body = null, queryParams = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, val);
      }
    });
    const queryString = searchParams.toString();
    const path = queryString
      ? `${endpoint}${endpoint.includes("?") ? "&" : "?"}${queryString}`
      : endpoint;

    return this.request(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put(endpoint, body = null) {
    return this.request(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient();
