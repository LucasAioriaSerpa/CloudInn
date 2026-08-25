/**
 * @fileoverview Modal de confirmação de Check-out (RF08, RF09)
 */
import React, { useState } from 'react';
import { LogOut, User, BedDouble, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/common/Modal.jsx';
import { Button } from '../../../components/common/Button.jsx';
import { useHotel } from '../../../context/HotelContext.jsx';

export function CheckOutModal({ isOpen, reservation, onClose }) {
  const { handleCheckOut } = useHotel();
  const [submitting, setSubmitting] = useState(false);

  if (!reservation) return null;

  const onConfirm = async () => {
    setSubmitting(true);
    const success = await handleCheckOut(reservation.id);
    setSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('pt-BR');
    } catch {
      return iso;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Check-out de Hóspede"
      subtitle={`Finalização da Reserva #${reservation.id}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Info card */}
        <div className="p-4 rounded-xl bg-[#F9F5FF] border border-[#D4C2FC]/70 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-[#14248A]" />
            <span className="font-bold text-sm text-[#28262C]">
              {reservation.guest?.name || 'Hóspede'}
            </span>
          </div>

          <div className="pt-2 border-t border-[#D4C2FC]/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[#28262C]">
              <BedDouble className="w-4 h-4 text-[#998FC7]" />
              <span>Quarto: <strong className="text-[#14248A]">{reservation.room?.number}</strong></span>
            </div>
            <div className="flex items-center gap-1 text-[#28262C]/70">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(reservation.checkOutDate)}</span>
            </div>
          </div>
        </div>

        {/* Operational Note for Housekeeping (RF08, RF09) */}
        <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong>Regra RF08 & RF09:</strong> Ao registrar a saída, a reserva é marcada como <strong>Concluída</strong> e o status do quarto é automaticamente modificado para <strong>Sujo</strong>, notificando a equipe de governança.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            icon={LogOut}
            loading={submitting}
            onClick={onConfirm}
          >
            Confirmar Check-out
          </Button>
        </div>
      </div>
    </Modal>
  );
}
