/**
 * @fileoverview Visão rápida de status dos quartos para o painel principal da recepção
 */
import React from "react";
import { BedDouble, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardBody,
} from "../../../components/common/Card.jsx";
import { RoomStatusBadge } from "../../../components/common/Badge.jsx";
import { Button } from "../../../components/common/Button.jsx";
import {
  ROOM_STATUS_BADGES,
  ROOM_TYPE_LABELS,
} from "../../../config/constants.js";

export function QuickRoomStatus({ rooms, onRoomClick, onNavigateRooms }) {
  // Contagens
  const counts = {
    available: rooms.filter((r) => r.status === "available").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
    reserved: rooms.filter((r) => r.status === "reserved").length,
    dirty: rooms.filter((r) => r.status === "dirty").length,
    cleaning: rooms.filter((r) => r.status === "cleaning").length,
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        title="Status Geral dos Quartos"
        subtitle="Monitoramento em tempo real da governança e recepção"
        action={
          <Button variant="ghost" size="sm" onClick={onNavigateRooms}>
            Ver Todos
          </Button>
        }
      />
      <CardBody className="flex-1 flex flex-col justify-between space-y-4">
        {/* Status mini bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(counts).map(([status, count]) => {
            const badge = ROOM_STATUS_BADGES[status];
            return (
              <div
                key={status}
                className={`p-2.5 rounded-xl border text-center ${badge?.bg || "bg-gray-50"}`}
              >
                <span className="text-base font-extrabold block leading-tight">
                  {count}
                </span>
                <span className="text-[10px] font-semibold uppercase">
                  {badge?.label || status}
                </span>
              </div>
            );
          })}
        </div>

        {/* Room grid representation */}
        <div>
          <p className="text-xs font-bold text-[#28262C]/70 mb-2.5 uppercase tracking-wide">
            Mapa de Quartos
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {rooms.slice(0, 12).map((room) => {
              const badge = ROOM_STATUS_BADGES[room.status];
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => onRoomClick(room)}
                  className={`p-2.5 rounded-xl border text-left transition-all hover:scale-102 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#14248A] ${
                    badge?.bg || "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[#28262C]">
                      {room.number}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${badge?.dot || "bg-gray-400"}`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-[#28262C]/70 block mt-0.5">
                    {ROOM_TYPE_LABELS[room.roomType] || room.roomType}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-[#F9F5FF] rounded-xl border border-[#D4C2FC]/60 flex items-center justify-between text-xs text-[#28262C]/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#14248A]" />
            <span>Quartos sujos exigem limpeza antes de nova ocupação.</span>
          </div>
          <span className="font-bold text-[#14248A]">
            {counts.dirty} pendente(s)
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
