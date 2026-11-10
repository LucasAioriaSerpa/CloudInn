// Monta a entrada da Function a partir do catálogo do hotel e das reservas do dia.
// Ocupação considera reservas confirmed/active que cobrem a data (calendário), não o status físico
// do quarto, para valer também em datas futuras. A receita do dia é a diária média de cada reserva.
const OCCUPYING_STATUSES = ['confirmed', 'active'];
const DAY_MS = 86400000;

const round2 = value => Math.round(value * 100) / 100;
const nightsOf = reservation => Math.max(1, Math.round((Date.parse(reservation.checkOutDate) - Date.parse(reservation.checkInDate)) / DAY_MS));

function daysInMonth(day) {
  const [year, month] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function buildCalculationInput({ hotelId, date, catalog, reservations }) {
  const roomIds = new Set((catalog.rooms || []).map(room => room.id));
  const occupying = reservations.filter(reservation => OCCUPYING_STATUSES.includes(reservation.status) && roomIds.has(reservation.roomId));
  return {
    hotelId,
    date,
    totalRooms: catalog.summary?.totalRooms ?? roomIds.size,
    occupiedRooms: new Set(occupying.map(reservation => reservation.roomId)).size,
    roomRevenue: round2(occupying.reduce((sum, reservation) => sum + Number(reservation.totalAmount) / nightsOf(reservation), 0)),
    daysInMonth: daysInMonth(date)
  };
}

module.exports = { buildCalculationInput, daysInMonth };
