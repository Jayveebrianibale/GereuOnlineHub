import { get, push, ref, remove, set, update } from 'firebase/database';
import { db } from '../firebaseConfig';
import { uploadImageToFirebaseWithRetry } from './imageUploadService';

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
    let serviceToSave = { ...service };
    
    // Handle image upload to Firebase Storage if it's a local URI
    if (service.image && (service.image.startsWith('file://') || service.image.startsWith('content://'))) {
      try {
        console.log('Attempting to upload laundry service image to Firebase Storage...');
        const imageResult = await uploadImageToFirebaseWithRetry(service.image, 'laundry-services');
        serviceToSave.image = imageResult.url;
        console.log('Laundry service image uploaded successfully:', imageResult.url);
      } catch (imageError) {
        console.error('Error uploading laundry service image:', imageError);
        console.log('Falling back to local image path');
        // Keep original image if upload fails - this ensures the service can still be created
        // The image will be stored as a local path, which might work for local development
      }
    }
    
    const serviceRef = ref(db, COLLECTION_NAME);
    const newServiceRef = push(serviceRef);
    await set(newServiceRef, serviceToSave);
    return { id: newServiceRef.key!, ...serviceToSave };
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
    let serviceToUpdate = service;
    
    // Handle image upload to Firebase Storage if it's a local URI
    if (service.image && (service.image.startsWith('file://') || service.image.startsWith('content://'))) {
      try {
        const imageResult = await uploadImageToFirebaseWithRetry(service.image, 'laundry-services');
        serviceToUpdate = {
          ...service,
          image: imageResult.url
        };
      } catch (imageError) {
        console.error('Error uploading laundry service image:', imageError);
        // Keep original image if upload fails
      }
    }
    
    const serviceRef = ref(db, `${COLLECTION_NAME}/${id}`);
    await update(serviceRef, serviceToUpdate);
    return { id, ...serviceToUpdate };
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