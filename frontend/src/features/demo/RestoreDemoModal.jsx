/**
 * @fileoverview Modal de Confirmação e Acompanhamento da Restauração da Demonstração (Seções 21-31)
 */
import React, { useState } from "react";
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Database,
  ArrowRight,
  ShieldCheck,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Modal } from "../../components/common/Modal.jsx";
import { Button } from "../../components/common/Button.jsx";
import { restoreDemoData } from "../../services/demoRestoreService.js";
import { useHotel } from "../../context/HotelContext.jsx";

export function RestoreDemoModal({ isOpen, onClose }) {
  const { refreshData, addToast } = useHotel();

  const [status, setStatus] = useState("idle"); // idle | running | success | error
  const [currentStep, setCurrentStep] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [restoredStats, setRestoredStats] = useState(null);

  const handleStartRestore = async () => {
    setStatus("running");
    setErrorMessage("");
    setCurrentStep("Iniciando processo de restauração...");

    try {
      const result = await restoreDemoData((progress) => {
        setCurrentStep(progress.message);
      });

      setRestoredStats(result.count);
      setStatus("success");
      await refreshData();
      addToast(
        "Demonstração restaurada com sucesso no MongoDB!",
        "success"
      );
    } catch (err) {
      console.error("[RestoreDemoModal] Falha na restauração:", err);
      setStatus("error");
      setErrorMessage(
        err.message ||
          "Erro inesperado durante a comunicação com as Azure Functions / MongoDB."
      );
      addToast(
        "Falha ao restaurar demonstração no banco de dados.",
        "error"
      );
    }
  };

  const handleClose = () => {
    if (status === "running") return;
    setStatus("idle");
    setErrorMessage("");
    setCurrentStep("");
    setRestoredStats(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Restaurar Dados da Demonstração"
      subtitle="Sincronização de ponta a ponta: Mock/Seed → Azure Functions → MongoDB → React"
      maxWidth="max-w-xl"
      id="restore-demo-modal"
    >
      <div className="space-y-5">
        {status === "idle" && (
          <>
            <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong className="font-semibold block mb-1">
                  Atenção: Ação de Reinicialização de Banco
                </strong>
                Esta operação irá restaurar o conjunto de dados canônico de
                demonstração do CloudInn no MongoDB através das Azure Functions
                (DELETE → INSERT → SELECT). Registros temporários criados
                manualmente serão sobrescritos.
              </div>
            </div>

            <div className="p-4 bg-[#F9F5FF] rounded-xl border border-[#D4C2FC]/60 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#14248A] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Garantias de Integridade (Regra RF-Demo)
              </h4>
              <ul className="text-xs text-[#28262C] space-y-2 list-disc list-inside">
                <li>
                  <strong>Validação Prévia:</strong> O dataset da demo é
                  validado estritamente contra os schemas OpenAPI 3.0 antes de
                  qualquer deleção no MongoDB.
                </li>
                <li>
                  <strong>Proteção Contra Falhas:</strong> Se o mock ou semente
                  estiver inválido, nenhuma exclusão ocorre no banco de dados.
                </li>
                <li>
                  <strong>Sincronização Atômica:</strong> O frontend recarrega o
                  estado diretamente do MongoDB após o término.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                icon={RotateCcw}
                onClick={handleStartRestore}
                className="bg-[#14248A] hover:bg-[#14248A]/90 text-white"
              >
                Confirmar e Restaurar no MongoDB
              </Button>
            </div>
          </>
        )}

        {status === "running" && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#14248A]/10 flex items-center justify-center text-[#14248A] animate-pulse">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#28262C]">
                Sincronizando com Azure Functions & MongoDB...
              </h4>
              <p className="text-xs text-[#28262C]/70 mt-1 max-w-sm mx-auto">
                {currentStep}
              </p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden max-w-xs">
              <div className="bg-[#14248A] h-2 rounded-full animate-indeterminate" />
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="py-4 space-y-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900">
                <strong className="font-semibold block mb-1">
                  Restauração Concluída com Sucesso!
                </strong>
                O banco de dados MongoDB foi atualizado via Azure Functions e o
                micro-frontend React foi sincronizado com o novo estado.
              </div>
            </div>

            {restoredStats && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#F9F5FF] rounded-xl border border-[#D4C2FC]/60 text-center">
                  <div className="text-xl font-extrabold text-[#14248A]">
                    {restoredStats.rooms}
                  </div>
                  <div className="text-[11px] text-[#28262C]/70 font-medium">
                    Quartos
                  </div>
                </div>
                <div className="p-3 bg-[#F9F5FF] rounded-xl border border-[#D4C2FC]/60 text-center">
                  <div className="text-xl font-extrabold text-[#14248A]">
                    {restoredStats.guests}
                  </div>
                  <div className="text-[11px] text-[#28262C]/70 font-medium">
                    Hóspedes
                  </div>
                </div>
                <div className="p-3 bg-[#F9F5FF] rounded-xl border border-[#D4C2FC]/60 text-center">
                  <div className="text-xl font-extrabold text-[#14248A]">
                    {restoredStats.reservations}
                  </div>
                  <div className="text-[11px] text-[#28262C]/70 font-medium">
                    Reservas
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={handleClose}>
                Concluir e Fechar
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="py-4 space-y-4">
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900">
                <strong className="font-semibold block mb-1">
                  Falha durante a restauração
                </strong>
                {errorMessage}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={handleClose}>
                Fechar
              </Button>
              <Button
                variant="primary"
                icon={RefreshCw}
                onClick={handleStartRestore}
                className="bg-rose-700 hover:bg-rose-800 text-white"
              >
                Tentar Novamente
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
