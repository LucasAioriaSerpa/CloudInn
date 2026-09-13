/**
 * @fileoverview Sidebar institucional com paleta CloudInn (#28262C, #998FC7, #D4C2FC, #14248A)
 * Adapta itens de navegação e ferramentas conforme o perfil do funcionário logado
 */
import React from "react";
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Users,
  Radio,
  RotateCcw,
  Sparkles,
  Hotel,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { ROUTES } from "../../config/constants.js";
import { useHotel } from "../../context/HotelContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { USER_ROLES } from "../../config/auth.js";

export function Sidebar({
  activeRoute,
  onNavigate,
  onOpenPartnerSimulator,
  onOpenRestoreModal,
  onCloseMobile,
}) {
  const { stats } = useHotel();
  const { user, permissions, logout } = useAuth();

  // Itens de navegação adaptados ao cargo do funcionário
  const allNavItems = [
    {
      route: ROUTES.DASHBOARD,
      label: "Visão Geral",
      icon: LayoutDashboard,
      visible: permissions?.canViewDashboard,
      badge: stats.pendingCount > 0 ? `${stats.pendingCount} pend.` : null,
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      route: ROUTES.RESERVATIONS,
      label:
        user?.role === USER_ROLES.RECEPTIONIST
          ? "Reservas & Recepção"
          : "Reservas",
      icon: CalendarDays,
      visible: permissions?.canViewReservations,
      badge:
        stats.totalReservations > 0 ? String(stats.totalReservations) : null,
      badgeColor: "bg-[#D4C2FC] text-[#28262C]",
    },
    {
      route: ROUTES.ROOMS,
      label:
        user?.role === USER_ROLES.HOUSEKEEPER
          ? "Quartos & Governança"
          : "Quartos & Limpeza",
      icon: BedDouble,
      visible: permissions?.canViewRooms,
      badge: stats.dirtyRooms > 0 ? `${stats.dirtyRooms} sujos` : null,
      badgeColor: "bg-rose-100 text-rose-800",
    },
    {
      route: ROUTES.GUESTS,
      label: "Hóspedes",
      icon: Users,
      visible: permissions?.canViewGuests,
      badge: stats.totalGuests > 0 ? String(stats.totalGuests) : null,
      badgeColor: "bg-[#F9F5FF] text-[#14248A]",
    },
  ];

  const visibleNavItems = allNavItems.filter((item) => item.visible);

  return (
    <aside className="w-64 bg-[#28262C] text-white flex flex-col h-full border-r border-[#28262C]/20 shadow-xl shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => onNavigate(permissions?.defaultRoute || ROUTES.DASHBOARD)}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14248A] to-[#998FC7] flex items-center justify-center text-white shadow-md">
            <Hotel className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight font-heading text-white">
                CloudInn
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#998FC7]/30 text-[#D4C2FC]">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-[#D4C2FC]/70 font-medium">
              Gestão Hoteleira
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#998FC7]">
          {user?.role === USER_ROLES.HOUSEKEEPER
            ? "Módulo Governança"
            : user?.role === USER_ROLES.RECEPTIONIST
            ? "Módulo Recepção"
            : "Navegação Geral"}
        </div>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.route;

          return (
            <motion.button
              key={item.route}
              type="button"
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onNavigate(item.route);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer group ${
                isActive
                  ? "text-white font-semibold"
                  : "text-white/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              {/* Indicador de Fundo Deslizante Ativo */}
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-[#14248A] rounded-xl shadow-md shadow-[#14248A]/30 z-0"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}

              <div className="relative z-10 flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? "text-[#D4C2FC]"
                      : "text-[#998FC7] group-hover:text-white"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <motion.span
                  layout
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}
                >
                  {item.badge}
                </motion.span>
              )}
            </motion.button>
          );
        })}

        {/* Ferramentas e Integrações - Apenas para Gerente / Sub-gerente */}
        {permissions?.canAccessPartnerSimulator && (
          <>
            <div className="pt-5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#998FC7]">
              Integrações & Gerência
            </div>

            <motion.button
              type="button"
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onOpenPartnerSimulator();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Radio className="w-4 h-4 text-[#998FC7] group-hover:text-[#D4C2FC]" />
                <span>Simulador RF01</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#14248A] text-[#D4C2FC]">
                Webhook
              </span>
            </motion.button>
          </>
        )}
      </nav>

      {/* Footer Info, Logged Employee and Logout */}
      <div className="p-3.5 border-t border-white/10 bg-black/20 space-y-2.5">
        {/* Current Employee Profile Card */}
        {user && (
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                style={{ backgroundColor: user.color || "#14248A" }}
              >
                {user.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] text-[#D4C2FC]/80 truncate">
                  {user.roleLabel}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={logout}
              className="p-1.5 rounded-lg text-[#D4C2FC]/70 hover:text-rose-400 hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              title="Sair do sistema (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        {/* Reset Demo Data Button - Apenas Gerência */}
        {permissions?.canResetDemoData && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onOpenRestoreModal}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-[11px] font-medium text-[#D4C2FC]/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Redefinir quartos, reservas e hóspedes para o estado de demonstração no MongoDB"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restaurar Dados Demo</span>
          </motion.button>
        )}
      </div>
    </aside>
  );
}

