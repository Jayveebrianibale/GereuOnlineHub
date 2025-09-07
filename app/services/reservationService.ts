import { get, onValue, push, ref, remove, set, update } from 'firebase/database';
import { db } from '../firebaseConfig';

export type FirebaseAdminReservation = {
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

export type FirebaseUserReservation = {
  id: string;
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

// Admin Reservation Functions
export const saveAdminReservation = async (reservation: Omit<FirebaseAdminReservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const reservationRef = ref(db, 'adminReservations');
    const newReservationRef = push(reservationRef);
    const reservationId = newReservationRef.key!;
    
    const reservationData: FirebaseAdminReservation = {
      ...reservation,
      id: reservationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await set(newReservationRef, reservationData);
    return reservationId;
  } catch (error) {
    console.error('Error saving admin reservation:', error);
    throw error;
  }
};

export const updateAdminReservationStatus = async (reservationId: string, status: FirebaseAdminReservation['status']): Promise<void> => {
  try {
    const reservationRef = ref(db, `adminReservations/${reservationId}`);
    await update(reservationRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating admin reservation status:', error);
    throw error;
  }
};

export const getAdminReservations = async (): Promise<FirebaseAdminReservation[]> => {
  try {
    const reservationRef = ref(db, 'adminReservations');
    const snapshot = await get(reservationRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data) as FirebaseAdminReservation[];
    }
    return [];
  } catch (error) {
    console.error('Error fetching admin reservations:', error);
    throw error;
  }
};

export const listenToAdminReservations = (callback: (reservations: FirebaseAdminReservation[]) => void) => {
  const reservationRef = ref(db, 'adminReservations');
  
  const unsubscribe = onValue(reservationRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const reservations = Object.values(data) as FirebaseAdminReservation[];
      callback(reservations);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};

// User Reservation Functions
export const saveUserReservation = async (userId: string, reservation: Omit<FirebaseUserReservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const reservationRef = ref(db, `userReservations/${userId}`);
    const newReservationRef = push(reservationRef);
    const reservationId = newReservationRef.key!;
    
    const reservationData: FirebaseUserReservation = {
      ...reservation,
      id: reservationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await set(newReservationRef, reservationData);
    return reservationId;
  } catch (error) {
    console.error('Error saving user reservation:', error);
    throw error;
  }
};

export const getUserReservations = async (userId: string): Promise<FirebaseUserReservation[]> => {
  try {
    const reservationRef = ref(db, `userReservations/${userId}`);
    const snapshot = await get(reservationRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data) as FirebaseUserReservation[];
    }
    return [];
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    throw error;
  }
};

export const updateUserReservationStatus = async (userId: string, reservationId: string, status: FirebaseUserReservation['status']): Promise<void> => {
  try {
    const reservationRef = ref(db, `userReservations/${userId}/${reservationId}`);
    await update(reservationRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating user reservation status:', error);
    throw error;
  }
};

export const listenToUserReservations = (userId: string, callback: (reservations: FirebaseUserReservation[]) => void) => {
  const reservationRef = ref(db, `userReservations/${userId}`);
  
  const unsubscribe = onValue(reservationRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const reservations = Object.values(data) as FirebaseUserReservation[];
      callback(reservations);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};

export const removeUserReservation = async (userId: string, reservationId: string): Promise<void> => {
  try {
    const reservationRef = ref(db, `userReservations/${userId}/${reservationId}`);
    await remove(reservationRef);
  } catch (error) {
    console.error('Error removing user reservation:', error);
    throw error;
  }
};
