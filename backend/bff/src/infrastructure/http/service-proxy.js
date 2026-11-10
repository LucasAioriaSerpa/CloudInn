// Repassa requisições do frontend ao microservice dono do recurso, preservando método, caminho,
// query string, corpo JSON, status e corpo da resposta (inclusive 4xx).
const FORWARDED_HEADERS = ['idempotency-key'];

class ServiceProxy {
  constructor({ clients }) {
    this.clients = clients;
  }

  async forward(target, { method, originalUrl, body, headers = {}, correlationId }) {
    const client = this.clients[target];
    const forwardedHeaders = Object.fromEntries(
      FORWARDED_HEADERS.filter(name => headers[name]).map(name => [name, headers[name]])
    );
    const hasBody = !['GET', 'HEAD'].includes(method) && body !== undefined && body !== null;
    return client.request(method, originalUrl, {
      body: hasBody ? body : undefined,
      headers: forwardedHeaders,
      correlationId
    });
  }
}

module.exports = { ServiceProxy };
