// Monta o JSON único do /aggregated-data. Cada reserva recebe o hóspede e o quarto aninhados
// (formato que a tela usa); a lista de hóspedes traz só os que aparecem nas reservas.
class AggregatedDataAssembler {
  assemble({ catalog, reservations, guests, calculations, errors, correlationId, generatedAt }) {
    const guestsById = new Map((guests || []).map(guest => [guest.id, guest]));
    const roomsById = new Map((catalog?.rooms || []).map(room => [room.id, room]));
    const reservationList = (reservations || []).map(reservation => {
      const room = roomsById.get(reservation.roomId);
      return {
        ...reservation,
        guest: guestsById.get(reservation.guestId) ?? null,
        room: room ? { id: room.id, number: room.number, roomType: room.roomType, status: room.status } : null
      };
    });
    const guestIds = new Set(reservationList.map(reservation => reservation.guestId));

    return {
      hotel: catalog?.hotel ?? null,
      rooms: catalog?.rooms ?? [],
      roomSummary: catalog?.summary ?? null,
      reservations: reservationList,
      guests: (guests || []).filter(guest => guestIds.has(guest.id)),
      calculations,
      metadata: {
        partial: errors.length > 0,
        errors,
        correlationId,
        generatedAt
      }
    };
  }
}

module.exports = { AggregatedDataAssembler };
