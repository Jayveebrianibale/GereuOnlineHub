import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getAccessibleModules, getAdminRole, isSuperAdmin } from '../config/adminConfig';
import { useAuth } from '../hooks/useAuth';
import { notifyUser } from '../services/notificationService';
import {
    FirebaseAdminReservation,
    getAdminReservations,
    listenToAdminReservations,
    removeAdminReservation as removeAdminReservationService,
    saveAdminReservation,
    updateAdminReservationStatus
} from '../services/reservationService';

export type AdminReservation = FirebaseAdminReservation;

interface AdminReservationContextType {
  adminReservations: AdminReservation[];
  loading: boolean;
  error: string | null;
  addAdminReservation: (reservation: Omit<AdminReservation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateReservationStatus: (reservationId: string, status: AdminReservation['status']) => Promise<void>;
  removeAdminReservation: (reservationId: string) => Promise<void>;
  getReservationsByStatus: (status: AdminReservation['status']) => AdminReservation[];
  // Role-based filtering
  getFilteredReservations: () => AdminReservation[];
  getReservationsByModule: (module: string) => AdminReservation[];
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
  const [filteredReservations, setFilteredReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Get admin role and accessible modules
  const adminEmail = user?.email || '';
  const adminRole = getAdminRole(adminEmail);
  const accessibleModules = getAccessibleModules(adminEmail);
  const isSuperAdminUser = isSuperAdmin(adminEmail);

  // Function to filter reservations based on admin role
  const filterReservationsByRole = (reservations: AdminReservation[]): AdminReservation[] => {
    if (isSuperAdminUser) {
      // Super admin can see all reservations
      return reservations;
    }

    // Filter reservations based on accessible modules
    return reservations.filter(reservation => {
      // Map service types to module names
      const moduleMapping: Record<string, string> = {
        'apartment': 'apartment',
        'laundry': 'laundry',
        'auto': 'car'
      };

      const module = moduleMapping[reservation.serviceType];
      return module && accessibleModules.includes(module);
    });
  };

  // Function to get filtered reservations
  const getFilteredReservations = (): AdminReservation[] => {
    return filterReservationsByRole(adminReservations);
  };

  // Function to get reservations by specific module
  const getReservationsByModule = (module: string): AdminReservation[] => {
    const moduleMapping: Record<string, string> = {
      'apartment': 'apartment',
      'laundry': 'laundry',
      'car': 'auto'
    };

    const serviceType = Object.keys(moduleMapping).find(key => moduleMapping[key] === module);
    if (!serviceType) return [];

    return adminReservations.filter(reservation => reservation.serviceType === serviceType);
  };

  // Load reservations from Firebase on mount
  useEffect(() => {
    // Only load reservations if user is authenticated
    if (!authLoading && !isAuthenticated) {
      console.log('⚠️ User not authenticated, skipping admin reservations load');
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    if (!authLoading && isAuthenticated && user) {
      console.log('✅ User authenticated, loading admin reservations...');
      
      const loadReservations = async () => {
        try {
          setLoading(true);
          setError(null);
          const reservations = await getAdminReservations();
          setAdminReservations(reservations);
          // Filter reservations based on admin role
          const filtered = filterReservationsByRole(reservations);
          setFilteredReservations(filtered);
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
        // Filter reservations based on admin role
        const filtered = filterReservationsByRole(reservations);
        setFilteredReservations(filtered);
        setLoading(false);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user, isAuthenticated, authLoading]);

  // Update filtered reservations when admin role or accessible modules change
  useEffect(() => {
    if (adminReservations.length > 0) {
      const filtered = filterReservationsByRole(adminReservations);
      setFilteredReservations(filtered);
    }
  }, [adminRole, accessibleModules, adminReservations]);

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
      // Get the reservation before updating state
      const reservation = (adminReservations || []).find(r => r.id === reservationId);
      
      // Optimistically update local state so UI reflects the change immediately
      setAdminReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status, updatedAt: new Date().toISOString() } : r));
      await updateAdminReservationStatus(reservationId, status);
      
      // Notify the user about status change
      if (reservation) {
        const title = status === 'confirmed' ? 'Reservation Accepted' : status === 'declined' ? 'Reservation Declined' : 'Reservation Update';
        const body = `Your ${reservation.serviceTitle} reservation has been ${status}.`;
        console.log('Sending user notification:', { userId: reservation.userId, title, body, status });
        await notifyUser(reservation.userId, title, body, { 
          reservationId, 
          status, 
          serviceId: reservation.serviceId, 
          serviceType: reservation.serviceType 
        });
      }
      // The real-time listener will update the state automatically
    } catch (err) {
      console.error('Error updating reservation status:', err);
      setError('Failed to update reservation status');
      // Revert optimistic update by reloading from listener on next tick
      // No-op here; the live listener will resync the correct state
      throw err;
    }
  };

  const removeAdminReservation = async (reservationId: string) => {
    try {
      setError(null);
      // Optimistically update local state so UI reflects the change immediately
      setAdminReservations(prev => prev.filter(reservation => reservation.id !== reservationId));
      await removeAdminReservationService(reservationId);
      // The real-time listener will update the state automatically
    } catch (err) {
      console.error('Error removing admin reservation:', err);
      setError('Failed to remove reservation');
      // Revert optimistic update by reloading from listener on next tick
      // No-op here; the live listener will resync the correct state
      throw err;
    }
  };

  const getReservationsByStatus = (status: AdminReservation['status']) => {
    return filteredReservations.filter(reservation => reservation.status === status);
  };

  return (
    <AdminReservationContext.Provider
      value={{
        adminReservations: filteredReservations, // Use filtered reservations instead of all reservations
        loading,
        error,
        addAdminReservation,
        updateReservationStatus,
        removeAdminReservation,
        getReservationsByStatus,
        getFilteredReservations,
        getReservationsByModule,
      }}
    >
      {children}
    </AdminReservationContext.Provider>
  );
};
