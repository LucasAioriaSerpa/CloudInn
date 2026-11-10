const { UpstreamError } = require('../../application/errors');

// Cliente HTTP com timeout por chamada. Qualquer resposta HTTP (inclusive 4xx/5xx) é devolvida a quem chamou;
// só falhas de rede e timeout viram UpstreamError.
class HttpClient {
  constructor({ name, baseUrl, timeoutMs, headers = {}, fetchImpl = fetch }) {
    this.name = name;
    this.endpointUrl = baseUrl; // usado quando o caminho é vazio (ex.: URL completa da Function)
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.timeoutMs = timeoutMs;
    this.headers = headers;
    this.fetchImpl = fetchImpl;
  }

  // path pode conter a query string; segmentos dinâmicos devem chegar já codificados (encodeURIComponent).
  async request(method, path, { query, body, headers = {}, correlationId } = {}) {
    const url = path ? new URL(path.replace(/^\/+/, ''), this.baseUrl) : new URL(this.endpointUrl);
    for (const [key, value] of Object.entries(query || {})) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }

    let response;
    try {
      response = await this.fetchImpl(url, {
        method,
        headers: {
          accept: 'application/json',
          ...this.headers,
          ...(correlationId ? { 'x-correlation-id': correlationId } : {}),
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
          ...headers
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs)
      });
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new UpstreamError(this.name, 'TIMEOUT', `${this.name} não respondeu em ${this.timeoutMs} ms.`, { cause: error });
      }
      throw new UpstreamError(this.name, 'UNAVAILABLE', `${this.name} está indisponível.`, { cause: error });
    }

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new UpstreamError(this.name, 'BAD_RESPONSE', `${this.name} respondeu em formato inesperado (HTTP ${response.status}).`);
      }
    }
    return { status: response.status, body: data };
  }
}

// Converte respostas inesperadas (5xx ou status não previsto) em UpstreamError.
function unexpectedResponse(name, { status }) {
  return new UpstreamError(name, 'BAD_RESPONSE', `${name} respondeu HTTP ${status}.`);
}

module.exports = { HttpClient, unexpectedResponse };
