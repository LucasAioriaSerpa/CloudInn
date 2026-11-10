const { Router } = require('express');

function hotelsRouter({ getHotelCatalog }) {
  const router = Router();

  router.get('/:id/catalog', async (request, response) => {
    response.json(await getHotelCatalog.execute({ hotelId: request.params.id }));
  });

  return router;
}

module.exports = { hotelsRouter };
