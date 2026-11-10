const { Router } = require('express');
const { parseBody, parseWith } = require('../validation');
const schemas = require('../schemas');

function roomsRouter({ listRooms, createRoom, getRoom, updateRoom, changeRoomStatus, deleteRoom }) {
  const router = Router();

  router.get('/', async (request, response) => {
    response.json(await listRooms.execute(parseWith(schemas.roomQuery, request.query)));
  });

  router.post('/', async (request, response) => {
    response.status(201).json(await createRoom.execute(parseBody(schemas.roomCreate, request.body)));
  });

  router.get('/:id', async (request, response) => {
    response.json(await getRoom.execute({ roomId: request.params.id }));
  });

  router.put('/:id', async (request, response) => {
    const changes = parseBody(schemas.roomUpdate, request.body);
    response.json(await updateRoom.execute({ roomId: request.params.id, changes }));
  });

  router.patch('/:id/status', async (request, response) => {
    const body = parseBody(schemas.roomStatusChange, request.body);
    response.json(await changeRoomStatus.execute({ ...body, roomId: request.params.id, correlationId: request.correlationId }));
  });

  router.delete('/:id', async (request, response) => {
    await deleteRoom.execute({ roomId: request.params.id });
    response.status(204).end();
  });

  return router;
}

module.exports = { roomsRouter };
