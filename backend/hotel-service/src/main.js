const http = require('node:http');
const { Room } = require('./domain/room');
const { SetRoomCleaningStatusHandler } = require('./features/rooms/set-room-cleaning-status/handler');

const rooms = new Map([['r1', new Room({ id: 'r1', status: 'cleaning' })]]);
const handler = new SetRoomCleaningStatusHandler({
  roomRepository: { findById: async id => rooms.get(id), save: async room => rooms.set(room.id, room) },
  eventPublisher: { publish: async () => undefined }
});
const server = http.createServer(async (request, response) => {
  if (request.url === '/health') return response.end(JSON.stringify({ status: 'ok', service: 'hotel-service' }));
  if (request.method === 'PATCH' && request.url.startsWith('/rooms/')) {
    const roomId = request.url.split('/')[2];
    let body = ''; for await (const chunk of request) body += chunk;
    try { const room = await handler.execute({ roomId, ...JSON.parse(body) }); response.end(JSON.stringify(room)); }
    catch (error) { response.statusCode = error.message === 'Room not found' ? 404 : 409; response.end(JSON.stringify({ error: error.message })); }
    return;
  }
  response.statusCode = 404; response.end(JSON.stringify({ error: 'Not found' }));
});
server.listen(process.env.PORT || 5001);
