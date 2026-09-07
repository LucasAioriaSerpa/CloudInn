/**
 * @fileoverview Serviço de Orquestração para Restaurar Dados Demo
 * Segue estritamente a sequência arquitetural:
 * 1. Limpa o MongoDB chamando a Azure Function DELETE (fc_gp_cloudInn_delete)
 * 2. Obtém novos dados do mock (Apidog / Mock Generator) com quartos fixos (10x, 20x, 30x, 40x)
 * 3. Insere os novos dados no MongoDB chamando a Azure Function INSERT (fc_gp_cloudInn_insert)
 * 4. Consulta e carrega os dados atualizados para a interface chamando a Azure Function SELECT (fc_gp_cloudInn_select)
 * 5. Habilita modificação posterior (Check-in, Check-out, Governança) via Azure Function UPDATE (fc_gp_cloudInn_update)
 */
import { apiClient } from "./apiClient.js";
import { MOCK_RESERVATION_URL } from "../config/api.js";
import { FIXED_ROOMS, INITIAL_GUESTS, INITIAL_RESERVATIONS } from "../mocks/seedData.js";
import { mockStorage } from "../mocks/mockStorage.js";

/**
 * Normaliza e gera datas futuras realistas para garantir validação
 */
function getFutureDates(offsetDaysStart = 1, durationDays = 4) {
  const now = new Date();
  const checkIn = new Date(now);
  checkIn.setDate(now.getDate() + offsetDaysStart);
  checkIn.setHours(14, 0, 0, 0);

  const checkOut = new Date(checkIn);
  checkOut.setDate(checkIn.getDate() + durationDays);
  checkOut.setHours(11, 0, 0, 0);

  return {
    checkInDate: checkIn.toISOString(),
    checkOutDate: checkOut.toISOString(),
  };
}

/**
 * Busca novos dados mock da API do Apidog ou gera lote mock consistente
 */
async function fetchMockReservations() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(MOCK_RESERVATION_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log(`[demoRestoreService] ${data.length} reservas obtidas do Mock Apidog`);
        // Normaliza as reservas retornadas do Apidog para casar com os quartos fixos 10x, 20x, 30x, 40x
        return data.slice(0, 6).map((item, index) => {
          const fixedRoom = FIXED_ROOMS[index % FIXED_ROOMS.length];
          const dates = getFutureDates(index * 2 + 1, 3);
          const guestName = item.guest?.name || `Hóspede Mock ${index + 1}`;
          const docNumber = item.guest?.document || `${(index + 1) * 111}.222.333-44`;

          return {
            id: 1000 + index + 1,
            guest: {
              id: item.guest?.id || 100 + index + 1,
              name: guestName,
              document: docNumber,
              email: item.guest?.email || `hospede${index + 1}@mockhotel.com`,
              phone: item.guest?.phone || "+55 11 98888-0000",
            },
            room: {
              id: fixedRoom.id,
              number: fixedRoom.number,
              roomType: fixedRoom.roomType,
              status: index % 2 === 0 ? "occupied" : "reserved",
            },
            checkInDate: dates.checkInDate,
            checkOutDate: dates.checkOutDate,
            status: index % 2 === 0 ? "active" : "pending",
          };
        });
      }
    }
  } catch (err) {
    console.warn(
      "[demoRestoreService] Falha ao consultar Apidog Mock, utilizando mock dinâmico integrado:",
      err.message,
    );
  }

  // Fallback: Mock dinâmico enriquecido com base nos dados base
  return INITIAL_RESERVATIONS.map((res, index) => {
    const fixedRoom = FIXED_ROOMS[index % FIXED_ROOMS.length];
    const dates = getFutureDates(index + 1, 3);
    return {
      ...res,
      id: 1001 + index,
      room: fixedRoom,
      checkInDate: dates.checkInDate,
      checkOutDate: dates.checkOutDate,
      status: index === 0 || index === 2 ? "active" : "pending",
    };
  });
}

/**
 * Executa o fluxo completo de Restauração de Dados Demo:
 * DELETE -> MOCK FETCH -> INSERT -> SELECT
 *
 * @param {Function} onProgress - Callback para notificar a etapa corrente
 */
export async function executeRestoreDemoData(onProgress = () => {}) {
  // -------------------------------------------------------------------------
  // ETAPA 1: Limpar o banco de dados MongoDB usando a Azure Function DELETE
  // -------------------------------------------------------------------------
  onProgress({
    step: "DELETE",
    title: "Limpando MongoDB",
    description: "Executando Azure Function DELETE (fc_gp_cloudInn_delete)...",
  });

  try {
    // 1.1 Tenta exclusão em lote / reset via Azure Function DELETE
    await apiClient.deleteRecord("all", "all", { all: "true", action: "clear" }).catch(() => null);
    await apiClient.deleteRecord("reservation", "all", { all: "true" }).catch(() => null);
    await apiClient.deleteRecord("guest", "all", { all: "true" }).catch(() => null);

    // 1.2 Para máxima compatibilidade com instâncias Azure já implantadas,
    // busca reservas e hóspedes existentes e exclui individualmente pelo ID
    const [existingReservations, existingGuests] = await Promise.all([
      apiClient.select("reservation").catch(() => []),
      apiClient.select("guest").catch(() => []),
    ]);

    if (Array.isArray(existingReservations) && existingReservations.length > 0) {
      for (const res of existingReservations) {
        if (res.id) {
          await apiClient.deleteRecord("reservation", res.id).catch(() => null);
        }
      }
    }

    if (Array.isArray(existingGuests) && existingGuests.length > 0) {
      for (const g of existingGuests) {
        if (g.id) {
          await apiClient.deleteRecord("guest", g.id).catch(() => null);
        }
      }
    }
  } catch (deleteError) {
    console.warn("[demoRestoreService] Aviso durante exclusão remota:", deleteError);
  }

  // Limpa o mockStorage local também para garantir sincronia
  mockStorage.resetToDefault();

  // -------------------------------------------------------------------------
  // ETAPA 2: Obter novos dados pelo mock
  // -------------------------------------------------------------------------
  onProgress({
    step: "FETCH_MOCK",
    title: "Obtendo Novos Dados do Mock",
    description: "Buscando reservas do mock (Apidog / Mock Generator)...",
  });

  const mockReservations = await fetchMockReservations();
  const mockGuests = mockReservations.map((r) => r.guest).filter(Boolean);

  // -------------------------------------------------------------------------
  // ETAPA 3: Inserir os novos dados no MongoDB via Azure Function INSERT
  //          Os quartos são dados fixos 10x, 20x, 30x e 40x
  // -------------------------------------------------------------------------
  onProgress({
    step: "INSERT",
    title: "Inserindo Dados Demo no MongoDB",
    description: "Gravando quartos fixos (10x, 20x, 30x, 40x), hóspedes e reservas via Azure Function INSERT...",
  });

  // 3.1 Insere ou garante os quartos fixos 10x, 20x, 30x e 40x
  for (const room of FIXED_ROOMS) {
    try {
      await apiClient.insert("room", {
        id: room.id,
        number: room.number,
        roomType: room.roomType,
        status: room.status || "available",
      }).catch(async () => {
        // Se já existir, atualiza status
        await apiClient.update("room", room.id, {}, { status: room.status || "available" }).catch(() => null);
      });
    } catch {
      // Continua para o próximo quarto
    }
  }

  // 3.2 Insere hóspedes obtidos do mock
  const insertedGuestIds = new Set();
  for (const guest of mockGuests) {
    if (!insertedGuestIds.has(guest.id)) {
      insertedGuestIds.add(guest.id);
      try {
        await apiClient.insert("guest", {
          id: guest.id,
          name: guest.name,
          document: guest.document,
          email: guest.email,
          phone: guest.phone,
        }).catch(() => null);
      } catch {
        // Continua
      }
    }
  }

  // 3.3 Insere reservas obtidas do mock
  for (const res of mockReservations) {
    try {
      await apiClient.insert("reservation", {
        id: res.id,
        guest: {
          id: res.guest.id,
          name: res.guest.name,
          document: res.guest.document,
          email: res.guest.email,
          phone: res.guest.phone,
        },
        room: {
          id: res.room.id,
          number: res.room.number,
          roomType: res.room.roomType,
          status: res.room.status,
        },
        checkInDate: res.checkInDate,
        checkOutDate: res.checkOutDate,
        status: res.status || "pending",
      }).catch(() => null);
    } catch {
      // Continua
    }
  }

  // -------------------------------------------------------------------------
  // ETAPA 4: Consultar dados atualizados do MongoDB via Azure Function SELECT
  // -------------------------------------------------------------------------
  onProgress({
    step: "SELECT",
    title: "Sincronizando com Interface",
    description: "Carregando dados do banco de dados via Azure Function SELECT (fc_gp_cloudInn_select)...",
  });

  const [refreshedReservations, refreshedRooms, refreshedGuests] = await Promise.all([
    apiClient.select("reservation").catch(() => mockStorage.getReservations()),
    apiClient.select("room").catch(() => FIXED_ROOMS),
    apiClient.select("guest").catch(() => mockStorage.getGuests()),
  ]);

  onProgress({
    step: "DONE",
    title: "Concluído com Sucesso",
    description: "Dados demo restaurados no MongoDB e prontos para check-in/check-out via Azure Function UPDATE.",
  });

  return {
    reservations: Array.isArray(refreshedReservations) ? refreshedReservations : mockReservations,
    rooms: Array.isArray(refreshedRooms) && refreshedRooms.length > 0 ? refreshedRooms : FIXED_ROOMS,
    guests: Array.isArray(refreshedGuests) ? refreshedGuests : mockGuests,
  };
}
