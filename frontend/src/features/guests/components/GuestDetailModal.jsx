/**
 * @fileoverview Modal de detalhes do hóspede com histórico de reservas associadas
 */
import React from "react";
import {
  User,
  Mail,
  Phone,
  FileText,
  CalendarDays,
  Edit3,
  BedDouble,
} from "lucide-react";
import { Modal } from "../../../components/common/Modal.jsx";
import { Button } from "../../../components/common/Button.jsx";
import { ReservationBadge } from "../../../components/common/Badge.jsx";
import { useHotel } from "../../../context/HotelContext.jsx";

export function GuestDetailModal({ isOpen, guest, onClose, onEdit }) {
  const { reservations } = useHotel();

  if (!guest) return null;

  // Reservas deste hóspede
  const guestReservations = reservations.filter(
    (r) =>
      Number(r.guest?.id) === Number(guest.id) ||
      r.guest?.document === guest.document,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Perfil do Hóspede #${guest.id}`}
      subtitle="Dados cadastrais e histórico de hospedagens"
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Profile Card */}
        <div className="p-4 rounded-xl bg-[#F9F5FF] border border-[#D4C2FC]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#14248A] text-white flex items-center justify-center text-lg font-bold">
              {guest.name?.charAt(0).toUpperCase() || "H"}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#28262C]">
                {guest.name}
              </h3>
              <p className="text-xs text-[#28262C]/65">
                Documento: {guest.document}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={Edit3}
            onClick={() => onEdit(guest)}
          >
            Editar
          </Button>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-[#D4C2FC]/60 text-xs">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#998FC7]" />
            <div>
              <span className="text-[#28262C]/60 block">E-mail:</span>
              <span className="font-semibold text-[#28262C]">
                {guest.email || "Não informado"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#998FC7]" />
            <div>
              <span className="text-[#28262C]/60 block">Telefone:</span>
              <span className="font-semibold text-[#28262C]">
                {guest.phone || "Não informado"}
              </span>
            </div>
          </div>
        </div>

        {/* Booking History */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-[#28262C] uppercase tracking-wider flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-[#14248A]" />
            Histórico de Reservas ({guestReservations.length})
          </h4>

          {guestReservations.length === 0 ? (
            <div className="p-4 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
              Nenhuma reserva associada a este hóspede ainda.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {guestReservations.map((res) => (
                <div
                  key={res.id}
                  className="p-3 rounded-xl border border-[#D4C2FC]/60 bg-white flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-[#14248A]">
                      Reserva #{res.id}
                    </span>
                    <span className="text-[#28262C]/60 ml-2">
                      Quarto {res.room?.number || "-"} ({res.room?.roomType})
                    </span>
                  </div>
                  <ReservationBadge status={res.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
