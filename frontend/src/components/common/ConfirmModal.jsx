/**
 * @fileoverview Modal de confirmação para operações de exclusão (DELETE) e ações críticas
 */
import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "./Modal.jsx";
import { Button } from "./Button.jsx";

export function ConfirmModal({
  isOpen,
  title = "Confirmar Exclusão",
  description = "Tem certeza de que deseja realizar esta operação? Esta ação não pode ser desfeita.",
  confirmLabel = "Excluir",
  confirmVariant = "danger",
  onConfirm,
  onClose,
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-800 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant={confirmVariant}
            icon={Trash2}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
