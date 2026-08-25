/**
 * @fileoverview Página do Painel / Visão Geral da Recepção
 */
import React, { useState } from "react";
import {
  BedDouble,
  CalendarCheck,
  Users,
  Sparkles,
  Plus,
  LogIn,
  LogOut,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { useHotel } from "../../context/HotelContext.jsx";
import { ROUTES } from "../../config/constants.js";
import { MetricCard } from "./components/MetricCard.jsx";
import { QuickRoomStatus } from "./components/QuickRoomStatus.jsx";
import { TodayActivities } from "./components/TodayActivities.jsx";
import { Button } from "../../components/common/Button.jsx";
import { LoadingState } from "../../components/common/LoadingState.jsx";
import { ErrorState } from "../../components/common/ErrorState.jsx";
import { CheckInModal } from "../reservations/components/CheckInModal.jsx";
import { CheckOutModal } from "../reservations/components/CheckOutModal.jsx";
import { RoomStatusModal } from "../rooms/components/RoomStatusModal.jsx";
import { ReservationFormModal } from "../reservations/components/ReservationFormModal.jsx";
import { ReservationDetailModal } from "../reservations/components/ReservationDetailModal.jsx";

export function DashboardPage({ onNavigate }) {
  const { reservations, rooms, stats, loading, error, refreshData } =
    useHotel();

  // Modals state
  const [selectedResForCheckIn, setSelectedResForCheckIn] = useState(null);
  const [selectedResForCheckOut, setSelectedResForCheckOut] = useState(null);
  const [selectedResForDetail, setSelectedResForDetail] = useState(null);
  const [selectedRoomForStatus, setSelectedRoomForStatus] = useState(null);
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);

  if (loading && rooms.length === 0) {
    return <LoadingState message="Carregando visão geral do hotel..." />;
  }

  if (error && rooms.length === 0) {
    return <ErrorState message={error} onRetry={refreshData} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-[#14248A] via-[#28262C] to-[#28262C] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#D4C2FC] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#D4C2FC]" />
            Sistema Integrado CloudInn
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
            Painel de Recepção & Governança
          </h2>
          <p className="text-sm text-[#D4C2FC]/80 mt-1">
            Acompanhe a ocupação, execute check-ins/outs e gerencie a liberação
            de quartos em tempo real.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            icon={Plus}
            onClick={() => setIsNewReservationOpen(true)}
            className="shadow-md"
          >
            Nova Reserva
          </Button>
          <Button
            variant="outline"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            onClick={() => onNavigate(ROUTES.ROOMS)}
          >
            Ver Mapa de Quartos
          </Button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#998FC7]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Operational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Taxa de Ocupação"
          value={`${stats.occupancyRate}%`}
          subtitle={`${stats.occupiedRooms} ocupados de ${stats.totalRooms} quartos`}
          icon={BedDouble}
          trend={`${stats.availableRooms} livres`}
          color="primary"
          onClick={() => onNavigate(ROUTES.ROOMS)}
        />
        <MetricCard
          title="Check-ins Pendentes"
          value={stats.pendingCount}
          subtitle="Aguardando confirmação de entrada"
          icon={LogIn}
          trend="Hoje"
          color="amber"
          onClick={() => onNavigate(ROUTES.RESERVATIONS)}
        />
        <MetricCard
          title="Hospedagens Ativas"
          value={stats.activeCount}
          subtitle="Hóspedes presentes no hotel"
          icon={CalendarCheck}
          trend={`${stats.completedCount} finalizadas`}
          color="purple"
          onClick={() => onNavigate(ROUTES.RESERVATIONS)}
        />
        <MetricCard
          title="Limpeza & Governança"
          value={stats.dirtyRooms + stats.cleaningRooms}
          subtitle={`${stats.dirtyRooms} sujos • ${stats.cleaningRooms} em limpeza`}
          icon={Sparkles}
          trend={stats.dirtyRooms > 0 ? "Ação requerida" : "Em dia"}
          color={stats.dirtyRooms > 0 ? "rose" : "emerald"}
          onClick={() => onNavigate(ROUTES.ROOMS)}
        />
      </div>

      {/* Main operational splits: Quick Room Status & Today Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <QuickRoomStatus
            rooms={rooms}
            onRoomClick={(room) => setSelectedRoomForStatus(room)}
            onNavigateRooms={() => onNavigate(ROUTES.ROOMS)}
          />
        </div>

        <div className="lg:col-span-5">
          <TodayActivities
            reservations={reservations}
            onCheckIn={(res) => setSelectedResForCheckIn(res)}
            onCheckOut={(res) => setSelectedResForCheckOut(res)}
            onViewDetails={(res) => setSelectedResForDetail(res)}
            onNavigateReservations={() => onNavigate(ROUTES.RESERVATIONS)}
          />
        </div>
      </div>

      {/* Modals for Check-In, Check-Out, Room Status and New Reservation */}
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

      <RoomStatusModal
        isOpen={!!selectedRoomForStatus}
        room={selectedRoomForStatus}
        onClose={() => setSelectedRoomForStatus(null)}
      />

      <ReservationFormModal
        isOpen={isNewReservationOpen}
        onClose={() => setIsNewReservationOpen(false)}
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
    </div>
  );
}
