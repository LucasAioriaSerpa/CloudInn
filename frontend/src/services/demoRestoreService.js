/**
 * @fileoverview Serviço de Restauração e Sincronização da Demo (Seções 21 a 31)
 *
 * Responsável por:
 * 1. Obter os dados da demo a partir do Mock da API (Apidog) ou semente certificada.
 * 2. Validar rigorosamente o payload contra os contratos do Swagger ANTES de qualquer ação.
 * 3. Chamar a Function DELETE para limpar o estado anterior no MongoDB.
 * 4. Chamar a Function INSERT para repovoar o MongoDB com o dataset limpo.
 * 5. Chamar a Function SELECT para ler os dados persistidos do MongoDB e refletir no React.
 * 6. Proibir deleção de dados se a fonte da demo for inválida ou inacessível.
 */

import { apiClient } from "./apiClient.js";
import {
  INITIAL_GUESTS,
  INITIAL_ROOMS,
  INITIAL_RESERVATIONS,
} from "../mocks/seedData.js";

const APIDOG_BASE_URL =
  "https://mock.apidog.com/m1/1365796-1370036-1444387";

/**
 * Validação estrita do dataset conforme schemas OpenAPI 3.0 do swagger.yaml
 * @param {Object} dataset - { guests, rooms, reservations }
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateDemoDataset(dataset) {
  const errors = [];

  if (!dataset || typeof dataset !== "object") {
    return { isValid: false, errors: ["Dataset de demonstração é nulo ou inválido."] };
  }

  const { guests, rooms, reservations } = dataset;

  // Validação de Hóspedes (RF02, Swagger /guest)
  if (!Array.isArray(guests) || guests.length === 0) {
    errors.push("A lista de hóspedes da demo está vazia ou não é um array.");
  } else {
    guests.forEach((g, idx) => {
      if (!g.name || typeof g.name !== "string" || !g.name.trim()) {
        errors.push(`Hóspede no índice ${idx} possui nome inválido ou ausente.`);
      }
      if (!g.document || typeof g.document !== "string" || !g.document.trim()) {
        errors.push(`Hóspede no índice ${idx} (${g.name || "Sem nome"}) não possui documento.`);
      }
    });
  }

  // Validação de Quartos (RF06, RF10, RF11, Swagger /room)
  const validRoomStatuses = ["available", "reserved", "occupied", "dirty", "cleaning"];
  if (!Array.isArray(rooms) || rooms.length === 0) {
    errors.push("A lista de quartos da demo está vazia ou não é um array.");
  } else {
    rooms.forEach((r, idx) => {
      if (!r.number || !String(r.number).trim()) {
        errors.push(`Quarto no índice ${idx} não possui número.`);
      }
      if (!r.roomType || !String(r.roomType).trim()) {
        errors.push(`Quarto ${r.number || idx} não possui tipo (roomType).`);
      }
      if (r.status && !validRoomStatuses.includes(r.status)) {
        errors.push(`Quarto ${r.number} possui status inválido: '${r.status}'.`);
      }
    });
  }

  // Validação de Reservas (RF01, RF03, RF04, RF05, Swagger /reservation)
  const validReservationStatuses = ["pending", "active", "completed", "cancelled"];
  if (!Array.isArray(reservations) || reservations.length === 0) {
    errors.push("A lista de reservas da demo está vazia ou não é um array.");
  } else {
    reservations.forEach((res, idx) => {
      if (!res.guest || !res.guest.name || !res.guest.document) {
        errors.push(`Reserva no índice ${idx} não possui hóspede válido com nome e documento.`);
      }
      if (!res.checkInDate || isNaN(new Date(res.checkInDate).getTime())) {
        errors.push(`Reserva no índice ${idx} possui data de check-in inválida.`);
      }
      if (!res.checkOutDate || isNaN(new Date(res.checkOutDate).getTime())) {
        errors.push(`Reserva no índice ${idx} possui data de check-out inválida.`);
      }
      if (
        res.checkInDate &&
        res.checkOutDate &&
        new Date(res.checkOutDate) <= new Date(res.checkInDate)
      ) {
        errors.push(`Reserva no índice ${idx}: check-out deve ser posterior ao check-in.`);
      }
      if (res.status && !validReservationStatuses.includes(res.status)) {
        errors.push(`Reserva no índice ${idx} possui status inválido: '${res.status}'.`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Obtém o dataset de demonstração a partir do Mock da API ou semente certificada
 * @returns {Promise<Object>}
 */
export async function fetchDemoDataset() {
  let fetchedData = null;

  // 1. Tenta obter do mock da API (Apidog)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const [resResp, roomResp, guestResp] = await Promise.all([
      fetch(`${APIDOG_BASE_URL}/reservation`, { signal: controller.signal }),
      fetch(`${APIDOG_BASE_URL}/room`, { signal: controller.signal }),
      fetch(`${APIDOG_BASE_URL}/guest`, { signal: controller.signal }),
    ]);

    clearTimeout(timeoutId);

    if (resResp.ok && roomResp.ok && guestResp.ok) {
      const reservations = await resResp.json();
      const rooms = await roomResp.json();
      const guests = await guestResp.json();

      const candidate = {
        reservations: Array.isArray(reservations) ? reservations : reservations?.data || [],
        rooms: Array.isArray(rooms) ? rooms : rooms?.data || [],
        guests: Array.isArray(guests) ? guests : guests?.data || [],
      };

      const validation = validateDemoDataset(candidate);
      if (validation.isValid) {
        fetchedData = candidate;
      }
    }
  } catch (err) {
    // Apidog inacessível ou timeout — procede para a semente Swagger certificada
    console.warn("[demoRestoreService] Mock externo indisponível, recorrendo à semente certificada:", err.message);
  }

  // 2. Se o mock externo não respondeu ou dados não passaram na validação,
  // utiliza o dataset canônico certificado do Swagger
  if (!fetchedData) {
    const fallbackCandidate = {
      guests: JSON.parse(JSON.stringify(INITIAL_GUESTS)),
      rooms: JSON.parse(JSON.stringify(INITIAL_ROOMS)),
      reservations: JSON.parse(JSON.stringify(INITIAL_RESERVATIONS)),
    };

    const validation = validateDemoDataset(fallbackCandidate);
    if (!validation.isValid) {
      throw new Error(
        `Falha na validação do dataset padrão da demo: ${validation.errors.join("; ")}`
      );
    }
    fetchedData = fallbackCandidate;
  }

  return fetchedData;
}

/**
 * Executa o fluxo de restauração completa de ponta a ponta:
 * Validação -> Delete via Function -> Insert via Function -> Select via Function
 *
 * @param {Function} [onProgress] - Callback para atualização de etapas na UI
 * @returns {Promise<Object>}
 */
export async function restoreDemoData(onProgress = () => {}) {
  // ETAPA 1: Obter e validar a fonte de dados ANTES de tocar no banco
  onProgress({
    step: "VALIDATING",
    message: "Obtendo e validando dataset canônico da demonstração...",
  });

  const dataset = await fetchDemoDataset();
  const validation = validateDemoDataset(dataset);

  if (!validation.isValid) {
    throw new Error(
      `Abortado: O conjunto de dados da demo é inválido. Nenhuma alteração foi realizada no MongoDB.\nErros:\n${validation.errors.join("\n")}`
    );
  }

  // ETAPA 2: Consultar dados existentes no MongoDB para exclusão controlada
  onProgress({
    step: "CLEARING",
    message: "Consultando e limpando registros existentes no MongoDB via Function DELETE...",
  });

  try {
    const [existingReservations, existingRooms, existingGuests] = await Promise.all([
      apiClient.select("reservation").catch(() => []),
      apiClient.select("room").catch(() => []),
      apiClient.select("guest").catch(() => []),
    ]);

    // Exclui reservas existentes
    if (Array.isArray(existingReservations)) {
      for (const res of existingReservations) {
        if (res.id) {
          await apiClient.deleteRecord("reservation", res.id).catch((err) => {
            console.warn(`[demoRestoreService] Aviso ao excluir reserva #${res.id}:`, err.message);
          });
        }
      }
    }

    // Exclui quartos existentes
    if (Array.isArray(existingRooms)) {
      for (const room of existingRooms) {
        if (room.id) {
          await apiClient.deleteRecord("room", room.id).catch((err) => {
            console.warn(`[demoRestoreService] Aviso ao excluir quarto #${room.id}:`, err.message);
          });
        }
      }
    }

    // Exclui hóspedes existentes
    if (Array.isArray(existingGuests)) {
      for (const guest of existingGuests) {
        if (guest.id) {
          await apiClient.deleteRecord("guest", guest.id).catch((err) => {
            console.warn(`[demoRestoreService] Aviso ao excluir hóspede #${guest.id}:`, err.message);
          });
        }
      }
    }
  } catch (err) {
    console.warn("[demoRestoreService] Aviso durante limpeza prévia:", err.message);
  }

  // ETAPA 3: Inserir novos quartos via Function INSERT
  onProgress({
    step: "INSERTING_ROOMS",
    message: `Cadastrando ${dataset.rooms.length} quartos demo via Function INSERT...`,
  });

  for (const room of dataset.rooms) {
    await apiClient.insert("room", room);
  }

  // ETAPA 4: Inserir novos hóspedes via Function INSERT
  onProgress({
    step: "INSERTING_GUESTS",
    message: `Cadastrando ${dataset.guests.length} hóspedes demo via Function INSERT...`,
  });

  for (const guest of dataset.guests) {
    await apiClient.insert("guest", guest);
  }

  // ETAPA 5: Inserir novas reservas via Function INSERT
  onProgress({
    step: "INSERTING_RESERVATIONS",
    message: `Cadastrando ${dataset.reservations.length} reservas demo via Function INSERT...`,
  });

  for (const reservation of dataset.reservations) {
    await apiClient.insert("reservation", reservation);
  }

  // ETAPA 6: Sincronizar estado final a partir do MongoDB via Function SELECT
  onProgress({
    step: "SYNCING",
    message: "Sincronizando estado persistido final a partir do MongoDB via Function SELECT...",
  });

  const [persistedReservations, persistedRooms, persistedGuests] = await Promise.all([
    apiClient.select("reservation"),
    apiClient.select("room"),
    apiClient.select("guest"),
  ]);

  return {
    success: true,
    count: {
      reservations: Array.isArray(persistedReservations) ? persistedReservations.length : dataset.reservations.length,
      rooms: Array.isArray(persistedRooms) ? persistedRooms.length : dataset.rooms.length,
      guests: Array.isArray(persistedGuests) ? persistedGuests.length : dataset.guests.length,
    },
    data: {
      reservations: persistedReservations || [],
      rooms: persistedRooms || [],
      guests: persistedGuests || [],
    },
  };
}
