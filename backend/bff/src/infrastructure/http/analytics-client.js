const { UpstreamError } = require('../../application/errors');
const { unexpectedResponse } = require('./http-client');

// Azure Function httpTriggerAnalytics (HTTP Trigger com authLevel "function").
// A chave vai no cabeçalho x-functions-key, configurado no HttpClient.
class AnalyticsClient {
  constructor({ httpClient }) {
    this.http = httpClient;
  }

  async calculate(payload, { correlationId } = {}) {
    const response = await this.http.request('POST', '', { body: payload, correlationId });
    if (response.status === 200) return response.body;
    if (response.status === 400) {
      throw new UpstreamError(this.http.name, 'INVALID_INPUT', `A Function recusou os dados: ${response.body?.error ?? 'entrada inválida'}.`);
    }
    if (response.status === 401) {
      throw new UpstreamError(this.http.name, 'UNAUTHORIZED', 'A Function recusou a chave (confira ANALYTICS_FUNCTION_KEY).');
    }
    throw unexpectedResponse(this.http.name, response);
  }
}

module.exports = { AnalyticsClient };
