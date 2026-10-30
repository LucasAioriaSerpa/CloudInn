const http = require('node:http');
const { CreateReservationHandler } = require('./features/reservations/create-reservation/handler');
const reservations = [];
const handler = new CreateReservationHandler({
  reservationRepository: { hasOverlap: async (roomId, dateRange) => reservations.some(item => item.roomId === roomId && item.dateRange.overlaps(dateRange)), save: async item => reservations.push(item) },
  idempotencyRepository: { find: async key => reservations.find(item => item.idempotencyKey === key)?.idempotencyResponse, save: async (key, value) => { const item = reservations.find(reservation => reservation.idempotencyKey === key); if (item) item.idempotencyResponse = value; } },
  unitOfWork: { transaction: operation => operation() }
});
const server = http.createServer(async (request, response) => {
  if (request.url === '/health') return response.end(JSON.stringify({ status: 'ok', service: 'reservations-service' }));
  if (request.method === 'POST' && request.url === '/reservations') {
    let body = ''; for await (const chunk of request) body += chunk;
    try { const result = await handler.execute(JSON.parse(body)); response.statusCode = 201; response.end(JSON.stringify(result)); }
    catch (error) { response.statusCode = error.statusCode || 400; response.end(JSON.stringify({ error: error.message })); }
    return;
  }
  response.statusCode = 404; response.end(JSON.stringify({ error: 'Not found' }));
});
server.listen(process.env.PORT || 5002);
