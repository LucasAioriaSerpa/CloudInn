// Consumidor da assinatura sub-reservations-service. Registra a liberação de quartos informada pelo
// Hotel Service (RoomCleaningCompleted). O Reservas Service não altera reservas com esse evento:
// o calendário de disponibilidade depende só das reservas (arc42, seção 1.3).
function createRoomReleaseListener({ logger }) {
  return async event => {
    if (event.type !== 'RoomCleaningCompleted') {
      logger.debug('Evento ignorado pelo Reservas Service', { eventType: event.type, eventId: event.id });
      return;
    }
    logger.info('Quarto liberado pela governança', {
      eventId: event.id,
      roomId: event.data?.roomId,
      hotelId: event.data?.hotelId,
      correlationId: event.correlationid
    });
  };
}

module.exports = { createRoomReleaseListener };
