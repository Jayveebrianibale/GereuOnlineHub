// ========================================
// APARTMENT SERVICE - PAMAMAHALA NG APARTMENT DATA
// ========================================
// Ang file na ito ay naghahandle ng apartment-related operations
// May CRUD operations para sa apartment management
// Nagpo-process ng images at nag-save sa Firebase Realtime Database

// Import ng Firebase Database functions
import { get, push, ref, remove, set, update } from 'firebase/database';
import { db } from '../firebaseConfig';
import { convertImageToBase64, isBase64DataUrl, isFirebaseStorageUrl } from '../utils/imageToBase64';

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
  bedrooms: number; // Number of bedrooms
  bathrooms: number; // Number of bathrooms
  available: boolean; // Availability status
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