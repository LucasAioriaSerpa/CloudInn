const express = require('express');
const { GetAggregatedDataQuery } = require('../../application/features/aggregated-data/query');

function createAggregatedDataRouter({ handler }) {
  const router = express.Router();

  router.get('/aggregated-data', async (req, res, next) => {
    try {
      const hotelId = req.query.hotelId;
      const date = req.query.date;
      const includeCalculations = req.query.includeCalculations !== 'false';
      const correlationId = req.correlationId;

      const query = new GetAggregatedDataQuery({
        hotelId,
        date,
        includeCalculations,
        correlationId
      });

      const result = await handler.execute(query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAggregatedDataRouter };
