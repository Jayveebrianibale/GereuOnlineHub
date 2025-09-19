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
    
    // Handle image upload to Firebase Storage - accept all image formats
    if (!service.image) {
      throw new Error('Image is required for auto service');
    }
    
    // Check if it's a local URI (file://, content://, or any local path)
    if (service.image.startsWith('file://') || service.image.startsWith('content://') || service.image.startsWith('/')) {
      try {
        console.log('Uploading auto service image to Firebase Storage...');
        const imageResult = await uploadImageToFirebaseWithRetry(service.image, 'auto-services');
        serviceToSave.image = imageResult.url;
        console.log('Auto service image uploaded successfully:', imageResult.url);
      } catch (imageError) {
        console.error('Error uploading auto service image:', imageError);
        throw new Error('Failed to upload auto service image to Firebase Storage');
      }
    } else if (service.image.startsWith('http')) {
      // Image is already a Firebase Storage URL
      serviceToSave.image = service.image;
    } else {
      // Try to upload any other format as well
      try {
        console.log('Attempting to upload image with unknown format...');
        const imageResult = await uploadImageToFirebaseWithRetry(service.image, 'auto-services');
        serviceToSave.image = imageResult.url;
        console.log('Image uploaded successfully:', imageResult.url);
      } catch (imageError) {
        console.error('Error uploading image:', imageError);
        throw new Error('Failed to upload image. Please ensure it is a valid image file.');
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
    
    // Handle image updates - upload to Firebase Storage if needed, accept all formats
    if (service.image !== undefined) {
      if (service.image.startsWith('file://') || service.image.startsWith('content://') || service.image.startsWith('/')) {
        try {
          const imageResult = await uploadImageToFirebaseWithRetry(service.image, 'auto-services');
          serviceToUpdate = {
            ...service,
            image: imageResult.url
          };
        } catch (imageError) {
          console.error('Error uploading auto service image:', imageError);
          throw new Error('Failed to upload auto service image to Firebase Storage');
        }
      } else if (service.image.startsWith('http')) {
        // Image is already a Firebase Storage URL
        serviceToUpdate = {
          ...service,
          image: service.image
        };
      } else {
        // Try to upload any other format as well
        try {
          console.log('Attempting to upload image with unknown format for update...');
          const imageResult = await uploadImageToFirebaseWithRetry(service.image, 'auto-services');
          serviceToUpdate = {
            ...service,
            image: imageResult.url
          };
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          throw new Error('Failed to upload image. Please ensure it is a valid image file.');
        }
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