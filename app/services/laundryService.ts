import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// Define the LaundryService type
export interface LaundryService {
  id: string;
  title: string;
  price: string;
  turnaround: string;
  image: string;
  rating: number;
  reviews: number;
  description: string;
  services: string[];
  pickup: string;
  delivery: string;
  minOrder: string;
  available: boolean;
}

// Collection name in Firestore
const COLLECTION_NAME = 'laundryServices';

// Create a new laundry service
export const createLaundryService = async (service: Omit<LaundryService, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), service);
    return { id: docRef.id, ...service };
  } catch (error) {
    console.error('Error adding laundry service: ', error);
    throw error;
  }
};

// Get all laundry services
export const getLaundryServices = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const services: LaundryService[] = [];
    querySnapshot.forEach((doc) => {
      services.push({ id: doc.id, ...(doc.data() as Omit<LaundryService, 'id'>) });
    });
    return services;
  } catch (error) {
    console.error('Error fetching laundry services: ', error);
    throw error;
  }
};

// Update a laundry service
export const updateLaundryService = async (id: string, service: Partial<LaundryService>) => {
  try {
    const serviceDoc = doc(db, COLLECTION_NAME, id);
    await updateDoc(serviceDoc, service);
    return { id, ...service };
  } catch (error) {
    console.error('Error updating laundry service: ', error);
    throw error;
  }
};

// Delete a laundry service
export const deleteLaundryService = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return id;
  } catch (error) {
    console.error('Error deleting laundry service: ', error);
    throw error;
  }
};