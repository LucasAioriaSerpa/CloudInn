/**
 * @fileoverview Modal para atualização de status de quartos (RF06, RF10, RF11)
 */
import React, { useState, useEffect } from 'react';
import { BedDouble, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/common/Modal.jsx';
import { Button } from '../../../components/common/Button.jsx';
import { Select } from '../../../components/common/Select.jsx';
import { RoomStatusBadge } from '../../../components/common/Badge.jsx';
import { useHotel } from '../../../context/HotelContext.jsx';
import { ROOM_STATUS, ROOM_STATUS_LABELS, ROOM_TYPE_LABELS } from '../../../config/constants.js';

export function RoomStatusModal({ isOpen, room, onClose }) {
  const { handleUpdateRoomStatus } = useHotel();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (room) {
      setSelectedStatus(room.status);
    }
  }, [room]);

  if (!room) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) return;

    setSubmitting(true);
    const success = await handleUpdateRoomStatus(room.id, selectedStatus);
    setSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const statusOptions = Object.values(ROOM_STATUS).map((st) => ({
    value: st,
    label: `${ROOM_STATUS_LABELS[st]} (${st})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Atualizar Status do Quarto ${room.number}`}
      subtitle={`Categoria: ${ROOM_TYPE_LABELS[room.roomType] || room.roomType} • ID #${room.id}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current status display */}
        <div className="p-3 rounded-xl bg-[#F9F5FF] border border-[#D4C2FC]/70 flex items-center justify-between">
          <span className="text-xs text-[#28262C]/70">Status Atual:</span>
          <RoomStatusBadge status={room.status} />
        </div>

        {/* Status selection */}
        <Select
          label="Novo Status Operacional"
          name="status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          options={statusOptions}
          required
          helperText="Altera a disponibilidade no sistema (RF06, RF10, RF11)."
        />

        {/* Contextual guidance */}
        {selectedStatus === 'cleaning' && (
          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <strong>Governança (RF10):</strong> Quarto marcado como "Em Limpeza". A equipe de governança está higienizando as dependências.
            </div>
          </div>
        )}

        {selectedStatus === 'available' && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Disponibilização (RF11):</strong> Quarto liberado e pronto para receber novas reservas ou check-in imediato.
            </div>
          </div>
        )}

        {selectedStatus === 'dirty' && (
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong>Atenção:</strong> Quarto aguarda higienização antes de poder ser ocupado.
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
          >
            Salvar Status
          </Button>
        </div>
      </form>
    </Modal>
  );
}
