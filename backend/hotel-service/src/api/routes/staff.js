const { Router } = require('express');
const { parseBody, parseWith } = require('../validation');
const schemas = require('../schemas');

function staffRouter({ listStaff, createStaff, getStaff, updateStaff, deleteStaff, verifyStaffCredentials }) {
  const router = Router();

  router.get('/', async (request, response) => {
    response.json(await listStaff.execute(parseWith(schemas.staffQuery, request.query)));
  });

  router.post('/', async (request, response) => {
    response.status(201).json(await createStaff.execute(parseBody(schemas.staffCreate, request.body)));
  });

  router.post('/verify-credentials', async (request, response) => {
    response.json(await verifyStaffCredentials.execute(parseBody(schemas.credentials, request.body)));
  });

  router.get('/:id', async (request, response) => {
    response.json(await getStaff.execute({ staffId: request.params.id }));
  });

  router.put('/:id', async (request, response) => {
    const changes = parseBody(schemas.staffUpdate, request.body);
    response.json(await updateStaff.execute({ staffId: request.params.id, changes }));
  });

  router.delete('/:id', async (request, response) => {
    await deleteStaff.execute({ staffId: request.params.id });
    response.status(204).end();
  });

  return router;
}

module.exports = { staffRouter };
