import { get, push, ref, remove, set, update } from 'firebase/database';
import { db } from '../firebaseConfig';
import { convertImageToBase64, isBase64DataUrl, isFirebaseStorageUrl } from '../utils/imageToBase64';

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
    console.log('Creating new auto service:', service);
    
    let serviceToSave = { ...service };
    
    // Handle image conversion to base64 if it's a local URI
    if (service.image && (service.image.startsWith('file://') || service.image.startsWith('content://') || service.image.startsWith('/'))) {
      try {
        console.log('Converting auto service image to base64...');
        const base64Image = await convertImageToBase64(service.image);
        serviceToSave.image = base64Image;
        console.log('Auto service image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting auto service image to base64:', imageError);
        throw new Error('Failed to convert auto service image to base64');
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
      throw new Error('Failed to generate auto service ID');
    }
    
    const serviceWithId = { ...serviceToSave, id: newId };
    await set(newServiceRef, serviceToSave);
    console.log('Auto service created successfully in Realtime Database with ID:', newId);
    
    return serviceWithId;
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
    console.log('Starting auto service update for ID:', id);
    console.log('Update data:', service);
    
    let serviceToUpdate = service;
    
    // Handle image conversion to base64 if it's a local URI
    if (service.image && (service.image.startsWith('file://') || service.image.startsWith('content://') || service.image.startsWith('/'))) {
      try {
        console.log('Converting auto service image to base64 for update...');
        const base64Image = await convertImageToBase64(service.image);
        serviceToUpdate = {
          ...service,
          image: base64Image
        };
        console.log('Auto service image converted to base64 successfully');
      } catch (imageError) {
        console.error('Error converting auto service image to base64:', imageError);
        throw new Error('Failed to convert auto service image to base64');
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
    console.log('Auto service updated successfully in database');
    
    return { id, ...serviceToUpdate };
  } catch (error) {
    console.error('Error updating auto service: ', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined
    });
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