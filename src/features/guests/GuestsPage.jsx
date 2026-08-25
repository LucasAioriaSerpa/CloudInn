/**
 * @fileoverview Página de Gestão de Hóspedes (RF02)
 */
import React, { useState, useMemo } from 'react';
import { Plus, Search, Users, RefreshCw, UserCheck } from 'lucide-react';
import { useHotel } from '../../context/HotelContext.jsx';
import { GuestTable } from './components/GuestTable.jsx';
import { GuestFormModal } from './components/GuestFormModal.jsx';
import { GuestDetailModal } from './components/GuestDetailModal.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';

export function GuestsPage() {
  const { guests, loading, refreshData } = useHotel();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuestForEdit, setSelectedGuestForEdit] = useState(null);
  const [selectedGuestForDetail, setSelectedGuestForDetail] = useState(null);
  const [isNewGuestOpen, setIsNewGuestOpen] = useState(false);

  // Filtered guests
  const filteredGuests = useMemo(() => {
    if (!searchTerm.trim()) return guests;
    const q = searchTerm.toLowerCase();
    return guests.filter(
      (g) =>
        g.name?.toLowerCase().includes(q) ||
        g.document?.toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q) ||
        g.phone?.toLowerCase().includes(q) ||
        String(g.id).includes(q)
    );
  }, [guests, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#28262C] font-heading">
            Diretório de Hóspedes
          </h2>
          <p className="text-xs sm:text-sm text-[#28262C]/65 mt-0.5">
            Cadastro de dados, identificação e histórico de estadias (RF02)
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={refreshData}
            title="Atualizar lista"
          />
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsNewGuestOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            Novo Hóspede
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-md">
          <Input
            icon={Search}
            placeholder="Buscar por nome, documento (CPF/Passaporte), e-mail ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-[#14248A] font-semibold hover:underline"
          >
            Limpar busca
          </button>
        )}
      </div>

      {/* Main Table / States */}
      {loading && guests.length === 0 ? (
        <LoadingState message="Carregando hóspedes..." />
      ) : filteredGuests.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum hóspede encontrado"
          description={
            searchTerm
              ? 'Nenhum resultado corresponde à sua pesquisa.'
              : 'Nenhum hóspede cadastrado no sistema.'
          }
          actionLabel="Cadastrar Novo Hóspede"
          onAction={() => setIsNewGuestOpen(true)}
        />
      ) : (
        <GuestTable
          guests={filteredGuests}
          onViewDetails={(g) => setSelectedGuestForDetail(g)}
          onEditGuest={(g) => setSelectedGuestForEdit(g)}
        />
      )}

      {/* Modals */}
      <GuestFormModal
        isOpen={isNewGuestOpen}
        onClose={() => setIsNewGuestOpen(false)}
      />

      <GuestFormModal
        isOpen={!!selectedGuestForEdit}
        guest={selectedGuestForEdit}
        onClose={() => setSelectedGuestForEdit(null)}
      />

      <GuestDetailModal
        isOpen={!!selectedGuestForDetail}
        guest={selectedGuestForDetail}
        onClose={() => setSelectedGuestForDetail(null)}
        onEdit={(g) => {
          setSelectedGuestForDetail(null);
          setSelectedGuestForEdit(g);
        }}
      />
    </div>
  );
}
