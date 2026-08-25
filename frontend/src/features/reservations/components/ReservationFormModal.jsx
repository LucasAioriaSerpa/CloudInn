/**
 * @fileoverview Modal de Cadastro de Nova Reserva (RF01, RF03, RF04, RF05)
 */
import React, { useState } from "react";
import { Plus, User, BedDouble, Calendar, Check, Search } from "lucide-react";
import { Modal } from "../../../components/common/Modal.jsx";
import { Button } from "../../../components/common/Button.jsx";
import { Input } from "../../../components/common/Input.jsx";
import { Select } from "../../../components/common/Select.jsx";
import { useHotel } from "../../../context/HotelContext.jsx";
import { ROOM_TYPE_LABELS } from "../../../config/constants.js";

export function ReservationFormModal({ isOpen, onClose }) {
  const { rooms, guests, handleCreateReservation, handleCreateGuest } =
    useHotel();

  // Modo do hóspede: 'existing' ou 'new'
  const [guestMode, setGuestMode] = useState("existing");
  const [selectedGuestId, setSelectedGuestId] = useState("");

  // Formulário do novo hóspede
  const [newGuest, setNewGuest] = useState({
    name: "",
    document: "",
    email: "",
    phone: "",
  });

  // Dados da reserva
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [checkInDate, setCheckInDate] = useState("2026-08-25T14:00");
  const [checkOutDate, setCheckOutDate] = useState("2026-08-28T12:00");
  const [initialStatus, setInitialStatus] = useState("pending");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Quartos disponíveis ou todos
  const availableRooms = rooms.filter((r) => r.status === "available");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedRoomId) {
      setError("Por favor, selecione um quarto para a reserva.");
      return;
    }

    if (!checkInDate || !checkOutDate) {
      setError("Por favor, preencha as datas de Check-in e Check-out.");
      return;
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      setError("A data de Check-out deve ser posterior à data de Check-in.");
      return;
    }

    setLoading(true);

    try {
      let guestObj = null;

      if (guestMode === "existing") {
        guestObj = guests.find((g) => Number(g.id) === Number(selectedGuestId));
        if (!guestObj) {
          setError("Por favor, selecione um hóspede cadastrado.");
          setLoading(false);
          return;
        }
      } else {
        if (!newGuest.name.trim() || !newGuest.document.trim()) {
          setError("Nome e Documento do hóspede são campos obrigatórios.");
          setLoading(false);
          return;
        }
        // Cadastra o hóspede primeiro
        guestObj = await handleCreateGuest(newGuest);
        if (!guestObj) {
          setError("Erro ao cadastrar novo hóspede.");
          setLoading(false);
          return;
        }
      }

      const roomObj = rooms.find(
        (r) => Number(r.id) === Number(selectedRoomId),
      );

      const payload = {
        guest: guestObj,
        room: roomObj,
        checkInDate: new Date(checkInDate).toISOString(),
        checkOutDate: new Date(checkOutDate).toISOString(),
        status: initialStatus,
      };

      const success = await handleCreateReservation(payload);
      if (success) {
        onClose();
        // Reset form
        setSelectedGuestId("");
        setSelectedRoomId("");
        setNewGuest({ name: "", document: "", email: "", phone: "" });
      }
    } catch (err) {
      setError(err.message || "Erro ao processar reserva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Reserva de Hospedagem"
      subtitle="Registro conforme especificações do Swagger (POST /reservation)"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Guest Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#28262C] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#14248A]" />
              1. Identificação do Hóspede (RF02)
            </h4>
            <div className="flex rounded-lg bg-[#F9F5FF] p-0.5 border border-[#D4C2FC]/60 text-xs">
              <button
                type="button"
                onClick={() => setGuestMode("existing")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  guestMode === "existing"
                    ? "bg-[#14248A] text-white shadow-xs"
                    : "text-[#28262C]/70 hover:text-[#28262C]"
                }`}
              >
                Hóspede Existente
              </button>
              <button
                type="button"
                onClick={() => setGuestMode("new")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  guestMode === "new"
                    ? "bg-[#14248A] text-white shadow-xs"
                    : "text-[#28262C]/70 hover:text-[#28262C]"
                }`}
              >
                Novo Cadastro
              </button>
            </div>
          </div>

          {guestMode === "existing" ? (
            <Select
              label="Selecionar Hóspede Cadastrado"
              name="guestId"
              value={selectedGuestId}
              onChange={(e) => setSelectedGuestId(e.target.value)}
              required
              options={guests.map((g) => ({
                value: g.id,
                label: `${g.name} — Doc: ${g.document || "N/A"} (${g.email || g.phone || "Sem contato"})`,
              }))}
              placeholder="Escolha um hóspede da lista..."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F9F5FF] border border-[#D4C2FC]/60">
              <Input
                label="Nome Completo"
                name="name"
                value={newGuest.name}
                onChange={(e) =>
                  setNewGuest({ ...newGuest, name: e.target.value })
                }
                placeholder="Ex: Carlos Santana"
                required
              />
              <Input
                label="Documento (CPF / Passaporte)"
                name="document"
                value={newGuest.document}
                onChange={(e) =>
                  setNewGuest({ ...newGuest, document: e.target.value })
                }
                placeholder="Ex: 123.456.789-00"
                required
              />
              <Input
                label="E-mail"
                name="email"
                type="email"
                value={newGuest.email}
                onChange={(e) =>
                  setNewGuest({ ...newGuest, email: e.target.value })
                }
                placeholder="carlos@email.com"
              />
              <Input
                label="Telefone / WhatsApp"
                name="phone"
                value={newGuest.phone}
                onChange={(e) =>
                  setNewGuest({ ...newGuest, phone: e.target.value })
                }
                placeholder="+55 11 99999-9999"
              />
            </div>
          )}
        </div>

        {/* Room Selection */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <h4 className="text-xs font-bold text-[#28262C] uppercase tracking-wider flex items-center gap-1.5">
            <BedDouble className="w-4 h-4 text-[#14248A]" />
            2. Associação de Quarto (RF05)
          </h4>
          <Select
            label="Quarto Designado"
            name="roomId"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            required
            options={rooms.map((r) => ({
              value: r.id,
              label: `Quarto ${r.number} [${ROOM_TYPE_LABELS[r.roomType] || r.roomType}] — Status Atual: ${r.status}`,
            }))}
            placeholder="Selecione o quarto para esta hospedagem..."
            helperText={`${availableRooms.length} quarto(s) disponível(is) no momento.`}
          />
        </div>

        {/* Dates & Status */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <h4 className="text-xs font-bold text-[#28262C] uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#14248A]" />
            3. Período e Status Inicial (RF04)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Data e Hora de Check-in"
              type="datetime-local"
              name="checkInDate"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              required
            />
            <Input
              label="Data e Hora de Check-out"
              type="datetime-local"
              name="checkOutDate"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              required
            />
          </div>

          <Select
            label="Status Inicial da Reserva"
            name="initialStatus"
            value={initialStatus}
            onChange={(e) => setInitialStatus(e.target.value)}
            options={[
              { value: "pending", label: "Pendente (Aguardando chegada)" },
              {
                value: "active",
                label: "Ativa (Hóspede já presente no quarto)",
              },
            ]}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" icon={Plus} loading={loading}>
            Cadastrar Reserva
          </Button>
        </div>
      </form>
    </Modal>
  );
}
