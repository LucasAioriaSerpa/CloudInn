const { Router } = require('express');
const { parseBody, parseWith } = require('../validation');
const schemas = require('../schemas');

// Corpo opcional (ex.: POST /checkin sem corpo).
const optionalBody = (schema, body) => parseWith(schema, body && typeof body === 'object' ? body : {});

function reservationsRouter(handlers) {
  const router = Router();

  router.get('/', async (request, response) => {
    response.json(await handlers.listReservations.execute(parseWith(schemas.reservationQuery, request.query)));
  });

  router.post('/', async (request, response) => {
    const body = parseBody(schemas.reservationCreate, request.body);
    const idempotencyKey = request.get('idempotency-key') || body.idempotencyKey;
    response.status(201).json(await handlers.createReservation.execute({ ...body, idempotencyKey, correlationId: request.correlationId }));
  });

  router.get('/:id', async (request, response) => {
    response.json(await handlers.getReservation.execute({ reservationId: request.params.id }));
  });

  router.put('/:id', async (request, response) => {
    const changes = parseBody(schemas.reservationUpdate, request.body);
    response.json(await handlers.updateReservation.execute({ reservationId: request.params.id, changes }));
  });

  // Cancela (status cancelled) em vez de apagar, preservando o histórico.
  router.delete('/:id', async (request, response) => {
    const body = optionalBody(schemas.statusAction, request.body);
    await handlers.cancelReservation.execute({ ...body, reservationId: request.params.id, correlationId: request.correlationId });
    response.status(204).end();
  });

  router.post('/:id/checkin', async (request, response) => {
    const body = optionalBody(schemas.statusAction, request.body);
    response.json(await handlers.checkInReservation.execute({ ...body, reservationId: request.params.id, correlationId: request.correlationId }));
  });

  router.post('/:id/checkout', async (request, response) => {
    const body = optionalBody(schemas.statusAction, request.body);
    response.json(await handlers.checkOutReservation.execute({ ...body, reservationId: request.params.id, correlationId: request.correlationId }));
  });

  return router;
}

module.exports = { reservationsRouter };
