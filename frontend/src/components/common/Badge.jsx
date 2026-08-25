/**
 * @fileoverview Componente Badge para exibição de status com indicador visual
 */
import React from "react";
import {
  RESERVATION_STATUS_BADGES,
  ROOM_STATUS_BADGES,
} from "../../config/constants.js";

export function ReservationBadge({ status, className = "" }) {
  const config = RESERVATION_STATUS_BADGES[status] || {
    bg: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
    label: status || "Desconhecido",
  };

  return (
    <span
      id={`reservation-badge-${status}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function RoomStatusBadge({ status, className = "" }) {
  const config = ROOM_STATUS_BADGES[status] || {
    bg: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
    label: status || "Desconhecido",
  };

  return (
    <span
      id={`room-badge-${status}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-[#F9F5FF] text-[#28262C] border-[#D4C2FC]",
    primary: "bg-[#14248A] text-white border-[#14248A]",
    purple: "bg-[#D4C2FC] text-[#28262C] border-[#998FC7]",
    outline: "bg-transparent text-[#28262C] border-[#998FC7]/40",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </span>
  );
}
