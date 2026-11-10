const { Router } = require('express');
const { parseBody, parseWith } = require('../validation');
const schemas = require('../schemas');

function guestsRouter(handlers) {
  const router = Router();

  router.get('/', async (request, response) => {
    response.json(await handlers.listGuests.execute(parseWith(schemas.guestQuery, request.query)));
  });

  router.post('/', async (request, response) => {
    response.status(201).json(await handlers.createGuest.execute(parseBody(schemas.guestCreate, request.body)));
  });

  router.get('/:id', async (request, response) => {
    response.json(await handlers.getGuest.execute({ guestId: request.params.id }));
  });

  router.put('/:id', async (request, response) => {
    const changes = parseBody(schemas.guestUpdate, request.body);
    response.json(await handlers.updateGuest.execute({ guestId: request.params.id, changes }));
  });

  router.delete('/:id', async (request, response) => {
    await handlers.deleteGuest.execute({ guestId: request.params.id });
    response.status(204).end();
  });

  return router;
}

module.exports = { guestsRouter };
