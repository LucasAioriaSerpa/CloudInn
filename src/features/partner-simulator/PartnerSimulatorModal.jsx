/**
 * @fileoverview Simulador de Notificação de Reserva de Parceiros Externos (RF01)
 * Permite simular a chamada HTTP POST /reservation enviada por Booking.com, Expedia, etc.
 */
import React, { useState } from 'react';
import { Radio, Send, CheckCircle2, AlertCircle, Copy, Sparkles, Building2 } from 'lucide-react';
import { Modal } from '../../components/common/Modal.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input, Textarea } from '../../components/common/Input.jsx';
import { Select } from '../../components/common/Select.jsx';
import { useHotel } from '../../context/HotelContext.jsx';

const PARTNER_TEMPLATES = [
  {
    id: 'booking',
    name: 'Booking.com API',
    guest: { name: 'Lucas Gabriel Albuquerque', document: '789.456.123-00', email: 'lucas.albuquerque@gmail.com', phone: '+55 41 98877-6655' },
    roomNumber: '302C',
    roomType: 'SUI',
    checkInDate: '2026-09-01T14:00:00Z',
    checkOutDate: '2026-09-05T12:00:00Z',
  },
  {
    id: 'expedia',
    name: 'Expedia Partner Solutions',
    guest: { name: 'Camila Vasconcelos', document: '333.222.111-99', email: 'camila.v@corporativo.com', phone: '+55 11 97654-3210' },
    roomNumber: '202B',
    roomType: 'DLX',
    checkInDate: '2026-08-29T15:00:00Z',
    checkOutDate: '2026-09-02T11:00:00Z',
  },
  {
    id: 'airbnb',
    name: 'Airbnb Direct Connect',
    guest: { name: 'Fernando Guimarães', document: 'PASS-BR776655', email: 'fernando.g@nomad.com', phone: '+55 21 99123-4567' },
    roomNumber: '401P',
    roomType: 'PRE',
    checkInDate: '2026-09-10T14:00:00Z',
    checkOutDate: '2026-09-15T12:00:00Z',
  },
];

export function PartnerSimulatorModal({ isOpen, onClose }) {
  const { rooms, handleCreateReservation } = useHotel();

  const [selectedPartner, setSelectedPartner] = useState('booking');
  const [guestName, setGuestName] = useState(PARTNER_TEMPLATES[0].guest.name);
  const [guestDoc, setGuestDoc] = useState(PARTNER_TEMPLATES[0].guest.document);
  const [guestEmail, setGuestEmail] = useState(PARTNER_TEMPLATES[0].guest.email);
  const [guestPhone, setGuestPhone] = useState(PARTNER_TEMPLATES[0].guest.phone);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [checkInDate, setCheckInDate] = useState('2026-09-01T14:00');
  const [checkOutDate, setCheckOutDate] = useState('2026-09-05T12:00');

  const [submitting, setSubmitting] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);

  const handleTemplateChange = (templateId) => {
    setSelectedPartner(templateId);
    const tmpl = PARTNER_TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) {
      setGuestName(tmpl.guest.name);
      setGuestDoc(tmpl.guest.document);
      setGuestEmail(tmpl.guest.email);
      setGuestPhone(tmpl.guest.phone);
      // Try to find matching room
      const match = rooms.find((r) => r.number === tmpl.roomNumber) || rooms[0];
      if (match) setSelectedRoomId(String(match.id));
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setLastResponse(null);

    try {
      const roomObj = rooms.find((r) => Number(r.id) === Number(selectedRoomId)) || rooms[0];

      const payload = {
        guest: {
          name: guestName,
          document: guestDoc,
          email: guestEmail,
          phone: guestPhone,
        },
        room: roomObj,
        checkInDate: new Date(checkInDate).toISOString(),
        checkOutDate: new Date(checkOutDate).toISOString(),
        status: 'pending',
      };

      const result = await handleCreateReservation(payload);
      setLastResponse({
        status: 200,
        message: 'Reserva registrada com sucesso via webhook do parceiro!',
        payload,
      });
    } catch (err) {
      setLastResponse({
        status: 400,
        error: err.message || 'Falha ao processar notificação.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulador de Notificação de Parceiro (RF01)"
      subtitle="Teste a recepção de reservas de sistemas externos via POST /reservation"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Explanation banner */}
        <div className="p-3.5 rounded-xl bg-[#14248A]/5 border border-[#14248A]/20 text-xs text-[#28262C] flex items-start gap-2.5">
          <Radio className="w-4 h-4 text-[#14248A] shrink-0 mt-0.5" />
          <div>
            <strong>Requisito RF01 (arc42 & Swagger):</strong> O sistema CloudInn recebe notificações de reservas originadas por parceiros e plataformas de viagens, persistindo o hóspede, associando o quarto e configurando as datas de estadia.
          </div>
        </div>

        {/* Partner selection presets */}
        <div>
          <label className="text-xs font-semibold text-[#28262C] block mb-1.5">
            Selecione o Sistema Parceiro Integrado:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PARTNER_TEMPLATES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleTemplateChange(p.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedPartner === p.id
                    ? 'border-[#14248A] bg-[#F9F5FF] text-[#14248A] ring-2 ring-[#D4C2FC] font-semibold'
                    : 'border-[#D4C2FC]/70 hover:border-[#998FC7] bg-white text-[#28262C]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs">{p.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSendNotification} className="space-y-4">
          <div className="p-4 rounded-xl border border-[#D4C2FC]/60 bg-white space-y-3">
            <h4 className="text-xs font-bold text-[#28262C] uppercase tracking-wide">
              Payload da Notificação Externa (JSON)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nome do Hóspede"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
              <Input
                label="Documento"
                value={guestDoc}
                onChange={(e) => setGuestDoc(e.target.value)}
                required
              />
              <Input
                label="E-mail"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
              />
              <Input
                label="Telefone"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Select
                label="Quarto Atribuído"
                value={selectedRoomId || (rooms[0] ? String(rooms[0].id) : '')}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                options={rooms.map((r) => ({
                  value: r.id,
                  label: `Quarto ${r.number} (${r.roomType})`,
                }))}
                required
              />
              <Input
                label="Check-in"
                type="datetime-local"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                required
              />
              <Input
                label="Check-out"
                type="datetime-local"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Response log box */}
          {lastResponse && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Status 200 OK:</strong> {lastResponse.message}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Send}
              loading={submitting}
            >
              Emitir Notificação HTTP (POST)
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
