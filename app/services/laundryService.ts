import { get, push, ref, remove, set, update } from 'firebase/database';
import { db } from '../firebaseConfig';

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

// Collection name in RTDB
const COLLECTION_NAME = 'laundryServices';

// Create a new laundry service
export const createLaundryService = async (service: Omit<LaundryService, 'id'>) => {
  try {
    const serviceRef = ref(db, COLLECTION_NAME);
    const newServiceRef = push(serviceRef);
    await set(newServiceRef, service);
    return { id: newServiceRef.key!, ...service };
  } catch (error) {
    console.error('Error adding laundry service: ', error);
    throw error;
  }
};

// Get all laundry services
export const getLaundryServices = async () => {
  try {
    const serviceRef = ref(db, COLLECTION_NAME);
    const snapshot = await get(serviceRef);
    const services: LaundryService[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).forEach((key) => {
        services.push({ id: key, ...data[key] });
      });
    }
    return services;
  } catch (error) {
    console.error('Error fetching laundry services: ', error);
    throw error;
  }
};

// Update a laundry service
export const updateLaundryService = async (id: string, service: Partial<LaundryService>) => {
  try {
    const serviceRef = ref(db, `${COLLECTION_NAME}/${id}`);
    await update(serviceRef, service);
    return { id, ...service };
  } catch (error) {
    console.error('Error updating laundry service: ', error);
    throw error;
  }
};

// Delete a laundry service
export const deleteLaundryService = async (id: string) => {
  try {
    const serviceRef = ref(db, `${COLLECTION_NAME}/${id}`);
    await remove(serviceRef);
    return id;
  } catch (error) {
    console.error('Error deleting laundry service: ', error);
    throw error;
  }
};