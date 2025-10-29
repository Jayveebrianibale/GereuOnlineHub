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
  paymentStatus: 'unpaid' | 'paid';
  reservationDate: string;
  createdAt: string;
  updatedAt: string;
  shippingInfo?: {
    deliveryType: 'pickup' | 'dropoff';
    address?: string;
  };
  // Additional properties for auto services
  homeService?: boolean;
  shopService?: boolean;
  problemDescription?: string;
  address?: string;
  contactNumber?: string;
  preferredTime?: string;
  // Additional properties for bed reservations
  bedId?: string;
  bedNumber?: number;
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
  paymentStatus: 'unpaid' | 'paid';
  reservationDate: string;
  createdAt: string;
  updatedAt: string;
  shippingInfo?: {
    deliveryType: 'pickup' | 'dropoff';
    address?: string;
  };
  // Additional properties for auto services
  homeService?: boolean;
  shopService?: boolean;
  problemDescription?: string;
  address?: string;
  contactNumber?: string;
  preferredTime?: string;
  // Additional properties for bed reservations
  bedId?: string;
  bedNumber?: number;
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
      status: reservation.status || 'pending', // Ensure status is always set
      paymentStatus: reservation.paymentStatus || 'unpaid',
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
    // Get reservation details before updating to check for bed reservation
    const reservationRef = ref(db, `adminReservations/${reservationId}`);
    const snapshot = await get(reservationRef);
    const reservation = snapshot.exists() ? { id: reservationId, ...snapshot.val() } : null;
    
    // Update reservation status
    await update(reservationRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
    
    // Handle bed reservation cancellation if this is a bed reservation being declined
    if (status === 'declined' && reservation?.serviceType === 'apartment' && reservation?.bedId) {
      try {
        console.log('🛏️ Declining bed reservation, cancelling bed:', { apartmentId: reservation.serviceId, bedId: reservation.bedId });
        const { cancelBedReservation } = await import('./apartmentService');
        await cancelBedReservation(reservation.serviceId, reservation.bedId);
        console.log('✅ Bed reservation cancelled and bed made available after decline');
      } catch (bedError) {
        console.error('❌ Error cancelling bed reservation after decline:', bedError);
        // Don't throw here as the main status update was successful
      }
    }
  } catch (error) {
    console.error('Error updating admin reservation status:', error);
    throw error;
  }
};

export const updateAdminReservationPaymentStatus = async (reservationId: string, paymentStatus: FirebaseAdminReservation['paymentStatus']): Promise<void> => {
  try {
    const reservationRef = ref(db, `adminReservations/${reservationId}`);
    await update(reservationRef, {
      paymentStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating admin reservation payment status:', error);
    throw error;
  }
};

export const getAdminReservations = async (): Promise<FirebaseAdminReservation[]> => {
  try {
    console.log('🔍 Fetching admin reservations...');
    const reservationRef = ref(db, 'adminReservations');
    const snapshot = await get(reservationRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const reservations = Object.values(data) as FirebaseAdminReservation[];
      console.log('✅ Successfully fetched admin reservations:', reservations.length);
      return reservations;
    }
    console.log('ℹ️ No admin reservations found');
    return [];
  } catch (error) {
    console.error('❌ Error fetching admin reservations:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Permission denied')) {
        console.error('🔒 Permission denied - check Firebase Realtime Database rules');
        throw new Error('Permission denied. Please check Firebase Database rules.');
      } else if (error.message.includes('network')) {
        console.error('🌐 Network error - check internet connection');
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.message.includes('unauthorized')) {
        console.error('🔐 Unauthorized - user not authenticated');
        throw new Error('Unauthorized. Please sign in again.');
      }
    }
    
    throw error;
  }
};

export const listenToAdminReservations = (callback: (reservations: FirebaseAdminReservation[]) => void) => {
  console.log('👂 Setting up admin reservations listener...');
  const reservationRef = ref(db, 'adminReservations');
  
  const unsubscribe = onValue(reservationRef, (snapshot) => {
    try {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const reservations = Object.values(data) as FirebaseAdminReservation[];
        console.log('📡 Real-time update: received', reservations.length, 'admin reservations');
        callback(reservations);
      } else {
        console.log('📡 Real-time update: no admin reservations found');
        callback([]);
      }
    } catch (error) {
      console.warn('⚠️ Admin reservations listener handled data parsing issue:', error);
      callback([]);
    }
  }, (error) => {
    console.warn('⚠️ Admin reservations listener warning:', error);
    callback([]);
  });
  
  return unsubscribe;
};

// User Reservation Functions
export const saveUserReservation = async (userId: string, reservation: Omit<FirebaseUserReservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    console.log('💾 Saving user reservation:', { userId, reservation });
    const reservationRef = ref(db, `userReservations/${userId}`);
    const newReservationRef = push(reservationRef);
    const reservationId = newReservationRef.key!;
    
    const reservationData: FirebaseUserReservation = {
      ...reservation,
      id: reservationId,
      paymentStatus: reservation.paymentStatus || 'unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log('💾 Final reservation data to save:', reservationData);
    await set(newReservationRef, reservationData);
    console.log('✅ User reservation saved successfully to Firebase with ID:', reservationId);
    return reservationId;
  } catch (error) {
    console.error('❌ Error saving user reservation:', error);
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
    console.log('🗑️ Removing user reservation:', { userId, reservationId });
    const reservationRef = ref(db, `userReservations/${userId}/${reservationId}`);
    await remove(reservationRef);
    
    // Wait a moment for Firebase to propagate the change
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify the deletion by checking if the reservation still exists
    const checkRef = ref(db, `userReservations/${userId}/${reservationId}`);
    const checkSnapshot = await get(checkRef);
    if (checkSnapshot.exists()) {
      console.warn('⚠️ Reservation still exists after deletion attempt');
    } else {
      console.log('✅ Successfully removed user reservation from Firebase');
    }
  } catch (error) {
    console.error('❌ Error removing user reservation:', error);
    throw error;
  }
};

export const removeAdminReservation = async (reservationId: string): Promise<void> => {
  try {
    const reservationRef = ref(db, `adminReservations/${reservationId}`);
    await remove(reservationRef);
  } catch (error) {
    console.error('Error removing admin reservation:', error);
    throw error;
  }
};

// Comprehensive function to remove both admin and user reservations
export const removeReservationCompletely = async (
  adminReservationId: string,
  userId: string,
  serviceType: 'apartment' | 'laundry' | 'auto',
  serviceId: string
): Promise<void> => {
  try {
    console.log('🧹 Starting complete reservation removal:', { adminReservationId, userId, serviceType, serviceId });
    
    // Step 1: Get admin reservation details before removal to check for bed reservation
    const adminReservationRef = ref(db, `adminReservations/${adminReservationId}`);
    const adminSnapshot = await get(adminReservationRef);
    const adminReservation = adminSnapshot.exists() ? { id: adminReservationId, ...adminSnapshot.val() } : null;
    
    // Step 2: Remove admin reservation
    await removeAdminReservation(adminReservationId);
    console.log('✅ Admin reservation removed');
    
    // Step 3: Find and remove user reservation
    const userReservations = await getUserReservations(userId);
    
    // If this is a bed reservation, find the specific bed reservation
    // Otherwise, find the first reservation for that service
    const userReservation = adminReservation?.bedId 
      ? userReservations.find(r => r.serviceId === serviceId && r.serviceType === serviceType && (r as any).bedId === adminReservation.bedId)
      : userReservations.find(r => r.serviceId === serviceId && r.serviceType === serviceType);
    
    if (userReservation) {
      await removeUserReservation(userId, userReservation.id);
      console.log('✅ User reservation removed:', userReservation.id);
    } else {
      console.log('⚠️ No matching user reservation found for removal');
    }
    
    // Step 4: Handle bed reservation cancellation if this is a bed reservation
    if (serviceType === 'apartment' && adminReservation?.bedId) {
      try {
        console.log('🛏️ Cancelling bed reservation:', { apartmentId: serviceId, bedId: adminReservation.bedId });
        const { cancelBedReservation } = await import('./apartmentService');
        await cancelBedReservation(serviceId, adminReservation.bedId);
        console.log('✅ Bed reservation cancelled and bed made available');
      } catch (bedError) {
        console.error('❌ Error cancelling bed reservation:', bedError);
        
        // Log specific error details for debugging
        const errorMessage =
          bedError instanceof Error ? bedError.message : String(bedError || 'Unknown error occurred');
        if (errorMessage.includes('Permission denied')) {
          console.warn('⚠️ Permission denied when cancelling bed reservation. This may indicate an authentication issue.');
        } else if (errorMessage.includes('Apartment not found')) {
          console.warn('⚠️ Apartment not found when cancelling bed reservation. The apartment may have been deleted.');
        } else if (errorMessage.includes('Bed not found')) {
          console.warn('⚠️ Bed not found when cancelling bed reservation. The bed may have been removed.');
        } else {
          console.warn('⚠️ Unexpected error when cancelling bed reservation:', errorMessage);
        }
        
        // Don't throw here as the main reservation removal was successful
        // The bed will remain in occupied state, but the reservation is removed
      }
    }
    
    console.log('🎉 Complete reservation removal successful');
  } catch (error) {
    console.error('❌ Error in complete reservation removal:', error);
    throw error;
  }
};

// Apartment Availability Functions
export const isApartmentReserved = async (apartmentId: string): Promise<boolean> => {
  try {
    console.log('🔍 Checking if apartment is reserved:', apartmentId);
    
    // Check admin reservations for this apartment
    const adminReservations = await getAdminReservations();
    const activeAdminReservation = adminReservations.find(
      reservation => 
        reservation.serviceId === apartmentId && 
        reservation.serviceType === 'apartment' &&
        (reservation.status === 'pending' || reservation.status === 'confirmed')
    );
    
    if (activeAdminReservation) {
      console.log('✅ Apartment is reserved (admin reservation found)');
      return true;
    }
    
    console.log('ℹ️ Apartment is not reserved');
    return false;
  } catch (error) {
    console.error('❌ Error checking apartment reservation status:', error);
    // In case of error, assume it's not reserved to avoid blocking legitimate reservations
    return false;
  }
};

export const getApartmentReservationInfo = async (apartmentId: string): Promise<{
  isReserved: boolean;
  reservedBy?: string;
  reservationDate?: string;
  status?: string;
} | null> => {
  try {
    console.log('🔍 Getting apartment reservation info:', apartmentId);
    
    // Check admin reservations for this apartment
    const adminReservations = await getAdminReservations();
    const activeAdminReservation = adminReservations.find(
      reservation => 
        reservation.serviceId === apartmentId && 
        reservation.serviceType === 'apartment' &&
        (reservation.status === 'pending' || reservation.status === 'confirmed')
    );
    
    if (activeAdminReservation) {
      console.log('✅ Apartment reservation info found');
      return {
        isReserved: true,
        reservedBy: activeAdminReservation.userName,
        reservationDate: activeAdminReservation.reservationDate,
        status: activeAdminReservation.status
      };
    }
    
    console.log('ℹ️ No active reservation found for apartment');
    return {
      isReserved: false
    };
  } catch (error) {
    console.error('❌ Error getting apartment reservation info:', error);
    return null;
  }
};

// Function to get all reserved apartment IDs
export const getReservedApartmentIds = async (): Promise<string[]> => {
  try {
    console.log('🔍 Getting all reserved apartment IDs...');
    
    const adminReservations = await getAdminReservations();
    const reservedApartmentIds = adminReservations
      .filter(reservation => 
        reservation.serviceType === 'apartment' &&
        (reservation.status === 'pending' || reservation.status === 'confirmed')
      )
      .map(reservation => reservation.serviceId);
    
    console.log('✅ Found reserved apartment IDs:', reservedApartmentIds);
    return reservedApartmentIds;
  } catch (error) {
    console.error('❌ Error getting reserved apartment IDs:', error);
    return [];
  }
};

// Function to get the user who reserved an apartment
export const getApartmentReservedBy = async (apartmentId: string): Promise<{ userName: string; userEmail: string } | null> => {
  try {
    const adminReservations = await getAdminReservations();
    
    const activeReservation = adminReservations.find(reservation => 
      reservation.serviceType === 'apartment' && 
      reservation.serviceId === apartmentId && 
      (reservation.status === 'pending' || reservation.status === 'confirmed')
    );
    
    if (activeReservation) {
      return {
        userName: activeReservation.userName,
        userEmail: activeReservation.userEmail
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting apartment reserved by info:', error);
    return null;
  }
};