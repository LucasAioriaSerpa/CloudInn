/**
 * @fileoverview Página de Gestão de Quartos e Governança (RF06, RF10, RF11)
 */
import React, { useState, useMemo } from "react";
import {
  BedDouble,
  LayoutGrid,
  List,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { useHotel } from "../../context/HotelContext.jsx";
import { RoomCard } from "./components/RoomCard.jsx";
import { RoomTable } from "./components/RoomTable.jsx";
import { RoomStatusModal } from "./components/RoomStatusModal.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Select } from "../../components/common/Select.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { LoadingState } from "../../components/common/LoadingState.jsx";
import {
  ROOM_STATUS,
  ROOM_STATUS_LABELS,
  ROOM_TYPES,
} from "../../config/constants.js";

export function RoomsPage() {
  const { rooms, loading, refreshData, handleUpdateRoomStatus } = useHotel();

  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [selectedRoomForModal, setSelectedRoomForModal] = useState(null);

  // Status Filter Tabs
  const statusTabs = [
    { id: "all", label: "Todos os Quartos", count: rooms.length },
    {
      id: ROOM_STATUS.AVAILABLE,
      label: "Disponíveis",
      count: rooms.filter((r) => r.status === ROOM_STATUS.AVAILABLE).length,
    },
    {
      id: ROOM_STATUS.OCCUPIED,
      label: "Ocupados",
      count: rooms.filter((r) => r.status === ROOM_STATUS.OCCUPIED).length,
    },
    {
      id: ROOM_STATUS.RESERVED,
      label: "Reservados",
      count: rooms.filter((r) => r.status === ROOM_STATUS.RESERVED).length,
    },
    {
      id: ROOM_STATUS.DIRTY,
      label: "Sujos (Aguardando)",
      count: rooms.filter((r) => r.status === ROOM_STATUS.DIRTY).length,
    },
    {
      id: ROOM_STATUS.CLEANING,
      label: "Em Limpeza",
      count: rooms.filter((r) => r.status === ROOM_STATUS.CLEANING).length,
    },
  ];

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (statusFilter !== "all" && room.status !== statusFilter) {
        return false;
      }
      if (typeFilter !== "all" && room.roomType !== typeFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesNumber = room.number?.toLowerCase().includes(query);
        const matchesType = room.roomType?.toLowerCase().includes(query);
        return matchesNumber || matchesType;
      }
      return true;
    });
  }, [rooms, statusFilter, typeFilter, searchTerm]);

  // Housekeeping counts
  const dirtyCount = rooms.filter((r) => r.status === "dirty").length;
  const cleaningCount = rooms.filter((r) => r.status === "cleaning").length;

  const handleQuickStatusChange = async (roomId, newStatus) => {
    await handleUpdateRoomStatus(roomId, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#28262C] font-heading">
            Quartos & Governança
          </h2>
          <p className="text-xs sm:text-sm text-[#28262C]/65 mt-0.5">
            Monitoramento de status, ocupação e fluxo de higienização dos
            quartos
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-white border border-[#D4C2FC]/80 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-[#14248A] text-white shadow-2xs"
                  : "text-[#28262C]/60 hover:text-[#28262C]"
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-[#14248A] text-white shadow-2xs"
                  : "text-[#28262C]/60 hover:text-[#28262C]"
              }`}
              title="Visualização em Tabela"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={refreshData}
            title="Atualizar lista de quartos"
          />
        </div>
      </div>

      {/* Housekeeping Flow Banner (if dirty/cleaning rooms exist) */}
      {(dirtyCount > 0 || cleaningCount > 0) && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#D4C2FC]/40 via-white to-white border border-[#998FC7]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#14248A] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[#28262C]">
                Fluxo de Governança Ativo
              </h4>
              <p className="text-xs text-[#28262C]/70">
                {dirtyCount} quarto(s) precisam de limpeza (RF10) •{" "}
                {cleaningCount} em processo de higienização.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-[#14248A] bg-white px-3 py-1.5 rounded-lg border border-[#D4C2FC]">
              Prontos para limpeza rápida
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#D4C2FC]/50">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
                  isActive
                    ? "border-[#14248A] text-[#14248A] bg-white"
                    : "border-transparent text-[#28262C]/60 hover:text-[#28262C] hover:bg-white/50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-[#14248A] text-white"
                      : "bg-[#D4C2FC]/60 text-[#28262C]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full max-w-md">
            <Input
              icon={Search}
              placeholder="Buscar por número do quarto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              name="typeFilter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              placeholder="Todas as categorias"
              options={[
                { value: "all", label: "Todas as Categorias" },
                ...ROOM_TYPES.map((t) => ({ value: t.value, label: t.label })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* Main Content (Grid vs Table) */}
      {loading && rooms.length === 0 ? (
        <LoadingState message="Carregando quartos..." />
      ) : filteredRooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="Nenhum quarto encontrado"
          description="Nenhum quarto corresponde aos filtros selecionados."
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onUpdateStatus={(r) => setSelectedRoomForModal(r)}
              onQuickAction={handleQuickStatusChange}
            />
          ))}
        </div>
      ) : (
        <RoomTable
          rooms={filteredRooms}
          onUpdateStatus={(r) => setSelectedRoomForModal(r)}
          onQuickAction={handleQuickStatusChange}
        />
      )}

      {/* Room Status Modal */}
      <RoomStatusModal
        isOpen={!!selectedRoomForModal}
        room={selectedRoomForModal}
        onClose={() => setSelectedRoomForModal(null)}
      />
    </div>
  );
}
