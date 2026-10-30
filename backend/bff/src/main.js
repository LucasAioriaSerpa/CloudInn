const http = require('node:http');
const { GetAggregatedDataQuery } = require('./features/aggregated-data/query');
const { GetAggregatedDataHandler } = require('./features/aggregated-data/handler');
const { AggregatedDataAssembler } = require('./features/aggregated-data/assembler');
const { GatewayClient } = require('./infrastructure/gateway-client');

const transport = {
  get: async route => ({ route, items: [], guests: [] }),
  post: async route => ({ route, occupancyRate: 0, projectedRevenue: 0 })
};
const handler = new GetAggregatedDataHandler({ gatewayClient: new GatewayClient({ transport }), assembler: new AggregatedDataAssembler() });

const server = http.createServer(async (request, response) => {
  if (request.url === '/health') return response.end(JSON.stringify({ status: 'ok', service: 'bff' }));
  if (request.method === 'GET' && request.url.startsWith('/aggregated-data')) {
    const url = new URL(request.url, 'http://localhost');
    const result = await handler.execute(new GetAggregatedDataQuery({ hotelId: url.searchParams.get('hotelId'), date: url.searchParams.get('date') }));
    response.setHeader('content-type', 'application/json');
    return response.end(JSON.stringify(result));
  }
  response.statusCode = 404;
  response.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(process.env.PORT || 4000);
