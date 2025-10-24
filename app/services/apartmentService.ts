// ========================================
// APARTMENT SERVICE - PAMAMAHALA NG APARTMENT DATA
// ========================================
// Ang file na ito ay naghahandle ng apartment-related operations
// May CRUD operations para sa apartment management
// Nagpo-process ng images at nag-save sa Firebase Realtime Database

// Import ng Firebase Database functions
import { get, push, ref, remove, set, update } from 'firebase/database';
import { db } from '../firebaseConfig';
import { convertBedImageToBase64, convertImageToBase64, isBase64DataUrl, isFirebaseStorageUrl } from '../utils/imageToBase64';
// Removed bed service imports - now handling beds directly in apartment

// ========================================
// BED INTERFACE DEFINITION
// ========================================
// Interface for individual bed data stored within apartment
export interface Bed {
  id: string; // Unique identifier ng bed within apartment
  bedNumber: number; // Bed number sa apartment (1, 2, 3, 4, etc.)
  image: string; // Image URL o base64 data ng bed
  status: 'available' | 'occupied'; // Bed status
  reservedBy?: string; // User ID na nag-reserve ng bed
  reservedAt?: string; // Timestamp ng reservation
  price?: string; // Individual bed price (optional)
  description?: string; // Bed description (optional)
  amenities?: string[]; // Bed-specific amenities (optional)
  createdAt?: string; // Timestamp when bed was created
  updatedAt?: string; // Timestamp when bed was last updated
}

// ========================================
// APARTMENT INTERFACE DEFINITION
// ========================================
// Interface na nagde-define ng structure ng apartment data
// Ginagamit para sa type safety at consistency
export interface Apartment {
  id: string; // Unique identifier ng apartment
  title: string; // Title o name ng apartment
  price: string; // Monthly rent price
  location: string; // General location (e.g., "Makati City")
  address: string; // Complete address
  image: string; // Image URL o base64 data
  rating: number; // Average rating (1-5 stars)
  reviews: number; // Number of reviews
  amenities: string[]; // Array ng available amenities
  description: string; // Detailed description
  size: string; // Size ng apartment (e.g., "50 sqm")
  bedrooms: string | number; // Number of bedrooms or description
  bathrooms: string; // Number of bathrooms or description
  available: boolean; // Availability status
  bedManagement: boolean; // Whether apartment uses individual bed management
  beds?: Bed[]; // Array of beds within the apartment
  totalBeds?: number; // Total number of beds in apartment
  availableBeds?: number; // Number of available beds
  occupiedBeds?: number; // Number of occupied beds
}

// ========================================
// DATABASE COLLECTION NAME
// ========================================
// Collection name sa Firebase Realtime Database
const COLLECTION_NAME = 'apartments';

// ========================================
// FUNCTION: CREATE APARTMENT
// ========================================
// Ang function na ito ay nagc-create ng bagong apartment sa database
// Nagpo-process ng image at nag-convert to base64 kung kailangan
export const createApartment = async (apartment: Omit<Apartment, 'id'>) => {
  try {
    console.log('Creating new apartment:', apartment);
    
    let apartmentToSave = { ...apartment };
    
    // I-handle ang image conversion to base64 kung local URI ang image
    if (apartment.image && (apartment.image.startsWith('file://') || apartment.image.startsWith('content://') || apartment.image.startsWith('/'))) {
      try {
        console.log('Converting apartment image to base64...');
        const base64Image = await convertImageToBase64(apartment.image);
        apartmentToSave.image = base64Image;
        console.log('Apartment image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting apartment image to base64:', imageError);
        // Gumamit ng default image instead na mag-throw ng error
        apartmentToSave.image = 'https://via.placeholder.com/400x300?text=Image+Error';
        console.log('Using placeholder image due to conversion error');
      }
    } else if (apartment.image && (isBase64DataUrl(apartment.image) || isFirebaseStorageUrl(apartment.image))) {
      // Ang image ay base64 na o Firebase Storage URL na
      console.log('Using existing image format:', apartment.image.substring(0, 50) + '...');
      apartmentToSave.image = apartment.image;
    } else if (apartment.image) {
      // Try to convert any other format as well
      try {
        console.log('Attempting to convert image with unknown format to base64...');
        const base64Image = await convertImageToBase64(apartment.image);
        apartmentToSave.image = base64Image;
        console.log('Image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting image to base64:', imageError);
        // Use a default image instead of throwing an error
        apartmentToSave.image = 'https://via.placeholder.com/400x300?text=Image+Error';
        console.log('Using placeholder image due to conversion error');
      }
    }
    
    const apartmentRef = ref(db, COLLECTION_NAME);
    const newApartmentRef = push(apartmentRef);
    const newId = newApartmentRef.key;
    
    if (!newId) {
      throw new Error('Failed to generate apartment ID');
    }
    
    const apartmentWithId = { ...apartmentToSave, id: newId };
    await set(newApartmentRef, apartmentToSave);
    console.log('Apartment created successfully in Realtime Database with ID:', newId);
    
    return apartmentWithId;
  } catch (error) {
    console.error('Error adding apartment: ', error);
    throw error;
  }
};

// Get all apartments
export const getApartments = async () => {
  try {
    const apartmentRef = ref(db, COLLECTION_NAME);
    const snapshot = await get(apartmentRef);
    const apartments: Apartment[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).forEach((key) => {
        const apartment = { id: key, ...data[key] };
        apartments.push(apartment);
      });
    }
    return apartments;
  } catch (error) {
    console.error('Error fetching apartments: ', error);
    throw error;
  }
};

// Update an apartment
export const updateApartment = async (id: string, apartment: Partial<Apartment>) => {
  try {
    console.log('Starting apartment update for ID:', id);
    console.log('Update data:', apartment);
    
    let apartmentToUpdate = apartment;
    
    // Handle image conversion to base64 if it's a local URI
    if (apartment.image && (apartment.image.startsWith('file://') || apartment.image.startsWith('content://') || apartment.image.startsWith('/'))) {
      try {
        console.log('Converting apartment image to base64 for update...');
        const base64Image = await convertImageToBase64(apartment.image);
        apartmentToUpdate = {
          ...apartment,
          image: base64Image
        };
        console.log('Apartment image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting apartment image to base64:', imageError);
        // Use a default image instead of throwing an error
        apartmentToUpdate = {
          ...apartment,
          image: 'https://via.placeholder.com/400x300?text=Image+Error'
        };
        console.log('Using placeholder image due to conversion error');
      }
    } else if (apartment.image && (isBase64DataUrl(apartment.image) || isFirebaseStorageUrl(apartment.image))) {
      // Image is already base64 or Firebase Storage URL
      console.log('Using existing image format for update:', apartment.image.substring(0, 50) + '...');
      apartmentToUpdate = {
        ...apartment,
        image: apartment.image
      };
    } else if (apartment.image) {
      // Try to convert any other format as well
      try {
        console.log('Attempting to convert image with unknown format to base64 for update...');
        const base64Image = await convertImageToBase64(apartment.image);
        apartmentToUpdate = {
          ...apartment,
          image: base64Image
        };
        console.log('Image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting image to base64:', imageError);
        // Use a default image instead of throwing an error
        apartmentToUpdate = {
          ...apartment,
          image: 'https://via.placeholder.com/400x300?text=Image+Error'
        };
        console.log('Using placeholder image due to conversion error');
      }
    }
    
    console.log('Final data to update:', apartmentToUpdate);
    const apartmentRef = ref(db, `${COLLECTION_NAME}/${id}`);
    console.log('Database reference path:', `${COLLECTION_NAME}/${id}`);
    
    await update(apartmentRef, apartmentToUpdate);
    console.log('Apartment updated successfully in database');
    
    return { id, ...apartmentToUpdate };
  } catch (error) {
    console.error('Error updating apartment: ', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

// Delete an apartment
export const deleteApartment = async (id: string) => {
  try {
    const apartmentRef = ref(db, `${COLLECTION_NAME}/${id}`);
    await remove(apartmentRef);
    return id;
  } catch (error) {
    console.error('Error deleting apartment: ', error);
    throw error;
  }
};

// ========================================
// BED MANAGEMENT FUNCTIONS
// ========================================

// ========================================
// FUNCTION: UPDATE APARTMENT BED STATISTICS
// ========================================
// Ang function na ito ay nag-u-update ng bed statistics ng apartment based on embedded beds
export const updateApartmentBedStats = async (apartmentId: string) => {
  try {
    console.log('Updating bed statistics for apartment:', apartmentId);
    
    // Get apartment data
    const apartmentRef = ref(db, `${COLLECTION_NAME}/${apartmentId}`);
    const snapshot = await get(apartmentRef);
    
    if (!snapshot.exists()) {
      throw new Error('Apartment not found');
    }
    
    const apartment = { id: apartmentId, ...snapshot.val() };
    const beds = apartment.beds || [];
    
    // Calculate bed statistics
    const totalBeds = beds.length;
    const availableBeds = beds.filter((bed: Bed) => bed.status === 'available').length;
    const occupiedBeds = beds.filter((bed: Bed) => bed.status === 'occupied').length;
    
    const bedStats = {
      totalBeds,
      availableBeds,
      occupiedBeds,
      updatedAt: new Date().toISOString()
    };
    
    // Update apartment with bed statistics
    await update(apartmentRef, bedStats);
    
    console.log('Bed statistics updated:', bedStats);
    return bedStats;
  } catch (error) {
    console.error('Error updating apartment bed statistics: ', error);
    throw error;
  }
};

// ========================================
// FUNCTION: ADD BED TO APARTMENT
// ========================================
// Ang function na ito ay nag-a-add ng bed sa apartment
export const addBedToApartment = async (apartmentId: string, bedData: Omit<Bed, 'id'>) => {
  try {
    console.log('Adding bed to apartment:', apartmentId, bedData);
    
    // Get current apartment data
    const apartmentRef = ref(db, `${COLLECTION_NAME}/${apartmentId}`);
    const snapshot = await get(apartmentRef);
    
    if (!snapshot.exists()) {
      throw new Error('Apartment not found');
    }
    
    const apartment = { id: apartmentId, ...snapshot.val() };
    const beds = apartment.beds || [];
    
    // ========================================
    // CONVERT BED IMAGE TO BASE64
    // ========================================
    let processedBedData = { ...bedData };
    
    if (bedData.image && bedData.image.trim() !== '') {
      try {
        console.log('Converting bed image to base64 for new bed...');
        const base64Image = await convertBedImageToBase64(bedData.image);
        processedBedData = {
          ...bedData,
          image: base64Image
        };
        console.log('Bed image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting bed image to base64:', imageError);
        // Use a placeholder image if conversion fails
        processedBedData = {
          ...bedData,
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
        };
        console.log('Using placeholder image due to conversion error');
      }
    }
    
    // Create new bed with unique ID and processed image
    const newBed: Bed = {
      ...processedBedData,
      id: `bed_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add bed to apartment
    const updatedBeds = [...beds, newBed];
    await update(apartmentRef, { beds: updatedBeds });
    
    // Update bed statistics
    await updateApartmentBedStats(apartmentId);
    
    console.log('Bed added successfully with base64 image:', newBed);
    return newBed;
  } catch (error) {
    console.error('Error adding bed to apartment: ', error);
    throw error;
  }
};

// ========================================
// FUNCTION: UPDATE BED IN APARTMENT
// ========================================
// Ang function na ito ay nag-u-update ng bed sa apartment
export const updateBedInApartment = async (apartmentId: string, bedId: string, bedData: Partial<Bed>) => {
  try {
    console.log('Updating bed in apartment:', apartmentId, bedId, bedData);
    
    // Get current apartment data
    const apartmentRef = ref(db, `${COLLECTION_NAME}/${apartmentId}`);
    const snapshot = await get(apartmentRef);
    
    if (!snapshot.exists()) {
      throw new Error('Apartment not found');
    }
    
    const apartment = { id: apartmentId, ...snapshot.val() };
    const beds = apartment.beds || [];
    
    // ========================================
    // CONVERT BED IMAGE TO BASE64 IF PROVIDED
    // ========================================
    let processedBedData = { ...bedData };
    
    if (bedData.image && bedData.image.trim() !== '') {
      try {
        console.log('Converting bed image to base64 for bed update...');
        const base64Image = await convertBedImageToBase64(bedData.image);
        processedBedData = {
          ...bedData,
          image: base64Image
        };
        console.log('Bed image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting bed image to base64:', imageError);
        // Keep the original image if conversion fails
        console.log('Keeping original image due to conversion error');
      }
    }
    
    // Find and update the bed with processed data
    const updatedBeds = beds.map((bed: Bed) => 
      bed.id === bedId ? { 
        ...bed, 
        ...processedBedData,
        updatedAt: new Date().toISOString()
      } : bed
    );
    
    await update(apartmentRef, { beds: updatedBeds });
    
    // Update bed statistics
    await updateApartmentBedStats(apartmentId);
    
    console.log('Bed updated successfully with base64 image');
    return updatedBeds.find((bed: Bed) => bed.id === bedId);
  } catch (error) {
    console.error('Error updating bed in apartment: ', error);
    throw error;
  }
};

// ========================================
// FUNCTION: DELETE BED FROM APARTMENT
// ========================================
// Ang function na ito ay nagde-delete ng bed sa apartment
export const deleteBedFromApartment = async (apartmentId: string, bedId: string) => {
  try {
    console.log('Deleting bed from apartment:', apartmentId, bedId);
    
    // Get current apartment data
    const apartmentRef = ref(db, `${COLLECTION_NAME}/${apartmentId}`);
    const snapshot = await get(apartmentRef);
    
    if (!snapshot.exists()) {
      throw new Error('Apartment not found');
    }
    
    const apartment = { id: apartmentId, ...snapshot.val() };
    const beds = apartment.beds || [];
    
    // Remove the bed
    const updatedBeds = beds.filter((bed: Bed) => bed.id !== bedId);
    await update(apartmentRef, { beds: updatedBeds });
    
    // Update bed statistics
    await updateApartmentBedStats(apartmentId);
    
    console.log('Bed deleted successfully');
    return bedId;
  } catch (error) {
    console.error('Error deleting bed from apartment: ', error);
    throw error;
  }
};

// ========================================
// FUNCTION: RESERVE BED IN APARTMENT
// ========================================
// Ang function na ito ay nagre-reserve ng bed sa apartment
export const reserveBedInApartment = async (apartmentId: string, bedId: string, userId: string) => {
  try {
    console.log('Reserving bed in apartment:', apartmentId, bedId, userId);
    
    // Get current apartment data
    const apartmentRef = ref(db, `${COLLECTION_NAME}/${apartmentId}`);
    const snapshot = await get(apartmentRef);
    
    if (!snapshot.exists()) {
      throw new Error('Apartment not found');
    }
    
    const apartment = { id: apartmentId, ...snapshot.val() };
    const beds = apartment.beds || [];
    
    // Find the bed
    const bed = beds.find((b: Bed) => b.id === bedId);
    if (!bed) {
      throw new Error('Bed not found');
    }
    
    if (bed.status === 'occupied') {
      throw new Error('Bed is already occupied');
    }
    
    // Update bed status
    const updatedBeds = beds.map((b: Bed) => 
      b.id === bedId ? { 
        ...b, 
        status: 'occupied' as const,
        reservedBy: userId,
        reservedAt: new Date().toISOString()
      } : b
    );
    
    await update(apartmentRef, { beds: updatedBeds });
    
    // Update bed statistics
    await updateApartmentBedStats(apartmentId);
    
    console.log('Bed reserved successfully');
    return updatedBeds.find((b: Bed) => b.id === bedId);
  } catch (error) {
    console.error('Error reserving bed in apartment: ', error);
    throw error;
  }
};

// ========================================
// FUNCTION: CHECK USER AUTHENTICATION
// ========================================
// Helper function to check if user is authenticated
const checkUserAuthentication = () => {
  // This function can be expanded to check Firebase Auth state
  // For now, we'll rely on Firebase rules to handle authentication
  return true;
};

// ========================================
// FUNCTION: CANCEL BED RESERVATION
// ========================================
// Ang function na ito ay nagca-cancel ng bed reservation
export const cancelBedReservation = async (apartmentId: string, bedId: string) => {
  try {
    console.log('🛏️ Cancelling bed reservation:', { apartmentId, bedId });
    
    // Check user authentication
    if (!checkUserAuthentication()) {
      throw new Error('User not authenticated. Please log in again.');
    }
    
    // Validate input parameters
    if (!apartmentId || !bedId) {
      throw new Error('Apartment ID and Bed ID are required');
    }
    
    // Get current apartment data
    const apartmentRef = ref(db, `${COLLECTION_NAME}/${apartmentId}`);
    const snapshot = await get(apartmentRef);
    
    if (!snapshot.exists()) {
      throw new Error('Apartment not found');
    }
    
    const apartment = { id: apartmentId, ...snapshot.val() };
    const beds = apartment.beds || [];
    
    // Find the specific bed
    const bed = beds.find((b: Bed) => b.id === bedId);
    if (!bed) {
      throw new Error('Bed not found in apartment');
    }
    
    // Check if bed is actually occupied
    if (bed.status !== 'occupied') {
      console.log('⚠️ Bed is not occupied, no need to cancel');
      return bed;
    }
    
    // Update bed status to available
    const updatedBeds = beds.map((b: Bed) => 
      b.id === bedId ? { 
        ...b, 
        status: 'available' as const,
        reservedBy: null,
        reservedAt: null,
        updatedAt: new Date().toISOString()
      } : b
    );
    
    // Update the apartment with new bed data
    await update(apartmentRef, { 
      beds: updatedBeds,
      updatedAt: new Date().toISOString()
    });
    
    // Update bed statistics
    await updateApartmentBedStats(apartmentId);
    
    console.log('✅ Bed reservation cancelled successfully');
    return updatedBeds.find((b: Bed) => b.id === bedId);
  } catch (error) {
    console.error('❌ Error cancelling bed reservation:', error);
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('Permission denied')) {
      throw new Error('Permission denied: Unable to cancel bed reservation. Please check your authentication status.');
    } else if (errorMessage.includes('Apartment not found')) {
      throw new Error('Apartment not found: The specified apartment does not exist.');
    } else if (errorMessage.includes('Bed not found')) {
      throw new Error('Bed not found: The specified bed does not exist in this apartment.');
    } else {
      throw new Error(`Failed to cancel bed reservation: ${errorMessage}`);
    }
  }
};

// ========================================
// FUNCTION: GET ALL APARTMENTS WITH BED STATISTICS
// ========================================
// Ang function na ito ay nagfe-fetch ng lahat ng apartments with bed statistics
export const getApartmentsWithBedStats = async () => {
  try {
    const apartments = await getApartments();
    
    // Calculate bed statistics for apartments that use bed management
    const apartmentsWithStats = apartments.map(apartment => {
      if (apartment.bedManagement && apartment.beds) {
        const beds = apartment.beds;
        const totalBeds = beds.length;
        const availableBeds = beds.filter(bed => bed.status === 'available').length;
        const occupiedBeds = beds.filter(bed => bed.status === 'occupied').length;
        
        return {
          ...apartment,
          totalBeds,
          availableBeds,
          occupiedBeds
        };
      }
      return apartment;
    });
    
    return apartmentsWithStats;
  } catch (error) {
    console.error('Error fetching apartments with bed stats: ', error);
    throw error;
  }
};