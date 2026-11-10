const express = require('express');

function safeStringify(obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

function createReservationsRouter({ createReservationHandler }) {
  const router = express.Router();

  router.post('/reservations', async (req, res, next) => {
    try {
      const parsed = req.body || {};
      const idempotencyKey =
        req.headers['idempotency-key'] ||
        req.headers['x-idempotency-key'] ||
        parsed.idempotencyKey;

      const command = {
        ...parsed,
        idempotencyKey
      };

      const result = await createReservationHandler.execute(command);
      res.setHeader('Content-Type', 'application/json');
      res.status(201).send(safeStringify(result));
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = {
  createReservationsRouter,
  safeStringify
};
