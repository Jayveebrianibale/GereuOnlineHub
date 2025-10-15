// ========================================
// BED SERVICE - PAMAMAHALA NG BED DATA
// ========================================
// Ang file na ito ay naghahandle ng bed-related operations
// May CRUD operations para sa individual bed management
// Nagpo-process ng bed images at nag-save sa Firebase Realtime Database

// Import ng Firebase Database functions
import { get, push, ref, remove, set, update } from 'firebase/database';
import { db } from '../firebaseConfig';
import { convertImageToBase64, isBase64DataUrl, isFirebaseStorageUrl } from '../utils/imageToBase64';

// ========================================
// BED INTERFACE DEFINITION
// ========================================
// Interface na nagde-define ng structure ng bed data
// Ginagamit para sa type safety at consistency
export interface Bed {
  id: string; // Unique identifier ng bed
  apartmentId: string; // ID ng apartment na may-ari ng bed
  bedNumber: number; // Bed number sa apartment (1, 2, 3, 4, etc.)
  image: string; // Image URL o base64 data ng bed
  status: 'available' | 'occupied'; // Bed status
  reservedBy?: string; // User ID na nag-reserve ng bed
  reservedAt?: string; // Timestamp ng reservation
  price?: string; // Individual bed price (optional)
  description?: string; // Bed description (optional)
  amenities?: string[]; // Bed-specific amenities (optional)
  createdAt: string; // Creation timestamp
  updatedAt: string; // Last update timestamp
}

// ========================================
// DATABASE COLLECTION NAME
// ========================================
// Collection name sa Firebase Realtime Database
const COLLECTION_NAME = 'beds';

// ========================================
// FUNCTION: CREATE BED
// ========================================
// Ang function na ito ay nagc-create ng bagong bed sa database
// Nagpo-process ng image at nag-convert to base64 kung kailangan
export const createBed = async (bed: Omit<Bed, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    console.log('Creating new bed:', bed);
    
    let bedToSave = { ...bed };
    
    // I-handle ang image conversion to base64 kung local URI ang image
    if (bed.image && (bed.image.startsWith('file://') || bed.image.startsWith('content://') || bed.image.startsWith('/'))) {
      try {
        console.log('Converting bed image to base64...');
        const base64Image = await convertImageToBase64(bed.image);
        bedToSave.image = base64Image;
        console.log('Bed image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting bed image to base64:', imageError);
        // Gumamit ng default image instead na mag-throw ng error
        bedToSave.image = 'https://via.placeholder.com/400x300?text=Bed+Image';
        console.log('Using placeholder image due to conversion error');
      }
    } else if (bed.image && (isBase64DataUrl(bed.image) || isFirebaseStorageUrl(bed.image))) {
      // Ang image ay base64 na o Firebase Storage URL na
      console.log('Using existing image format:', bed.image.substring(0, 50) + '...');
      bedToSave.image = bed.image;
    } else if (bed.image) {
      // Try to convert any other format as well
      try {
        console.log('Attempting to convert image with unknown format to base64...');
        const base64Image = await convertImageToBase64(bed.image);
        bedToSave.image = base64Image;
        console.log('Image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting image to base64:', imageError);
        // Use a default image instead of throwing an error
        bedToSave.image = 'https://via.placeholder.com/400x300?text=Bed+Image';
        console.log('Using placeholder image due to conversion error');
      }
    }
    
    const bedRef = ref(db, COLLECTION_NAME);
    const newBedRef = push(bedRef);
    const newId = newBedRef.key;
    
    if (!newId) {
      throw new Error('Failed to generate bed ID');
    }
    
    const bedWithId = { 
      ...bedToSave, 
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await set(newBedRef, bedWithId);
    console.log('Bed created successfully in Realtime Database with ID:', newId);
    
    return bedWithId;
  } catch (error) {
    console.error('Error adding bed: ', error);
    throw error;
  }
};

// ========================================
// FUNCTION: GET BEDS BY APARTMENT
// ========================================
// Ang function na ito ay nagfe-fetch ng lahat ng beds ng specific apartment
export const getBedsByApartment = async (apartmentId: string) => {
  try {
    const bedsRef = ref(db, COLLECTION_NAME);
    const snapshot = await get(bedsRef);
    const beds: Bed[] = [];
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).forEach((key) => {
        const bed = { id: key, ...data[key] };
        if (bed.apartmentId === apartmentId) {
          beds.push(bed);
        }
      });
    }
    
    // Sort by bed number
    beds.sort((a, b) => a.bedNumber - b.bedNumber);
    return beds;
  } catch (error) {
    console.error('Error fetching beds by apartment: ', error);
    throw error;
  }
};

// ========================================
// FUNCTION: GET ALL BEDS
// ========================================
// Ang function na ito ay nagfe-fetch ng lahat ng beds
export const getAllBeds = async () => {
  try {
    const bedsRef = ref(db, COLLECTION_NAME);
    const snapshot = await get(bedsRef);
    const beds: Bed[] = [];
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).forEach((key) => {
        const bed = { id: key, ...data[key] };
        beds.push(bed);
      });
    }
    
    // Sort by apartment ID then bed number
    beds.sort((a, b) => {
      if (a.apartmentId !== b.apartmentId) {
        return a.apartmentId.localeCompare(b.apartmentId);
      }
      return a.bedNumber - b.bedNumber;
    });
    
    return beds;
  } catch (error) {
    console.error('Error fetching all beds: ', error);
    throw error;
  }
};

// ========================================
// FUNCTION: UPDATE BED
// ========================================
// Ang function na ito ay nag-u-update ng existing bed
export const updateBed = async (id: string, bed: Partial<Bed>) => {
  try {
    console.log('Starting bed update for ID:', id);
    console.log('Update data:', bed);
    
    let bedToUpdate = bed;
    
    // Handle image conversion to base64 if it's a local URI
    if (bed.image && (bed.image.startsWith('file://') || bed.image.startsWith('content://') || bed.image.startsWith('/'))) {
      try {
        console.log('Converting bed image to base64 for update...');
        const base64Image = await convertImageToBase64(bed.image);
        bedToUpdate = {
          ...bed,
          image: base64Image
        };
        console.log('Bed image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting bed image to base64:', imageError);
        // Use a default image instead of throwing an error
        bedToUpdate = {
          ...bed,
          image: 'https://via.placeholder.com/400x300?text=Bed+Image'
        };
        console.log('Using placeholder image due to conversion error');
      }
    } else if (bed.image && (isBase64DataUrl(bed.image) || isFirebaseStorageUrl(bed.image))) {
      // Image is already base64 or Firebase Storage URL
      console.log('Using existing image format for update:', bed.image.substring(0, 50) + '...');
      bedToUpdate = {
        ...bed,
        image: bed.image
      };
    } else if (bed.image) {
      // Try to convert any other format as well
      try {
        console.log('Attempting to convert image with unknown format to base64 for update...');
        const base64Image = await convertImageToBase64(bed.image);
        bedToUpdate = {
          ...bed,
          image: base64Image
        };
        console.log('Image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting image to base64:', imageError);
        // Use a default image instead of throwing an error
        bedToUpdate = {
          ...bed,
          image: 'https://via.placeholder.com/400x300?text=Bed+Image'
        };
        console.log('Using placeholder image due to conversion error');
      }
    }
    
    console.log('Final data to update:', bedToUpdate);
    const bedRef = ref(db, `${COLLECTION_NAME}/${id}`);
    console.log('Database reference path:', `${COLLECTION_NAME}/${id}`);
    
    // Add updatedAt timestamp
    const updateData = {
      ...bedToUpdate,
      updatedAt: new Date().toISOString()
    };
    
    await update(bedRef, updateData);
    console.log('Bed updated successfully in database');
    
    return { id, ...updateData };
  } catch (error) {
    console.error('Error updating bed: ', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

// ========================================
// FUNCTION: DELETE BED
// ========================================
// Ang function na ito ay nagde-delete ng bed
export const deleteBed = async (id: string) => {
  try {
    const bedRef = ref(db, `${COLLECTION_NAME}/${id}`);
    await remove(bedRef);
    return id;
  } catch (error) {
    console.error('Error deleting bed: ', error);
    throw error;
  }
};

// ========================================
// FUNCTION: RESERVE BED
// ========================================
// Ang function na ito ay nagre-reserve ng bed para sa user
export const reserveBed = async (bedId: string, userId: string) => {
  try {
    const bedRef = ref(db, `${COLLECTION_NAME}/${bedId}`);
    const snapshot = await get(bedRef);
    
    if (!snapshot.exists()) {
      throw new Error('Bed not found');
    }
    
    const bed = snapshot.val();
    
    if (bed.status === 'occupied') {
      throw new Error('Bed is already occupied');
    }
    
    const updateData = {
      status: 'occupied',
      reservedBy: userId,
      reservedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await update(bedRef, updateData);
    console.log('Bed reserved successfully');
    
    return { id: bedId, ...bed, ...updateData };
  } catch (error) {
    console.error('Error reserving bed: ', error);
    throw error;
  }
};

// ========================================
// FUNCTION: CANCEL BED RESERVATION
// ========================================
// Ang function na ito ay nagca-cancel ng bed reservation
export const cancelBedReservation = async (bedId: string) => {
  try {
    const bedRef = ref(db, `${COLLECTION_NAME}/${bedId}`);
    const snapshot = await get(bedRef);
    
    if (!snapshot.exists()) {
      throw new Error('Bed not found');
    }
    
    const updateData = {
      status: 'available',
      reservedBy: null,
      reservedAt: null,
      updatedAt: new Date().toISOString()
    };
    
    await update(bedRef, updateData);
    console.log('Bed reservation cancelled successfully');
    
    return { id: bedId, ...snapshot.val(), ...updateData };
  } catch (error) {
    console.error('Error cancelling bed reservation: ', error);
    throw error;
  }
};

// ========================================
// FUNCTION: GET BED BY ID
// ========================================
// Ang function na ito ay nagfe-fetch ng specific bed by ID
export const getBedById = async (id: string) => {
  try {
    const bedRef = ref(db, `${COLLECTION_NAME}/${id}`);
    const snapshot = await get(bedRef);
    
    if (!snapshot.exists()) {
      throw new Error('Bed not found');
    }
    
    return { id, ...snapshot.val() };
  } catch (error) {
    console.error('Error fetching bed by ID: ', error);
    throw error;
  }
};

// ========================================
// FUNCTION: GET AVAILABLE BEDS BY APARTMENT
// ========================================
// Ang function na ito ay nagfe-fetch ng available beds ng specific apartment
export const getAvailableBedsByApartment = async (apartmentId: string) => {
  try {
    const beds = await getBedsByApartment(apartmentId);
    return beds.filter(bed => bed.status === 'available');
  } catch (error) {
    console.error('Error fetching available beds by apartment: ', error);
    throw error;
  }
};

// ========================================
// FUNCTION: GET OCCUPIED BEDS BY APARTMENT
// ========================================
// Ang function na ito ay nagfe-fetch ng occupied beds ng specific apartment
export const getOccupiedBedsByApartment = async (apartmentId: string) => {
  try {
    const beds = await getBedsByApartment(apartmentId);
    return beds.filter(bed => bed.status === 'occupied');
  } catch (error) {
    console.error('Error fetching occupied beds by apartment: ', error);
    throw error;
  }
};
