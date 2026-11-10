// Cálculos analíticos (RF14). Funções puras, sem I/O: fáceis de testar.
// Fórmulas são o ponto de partida; o time de analytics pode refinar (ponderação, tipologias).

class ValidationError extends Error {}

const num = (value, name) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new ValidationError(`${name} deve ser um número >= 0`);
  return n;
};

function calculate(payload = {}) {
  const totalRooms = num(payload.totalRooms, 'totalRooms');
  const occupiedRooms = num(payload.occupiedRooms, 'occupiedRooms');
  const roomRevenue = num(payload.roomRevenue ?? 0, 'roomRevenue');
  const daysInMonth = num(payload.daysInMonth ?? 30, 'daysInMonth');
  if (totalRooms === 0) throw new ValidationError('totalRooms deve ser maior que 0');
  if (occupiedRooms > totalRooms) throw new ValidationError('occupiedRooms não pode exceder totalRooms');

  const round = value => Math.round(value * 100) / 100;
  const occupancyRate = (occupiedRooms / totalRooms) * 100;
  const adr = occupiedRooms === 0 ? 0 : roomRevenue / occupiedRooms;   // Average Daily Rate
  const revPar = roomRevenue / totalRooms;                             // Revenue Per Available Room
  return {
    hotelId: payload.hotelId ?? null,
    date: payload.date ?? null,
    occupancyRate: round(occupancyRate),
    adr: round(adr),
    revPar: round(revPar),
    projectedRevenue: round(revPar * totalRooms * daysInMonth)         // projeção simples: receita diária × dias do mês
  };
}

// Máscara de CPF/telefone para logs (LGPD, RST-10)
const mask = text => String(text)
  .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '***.***.***-**')
  .replace(/\+?\d{2}\s?\(?\d{2}\)?\s?9?\d{4}-?\d{4}/g, '***');

const REQUIRED_EVENT_FIELDS = ['specversion', 'id', 'source', 'type', 'time'];
function validateCloudEvent(event) {
  if (!event || typeof event !== 'object') throw new ValidationError('evento inválido');
  const missing = REQUIRED_EVENT_FIELDS.filter(field => !event[field]);
  if (missing.length) throw new ValidationError(`campos ausentes: ${missing.join(', ')}`);
  if (event.specversion !== '1.0') throw new ValidationError('specversion deve ser 1.0');
  return event;
}

// Linha de log da projeção de eventos. correlationId liga o evento à requisição que o originou (BFF → serviço).
function describeEvent(event) {
  return [
    `evento ${event.type}`,
    `id=${event.id}`,
    `subject=${event.subject ?? '-'}`,
    `source=${event.source}`,
    `correlationId=${event.correlationid ?? '-'}`
  ].join(' ');
}

module.exports = { calculate, mask, validateCloudEvent, describeEvent, ValidationError };
