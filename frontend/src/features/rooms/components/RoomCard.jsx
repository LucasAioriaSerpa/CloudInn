/**
 * @fileoverview Card visual de quarto com ações rápidas de governança (RF06, RF10, RF11)
 */
import React from "react";
import {
  BedDouble,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Card } from "../../../components/common/Card.jsx";
import { RoomStatusBadge } from "../../../components/common/Badge.jsx";
import { Button } from "../../../components/common/Button.jsx";
import {
  ROOM_TYPE_LABELS,
  ROOM_STATUS_BADGES,
} from "../../../config/constants.js";

export function RoomCard({ room, onUpdateStatus, onQuickAction }) {
  const isDirty = room.status === "dirty";
  const isCleaning = room.status === "cleaning";
  const isAvailable = room.status === "available";

  const badgeConfig = ROOM_STATUS_BADGES[room.status];

  return (
    <Card className="p-4 flex flex-col justify-between hover:border-[#14248A]/50 transition-all group">
      <div>
        {/* Top bar: Room Number & Status */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#F9F5FF] border border-[#D4C2FC]/80 flex items-center justify-center font-extrabold text-[#14248A] text-base group-hover:bg-[#14248A] group-hover:text-white transition-colors">
              {room.number}
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#28262C] leading-none">
                Quarto {room.number}
              </h4>
              <p className="text-xs text-[#28262C]/65 mt-1">
                {ROOM_TYPE_LABELS[room.roomType] || room.roomType}
              </p>
            </div>
          </div>

          <RoomStatusBadge status={room.status} />
        </div>
      </div>

      {/* Housekeeping Action / Status Editor button */}
      <div className="mt-3 pt-3 border-t border-[#F9F5FF] flex items-center justify-between gap-2">
        {/* Contextual quick action */}
        {isDirty && (
          <Button
            variant="secondary"
            size="sm"
            icon={Sparkles}
            className="w-full text-xs font-bold bg-[#D4C2FC] text-[#28262C] hover:bg-[#c3abf7]"
            title="Iniciar processo de limpeza (RF10)"
            onClick={() => onQuickAction(room.id, "cleaning")}
          >
            Iniciar Limpeza
          </Button>
        )}

        {isCleaning && (
          <Button
            variant="success"
            size="sm"
            icon={CheckCircle2}
            className="w-full text-xs font-bold"
            title="Liberar e disponibilizar quarto limpo (RF11)"
            onClick={() => onQuickAction(room.id, "available")}
          >
            Liberar Quarto
          </Button>
        )}

        {!isDirty && !isCleaning && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-[#28262C]/80 hover:text-[#14248A]"
            onClick={() => onUpdateStatus(room)}
          >
            Alterar Status
          </Button>
        )}

        {(isDirty || isCleaning) && (
          <Button
            variant="ghost"
            size="sm"
            className="px-2 text-xs text-[#28262C]/60 hover:text-[#28262C]"
            title="Outras opções de status"
            onClick={() => onUpdateStatus(room)}
          >
            ...
          </Button>
        )}
      </div>
    </Card>
  );
}
