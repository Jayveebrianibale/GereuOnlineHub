import { get, push, ref, remove, set, update } from 'firebase/database';
import { db } from '../firebaseConfig';
import { getImagePath } from '../utils/imageUtils';
import { uploadImageToFirebaseWithRetry } from './imageUploadService';

// Define the Apartment type
export interface Apartment {
  id: string;
  title: string;
  price: string;
  location: string;
  address: string;
  image: string;
  rating: number;
  reviews: number;
  amenities: string[];
  description: string;
  size: string;
  bedrooms: number;
  bathrooms: number;
  available: boolean;
}

// Collection name in RTDB
const COLLECTION_NAME = 'apartments';

// Create a new apartment
export const createApartment = async (apartment: Omit<Apartment, 'id'>) => {
  try {
    let apartmentToSave = { ...apartment };
    
    // Handle image upload to Firebase Storage if it's a local URI
    if (apartment.image && (apartment.image.startsWith('file://') || apartment.image.startsWith('content://'))) {
      try {
        console.log('Attempting to upload apartment image to Firebase Storage...');
        const imageResult = await uploadImageToFirebaseWithRetry(apartment.image, 'apartments');
        apartmentToSave.image = imageResult.url;
        console.log('Apartment image uploaded successfully:', imageResult.url);
      } catch (imageError) {
        console.error('Error uploading apartment image:', imageError);
        console.log('Falling back to local image path');
        // Fallback to original image handling
        apartmentToSave.image = typeof apartment.image === 'string' ? apartment.image : getImagePath(apartment.image);
      }
    } else {
      // Convert image source to path for storage (existing logic)
      apartmentToSave.image = typeof apartment.image === 'string' ? apartment.image : getImagePath(apartment.image);
    }
    
    const apartmentRef = ref(db, COLLECTION_NAME);
    const newApartmentRef = push(apartmentRef);
    await set(newApartmentRef, apartmentToSave);
    return { id: newApartmentRef.key!, ...apartmentToSave };
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
    let apartmentToUpdate = apartment;
    
    // Handle image upload to Firebase Storage if it's a local URI
    if (apartment.image && (apartment.image.startsWith('file://') || apartment.image.startsWith('content://'))) {
      try {
        const imageResult = await uploadImageToFirebaseWithRetry(apartment.image, 'apartments');
        apartmentToUpdate = {
          ...apartment,
          image: imageResult.url
        };
      } catch (imageError) {
        console.error('Error uploading apartment image:', imageError);
        // Fallback to original image handling
        apartmentToUpdate = {
          ...apartment,
          image: typeof apartment.image === 'string' ? apartment.image : getImagePath(apartment.image)
        };
      }
    } else if (apartment.image !== undefined) {
      // Convert image source to path for storage if image is provided (existing logic)
      apartmentToUpdate = {
        ...apartment,
        image: typeof apartment.image === 'string' ? apartment.image : getImagePath(apartment.image)
      };
    }
    
    const apartmentRef = ref(db, `${COLLECTION_NAME}/${id}`);
    await update(apartmentRef, apartmentToUpdate);
    return { id, ...apartmentToUpdate };
  } catch (error) {
    console.error('Error updating apartment: ', error);
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