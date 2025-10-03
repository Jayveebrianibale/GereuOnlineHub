import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { notifyAdmins } from '../services/notificationService';
import {
    getUserReservations,
    listenToUserReservations,
    removeUserReservation,
    saveUserReservation,
    updateUserReservationStatus
} from '../services/reservationService';
import { mapServiceToReservation, parsePrice } from '../utils/reservationUtils';
import { useAuthContext } from './AuthContext';

export type Apartment = {
  id: string;
  title: string;
  price: number;
  location: string;
  image: any;
  status?: 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled';
  // Add other apartment properties as needed
  [key: string]: any;
};

export type LaundryService = {
  id: string;
  title: string;
  price: number;
  image: any;
  status?: 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled';
  shippingInfo?: {
    deliveryType: 'pickup' | 'dropoff';
    address?: string;
  };
  // Add other laundry properties as needed
  [key: string]: any;
};

export type AutoService = {
  id: string;
  title: string;
  price: number;
  image: any;
  status?: 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled';
  // Add other auto properties as needed
  [key: string]: any;
};

interface ReservationContextType {
  reservedApartments: Apartment[];
  reservedLaundryServices: LaundryService[];
  reservedAutoServices: AutoService[];
  loading: boolean;
  error: string | null;
  
  reserveApartment: (apartment: Apartment) => Promise<void>;
  removeReservation: (apartmentId: string) => Promise<void>;
  updateApartmentStatus: (apartmentId: string, status: Apartment['status']) => Promise<void>;

  reserveLaundryService: (service: LaundryService) => Promise<void>;
  removeLaundryReservation: (serviceId: string) => Promise<void>;
  updateLaundryStatus: (serviceId: string, status: LaundryService['status']) => Promise<void>;

  reserveAutoService: (service: AutoService) => Promise<void>;
  removeAutoReservation: (serviceId: string) => Promise<void>;
  updateAutoStatus: (serviceId: string, status: AutoService['status']) => Promise<void>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [reservedApartments, setReservedApartments] = useState<Apartment[]>([]);
  const [reservedLaundryServices, setReservedLaundryServices] = useState<LaundryService[]>([]);
  const [reservedAutoServices, setReservedAutoServices] = useState<AutoService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  // Load user reservations from Firebase when user changes
  useEffect(() => {
    if (!user) {
      setReservedApartments([]);
      setReservedLaundryServices([]);
      setReservedAutoServices([]);
      setLoading(false);
      return;
    }

    const loadUserReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        const reservations = await getUserReservations(user.uid);
        console.log('🔄 Loaded user reservations:', reservations.length, 'reservations');
        console.log('🔄 All reservations details:', reservations.map(r => ({ 
          id: r.id, 
          serviceType: r.serviceType, 
          serviceTitle: r.serviceTitle,
          serviceId: r.serviceId 
        })));
        
        // Separate reservations by type
        const apartments = reservations.filter(r => r.serviceType === 'apartment') as Apartment[];
        const laundry = reservations.filter(r => r.serviceType === 'laundry') as LaundryService[];
        const auto = reservations.filter(r => r.serviceType === 'auto') as AutoService[];
        
        console.log('🔄 Filtered - Apartments:', apartments.length, 'Laundry:', laundry.length, 'Auto:', auto.length);
        console.log('🔄 Auto reservations details:', auto.map(a => ({ 
          id: a.id, 
          serviceTitle: a.serviceTitle, 
          serviceType: a.serviceType,
          serviceId: (a as any).serviceId,
          homeService: (a as any).homeService,
          shopService: (a as any).shopService
        })));
        
        setReservedApartments(apartments);
        setReservedLaundryServices(laundry);
        setReservedAutoServices(auto);
      } catch (err) {
        console.error('Error loading user reservations:', err);
        setError('Failed to load reservations');
      } finally {
        setLoading(false);
      }
    };

    loadUserReservations();

    // Set up real-time listener
    const unsubscribe = listenToUserReservations(user.uid, (reservations) => {
      console.log('📡 Real-time user reservation update:', reservations.length, 'reservations');
      console.log('📡 Real-time all reservations:', reservations.map(r => ({ 
        id: r.id, 
        serviceType: r.serviceType, 
        serviceTitle: r.serviceTitle,
        serviceId: r.serviceId 
      })));
      const apartments = reservations.filter(r => r.serviceType === 'apartment') as Apartment[];
      const laundry = reservations.filter(r => r.serviceType === 'laundry') as LaundryService[];
      const auto = reservations.filter(r => r.serviceType === 'auto') as AutoService[];
      
      console.log('📡 Real-time filtered - Apartments:', apartments.length, 'Laundry:', laundry.length, 'Auto:', auto.length);
      console.log('📡 Real-time auto reservations details:', auto.map(a => ({ 
        id: a.id, 
        serviceTitle: a.serviceTitle, 
        serviceType: a.serviceType,
        serviceId: (a as any).serviceId,
        homeService: (a as any).homeService,
        shopService: (a as any).shopService
      })));
      
      setReservedApartments(apartments);
      setReservedLaundryServices(laundry);
      setReservedAutoServices(auto);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const reserveApartment = async (apartment: Apartment) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      const isReserved = reservedApartments.some(a => (a as any).serviceId === apartment.id);
      if (isReserved) return;

      const reservationData = mapServiceToReservation(apartment, 'apartment');
      await saveUserReservation(user.uid, reservationData);
      // Notify admins new reservation
      await notifyAdmins('New apartment reservation', `${apartment.title} reserved`, {
        serviceType: 'apartment', serviceId: apartment.id, userId: user.uid,
      });
    } catch (err) {
      console.error('Error reserving apartment:', err);
      setError('Failed to reserve apartment');
      throw err;
    }
  };

  const removeReservation = async (apartmentId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      const reservation = reservedApartments.find(a => (a as any).serviceId === apartmentId);
      if (!reservation) return;

      // Find the Firebase reservation ID
      const reservations = await getUserReservations(user.uid);
      const firebaseReservation = reservations.find(r => r.serviceId === apartmentId && r.serviceType === 'apartment');
      
      if (firebaseReservation) {
        await removeUserReservation(user.uid, firebaseReservation.id);
        // Notify admins cancellation
        await notifyAdmins('Reservation cancelled', `Apartment reservation cancelled`, {
          serviceType: 'apartment', serviceId: apartmentId, userId: user.uid,
        });
      }
    } catch (err) {
      console.error('Error removing apartment reservation:', err);
      setError('Failed to remove reservation');
      throw err;
    }
  };

  const reserveLaundryService = async (service: LaundryService) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      const isReserved = reservedLaundryServices.some(s => (s as any).serviceId === service.id);
      if (isReserved) return;

      // Use the service data directly to preserve all information
      const reservationData = {
        serviceType: 'laundry',
        serviceId: service.id,
        serviceTitle: service.title,
        servicePrice: parsePrice(service.price),
        serviceImage: service.image,
        status: service.status || 'pending' as const,
        reservationDate: new Date().toISOString(),
        // Preserve all additional data from the service (including shipping info)
        ...service,
      };
      
      console.log('🚀 Saving user laundry reservation with all data:', reservationData);
      await saveUserReservation(user.uid, reservationData);
      await notifyAdmins('New laundry reservation', `${service.title} reserved`, {
        serviceType: 'laundry', serviceId: service.id, userId: user.uid,
      });
    } catch (err) {
      console.error('Error reserving laundry service:', err);
      setError('Failed to reserve laundry service');
      throw err;
    }
  };

  const removeLaundryReservation = async (serviceId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      const reservation = reservedLaundryServices.find(s => (s as any).serviceId === serviceId);
      if (!reservation) return;

      const reservations = await getUserReservations(user.uid);
      const firebaseReservation = reservations.find(r => r.serviceId === serviceId && r.serviceType === 'laundry');
      
      if (firebaseReservation) {
        await removeUserReservation(user.uid, firebaseReservation.id);
        await notifyAdmins('Reservation cancelled', `Laundry reservation cancelled`, {
          serviceType: 'laundry', serviceId, userId: user.uid,
        });
      }
    } catch (err) {
      console.error('Error removing laundry reservation:', err);
      setError('Failed to remove reservation');
      throw err;
    }
  };

  const reserveAutoService = async (service: AutoService) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      const isReserved = reservedAutoServices.some(s => (s as any).serviceId === service.id);
      if (isReserved) return;

      // Create reservation data with proper structure
      const reservationData = {
        serviceType: 'auto' as const,
        serviceId: service.id,
        serviceTitle: service.title,
        servicePrice: parsePrice(service.price),
        serviceImage: service.image,
        status: service.status || 'pending' as const,
        reservationDate: new Date().toISOString(),
        // Preserve additional data as separate properties
        homeService: service.homeService || false,
        shopService: service.shopService || false,
        problemDescription: service.problemDescription,
        address: service.address,
        contactNumber: service.contactNumber,
      };
      
      console.log('🚀 Saving user auto reservation with all data:', reservationData);
      console.log('🚀 User ID:', user.uid);
      const reservationId = await saveUserReservation(user.uid, reservationData);
      console.log('🚀 Auto reservation saved with ID:', reservationId);
      await notifyAdmins('New auto reservation', `${service.title} reserved`, {
        serviceType: 'auto', serviceId: service.id, userId: user.uid,
      });
    } catch (err) {
      console.error('Error reserving auto service:', err);
      setError('Failed to reserve auto service');
      throw err;
    }
  };

  const removeAutoReservation = async (serviceId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      const reservation = reservedAutoServices.find(s => (s as any).serviceId === serviceId);
      if (!reservation) return;

      const reservations = await getUserReservations(user.uid);
      const firebaseReservation = reservations.find(r => r.serviceId === serviceId && r.serviceType === 'auto');
      
      if (firebaseReservation) {
        await removeUserReservation(user.uid, firebaseReservation.id);
        await notifyAdmins('Reservation cancelled', `Auto reservation cancelled`, {
          serviceType: 'auto', serviceId, userId: user.uid,
        });
      }
    } catch (err) {
      console.error('Error removing auto reservation:', err);
      setError('Failed to remove reservation');
      throw err;
    }
  };

  const updateApartmentStatus = async (apartmentId: string, status: Apartment['status']) => {
    if (!user) return;
    
    try {
      setError(null);
      const reservations = await getUserReservations(user.uid);
      const firebaseReservation = reservations.find(r => r.serviceId === apartmentId && r.serviceType === 'apartment');
      
      if (firebaseReservation) {
        await updateUserReservationStatus(user.uid, firebaseReservation.id, status || 'pending');
      }
    } catch (err) {
      console.error('Error updating apartment status:', err);
      setError('Failed to update status');
      throw err;
    }
  };

  const updateLaundryStatus = async (serviceId: string, status: LaundryService['status']) => {
    if (!user) return;
    
    try {
      setError(null);
      const reservations = await getUserReservations(user.uid);
      const firebaseReservation = reservations.find(r => r.serviceId === serviceId && r.serviceType === 'laundry');
      
      if (firebaseReservation) {
        await updateUserReservationStatus(user.uid, firebaseReservation.id, status || 'pending');
      }
    } catch (err) {
      console.error('Error updating laundry status:', err);
      setError('Failed to update status');
      throw err;
    }
  };

  const updateAutoStatus = async (serviceId: string, status: AutoService['status']) => {
    if (!user) return;
    
    try {
      setError(null);
      const reservations = await getUserReservations(user.uid);
      const firebaseReservation = reservations.find(r => r.serviceId === serviceId && r.serviceType === 'auto');
      
      if (firebaseReservation) {
        await updateUserReservationStatus(user.uid, firebaseReservation.id, status || 'pending');
      }
    } catch (err) {
      console.error('Error updating auto status:', err);
      setError('Failed to update status');
      throw err;
    }
  };

  return (
    <ReservationContext.Provider
      value={{
        reservedApartments,
        reservedLaundryServices,
        reservedAutoServices,
        loading,
        error,
        reserveApartment,
        removeReservation,
        updateApartmentStatus,
        reserveLaundryService,
        removeLaundryReservation,
        updateLaundryStatus,
        reserveAutoService,
        removeAutoReservation,
        updateAutoStatus,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};
