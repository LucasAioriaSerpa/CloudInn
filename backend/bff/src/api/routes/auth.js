const { Router } = require('express');
const { z } = require('zod');
const { ValidationError } = require('../../application/errors');
const { requireAuth } = require('../middleware/auth');

const credentials = z.object({ login: z.string(), password: z.string() }).strict();

function authRouter({ handlers, tokenService }) {
  const router = Router();

  router.post('/login', async (request, response) => {
    const parsed = credentials.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Envie um JSON com login e password.');
    response.json(await handlers.login.execute(parsed.data, { correlationId: request.correlationId }));
  });

  router.get('/me', requireAuth(tokenService), (request, response) => {
    const { sub, username, name, role, hotelId, exp } = request.user;
    response.json({ id: sub, username, name, role, hotelId, expiresAt: new Date(exp * 1000).toISOString() });
  });

  return router;
}

module.exports = { authRouter };
