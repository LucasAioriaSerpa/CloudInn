const express = require('express');

function createRoomsRouter({ setRoomCleaningStatusHandler }) {
  const router = express.Router();

  // PATCH /rooms/:id (ou /rooms/:id/status)
  router.patch('/rooms/:id', async (req, res, next) => {
    try {
      const roomId = req.params.id;
      const payload = req.body || {};
      const status = payload.status;
      const staffId = payload.staffId;

      const room = await setRoomCleaningStatusHandler.execute({
        roomId,
        status,
        staffId
      });

      res.status(200).json(room);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createRoomsRouter };
