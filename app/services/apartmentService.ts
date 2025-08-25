import { db } from '../firebaseConfig';
import { ref, push, get, update, remove, set } from 'firebase/database';

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
    const apartmentRef = ref(db, COLLECTION_NAME);
    const newApartmentRef = push(apartmentRef);
    await set(newApartmentRef, apartment);
    return { id: newApartmentRef.key!, ...apartment };
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
        apartments.push({ id: key, ...data[key] });
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
    const apartmentRef = ref(db, `${COLLECTION_NAME}/${id}`);
    await update(apartmentRef, apartment);
    return { id, ...apartment };
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