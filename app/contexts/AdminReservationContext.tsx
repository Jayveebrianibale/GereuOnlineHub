import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
    getAdminReservations,
    listenToAdminReservations,
    saveAdminReservation,
    updateAdminReservationStatus
} from '../services/reservationService';

export type AdminReservation = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceType: 'apartment' | 'laundry' | 'auto';
  serviceId: string;
  serviceTitle: string;
  servicePrice: number;
  serviceLocation?: string;
  serviceImage?: any;
  status: 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled';
  reservationDate: string;
  createdAt: string;
  updatedAt: string;
};

interface AdminReservationContextType {
  adminReservations: AdminReservation[];
  loading: boolean;
  error: string | null;
  addAdminReservation: (reservation: Omit<AdminReservation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateReservationStatus: (reservationId: string, status: AdminReservation['status']) => Promise<void>;
  removeAdminReservation: (reservationId: string) => void;
  getReservationsByStatus: (status: AdminReservation['status']) => AdminReservation[];
}

const AdminReservationContext = createContext<AdminReservationContextType | undefined>(undefined);

export const useAdminReservation = () => {
  const context = useContext(AdminReservationContext);
  if (!context) {
    throw new Error('useAdminReservation must be used within an AdminReservationProvider');
  }
  return context;
};

export const AdminReservationProvider = ({ children }: { children: ReactNode }) => {
  const [adminReservations, setAdminReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load reservations from Firebase on mount
  useEffect(() => {
    const loadReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        const reservations = await getAdminReservations();
        setAdminReservations(reservations);
      } catch (err) {
        console.error('Error loading admin reservations:', err);
        setError('Failed to load reservations');
      } finally {
        setLoading(false);
      }
    };

    loadReservations();

    // Set up real-time listener
    const unsubscribe = listenToAdminReservations((reservations) => {
      setAdminReservations(reservations);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const addAdminReservation = async (reservationData: Omit<AdminReservation, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      await saveAdminReservation(reservationData);
      // The real-time listener will update the state automatically
    } catch (err) {
      console.error('Error adding admin reservation:', err);
      setError('Failed to add reservation');
      throw err;
    }
  };

  const updateReservationStatus = async (reservationId: string, status: AdminReservation['status']) => {
    try {
      setError(null);
      await updateAdminReservationStatus(reservationId, status);
      // The real-time listener will update the state automatically
    } catch (err) {
      console.error('Error updating reservation status:', err);
      setError('Failed to update reservation status');
      throw err;
    }
  };

  const removeAdminReservation = (reservationId: string) => {
    setAdminReservations(prev => prev.filter(reservation => reservation.id !== reservationId));
  };

  const getReservationsByStatus = (status: AdminReservation['status']) => {
    return adminReservations.filter(reservation => reservation.status === status);
  };

  return (
    <AdminReservationContext.Provider
      value={{
        adminReservations,
        loading,
        error,
        addAdminReservation,
        updateReservationStatus,
        removeAdminReservation,
        getReservationsByStatus,
      }}
    >
      {children}
    </AdminReservationContext.Provider>
  );
};
