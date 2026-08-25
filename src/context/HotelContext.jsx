/**
 * @fileoverview Contexto global de estado para o ecossistema CloudInn
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { reservationService } from '../services/reservationService.js';
import { roomService } from '../services/roomService.js';
import { guestService } from '../services/guestService.js';
import { mockStorage } from '../mocks/mockStorage.js';

const HotelContext = createContext(null);

export function HotelProvider({ children }) {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Adiciona toast de feedback
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Carrega todos os dados
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resData, roomData, guestData] = await Promise.all([
        reservationService.getReservations(),
        roomService.getRooms(),
        guestService.getGuests(),
      ]);
      setReservations(resData || []);
      setRooms(roomData || []);
      setGuests(guestData || []);
    } catch (err) {
      setError(err.message || 'Falha ao carregar dados do sistema.');
      addToast('Erro ao sincronizar com a API. Dados em modo autônomo.', 'warning');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ações de Reserva
  const handleCreateReservation = async (reservationData) => {
    try {
      await reservationService.createReservation(reservationData);
      await loadData();
      addToast(`Reserva cadastrada com sucesso para ${reservationData.guest?.name || 'hóspede'}!`, 'success');
      return true;
    } catch (err) {
      addToast(err.message || 'Erro ao criar reserva.', 'error');
      return false;
    }
  };

  const handleCheckIn = async (reservationId) => {
    try {
      await reservationService.registerCheckIn(reservationId);
      await loadData();
      addToast(`Check-in registrado com sucesso! Quarto atualizado para Ocupado.`, 'success');
      return true;
    } catch (err) {
      addToast(err.message || 'Erro ao realizar check-in.', 'error');
      return false;
    }
  };

  const handleCheckOut = async (reservationId) => {
    try {
      await reservationService.registerCheckOut(reservationId);
      await loadData();
      addToast(`Check-out registrado com sucesso! Quarto alterado para Sujo.`, 'success');
      return true;
    } catch (err) {
      addToast(err.message || 'Erro ao realizar check-out.', 'error');
      return false;
    }
  };

  // Ações de Quartos (Housekeeping / Governança)
  const handleUpdateRoomStatus = async (roomId, newStatus) => {
    try {
      await roomService.updateRoomStatus(roomId, newStatus);
      await loadData();
      addToast(`Status do quarto atualizado com sucesso para "${newStatus}".`, 'success');
      return true;
    } catch (err) {
      addToast(err.message || 'Erro ao atualizar status do quarto.', 'error');
      return false;
    }
  };

  // Ações de Hóspedes
  const handleCreateGuest = async (guestData) => {
    try {
      const created = await guestService.createGuest(guestData);
      await loadData();
      addToast(`Hóspede "${guestData.name}" cadastrado com sucesso!`, 'success');
      return created;
    } catch (err) {
      addToast(err.message || 'Erro ao cadastrar hóspede.', 'error');
      return null;
    }
  };

  const handleUpdateGuest = async (guestId, guestData) => {
    try {
      await guestService.updateGuest(guestId, guestData);
      await loadData();
      addToast(`Dados do hóspede "${guestData.name}" atualizados com sucesso!`, 'success');
      return true;
    } catch (err) {
      addToast(err.message || 'Erro ao atualizar hóspede.', 'error');
      return false;
    }
  };

  // Restaura dados padrão
  const handleResetData = async () => {
    mockStorage.resetToDefault();
    await loadData();
    addToast('Dados do sistema redefinidos para os valores padrão com sucesso.', 'info');
  };

  // Estatísticas e métricas computadas
  const stats = useMemo(() => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
    const reservedRooms = rooms.filter((r) => r.status === 'reserved').length;
    const availableRooms = rooms.filter((r) => r.status === 'available').length;
    const dirtyRooms = rooms.filter((r) => r.status === 'dirty').length;
    const cleaningRooms = rooms.filter((r) => r.status === 'cleaning').length;

    const occupancyRate = totalRooms > 0 ? Math.round(((occupiedRooms + reservedRooms) / totalRooms) * 100) : 0;

    const pendingCheckins = reservations.filter((r) => r.status === 'pending');
    const activeStays = reservations.filter((r) => r.status === 'active');
    const completedStays = reservations.filter((r) => r.status === 'completed');

    return {
      totalRooms,
      occupiedRooms,
      reservedRooms,
      availableRooms,
      dirtyRooms,
      cleaningRooms,
      occupancyRate,
      totalReservations: reservations.length,
      pendingCount: pendingCheckins.length,
      activeCount: activeStays.length,
      completedCount: completedStays.length,
      totalGuests: guests.length,
    };
  }, [rooms, reservations, guests]);

  const value = {
    reservations,
    rooms,
    guests,
    loading,
    error,
    stats,
    toasts,
    addToast,
    removeToast,
    refreshData: loadData,
    handleCreateReservation,
    handleCheckIn,
    handleCheckOut,
    handleUpdateRoomStatus,
    handleCreateGuest,
    handleUpdateGuest,
    handleResetData,
  };

  return <HotelContext.Provider value={value}>{children}</HotelContext.Provider>;
}

export function useHotel() {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotel deve ser utilizado dentro de um HotelProvider');
  }
  return context;
}
