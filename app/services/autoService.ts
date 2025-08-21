import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

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
  includes: string[];
  warranty: string;
  available: boolean;
}

// Collection name in Firestore
const COLLECTION_NAME = 'autoServices';

// Create a new auto service
export const createAutoService = async (service: Omit<AutoService, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), service);
    return { id: docRef.id, ...service };
  } catch (error) {
    console.error('Error adding auto service: ', error);
    throw error;
  }
};

// Get all auto services
export const getAutoServices = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const services: AutoService[] = [];
    querySnapshot.forEach((doc) => {
      services.push({ id: doc.id, ...(doc.data() as Omit<AutoService, 'id'>) });
    });
    return services;
  } catch (error) {
    console.error('Error fetching auto services: ', error);
    throw error;
  }
};

// Update an auto service
export const updateAutoService = async (id: string, service: Partial<AutoService>) => {
  try {
    const serviceDoc = doc(db, COLLECTION_NAME, id);
    await updateDoc(serviceDoc, service);
    return { id, ...service };
  } catch (error) {
    console.error('Error updating auto service: ', error);
    throw error;
  }
};

// Delete an auto service
export const deleteAutoService = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return id;
  } catch (error) {
    console.error('Error deleting auto service: ', error);
    throw error;
  }
};