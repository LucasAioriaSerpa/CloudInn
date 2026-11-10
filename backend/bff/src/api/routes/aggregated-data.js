const { Router } = require('express');
const { GetAggregatedDataQuery } = require('../../application/features/aggregated-data/query');

function aggregatedDataRouter({ handlers }) {
  const router = Router();

  router.get('/', async (request, response) => {
    const { hotelId, date, includeCalculations } = request.query;
    const query = new GetAggregatedDataQuery({ hotelId, date, includeCalculations });
    response.json(await handlers.getAggregatedData.execute(query, { correlationId: request.correlationId }));
  });

  return router;
}

module.exports = { aggregatedDataRouter };
