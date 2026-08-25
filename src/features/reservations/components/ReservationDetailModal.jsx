/**
 * @fileoverview Modal de Detalhes completos da Reserva
 */
import React from 'react';
import { User, BedDouble, Calendar, Mail, Phone, FileText, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../../components/common/Modal.jsx';
import { ReservationBadge, RoomStatusBadge } from '../../../components/common/Badge.jsx';
import { Button } from '../../../components/common/Button.jsx';
import { ROOM_TYPE_LABELS } from '../../../config/constants.js';

export function ReservationDetailModal({
  isOpen,
  reservation,
  onClose,
  onCheckIn,
  onCheckOut,
}) {
  if (!reservation) return null;

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('pt-BR');
    } catch {
      return iso;
    }
  };

  const isPending = reservation.status === 'pending';
  const isActive = reservation.status === 'active';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalhes da Reserva #${reservation.id}`}
      subtitle="Informações cadastrais e operacionais"
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Status Header */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#F9F5FF] border border-[#D4C2FC]/80">
          <div>
            <span className="text-xs text-[#28262C]/60 block">Situação da Reserva:</span>
            <div className="mt-1">
              <ReservationBadge status={reservation.status} />
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#28262C]/60 block">Identificador Único:</span>
            <span className="text-sm font-mono font-bold text-[#14248A]">#{reservation.id}</span>
          </div>
        </div>

        {/* Guest Information */}
        <div className="p-4 rounded-xl border border-[#D4C2FC]/60 space-y-3">
          <h4 className="text-xs font-bold text-[#28262C] uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#14248A]" />
            Dados do Hóspede (RF02)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#28262C]/60 block">Nome Completo:</span>
              <span className="font-bold text-[#28262C] text-sm">{reservation.guest?.name || '-'}</span>
            </div>
            <div>
              <span className="text-[#28262C]/60 block">Documento (CPF/Passaporte):</span>
              <span className="font-medium text-[#28262C]">{reservation.guest?.document || '-'}</span>
            </div>
            <div>
              <span className="text-[#28262C]/60 block">E-mail:</span>
              <span className="font-medium text-[#28262C]">{reservation.guest?.email || '-'}</span>
            </div>
            <div>
              <span className="text-[#28262C]/60 block">Telefone:</span>
              <span className="font-medium text-[#28262C]">{reservation.guest?.phone || '-'}</span>
            </div>
          </div>
        </div>

        {/* Room & Stay Dates */}
        <div className="p-4 rounded-xl border border-[#D4C2FC]/60 space-y-3">
          <h4 className="text-xs font-bold text-[#28262C] uppercase tracking-wider flex items-center gap-1.5">
            <BedDouble className="w-4 h-4 text-[#14248A]" />
            Quarto & Hospedagem (RF04, RF05)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#28262C]/60 block">Número do Quarto:</span>
              <span className="font-bold text-sm text-[#14248A]">
                {reservation.room?.number || 'Não atribuído'}
              </span>
            </div>
            <div>
              <span className="text-[#28262C]/60 block">Categoria:</span>
              <span className="font-medium text-[#28262C]">
                {ROOM_TYPE_LABELS[reservation.room?.roomType] || reservation.room?.roomType || '-'}
              </span>
            </div>
            <div>
              <span className="text-[#28262C]/60 block">Data/Hora de Check-in:</span>
              <span className="font-semibold text-[#28262C]">{formatDate(reservation.checkInDate)}</span>
            </div>
            <div>
              <span className="text-[#28262C]/60 block">Data/Hora de Check-out:</span>
              <span className="font-semibold text-[#28262C]">{formatDate(reservation.checkOutDate)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>

          <div className="flex items-center gap-2">
            {isPending && onCheckIn && (
              <Button
                variant="primary"
                icon={LogIn}
                onClick={() => onCheckIn(reservation)}
              >
                Realizar Check-in
              </Button>
            )}
            {isActive && onCheckOut && (
              <Button
                variant="danger"
                icon={LogOut}
                onClick={() => onCheckOut(reservation)}
              >
                Realizar Check-out
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
