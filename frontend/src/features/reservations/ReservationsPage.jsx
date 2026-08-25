/**
 * @fileoverview Página Principal de Gerenciamento de Reservas (RF01, RF03, RF04, RF05, RF07, RF08)
 */
import React, { useState, useMemo } from "react";
import { Plus, Search, Filter, CalendarDays, RefreshCw } from "lucide-react";
import { useHotel } from "../../context/HotelContext.jsx";
import { ReservationTable } from "./components/ReservationTable.jsx";
import { ReservationFormModal } from "./components/ReservationFormModal.jsx";
import { ReservationDetailModal } from "./components/ReservationDetailModal.jsx";
import { CheckInModal } from "./components/CheckInModal.jsx";
import { CheckOutModal } from "./components/CheckOutModal.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { LoadingState } from "../../components/common/LoadingState.jsx";
import { RESERVATION_STATUS } from "../../config/constants.js";

export function ReservationsPage() {
  const { reservations, loading, refreshData } = useHotel();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedResForDetail, setSelectedResForDetail] = useState(null);
  const [selectedResForCheckIn, setSelectedResForCheckIn] = useState(null);
  const [selectedResForCheckOut, setSelectedResForCheckOut] = useState(null);

  // Tabs for status filtering
  const tabs = [
    { id: "all", label: "Todas as Reservas", count: reservations.length },
    {
      id: RESERVATION_STATUS.PENDING,
      label: "Pendentes",
      count: reservations.filter((r) => r.status === RESERVATION_STATUS.PENDING)
        .length,
    },
    {
      id: RESERVATION_STATUS.ACTIVE,
      label: "Ativas (Hospedados)",
      count: reservations.filter((r) => r.status === RESERVATION_STATUS.ACTIVE)
        .length,
    },
    {
      id: RESERVATION_STATUS.COMPLETED,
      label: "Concluídas",
      count: reservations.filter(
        (r) => r.status === RESERVATION_STATUS.COMPLETED,
      ).length,
    },
    {
      id: RESERVATION_STATUS.CANCELLED,
      label: "Canceladas",
      count: reservations.filter(
        (r) => r.status === RESERVATION_STATUS.CANCELLED,
      ).length,
    },
  ];

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      // Filter by status tab
      if (statusFilter !== "all" && res.status !== statusFilter) {
        return false;
      }
      // Search term (name, doc, room, id)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = res.guest?.name?.toLowerCase().includes(query);
        const matchesDoc = res.guest?.document?.toLowerCase().includes(query);
        const matchesRoom = res.room?.number?.toLowerCase().includes(query);
        const matchesId = String(res.id).includes(query);
        return matchesName || matchesDoc || matchesRoom || matchesId;
      }
      return true;
    });
  }, [reservations, statusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#28262C] font-heading">
            Gestão de Reservas
          </h2>
          <p className="text-xs sm:text-sm text-[#28262C]/65 mt-0.5">
            Controle de estadias, confirmação de entradas e liberação de
            check-outs
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={refreshData}
            title="Atualizar lista"
          />
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsFormOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            Nova Reserva
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#D4C2FC]/50">
          {tabs.map((tab) => {
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

        {/* Search input */}
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-md">
            <Input
              icon={Search}
              placeholder="Buscar por hóspede, documento, quarto ou #ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-xs text-[#14248A] font-semibold hover:underline"
            >
              Limpar busca
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading && reservations.length === 0 ? (
        <LoadingState message="Carregando lista de reservas..." />
      ) : filteredReservations.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhuma reserva encontrada"
          description={
            searchTerm || statusFilter !== "all"
              ? "Tente ajustar os filtros ou o termo de busca pesquisado."
              : "Comece criando a primeira reserva ou simulando uma entrada de parceiro."
          }
          actionLabel="Cadastrar Nova Reserva"
          onAction={() => setIsFormOpen(true)}
        />
      ) : (
        <ReservationTable
          reservations={filteredReservations}
          onCheckIn={(res) => setSelectedResForCheckIn(res)}
          onCheckOut={(res) => setSelectedResForCheckOut(res)}
          onViewDetails={(res) => setSelectedResForDetail(res)}
        />
      )}

      {/* Modals */}
      <ReservationFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />

      <ReservationDetailModal
        isOpen={!!selectedResForDetail}
        reservation={selectedResForDetail}
        onClose={() => setSelectedResForDetail(null)}
        onCheckIn={(res) => {
          setSelectedResForDetail(null);
          setSelectedResForCheckIn(res);
        }}
        onCheckOut={(res) => {
          setSelectedResForDetail(null);
          setSelectedResForCheckOut(res);
        }}
      />

      <CheckInModal
        isOpen={!!selectedResForCheckIn}
        reservation={selectedResForCheckIn}
        onClose={() => setSelectedResForCheckIn(null)}
      />

      <CheckOutModal
        isOpen={!!selectedResForCheckOut}
        reservation={selectedResForCheckOut}
        onClose={() => setSelectedResForCheckOut(null)}
      />
    </div>
  );
}
