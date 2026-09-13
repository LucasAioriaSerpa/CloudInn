/**
 * @fileoverview Tela de Login Corporativo para Funcionários do CloudInn
 * Suporta autenticação direta por credenciais e seleção rápida dos perfis operacionais:
 * - Gerente / Sub-gerente (Acesso total)
 * - Recepcionista (Reservas, Check-in e Check-out)
 * - Governanta (Controle de quartos sujos e limpos)
 */
import React, { useState } from "react";
import {
  Hotel,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CalendarDays,
  BedDouble,
  CheckCircle2,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { DEFAULT_EMPLOYEES, USER_ROLES } from "../../config/auth.js";
import { motion, AnimatePresence } from "motion/react";

export function LoginPage({ onLoginSuccess }) {
  const { login, loginAsRole } = useAuth();

  const [email, setEmail] = useState("gerente@cloudinn.com");
  const [password, setPassword] = useState("123");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Manipula o envio do formulário de login tradicional
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Por favor, informe seu email de funcionário.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Por favor, informe sua senha de acesso.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = login(email, password);
      setLoading(false);
      if (result.success) {
        if (onLoginSuccess) onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.message || "Falha na autenticação.");
      }
    }, 250);
  };

  // Login rápido direto pelo card de perfil
  const handleQuickLogin = (employee) => {
    setEmail(employee.email);
    setPassword(employee.password);
    setErrorMessage("");
    setLoading(true);

    setTimeout(() => {
      const result = loginAsRole(employee.role);
      setLoading(false);
      if (result.success && onLoginSuccess) {
        onLoginSuccess(result.user);
      }
    }, 200);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case USER_ROLES.MANAGER:
      case USER_ROLES.SUB_MANAGER:
        return ShieldCheck;
      case USER_ROLES.RECEPTIONIST:
        return CalendarDays;
      case USER_ROLES.HOUSEKEEPER:
        return BedDouble;
      default:
        return Users;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9F5FF] text-[#28262C] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Brand Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14248A] to-[#998FC7] flex items-center justify-center text-white shadow-md">
            <Hotel className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight font-heading text-[#28262C]">
              CloudInn
            </span>
            <span className="ml-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#D4C2FC] text-[#14248A]">
              Ambiente Interno
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#28262C]/70">
          <Sparkles className="w-3.5 h-3.5 text-[#14248A]" />
          <span>Gestão Operacional Hoteleira</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Traditional Login Form */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#998FC7]/10 border border-[#D4C2FC]/60 flex flex-col justify-between"
        >
          <div>
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#14248A]">
                Autenticação de Funcionários
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#28262C] font-heading mt-1">
                Acessar Sistema
              </h2>
              <p className="text-xs sm:text-sm text-[#28262C]/70 mt-1.5">
                Entre com suas credenciais corporativas para acessar o painel correspondente ao seu cargo.
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 overflow-hidden"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                  <p className="font-medium">{errorMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Username */}
              <div>
                <label
                  htmlFor="employee-email"
                  className="block text-xs font-bold uppercase tracking-wider text-[#28262C]/80 mb-1.5"
                >
                  Email do Funcionário
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#28262C]/40">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="employee-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: gerente@cloudinn.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D4C2FC] bg-[#F9F5FF]/50 text-sm text-[#28262C] placeholder-[#28262C]/40 focus:outline-none focus:ring-2 focus:ring-[#14248A] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="employee-password"
                    className="block text-xs font-bold uppercase tracking-wider text-[#28262C]/80"
                  >
                    Senha de Acesso
                  </label>
                  <span className="text-[11px] text-[#14248A] font-semibold">
                    Padrão: 123
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#28262C]/40">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="employee-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-[#D4C2FC] bg-[#F9F5FF]/50 text-sm text-[#28262C] placeholder-[#28262C]/40 focus:outline-none focus:ring-2 focus:ring-[#14248A] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#28262C]/40 hover:text-[#28262C] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#14248A] text-white font-bold text-sm shadow-md shadow-[#14248A]/30 hover:bg-[#101c6d] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <span>Validando credenciais...</span>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer note inside card */}
          <div className="mt-6 pt-4 border-t border-[#D4C2FC]/40 text-center">
            <p className="text-[11px] text-[#28262C]/60">
              Ambiente de demonstração CloudInn • Você pode digitar as credenciais ou clicar em um dos perfis ao lado para acesso instantâneo.
            </p>
          </div>
        </motion.div>

        {/* Right Column: Quick Role-Based Selection (Visual Demonstrator) */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="lg:col-span-7 flex flex-col justify-between"
        >
          <div>
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#14248A]">
                Seleção Rápida por Função
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#28262C] font-heading mt-0.5">
                Escolha o Perfil do Funcionário
              </h3>
              <p className="text-xs sm:text-sm text-[#28262C]/70">
                Cada cargo possui permissões e visão personalizada do mesmo sistema:
              </p>
            </div>

            {/* Profiles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {DEFAULT_EMPLOYEES.map((employee) => {
                const Icon = getRoleIcon(employee.role);
                const isCurrentForm = email.toLowerCase() === employee.email.toLowerCase();

                return (
                  <motion.div
                    key={employee.id}
                    whileHover={{ y: -3, transition: { duration: 0.18 } }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickLogin(employee)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between bg-white relative overflow-hidden ${
                      isCurrentForm
                        ? "border-[#14248A] shadow-md shadow-[#14248A]/10 ring-1 ring-[#14248A]"
                        : "border-[#D4C2FC]/70 hover:border-[#14248A]/60 hover:shadow-md"
                    }`}
                  >
                    {/* Top row: Avatar & Role Badge */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xs"
                            style={{ backgroundColor: employee.color }}
                          >
                            {employee.avatar}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-[#28262C] leading-snug group-hover:text-[#14248A] transition-colors">
                              {employee.name}
                            </h4>
                            <p className="text-[11px] text-[#28262C]/60">
                              {employee.email}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#F9F5FF] text-[#14248A] border border-[#D4C2FC]/80 whitespace-nowrap">
                          {employee.roleLabel}
                        </span>
                      </div>

                      {/* Description of what this employee sees */}
                      <p className="text-xs text-[#28262C]/75 leading-relaxed mt-2 line-clamp-3">
                        {employee.description}
                      </p>
                    </div>

                    {/* Bottom action button */}
                    <div className="mt-3 pt-2.5 border-t border-[#F9F5FF] flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#14248A] group-hover:underline flex items-center gap-1">
                        <Icon className="w-3.5 h-3.5" />
                        <span>Acessar como {employee.roleLabel}</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#14248A] transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Role Access Matrix Summary Card */}
          <div className="mt-4 p-4 rounded-2xl bg-[#28262C] text-white border border-[#28262C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#D4C2FC]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">
                  Visões Diferenciadas Ativas (RBAC)
                </p>
                <p className="text-[11px] text-[#D4C2FC]/80 mt-0.5">
                  • <strong>Recepcionista</strong>: Reservas, Check-in & Check-out &nbsp;|&nbsp; • <strong>Governanta</strong>: Quartos Sujos & Limpos &nbsp;|&nbsp; • <strong>Gerente</strong>: Sistema Total
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto py-2 text-center text-xs text-[#28262C]/50">
        CloudInn Hotel Management • Sistema Integrado com Azure Functions & MongoDB
      </footer>
    </div>
  );
}
