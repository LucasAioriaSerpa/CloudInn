/**
 * @fileoverview Tabela densa de quartos para visualização em lista
 */
import React from "react";
import { Sparkles, CheckCircle2, Edit3 } from "lucide-react";
import { RoomStatusBadge } from "../../../components/common/Badge.jsx";
import { Button } from "../../../components/common/Button.jsx";
import { ROOM_TYPE_LABELS } from "../../../config/constants.js";

export function RoomTable({ rooms = [], onUpdateStatus, onQuickAction }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#D4C2FC]/60 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-[#D4C2FC]/50 bg-[#F9F5FF] text-[#28262C]/70 font-semibold uppercase text-[11px] tracking-wider">
            <th className="py-3 px-4">Número</th>
            <th className="py-3 px-4">Categoria / Tipo</th>
            <th className="py-3 px-4">Status Operacional</th>
            <th className="py-3 px-4 text-right">Governança & Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F9F5FF]">
          {rooms.map((room) => {
            const isDirty = room.status === "dirty";
            const isCleaning = room.status === "cleaning";

            return (
              <tr
                key={room.id}
                className="hover:bg-[#F9F5FF]/80 transition-colors"
              >
                <td className="py-3.5 px-4 font-bold text-sm text-[#14248A]">
                  Quarto {room.number}
                </td>
                <td className="py-3.5 px-4 font-medium text-[#28262C]">
                  {ROOM_TYPE_LABELS[room.roomType] || room.roomType} (
                  {room.roomType})
                </td>
                <td className="py-3.5 px-4">
                  <RoomStatusBadge status={room.status} />
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isDirty && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Sparkles}
                        onClick={() => onQuickAction(room.id, "cleaning")}
                      >
                        Limpar
                      </Button>
                    )}
                    {isCleaning && (
                      <Button
                        variant="success"
                        size="sm"
                        icon={CheckCircle2}
                        onClick={() => onQuickAction(room.id, "available")}
                      >
                        Liberar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit3}
                      onClick={() => onUpdateStatus(room)}
                    >
                      Alterar
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
