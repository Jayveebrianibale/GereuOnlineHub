import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

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

// Collection name in Firestore
const COLLECTION_NAME = 'apartments';

// Create a new apartment
export const createApartment = async (apartment: Omit<Apartment, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), apartment);
    return { id: docRef.id, ...apartment };
  } catch (error) {
    console.error('Error adding apartment: ', error);
    throw error;
  }
};

// Get all apartments
export const getApartments = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const apartments: Apartment[] = [];
    querySnapshot.forEach((doc) => {
      apartments.push({ id: doc.id, ...(doc.data() as Omit<Apartment, 'id'>) });
    });
    return apartments;
  } catch (error) {
    console.error('Error fetching apartments: ', error);
    throw error;
  }
};

// Update an apartment
export const updateApartment = async (id: string, apartment: Partial<Apartment>) => {
  try {
    const apartmentDoc = doc(db, COLLECTION_NAME, id);
    await updateDoc(apartmentDoc, apartment);
    return { id, ...apartment };
  } catch (error) {
    console.error('Error updating apartment: ', error);
    throw error;
  }
};

// Delete an apartment
export const deleteApartment = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return id;
  } catch (error) {
    console.error('Error deleting apartment: ', error);
    throw error;
  }
};