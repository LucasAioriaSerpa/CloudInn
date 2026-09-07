/**
 * @fileoverview Modal com visualização em tempo real da restauração de dados demo
 * Segue a arquitetura: DELETE (MongoDB) -> FETCH (Mock) -> INSERT (MongoDB) -> SELECT (UI)
 */
import React, { useState } from "react";
import {
  RefreshCw,
  Trash2,
  DownloadCloud,
  PlusCircle,
  Search,
  CheckCircle2,
  Loader2,
  Building,
  Info,
} from "lucide-react";
import { Modal } from "../../components/common/Modal.jsx";
import { Button } from "../../components/common/Button.jsx";
import { useHotel } from "../../context/HotelContext.jsx";

const PIPELINE_STEPS = [
  {
    id: "DELETE",
    label: "1. Limpeza MongoDB",
    badge: "Azure Function DELETE",
    fnName: "fc_gp_cloudInn_delete",
    icon: Trash2,
    desc: "Remove reservas e dados dinâmicos do MongoDB",
  },
  {
    id: "FETCH_MOCK",
    label: "2. Obtenção do Mock",
    badge: "Mock Apidog / Generator",
    fnName: "Apidog / Seed API",
    icon: DownloadCloud,
    desc: "Coleta novo lote de reservas e hóspedes mock",
  },
  {
    id: "INSERT",
    label: "3. Inserção no Banco",
    badge: "Azure Function INSERT",
    fnName: "fc_gp_cloudInn_insert",
    icon: PlusCircle,
    desc: "Grava quartos fixos (10x, 20x, 30x, 40x), hóspedes e reservas",
  },
  {
    id: "SELECT",
    label: "4. Exibição na Interface",
    badge: "Azure Function SELECT",
    fnName: "fc_gp_cloudInn_select",
    icon: Search,
    desc: "Consulta e renderiza o estado atualizado no sistema",
  },
];

export function RestoreDemoModal({ isOpen, onClose }) {
  const { handleResetData } = useHotel();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [stepMessage, setStepMessage] = useState("");
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const handleConfirmRestore = async () => {
    setLoading(true);
    setCompletedSteps(new Set());
    setCurrentStep("DELETE");
    setStepMessage("Iniciando exclusão no MongoDB...");

    try {
      await handleResetData((progress) => {
        if (progress.step === "DELETE") {
          setCurrentStep("DELETE");
          setStepMessage(progress.description);
        } else if (progress.step === "FETCH_MOCK") {
          setCompletedSteps((prev) => new Set(prev).add("DELETE"));
          setCurrentStep("FETCH_MOCK");
          setStepMessage(progress.description);
        } else if (progress.step === "INSERT") {
          setCompletedSteps((prev) => new Set(prev).add("FETCH_MOCK"));
          setCurrentStep("INSERT");
          setStepMessage(progress.description);
        } else if (progress.step === "SELECT") {
          setCompletedSteps((prev) => new Set(prev).add("INSERT"));
          setCurrentStep("SELECT");
          setStepMessage(progress.description);
        } else if (progress.step === "DONE") {
          setCompletedSteps((prev) => new Set(prev).add("SELECT"));
          setCurrentStep("DONE");
          setStepMessage("Restauração concluída!");
        }
      });

      setTimeout(() => {
        onClose();
        setCurrentStep(null);
        setCompletedSteps(new Set());
      }, 1000);
    } catch {
      // Falha tratada no context
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      title="Restaurar Dados Demo"
      subtitle="Sincronização ponta a ponta com Azure Functions & MongoDB"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Info box quartos fixos */}
        <div className="p-3.5 bg-[#F9F5FF] border border-[#D4C2FC] rounded-xl flex items-start gap-3">
          <Building className="w-5 h-5 text-[#14248A] shrink-0 mt-0.5" />
          <div className="text-xs text-[#28262C]">
            <p className="font-bold text-[#14248A]">
              Quartos Fixos do Hotel: 10x, 20x, 30x e 40x
            </p>
            <p className="mt-0.5 text-[#28262C]/80">
              O hotel possui quartos físicos permanentes nos andares 10x (Standard), 20x (Deluxe), 30x (Suíte Master) e 40x (Presidencial). As reservas obtidas do mock serão alocadas a esses quartos fixos.
            </p>
          </div>
        </div>

        {/* Pipeline de Execução */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#28262C]/70">
            Fluxo de Execução Arquitetural
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PIPELINE_STEPS.map((st) => {
              const Icon = st.icon;
              const isCurrent = currentStep === st.id;
              const isDone = completedSteps.has(st.id);

              return (
                <div
                  key={st.id}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    isDone
                      ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                      : isCurrent
                        ? "bg-[#14248A]/5 border-[#14248A] ring-1 ring-[#14248A]"
                        : "bg-white border-[#28262C]/15 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isDone
                            ? "bg-emerald-600 text-white"
                            : isCurrent
                              ? "bg-[#14248A] text-white"
                              : "bg-gray-100 text-[#28262C]/70"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#28262C]">
                        {st.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/5 text-[#28262C]/70">
                      {st.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#28262C]/70 mt-1.5 leading-snug">
                    {st.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mensagem de progresso ao vivo */}
        {loading && (
          <div className="p-3 bg-[#14248A]/10 border border-[#14248A]/30 rounded-xl flex items-center gap-2 text-xs font-semibold text-[#14248A]">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span className="truncate">{stepMessage || "Processando..."}</span>
          </div>
        )}

        {/* Rodapé explicativo */}
        <div className="flex items-start gap-2 text-xs text-[#28262C]/70 pt-1">
          <Info className="w-4 h-4 text-[#14248A] shrink-0 mt-0.5" />
          <p>
            Após o SELECT carregar os dados na interface, você poderá modificá-los em tempo real realizando <strong>Check-in</strong>, <strong>Check-out</strong> e <strong>Governança de Quartos</strong> via <strong>Azure Function UPDATE</strong>.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirmRestore}
            loading={loading}
            className="bg-[#14248A] hover:bg-[#14248A]/90 text-white font-bold"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Restaurar Dados Demo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
