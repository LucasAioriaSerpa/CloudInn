/**
 * @fileoverview Lista de atividades imediatas da recepção (Check-ins pendentes e Check-outs do dia)
 */
import React from "react";
import { LogIn, LogOut, ArrowRight, User, Calendar } from "lucide-react";
import {
  Card,
  CardHeader,
  CardBody,
} from "../../../components/common/Card.jsx";
import { ReservationBadge } from "../../../components/common/Badge.jsx";
import { Button } from "../../../components/common/Button.jsx";

export function TodayActivities({
  reservations,
  onCheckIn,
  onCheckOut,
  onViewDetails,
  onNavigateReservations,
}) {
  const pendingCheckins = reservations.filter((r) => r.status === "pending");
  const activeStays = reservations.filter((r) => r.status === "active");

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        title="Operações da Recepção"
        subtitle="Entradas e saídas de hóspedes aguardando processamento"
        action={
          <Button variant="ghost" size="sm" onClick={onNavigateReservations}>
            Ver Reservas
          </Button>
        }
      />
      <CardBody className="space-y-4 flex-1">
        {/* Pending Check-ins section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#28262C] uppercase flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5 text-[#14248A]" />
              Check-ins Pendentes ({pendingCheckins.length})
            </span>
          </div>

          {pendingCheckins.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#F9F5FF] text-center text-xs text-[#28262C]/60">
              Nenhum check-in pendente no momento.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingCheckins.slice(0, 3).map((res) => (
                <div
                  key={res.id}
                  className="p-3 rounded-xl border border-[#D4C2FC]/60 bg-white hover:border-[#14248A]/40 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#28262C] truncate">
                        {res.guest?.name || "Hóspede"}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#14248A]/10 text-[#14248A] text-[10px] font-bold">
                        Quarto {res.room?.number || "-"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#28262C]/60 truncate mt-0.5">
                      Entrada prevista: {formatDate(res.checkInDate)}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={LogIn}
                    onClick={() => onCheckIn(res)}
                  >
                    Check-in
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Stays awaiting checkout */}
        <div>
          <div className="flex items-center justify-between mb-2 pt-2 border-t border-[#F9F5FF]">
            <span className="text-xs font-bold text-[#28262C] uppercase flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              Hospedagens em Andamento ({activeStays.length})
            </span>
          </div>

          {activeStays.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#F9F5FF] text-center text-xs text-[#28262C]/60">
              Nenhum hóspede ativo no hotel.
            </div>
          ) : (
            <div className="space-y-2">
              {activeStays.slice(0, 3).map((res) => (
                <div
                  key={res.id}
                  className="p-3 rounded-xl border border-[#D4C2FC]/60 bg-white hover:border-rose-300 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#28262C] truncate">
                        {res.guest?.name || "Hóspede"}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                        Quarto {res.room?.number || "-"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#28262C]/60 truncate mt-0.5">
                      Saída prevista: {formatDate(res.checkOutDate)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={LogOut}
                    onClick={() => onCheckOut(res)}
                    className="border-rose-300 text-rose-700 hover:bg-rose-50"
                  >
                    Check-out
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
