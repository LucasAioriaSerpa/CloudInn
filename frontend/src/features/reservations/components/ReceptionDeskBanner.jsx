/**
 * @fileoverview Balcão de Recepção Operacional - Check-in e Check-out Rápidos
 * Atende ao requisito: "onde o recepcionista verá as reservas, para a realização do check-in e check-out"
 */
import React from "react";
import {
  LogIn,
  LogOut,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "../../../components/common/Button.jsx";
import { RESERVATION_STATUS } from "../../../config/constants.js";

export function ReceptionDeskBanner({
  reservations,
  rooms,
  onCheckIn,
  onCheckOut,
  onNewReservation,
}) {
  // Reservas pendentes (aguardando Check-in)
  const pendingCheckIns = reservations.filter(
    (r) => r.status === RESERVATION_STATUS.PENDING
  );

  // Reservas ativas (hóspedes hospedados que podem realizar Check-out)
  const activeStays = reservations.filter(
    (r) => r.status === RESERVATION_STATUS.ACTIVE
  );

  // Quartos disponíveis limpos prontos para entrega
  const availableRooms = rooms.filter((r) => r.status === "available");

  return (
    <div className="bg-gradient-to-br from-[#14248A] via-[#28262C] to-[#28262C] rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-5">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#D4C2FC] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D4C2FC]" />
            Balcão de Recepção & Front Desk
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-white">
            Operações de Entrada & Saída
          </h2>
          <p className="text-xs sm:text-sm text-[#D4C2FC]/80 mt-0.5">
            Realize check-ins de hóspedes que estão chegando e encerre estadias com check-out imediato.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-xs text-[#D4C2FC]">
            <BedDouble className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>{availableRooms.length}</strong> quartos limpos prontos
            </span>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={onNewReservation}
            className="w-full sm:w-auto bg-[#D4C2FC] text-[#28262C] hover:bg-white font-bold"
          >
            + Nova Reserva
          </Button>
        </div>
      </div>

      {/* Dual Columns: Quick Check-in & Quick Check-out */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Pendentes para Check-In */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <LogIn className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Check-ins Aguardando
                  </h3>
                  <p className="text-[11px] text-[#D4C2FC]/70">
                    Hóspedes com reserva pendente
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                {pendingCheckIns.length} pendentes
              </span>
            </div>

            {/* List of pending check-ins */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {pendingCheckIns.slice(0, 3).map((res) => (
                <div
                  key={res.id}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate">
                        {res.guest?.name || "Hóspede"}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-[#D4C2FC]">
                        Qto {res.room?.number || "—"}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#D4C2FC]/60 truncate mt-0.5">
                      Doc: {res.guest?.document || "Não informado"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCheckIn(res)}
                    className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Fazer Check-in</span>
                  </button>
                </div>
              ))}

              {pendingCheckIns.length === 0 && (
                <div className="py-4 text-center text-xs text-[#D4C2FC]/60">
                  Nenhum check-in pendente no momento.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Hospedados para Check-Out */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-[#D4C2FC] flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Check-outs & Saídas
                  </h3>
                  <p className="text-[11px] text-[#D4C2FC]/70">
                    Hóspedes ativos no hotel
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-[#D4C2FC] font-bold text-xs border border-purple-500/30">
                {activeStays.length} hospedados
              </span>
            </div>

            {/* List of active stays for check-out */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeStays.slice(0, 3).map((res) => (
                <div
                  key={res.id}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate">
                        {res.guest?.name || "Hóspede"}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-[#D4C2FC]">
                        Qto {res.room?.number || "—"}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#D4C2FC]/60 truncate mt-0.5">
                      Reserva #{res.id}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCheckOut(res)}
                    className="py-1.5 px-3 rounded-lg bg-[#998FC7] hover:bg-[#b0a7d8] text-[#28262C] font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Fazer Check-out</span>
                  </button>
                </div>
              ))}

              {activeStays.length === 0 && (
                <div className="py-4 text-center text-xs text-[#D4C2FC]/60">
                  Nenhum hóspede ativo para saída no momento.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
