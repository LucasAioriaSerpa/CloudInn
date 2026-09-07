/**
 * @fileoverview Modal de confirmação para restaurar os dados demo do CloudInn
 */
import React, { useState } from "react";
import { ConfirmModal } from "../../components/common/ConfirmModal.jsx";
import { useHotel } from "../../context/HotelContext.jsx";

export function RestoreDemoModal({ isOpen, onClose }) {
  const { handleResetData } = useHotel();
  const [loading, setLoading] = useState(false);

  const handleConfirmRestore = async () => {
    setLoading(true);
    try {
      await handleResetData();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Restaurar Dados Demo"
      description="Deseja redefinir quartos, reservas e hóspedes para o estado de demonstração? Esta ação substituirá os dados atuais em memória."
      confirmLabel="Restaurar"
      confirmVariant="warning"
      onConfirm={handleConfirmRestore}
      onClose={onClose}
      loading={loading}
    />
  );
}
