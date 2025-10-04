import { get, push, ref, remove, set, update } from 'firebase/database';
import { db } from '../firebaseConfig';
import { convertImageToBase64, isBase64DataUrl, isFirebaseStorageUrl } from '../utils/imageToBase64';

// Define the MotorPart type
export interface MotorPart {
  id: string;
  name: string;
  price: string;
  image: string;
  description: string;
  category: string; // e.g., 'engine', 'brake', 'electrical', 'body', 'accessories'
  available: boolean;
  brand?: string; // Optional brand information
  model?: string; // Optional model information
}

// Collection name in RTDB
const COLLECTION_NAME = 'motorParts';

// Get all motor parts
export const getMotorParts = async (): Promise<MotorPart[]> => {
  try {
    const snapshot = await get(ref(db, COLLECTION_NAME));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching motor parts:', error);
    throw error;
  }
};

// Get motor parts by category
export const getMotorPartsByCategory = async (category: string): Promise<MotorPart[]> => {
  try {
    const allParts = await getMotorParts();
    return allParts.filter(part => part.category === category);
  } catch (error) {
    console.error('Error fetching motor parts by category:', error);
    throw error;
  }
};

// Create a new motor part
export const createMotorPart = async (motorPartData: Omit<MotorPart, 'id'>): Promise<MotorPart> => {
  try {
    // Process image if it's a local URI
    let processedImage = motorPartData.image;
    if (motorPartData.image && !isBase64DataUrl(motorPartData.image) && !isFirebaseStorageUrl(motorPartData.image)) {
      processedImage = await convertImageToBase64(motorPartData.image);
    }

    const motorPartWithImage = {
      ...motorPartData,
      image: processedImage
    };

    const newMotorPartRef = push(ref(db, COLLECTION_NAME));
    const newMotorPart: MotorPart = {
      id: newMotorPartRef.key!,
      ...motorPartWithImage
    };

    await set(newMotorPartRef, newMotorPart);
    return newMotorPart;
  } catch (error) {
    console.error('Error creating motor part:', error);
    throw error;
  }
};

// Update an existing motor part
export const updateMotorPart = async (id: string, updates: Partial<MotorPart>): Promise<void> => {
  try {
    // Process image if it's a local URI
    let processedUpdates = { ...updates };
    if (updates.image && !isBase64DataUrl(updates.image) && !isFirebaseStorageUrl(updates.image)) {
      processedUpdates.image = await convertImageToBase64(updates.image);
    }

    await update(ref(db, `${COLLECTION_NAME}/${id}`), processedUpdates);
  } catch (error) {
    console.error('Error updating motor part:', error);
    throw error;
  }
};

// Delete a motor part
export const deleteMotorPart = async (id: string): Promise<void> => {
  try {
    await remove(ref(db, `${COLLECTION_NAME}/${id}`));
  } catch (error) {
    console.error('Error deleting motor part:', error);
    throw error;
  }
};

// Get motor part by ID
export const getMotorPartById = async (id: string): Promise<MotorPart | null> => {
  try {
    const snapshot = await get(ref(db, `${COLLECTION_NAME}/${id}`));
    if (snapshot.exists()) {
      return {
        id,
        ...snapshot.val()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching motor part by ID:', error);
    throw error;
  }
};

// Search motor parts
export const searchMotorParts = async (query: string): Promise<MotorPart[]> => {
  try {
    const allParts = await getMotorParts();
    const searchQuery = query.toLowerCase();
    
    return allParts.filter(part => 
      part.name.toLowerCase().includes(searchQuery) ||
      part.description.toLowerCase().includes(searchQuery) ||
      part.brand?.toLowerCase().includes(searchQuery) ||
      part.model?.toLowerCase().includes(searchQuery) ||
      part.category.toLowerCase().includes(searchQuery)
    );
  } catch (error) {
    console.error('Error searching motor parts:', error);
    throw error;
  }
};

// Get available categories
export const getMotorPartCategories = async (): Promise<string[]> => {
  try {
    const allParts = await getMotorParts();
    const categories = [...new Set(allParts.map(part => part.category))];
    return categories.sort();
  } catch (error) {
    console.error('Error fetching motor part categories:', error);
    throw error;
  }
};
