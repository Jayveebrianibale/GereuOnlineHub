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
    
    // Handle image upload to Firebase Storage - accept all image formats
    if (!service.image) {
      throw new Error('Image is required for laundry service');
    }
    
    // Check if it's a local URI (file://, content://, or any local path)
    if (service.image.startsWith('file://') || service.image.startsWith('content://') || service.image.startsWith('/')) {
      try {
        console.log('Uploading laundry service image to Firebase Storage...');
        const imageResult = await uploadImageToFirebaseWithRetry(service.image, 'laundry-services');
        serviceToSave.image = imageResult.url;
        console.log('Laundry service image uploaded successfully:', imageResult.url);
      } catch (imageError) {
        console.error('Error uploading laundry service image:', imageError);
        throw new Error('Failed to upload laundry service image to Firebase Storage');
      }
    } else if (service.image.startsWith('http')) {
      // Image is already a Firebase Storage URL
      serviceToSave.image = service.image;
    } else {
      // Try to upload any other format as well
      try {
        console.log('Attempting to upload image with unknown format...');
        const imageResult = await uploadImageToFirebaseWithRetry(service.image, 'laundry-services');
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
    
    // Handle image updates - upload to Firebase Storage if needed, accept all formats
    if (service.image !== undefined) {
      if (service.image.startsWith('file://') || service.image.startsWith('content://') || service.image.startsWith('/')) {
        try {
          const imageResult = await uploadImageToFirebaseWithRetry(service.image, 'laundry-services');
          serviceToUpdate = {
            ...service,
            image: imageResult.url
          };
        } catch (imageError) {
          console.error('Error uploading laundry service image:', imageError);
          throw new Error('Failed to upload laundry service image to Firebase Storage');
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
          const imageResult = await uploadImageToFirebaseWithRetry(service.image, 'laundry-services');
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