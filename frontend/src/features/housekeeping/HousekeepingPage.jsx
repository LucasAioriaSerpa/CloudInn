/**
 * @fileoverview Painel Operacional de Governança (Visão da Governanta - Quartos Sujos e Limpos)
 * Atende diretamente ao requisito: "a governanta verá os quartos sujos e limpos"
 */
import React, { useState, useMemo } from "react";
import {
  BedDouble,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  CheckSquare,
  Clock,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { useHotel } from "../../context/HotelContext.jsx";
import { Card } from "../../components/common/Card.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { RoomStatusBadge } from "../../components/common/Badge.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import {
  ROOM_STATUS,
  ROOM_STATUS_LABELS,
  ROOM_TYPE_LABELS,
} from "../../config/constants.js";

export function HousekeepingPage() {
  const { rooms, reservations, loading, refreshData, handleUpdateRoomStatus } =
    useHotel();

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'dirty' | 'cleaning' | 'available' | 'occupied'
  const [selectedFloor, setSelectedFloor] = useState("all"); // 'all' | '1' | '2' | '3' | '4'
  const [searchNumber, setSearchNumber] = useState("");
  const [updatingRoomId, setUpdatingRoomId] = useState(null);

  // Modal de Checklist de Inspeção de Limpeza
  const [inspectingRoom, setInspectingRoom] = useState(null);
  const [checklist, setChecklist] = useState({
    linen: true,
    towels: true,
    bathroom: true,
    minibar: true,
    inspection: true,
  });

  // Identifica quais quartos têm reserva com check-in pendente para hoje (prioridade máxima de limpeza)
  const pendingCheckInRoomIds = useMemo(() => {
    const ids = new Set();
    reservations.forEach((res) => {
      if (res.status === "pending" && res.room?.id) {
        ids.add(res.room.id);
      }
    });
    return ids;
  }, [reservations]);

  // Contadores por status
  const dirtyCount = rooms.filter((r) => r.status === ROOM_STATUS.DIRTY).length;
  const cleaningCount = rooms.filter((r) => r.status === ROOM_STATUS.CLEANING).length;
  const availableCount = rooms.filter((r) => r.status === ROOM_STATUS.AVAILABLE).length;
  const occupiedCount = rooms.filter((r) => r.status === ROOM_STATUS.OCCUPIED).length;

  // Filtragem dos quartos
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Filtro de status
      if (activeTab !== "all" && room.status !== activeTab) {
        return false;
      }
      // Filtro de andar
      if (selectedFloor !== "all") {
        const floorPrefix = selectedFloor;
        const roomFloor = String(room.number).charAt(0);
        if (roomFloor !== floorPrefix) return false;
      }
      // Busca por número
      if (searchNumber.trim()) {
        if (!String(room.number).includes(searchNumber.trim())) {
          return false;
        }
      }
      return true;
    });
  }, [rooms, activeTab, selectedFloor, searchNumber]);

  // Ação rápida: Iniciar limpeza
  const handleStartCleaning = async (roomId) => {
    setUpdatingRoomId(roomId);
    try {
      await handleUpdateRoomStatus(roomId, ROOM_STATUS.CLEANING);
    } finally {
      setUpdatingRoomId(null);
    }
  };

  // Ação rápida: Marcar como limpo / liberado
  const handleFinishCleaning = async (roomId) => {
    setUpdatingRoomId(roomId);
    try {
      await handleUpdateRoomStatus(roomId, ROOM_STATUS.AVAILABLE);
      setInspectingRoom(null);
    } finally {
      setUpdatingRoomId(null);
    }
  };

  // Ação rápida: Marcar como sujo
  const handleMarkDirty = async (roomId) => {
    setUpdatingRoomId(roomId);
    try {
      await handleUpdateRoomStatus(roomId, ROOM_STATUS.DIRTY);
    } finally {
      setUpdatingRoomId(null);
    }
  };

  // Abre checklist antes de liberar
  const openInspectionModal = (room) => {
    setInspectingRoom(room);
    setChecklist({
      linen: true,
      towels: true,
      bathroom: true,
      minibar: true,
      inspection: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-1.5 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            Visão Exclusiva da Governança
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#28262C] font-heading">
            Quartos & Higienização
          </h2>
          <p className="text-xs sm:text-sm text-[#28262C]/70 mt-0.5">
            Controle operacional do estado dos quartos: acompanhe quartos sujos, em limpeza e libere quartos limpos para a recepção.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={refreshData}
            title="Atualizar status dos quartos"
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Metric Cards - Destaque para Sujos e Limpos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card Sujos */}
        <div
          onClick={() => setActiveTab(ROOM_STATUS.DIRTY)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            activeTab === ROOM_STATUS.DIRTY
              ? "border-rose-500 ring-2 ring-rose-200 shadow-md"
              : "border-rose-100 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Quartos Sujos
            </span>
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 font-heading">
              {dirtyCount}
            </span>
            <span className="text-xs text-[#28262C]/60">a higienizar</span>
          </div>
          <p className="text-[11px] text-rose-800/80 mt-1 font-medium">
            {dirtyCount > 0 ? "Aguardando equipe de camareiras" : "Nenhum quarto sujo pendente!"}
          </p>
        </div>

        {/* Card Em Limpeza */}
        <div
          onClick={() => setActiveTab(ROOM_STATUS.CLEANING)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            activeTab === ROOM_STATUS.CLEANING
              ? "border-sky-500 ring-2 ring-sky-200 shadow-md"
              : "border-sky-100 hover:border-sky-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
              Em Limpeza
            </span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-sky-600 font-heading">
              {cleaningCount}
            </span>
            <span className="text-xs text-[#28262C]/60">em andamento</span>
          </div>
          <p className="text-[11px] text-sky-800/80 mt-1 font-medium">
            Higienização ativa
          </p>
        </div>

        {/* Card Limpos / Prontos */}
        <div
          onClick={() => setActiveTab(ROOM_STATUS.AVAILABLE)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            activeTab === ROOM_STATUS.AVAILABLE
              ? "border-emerald-500 ring-2 ring-emerald-200 shadow-md"
              : "border-emerald-100 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Limpos & Prontos
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-heading">
              {availableCount}
            </span>
            <span className="text-xs text-[#28262C]/60">disponíveis</span>
          </div>
          <p className="text-[11px] text-emerald-800/80 mt-1 font-medium">
            Liberados para check-in
          </p>
        </div>

        {/* Card Ocupados */}
        <div
          onClick={() => setActiveTab(ROOM_STATUS.OCCUPIED)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            activeTab === ROOM_STATUS.OCCUPIED
              ? "border-purple-500 ring-2 ring-purple-200 shadow-md"
              : "border-purple-100 hover:border-purple-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Quartos Ocupados
            </span>
            <BedDouble className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-purple-600 font-heading">
              {occupiedCount}
            </span>
            <span className="text-xs text-[#28262C]/60">com hóspede</span>
          </div>
          <p className="text-[11px] text-purple-800/80 mt-1 font-medium">
            Arrumação sob solicitação
          </p>
        </div>
      </div>

      {/* Filter Tabs and Controls */}
      <div className="bg-white rounded-2xl p-4 border border-[#D4C2FC]/50 shadow-xs space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "all"
                ? "bg-[#14248A] text-white shadow-xs"
                : "bg-[#F9F5FF] text-[#28262C]/70 hover:bg-[#D4C2FC]/40"
            }`}
          >
            Todos os Quartos ({rooms.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(ROOM_STATUS.DIRTY)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === ROOM_STATUS.DIRTY
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Sujos ({dirtyCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(ROOM_STATUS.CLEANING)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === ROOM_STATUS.CLEANING
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-sky-50 text-sky-700 hover:bg-sky-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            Em Limpeza ({cleaningCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(ROOM_STATUS.AVAILABLE)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === ROOM_STATUS.AVAILABLE
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Limpos & Prontos ({availableCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(ROOM_STATUS.OCCUPIED)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === ROOM_STATUS.OCCUPIED
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Ocupados ({occupiedCount})
          </button>
        </div>

        {/* Secondary Filter: Floor selection & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#F9F5FF]">
          {/* Floor selection */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs font-bold text-[#28262C]/60 whitespace-nowrap mr-1">
              Andar:
            </span>
            {["all", "1", "2", "3", "4"].map((floor) => (
              <button
                key={floor}
                type="button"
                onClick={() => setSelectedFloor(floor)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedFloor === floor
                    ? "bg-[#28262C] text-white"
                    : "bg-[#F9F5FF] text-[#28262C]/60 hover:bg-[#D4C2FC]/30"
                }`}
              >
                {floor === "all" ? "Todos" : `${floor}º Andar`}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="w-full sm:w-56">
            <Input
              icon={Search}
              placeholder="Buscar nº quarto..."
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              className="py-1.5 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Rooms Grid with Direct 1-Click Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredRooms.map((room) => {
          const isDirty = room.status === ROOM_STATUS.DIRTY;
          const isCleaning = room.status === ROOM_STATUS.CLEANING;
          const isAvailable = room.status === ROOM_STATUS.AVAILABLE;
          const isOccupied = room.status === ROOM_STATUS.OCCUPIED;
          const isPendingArrival = pendingCheckInRoomIds.has(room.id);
          const isBusy = updatingRoomId === room.id;

          return (
            <Card
              key={room.id}
              className={`p-4 flex flex-col justify-between transition-all border ${
                isDirty
                  ? "border-rose-300 bg-white shadow-xs"
                  : isCleaning
                  ? "border-sky-300 bg-white shadow-xs"
                  : isAvailable
                  ? "border-emerald-200 bg-white"
                  : "border-[#D4C2FC]/60 bg-white"
              }`}
            >
              <div>
                {/* Header: Room Number and Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-base border ${
                        isDirty
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : isCleaning
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : isAvailable
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-[#F9F5FF] text-[#14248A] border-[#D4C2FC]/80"
                      }`}
                    >
                      {room.number}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#28262C] leading-none">
                        Quarto {room.number}
                      </h4>
                      <p className="text-[11px] text-[#28262C]/65 mt-1">
                        {ROOM_TYPE_LABELS[room.roomType] || room.roomType}
                      </p>
                    </div>
                  </div>

                  <RoomStatusBadge status={room.status} />
                </div>

                {/* Arrival priority warning */}
                {isPendingArrival && (isDirty || isCleaning) && (
                  <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-1.5 text-[11px] text-amber-900 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Prioridade: Hóspede chega hoje!</span>
                  </div>
                )}
              </div>

              {/* Action Buttons for Housekeeping */}
              <div className="mt-4 pt-3 border-t border-[#F9F5FF] space-y-2">
                {/* 1. SE SUJO: Ação Iniciar Limpeza */}
                {isDirty && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleStartCleaning(room.id)}
                    className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isBusy ? "Atualizando..." : "Iniciar Limpeza"}</span>
                  </button>
                )}

                {/* 2. SE EM LIMPEZA: Ação Liberar Quarto Limpo */}
                {isCleaning && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => openInspectionModal(room)}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isBusy ? "Atualizando..." : "Liberar Quarto (Limpo)"}</span>
                  </button>
                )}

                {/* 3. SE LIMPO / DISPONÍVEL: Botão para marcar como sujo se necessário */}
                {isAvailable && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Pronto para entrega
                    </span>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleMarkDirty(room.id)}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline py-1 px-2 rounded cursor-pointer"
                      title="Marcar quarto como sujo para reabrir limpeza"
                    >
                      Marcar Sujo
                    </button>
                  </div>
                )}

                {/* 4. SE OCUPADO: Solicitar arrumação */}
                {isOccupied && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleMarkDirty(room.id)}
                    className="w-full py-2 px-3 rounded-xl bg-[#F9F5FF] hover:bg-rose-50 text-rose-700 border border-[#D4C2FC]/80 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-rose-600" />
                    <span>Solicitar Arrumação</span>
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#D4C2FC]/60">
          <BedDouble className="w-10 h-10 text-[#998FC7] mx-auto mb-2 opacity-50" />
          <h4 className="font-bold text-base text-[#28262C]">
            Nenhum quarto encontrado
          </h4>
          <p className="text-xs text-[#28262C]/60 mt-1">
            Tente remover os filtros de status ou andar aplicados.
          </p>
        </div>
      )}

      {/* Modal de Inspeção e Liberação de Quarto */}
      <Modal
        isOpen={!!inspectingRoom}
        onClose={() => setInspectingRoom(null)}
        title={`Inspeção e Liberação - Quarto ${inspectingRoom?.number}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <p className="font-bold">Confirmação de Higienização</p>
            <p className="text-emerald-700 mt-0.5">
              Ao liberar este quarto, seu status será alterado para <strong>Disponível</strong> no sistema, permitindo que a recepção faça check-in imediatamente.
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#28262C]/70">
              Checklist da Governanta
            </p>

            <label className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F9F5FF] border border-[#D4C2FC]/50 text-xs cursor-pointer hover:bg-[#F9F5FF]/80">
              <input
                type="checkbox"
                checked={checklist.linen}
                onChange={(e) =>
                  setChecklist({ ...checklist, linen: e.target.checked })
                }
                className="rounded text-[#14248A] focus:ring-0"
              />
              <span className="font-medium text-[#28262C]">
                Troca de roupa de cama (lençóis e fronhas higienizados)
              </span>
            </label>

            <label className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F9F5FF] border border-[#D4C2FC]/50 text-xs cursor-pointer hover:bg-[#F9F5FF]/80">
              <input
                type="checkbox"
                checked={checklist.towels}
                onChange={(e) =>
                  setChecklist({ ...checklist, towels: e.target.checked })
                }
                className="rounded text-[#14248A] focus:ring-0"
              />
              <span className="font-medium text-[#28262C]">
                Toalhas limpas e reposição de amenidades de banho
              </span>
            </label>

            <label className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F9F5FF] border border-[#D4C2FC]/50 text-xs cursor-pointer hover:bg-[#F9F5FF]/80">
              <input
                type="checkbox"
                checked={checklist.bathroom}
                onChange={(e) =>
                  setChecklist({ ...checklist, bathroom: e.target.checked })
                }
                className="rounded text-[#14248A] focus:ring-0"
              />
              <span className="font-medium text-[#28262C]">
                Sanitização completa do banheiro e desinfecção
              </span>
            </label>

            <label className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F9F5FF] border border-[#D4C2FC]/50 text-xs cursor-pointer hover:bg-[#F9F5FF]/80">
              <input
                type="checkbox"
                checked={checklist.minibar}
                onChange={(e) =>
                  setChecklist({ ...checklist, minibar: e.target.checked })
                }
                className="rounded text-[#14248A] focus:ring-0"
              />
              <span className="font-medium text-[#28262C]">
                Conferência e reposição de itens do frigobar
              </span>
            </label>

            <label className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F9F5FF] border border-[#D4C2FC]/50 text-xs cursor-pointer hover:bg-[#F9F5FF]/80">
              <input
                type="checkbox"
                checked={checklist.inspection}
                onChange={(e) =>
                  setChecklist({ ...checklist, inspection: e.target.checked })
                }
                className="rounded text-[#14248A] focus:ring-0"
              />
              <span className="font-medium text-[#28262C]">
                Aromatização e inspeção visual aprovada
              </span>
            </label>
          </div>

          <div className="pt-3 border-t border-[#D4C2FC]/40 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInspectingRoom(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="success"
              size="sm"
              icon={CheckCircle2}
              loading={updatingRoomId === inspectingRoom?.id}
              onClick={() => handleFinishCleaning(inspectingRoom.id)}
            >
              Aprovar & Liberar Quarto Limpo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
