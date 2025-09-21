import { get, push, ref, remove, set, update } from 'firebase/database';
import { db } from '../firebaseConfig';
import { convertImageToBase64, isBase64DataUrl, isFirebaseStorageUrl } from '../utils/imageToBase64';

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
    console.log('Creating new laundry service:', service);
    
    let serviceToSave = { ...service };
    
    // Handle image conversion to base64 if it's a local URI
    if (service.image && (service.image.startsWith('file://') || service.image.startsWith('content://') || service.image.startsWith('/'))) {
      try {
        console.log('Converting laundry service image to base64...');
        const base64Image = await convertImageToBase64(service.image);
        serviceToSave.image = base64Image;
        console.log('Laundry service image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting laundry service image to base64:', imageError);
        throw new Error('Failed to convert laundry service image to base64');
      }
    } else if (service.image && (isBase64DataUrl(service.image) || isFirebaseStorageUrl(service.image))) {
      // Image is already base64 or Firebase Storage URL
      console.log('Using existing image format:', service.image.substring(0, 50) + '...');
      serviceToSave.image = service.image;
    } else if (service.image) {
      // Try to convert any other format as well
      try {
        console.log('Attempting to convert image with unknown format to base64...');
        const base64Image = await convertImageToBase64(service.image);
        serviceToSave.image = base64Image;
        console.log('Image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting image to base64:', imageError);
        throw new Error('Failed to convert image to base64. Please ensure it is a valid image file.');
      }
    }
    
    const serviceRef = ref(db, COLLECTION_NAME);
    const newServiceRef = push(serviceRef);
    const newId = newServiceRef.key;
    
    if (!newId) {
      throw new Error('Failed to generate laundry service ID');
    }
    
    const serviceWithId = { ...serviceToSave, id: newId };
    await set(newServiceRef, serviceToSave);
    console.log('Laundry service created successfully in Realtime Database with ID:', newId);
    
    return serviceWithId;
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
    console.log('Starting laundry service update for ID:', id);
    console.log('Update data:', service);
    
    let serviceToUpdate = service;
    
    // Handle image conversion to base64 if it's a local URI
    if (service.image && (service.image.startsWith('file://') || service.image.startsWith('content://') || service.image.startsWith('/'))) {
      try {
        console.log('Converting laundry service image to base64 for update...');
        const base64Image = await convertImageToBase64(service.image);
        serviceToUpdate = {
          ...service,
          image: base64Image
        };
        console.log('Laundry service image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting laundry service image to base64:', imageError);
        throw new Error('Failed to convert laundry service image to base64');
      }
    } else if (service.image && (isBase64DataUrl(service.image) || isFirebaseStorageUrl(service.image))) {
      // Image is already base64 or Firebase Storage URL
      console.log('Using existing image format for update:', service.image.substring(0, 50) + '...');
      serviceToUpdate = {
        ...service,
        image: service.image
      };
    } else if (service.image) {
      // Try to convert any other format as well
      try {
        console.log('Attempting to convert image with unknown format to base64 for update...');
        const base64Image = await convertImageToBase64(service.image);
        serviceToUpdate = {
          ...service,
          image: base64Image
        };
        console.log('Image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting image to base64:', imageError);
        throw new Error('Failed to convert image to base64. Please ensure it is a valid image file.');
      }
    }
    
    console.log('Final data to update:', serviceToUpdate);
    const serviceRef = ref(db, `${COLLECTION_NAME}/${id}`);
    console.log('Database reference path:', `${COLLECTION_NAME}/${id}`);
    
    await update(serviceRef, serviceToUpdate);
    console.log('Laundry service updated successfully in database');
    
    return { id, ...serviceToUpdate };
  } catch (error) {
    console.error('Error updating laundry service: ', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined
    });
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