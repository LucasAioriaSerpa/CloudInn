/**
 * @fileoverview Cliente HTTP centralizado para comunicação com a API REST do CloudInn
 */
import { API_BASE_URL, API_KEY } from "../config/constants.js";

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.apiKey = API_KEY;
    this.preferLocalFallback = false;
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
   * @param {string} endpoint - Caminho da rota (ex: /reservation)
   * @param {RequestInit} options - Opções do fetch (method, headers, body)
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
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
          data = { message: text };
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
      // Registrar falha para diagnóstico
      console.warn(
        `[ApiClient] Falha na chamada HTTP para ${url}:`,
        err.message,
      );
      throw err;
    }
  }

  get(endpoint, queryParams = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "" && val !== "all") {
        searchParams.append(key, val);
      }
    });
    const queryString = searchParams.toString();
    const path = queryString ? `${endpoint}?${queryString}` : endpoint;
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
    const path = queryString ? `${endpoint}?${queryString}` : endpoint;

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
}

export const apiClient = new ApiClient();
