import { get, push, ref, remove, set, update } from 'firebase/database';
import { db } from '../firebaseConfig';
import { uploadImageToFirebaseWithRetry } from './imageUploadService';

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
    let serviceToSave = { ...service };
    
    // Handle image upload to Firebase Storage if it's a local URI
    if (service.image && (service.image.startsWith('file://') || service.image.startsWith('content://'))) {
      try {
        console.log('Attempting to upload auto service image to Firebase Storage...');
        const imageResult = await uploadImageToFirebaseWithRetry(service.image, 'auto-services');
        serviceToSave.image = imageResult.url;
        console.log('Auto service image uploaded successfully:', imageResult.url);
      } catch (imageError) {
        console.error('Error uploading auto service image:', imageError);
        console.log('Falling back to local image path');
        // Keep original image if upload fails
      }
    }
    
    const serviceRef = ref(db, COLLECTION_NAME);
    const newServiceRef = push(serviceRef);
    await set(newServiceRef, serviceToSave);
    return { id: newServiceRef.key!, ...serviceToSave };
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
    let serviceToUpdate = service;
    
    // Handle image upload to Firebase Storage if it's a local URI
    if (service.image && (service.image.startsWith('file://') || service.image.startsWith('content://'))) {
      try {
        const imageResult = await uploadImageToFirebaseWithRetry(service.image, 'auto-services');
        serviceToUpdate = {
          ...service,
          image: imageResult.url
        };
      } catch (imageError) {
        console.error('Error uploading auto service image:', imageError);
        // Keep original image if upload fails
      }
    }
    
    const serviceRef = ref(db, `${COLLECTION_NAME}/${id}`);
    await update(serviceRef, serviceToUpdate);
    return { id, ...serviceToUpdate };
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