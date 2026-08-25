/**
 * @fileoverview Modal para Cadastro e Edição de Hóspedes (RF02 - POST /guest, PUT /guest/{guestId})
 */
import React, { useState, useEffect } from 'react';
import { User, Plus, Edit3, Mail, Phone, FileText } from 'lucide-react';
import { Modal } from '../../../components/common/Modal.jsx';
import { Button } from '../../../components/common/Button.jsx';
import { Input } from '../../../components/common/Input.jsx';
import { useHotel } from '../../../context/HotelContext.jsx';

export function GuestFormModal({ isOpen, guest, onClose }) {
  const { handleCreateGuest, handleUpdateGuest } = useHotel();

  const isEditing = !!guest?.id;

  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (guest) {
      setFormData({
        name: guest.name || '',
        document: guest.document || '',
        email: guest.email || '',
        phone: guest.phone || '',
      });
    } else {
      setFormData({
        name: '',
        document: '',
        email: '',
        phone: '',
      });
    }
  }, [guest, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('O nome do hóspede é obrigatório.');
      return;
    }

    if (!formData.document.trim()) {
      setError('O documento (CPF ou Passaporte) é obrigatório.');
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        const success = await handleUpdateGuest(guest.id, formData);
        if (success) {
          onClose();
        }
      } else {
        const created = await handleCreateGuest(formData);
        if (created) {
          onClose();
        }
      }
    } catch (err) {
      setError(err.message || 'Erro ao salvar hóspede.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar Hóspede #${guest.id}` : 'Cadastrar Novo Hóspede'}
      subtitle="Cadastro de identificação conforme Swagger (POST /guest, PUT /guest/{id})"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <Input
          label="Nome Completo"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: João da Silva"
          required
        />

        <Input
          label="Documento de Identificação (CPF / Passaporte)"
          name="document"
          value={formData.document}
          onChange={(e) => setFormData({ ...formData, document: e.target.value })}
          placeholder="Ex: 123.456.789-00 ou PASS-BR12345"
          required
          helperText="Campo obrigatório para registro no hotel (RF02)."
        />

        <Input
          label="E-mail de Contato"
          name="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="joao.silva@email.com"
        />

        <Input
          label="Telefone / WhatsApp"
          name="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+55 41 99999-9999"
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={isEditing ? Edit3 : Plus}
            loading={loading}
          >
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Hóspede'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
