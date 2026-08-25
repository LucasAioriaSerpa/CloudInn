/**
 * @fileoverview Gerenciador de persistência local para fallback autônomo e simulações
 */
import { INITIAL_GUESTS, INITIAL_RESERVATIONS, INITIAL_ROOMS } from './seedData.js';

const STORAGE_KEYS = {
  GUESTS: 'cloudinn_guests_v1',
  ROOMS: 'cloudinn_rooms_v1',
  RESERVATIONS: 'cloudinn_reservations_v1',
};

class MockStorage {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.GUESTS)) {
      localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(INITIAL_GUESTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(INITIAL_RESERVATIONS));
    }
  }

  // Guests
  getGuests() {
    const data = localStorage.getItem(STORAGE_KEYS.GUESTS);
    return data ? JSON.parse(data) : INITIAL_GUESTS;
  }

  getGuestById(id) {
    const guests = this.getGuests();
    return guests.find((g) => Number(g.id) === Number(id)) || null;
  }

  saveGuest(guestData) {
    const guests = this.getGuests();
    let updated;
    if (guestData.id) {
      updated = guests.map((g) => (Number(g.id) === Number(guestData.id) ? { ...g, ...guestData } : g));
    } else {
      const nextId = guests.length > 0 ? Math.max(...guests.map((g) => g.id || 0)) + 1 : 1;
      const newGuest = { ...guestData, id: nextId };
      updated = [newGuest, ...guests];
      guestData = newGuest;
    }
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(updated));
    return guestData;
  }

  // Rooms
  getRooms(statusFilter) {
    const rooms = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROOMS) || '[]');
    if (statusFilter && statusFilter !== 'all') {
      return rooms.filter((r) => r.status === statusFilter);
    }
    return rooms;
  }

  getRoomById(id) {
    const rooms = this.getRooms();
    return rooms.find((r) => Number(r.id) === Number(id)) || null;
  }

  updateRoomStatus(roomId, newStatus) {
    const rooms = this.getRooms();
    const updated = rooms.map((r) => {
      if (Number(r.id) === Number(roomId)) {
        return { ...r, status: newStatus };
      }
      return r;
    });
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(updated));
    
    // Also sync room in active reservations if applicable
    const reservations = this.getReservations();
    const updatedRes = reservations.map((res) => {
      if (res.room && Number(res.room.id) === Number(roomId)) {
        return { ...res, room: { ...res.room, status: newStatus } };
      }
      return res;
    });
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(updatedRes));
    return { code: 200, type: 'success', message: `Status do quarto atualizado para ${newStatus}` };
  }

  // Reservations
  getReservations(statusFilter) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVATIONS) || '[]');
    if (statusFilter && statusFilter !== 'all') {
      return list.filter((r) => r.status === statusFilter);
    }
    return list;
  }

  getReservationById(id) {
    const list = this.getReservations();
    return list.find((r) => Number(r.id) === Number(id)) || null;
  }

  createReservation(reservationData) {
    const reservations = this.getReservations();
    const nextId = reservations.length > 0 ? Math.max(...reservations.map((r) => r.id || 0)) + 1 : 1001;
    
    // Ensure room is set to reserved if currently available
    if (reservationData.room && reservationData.room.id) {
      this.updateRoomStatus(reservationData.room.id, 'reserved');
    }

    const newRes = {
      ...reservationData,
      id: nextId,
      status: reservationData.status || 'pending',
    };
    const updated = [newRes, ...reservations];
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(updated));
    return newRes;
  }

  registerCheckIn(reservationId) {
    const reservations = this.getReservations();
    const reservation = reservations.find((r) => Number(r.id) === Number(reservationId));
    if (!reservation) {
      throw new Error('Reserva não encontrada');
    }
    
    // RF07: Altera status da reserva para active e quarto para occupied
    reservation.status = 'active';
    if (reservation.room?.id) {
      this.updateRoomStatus(reservation.room.id, 'occupied');
      reservation.room.status = 'occupied';
    }

    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
    return { code: 200, type: 'success', message: 'Check-in realizado com sucesso' };
  }

  registerCheckOut(reservationId) {
    const reservations = this.getReservations();
    const reservation = reservations.find((r) => Number(r.id) === Number(reservationId));
    if (!reservation) {
      throw new Error('Reserva não encontrada');
    }
    
    // RF08 & RF09: Altera status da reserva para completed e quarto para dirty
    reservation.status = 'completed';
    if (reservation.room?.id) {
      this.updateRoomStatus(reservation.room.id, 'dirty');
      reservation.room.status = 'dirty';
    }

    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
    return { code: 200, type: 'success', message: 'Check-out realizado com sucesso e quarto marcado como sujo' };
  }

  resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(INITIAL_GUESTS));
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(INITIAL_RESERVATIONS));
  }
}

export const mockStorage = new MockStorage();
