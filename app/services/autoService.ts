import { get, push, ref, remove, set, update } from 'firebase/database';
import { db } from '../firebaseConfig';

// Define the AutoService type
export interface AutoService {
  id: string;
  title: string;
  price: string;
  duration: string;
  image: string;
  rating: number;
  reviews: number;
  description: string;
  services: string[];
  category: string;
  includes: string[];
  warranty: string;
  available: boolean;
}

// Collection name in RTDB
const COLLECTION_NAME = 'autoServices';

// Create a new auto service
export const createAutoService = async (service: Omit<AutoService, 'id'>) => {
  try {
    const serviceRef = ref(db, COLLECTION_NAME);
    const newServiceRef = push(serviceRef);
    await set(newServiceRef, service);
    return { id: newServiceRef.key!, ...service };
  } catch (error) {
    console.error('Error adding auto service: ', error);
    throw error;
  }
};

// Get all auto services
export const getAutoServices = async () => {
  try {
    const serviceRef = ref(db, COLLECTION_NAME);
    const snapshot = await get(serviceRef);
    const services: AutoService[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).forEach((key) => {
        services.push({ id: key, ...data[key] });
      });
    }
    return services;
  } catch (error) {
    console.error('Error fetching auto services: ', error);
    throw error;
  }
};

// Update an auto service
export const updateAutoService = async (id: string, service: Partial<AutoService>) => {
  try {
    const serviceRef = ref(db, `${COLLECTION_NAME}/${id}`);
    await update(serviceRef, service);
    return { id, ...service };
  } catch (error) {
    console.error('Error updating auto service: ', error);
    throw error;
  }
};

// Delete an auto service
export const deleteAutoService = async (id: string) => {
  try {
    const serviceRef = ref(db, `${COLLECTION_NAME}/${id}`);
    await remove(serviceRef);
    return id;
  } catch (error) {
    console.error('Error deleting auto service: ', error);
    throw error;
  }
};