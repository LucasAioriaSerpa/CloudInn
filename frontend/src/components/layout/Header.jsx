/**
 * @fileoverview Header institucional do CloudInn com identidade visual, dados do funcionário e troca rápida de papel
 */
import React, { useState } from "react";
import {
  Calendar,
  Radio,
  Code2,
  Menu,
  LogOut,
  ChevronDown,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "../common/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROLE_BADGES } from "../../config/auth.js";
import { motion, AnimatePresence } from "motion/react";

export function Header({
  activeRoute,
  onOpenMobileMenu,
  onOpenPartnerSimulator,
  onOpenApiExplorer,
}) {
  const { user, permissions, logout, employeesList, switchEmployee } =
    useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const titles = {
    "/": {
      title: "Visão Geral Executiva",
      subtitle: "Painel 360° do hotel com métricas, ocupação e controle global",
    },
    "/reservas": {
      title: "Gestão de Reservas & Recepção",
      subtitle: "Listagem, check-ins, check-outs e atendimento de hóspedes",
    },
    "/quartos": {
      title:
        user?.role === "housekeeper"
          ? "Painel da Governança (Limpeza)"
          : "Quartos & Governança",
      subtitle:
        user?.role === "housekeeper"
          ? "Controle prioritário de quartos sujos, em limpeza e limpos"
          : "Controle de disponibilidade, ocupação e fluxo de higienização",
    },
    "/hospedes": {
      title: "Diretório de Hóspedes",
      subtitle: "Cadastro, histórico e dados de contato dos hóspedes",
    },
  };

  const current = titles[activeRoute] || {
    title: "CloudInn Hotel",
    subtitle: "Sistema Interno",
  };

  const badgeConfig = user ? ROLE_BADGES[user.role] : null;

  return (
    <header className="bg-white border-b border-[#D4C2FC]/50 sticky top-0 z-30 px-4 sm:px-6 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg text-[#28262C] hover:bg-[#F9F5FF] focus:outline-none"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#28262C] font-heading leading-tight">
              {current.title}
            </h1>
            <p className="text-xs text-[#28262C]/65 hidden sm:block">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Operational Date, Tools (Manager) & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Operational date badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F9F5FF] border border-[#D4C2FC]/70 text-xs font-medium text-[#28262C]">
            <Calendar className="w-3.5 h-3.5 text-[#14248A]" />
            <span>25 de Agosto de 2026</span>
          </div>

          {/* Partner Simulation Trigger (RF01) - Apenas Gerência */}
          {permissions?.canAccessPartnerSimulator && (
            <Button
              variant="outline"
              size="sm"
              icon={Radio}
              onClick={onOpenPartnerSimulator}
              title="Simular notificação de reserva de site externo parceiro"
              className="hidden sm:inline-flex border-[#998FC7]/40 text-[#14248A] hover:bg-[#F9F5FF]"
            >
              Simular Parceiro (RF01)
            </Button>
          )}

          {/* Swagger API Contract Inspector - Apenas Gerência */}
          {permissions?.canAccessSwaggerDocs && (
            <Button
              variant="ghost"
              size="sm"
              icon={Code2}
              onClick={onOpenApiExplorer}
              title="Inspecionar Contratos Swagger & Endpoints"
              className="text-[#28262C]/70 hover:text-[#14248A]"
            >
              <span className="hidden lg:inline">Swagger API</span>
            </Button>
          )}

          {/* User profile dropdown & quick role switcher */}
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#D4C2FC]/50 hover:opacity-85 transition-opacity cursor-pointer"
              >
                <div
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs"
                  style={{ backgroundColor: user.color || "#14248A" }}
                >
                  {user.avatar}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-[#28262C] leading-none flex items-center gap-1">
                    <span>{user.name}</span>
                    <ChevronDown className="w-3 h-3 text-[#28262C]/50" />
                  </p>
                  <p className="text-[10px] text-[#28262C]/60 mt-0.5">
                    {user.roleLabel}
                  </p>
                </div>
              </button>

              {/* Profile & Role Switcher Popover */}
              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ type: "spring", damping: 25, stiffness: 350 }}
                      className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#D4C2FC]/70 z-50 p-3 space-y-3"
                    >
                      {/* User header */}
                      <div className="p-2.5 rounded-xl bg-[#F9F5FF] border border-[#D4C2FC]/50">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-xs"
                            style={{ backgroundColor: user.color || "#14248A" }}
                          >
                            {user.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-[#28262C] truncate">
                              {user.name}
                            </p>
                            <p className="text-[11px] text-[#28262C]/60 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#D4C2FC]/40 flex items-center justify-between text-[11px]">
                          <span className="text-[#28262C]/70">Cargo Atual:</span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${badgeConfig?.bg || "bg-indigo-50 text-indigo-700"}`}
                          >
                            {user.roleLabel}
                          </span>
                        </div>
                      </div>

                      {/* Quick Switch Role Options */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#998FC7] px-1 mb-1.5">
                          Alternar Visão do Sistema
                        </p>
                        <div className="space-y-1">
                          {employeesList.map((emp) => {
                            const isSelected = emp.id === user.id;
                            return (
                              <motion.button
                                key={emp.id}
                                whileHover={{ x: 3 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => {
                                  switchEmployee(emp.id);
                                  setProfileDropdownOpen(false);
                                }}
                                className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-[#14248A] text-white font-bold"
                                    : "hover:bg-[#F9F5FF] text-[#28262C]"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: emp.color }}
                                  />
                                  <span>{emp.name}</span>
                                </div>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    isSelected
                                      ? "bg-white/20 text-white"
                                      : "bg-[#F9F5FF] text-[#28262C]/70"
                                  }`}
                                >
                                  {emp.roleLabel}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Logout button */}
                      <div className="pt-2 border-t border-[#D4C2FC]/50">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                          }}
                          className="w-full py-2 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sair (Trocar de Usuário)</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

