/**
 * @fileoverview Sidebar institucional com paleta CloudInn (#28262C, #998FC7, #D4C2FC, #14248A)
 */
import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Users,
  Radio,
  RotateCcw,
  Sparkles,
  Hotel,
} from 'lucide-react';
import { ROUTES } from '../../config/constants.js';
import { useHotel } from '../../context/HotelContext.jsx';

export function Sidebar({
  activeRoute,
  onNavigate,
  onOpenPartnerSimulator,
  onCloseMobile,
}) {
  const { stats, handleResetData } = useHotel();

  const navItems = [
    {
      route: ROUTES.DASHBOARD,
      label: 'Visão Geral',
      icon: LayoutDashboard,
      badge: stats.pendingCount > 0 ? `${stats.pendingCount} pend.` : null,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      route: ROUTES.RESERVATIONS,
      label: 'Reservas',
      icon: CalendarDays,
      badge: stats.totalReservations > 0 ? String(stats.totalReservations) : null,
      badgeColor: 'bg-[#D4C2FC] text-[#28262C]',
    },
    {
      route: ROUTES.ROOMS,
      label: 'Quartos & Limpeza',
      icon: BedDouble,
      badge: stats.dirtyRooms > 0 ? `${stats.dirtyRooms} sujos` : null,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      route: ROUTES.GUESTS,
      label: 'Hóspedes',
      icon: Users,
      badge: stats.totalGuests > 0 ? String(stats.totalGuests) : null,
      badgeColor: 'bg-[#F9F5FF] text-[#14248A]',
    },
  ];

  return (
    <aside className="w-64 bg-[#28262C] text-white flex flex-col h-full border-r border-[#28262C]/20 shadow-xl shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate(ROUTES.DASHBOARD)}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14248A] to-[#998FC7] flex items-center justify-center text-white shadow-md">
            <Hotel className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight font-heading text-white">CloudInn</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#998FC7]/30 text-[#D4C2FC]">v1.0</span>
            </div>
            <p className="text-[11px] text-[#D4C2FC]/70 font-medium">Gestão Hoteleira</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#998FC7]">
          Navegação Principal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.route;

          return (
            <button
              key={item.route}
              type="button"
              onClick={() => {
                onNavigate(item.route);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-[#14248A] text-white shadow-md shadow-[#14248A]/30 font-semibold'
                  : 'text-white/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#D4C2FC]' : 'text-[#998FC7] group-hover:text-white'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* External integrations section */}
        <div className="pt-5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#998FC7]">
          Integrações & Ferramentas
        </div>

        <button
          type="button"
          onClick={() => {
            onOpenPartnerSimulator();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-all group"
        >
          <div className="flex items-center gap-3">
            <Radio className="w-4 h-4 text-[#998FC7] group-hover:text-[#D4C2FC]" />
            <span>Simulador RF01</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#14248A] text-[#D4C2FC]">
            Webhook
          </span>
        </button>
      </nav>

      {/* Footer Info & Quick Reset */}
      <div className="p-4 border-t border-white/10 bg-black/20 space-y-3">
        {/* Quick occupancy badge */}
        <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-xs">
          <span className="text-[#D4C2FC]/80 text-[11px]">Ocupação Atual:</span>
          <span className="font-bold text-white text-xs">{stats.occupancyRate}%</span>
        </div>

        {/* Reset Demo Data Button */}
        <button
          type="button"
          onClick={handleResetData}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-[#D4C2FC]/70 hover:text-white hover:bg-white/5 transition-colors"
          title="Redefinir quartos, reservas e hóspedes para o estado de demonstração"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Dados Demo</span>
        </button>
      </div>
    </aside>
  );
}
