/**
 * @fileoverview Header institucional do CloudInn com identidade visual, data operacional e ações
 */
import React from 'react';
import { Calendar, Bell, Radio, Code2, Menu } from 'lucide-react';
import { Button } from '../common/Button.jsx';

export function Header({
  activeRoute,
  onOpenMobileMenu,
  onOpenPartnerSimulator,
  onOpenApiExplorer,
}) {
  const titles = {
    '/': { title: 'Visão Geral & Recepção', subtitle: 'Painel operacional e monitoramento de quartos em tempo real' },
    '/reservas': { title: 'Gestão de Reservas', subtitle: 'Listagem, check-ins, check-outs e novas reservas' },
    '/quartos': { title: 'Quartos & Governança', subtitle: 'Controle de disponibilidade, ocupação e fluxo de limpeza' },
    '/hospedes': { title: 'Diretório de Hóspedes', subtitle: 'Cadastro, histórico e dados de contato dos hóspedes' },
  };

  const current = titles[activeRoute] || { title: 'CloudInn Hotel', subtitle: 'Sistema Interno' };

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

        {/* Right: Operational Date, Partner Simulator button, Swagger API button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Operational date badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F9F5FF] border border-[#D4C2FC]/70 text-xs font-medium text-[#28262C]">
            <Calendar className="w-3.5 h-3.5 text-[#14248A]" />
            <span>25 de Agosto de 2026</span>
          </div>

          {/* Partner Simulation Trigger (RF01) */}
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

          {/* Swagger API Contract Inspector */}
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

          {/* User profile avatar / role */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#D4C2FC]/50">
            <div className="w-8 h-8 rounded-full bg-[#14248A] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              RC
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-[#28262C] leading-none">Recepção Central</p>
              <p className="text-[10px] text-[#28262C]/60 mt-0.5">Operador CloudInn</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
