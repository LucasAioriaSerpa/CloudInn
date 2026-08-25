/**
 * @fileoverview Modal de confirmação de Check-in (RF07)
 */
import React, { useState } from 'react';
import { LogIn, User, BedDouble, Calendar, AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/common/Modal.jsx';
import { Button } from '../../../components/common/Button.jsx';
import { useHotel } from '../../../context/HotelContext.jsx';

export function CheckInModal({ isOpen, reservation, onClose }) {
  const { handleCheckIn } = useHotel();
  const [submitting, setSubmitting] = useState(false);

  if (!reservation) return null;

  const onConfirm = async () => {
    setSubmitting(true);
    const success = await handleCheckIn(reservation.id);
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
      title="Confirmar Check-in de Hóspede"
      subtitle={`Reserva #${reservation.id} • Quarto ${reservation.room?.number || '-'}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Info card */}
        <div className="p-4 rounded-xl bg-[#F9F5FF] border border-[#D4C2FC]/70 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-[#14248A]" />
            <span className="font-bold text-sm text-[#28262C]">
              {reservation.guest?.name || 'Hóspede não informado'}
            </span>
          </div>
          <div className="text-xs text-[#28262C]/70 pl-6 space-y-1">
            <p>Documento: <span className="font-medium text-[#28262C]">{reservation.guest?.document || '-'}</span></p>
            <p>E-mail: <span className="font-medium text-[#28262C]">{reservation.guest?.email || '-'}</span></p>
          </div>

          <div className="pt-2 border-t border-[#D4C2FC]/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[#28262C]">
              <BedDouble className="w-4 h-4 text-[#998FC7]" />
              <span>Quarto: <strong className="text-[#14248A]">{reservation.room?.number}</strong> ({reservation.room?.roomType})</span>
            </div>
            <div className="flex items-center gap-1 text-[#28262C]/70">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(reservation.checkInDate)}</span>
            </div>
          </div>
        </div>

        {/* Operational Note */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Regra RF07:</strong> Ao confirmar o check-in, a reserva passará para o status <strong>Ativa</strong> e o quarto será atualizado para <strong>Ocupado</strong>.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            icon={LogIn}
            loading={submitting}
            onClick={onConfirm}
          >
            Registrar Check-in
          </Button>
        </div>
      </div>
    </Modal>
  );
}
