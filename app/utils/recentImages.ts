import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'recent_apartment_images_v1';
const MAX_ITEMS = 8;

export const getRecentImages = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) return parsed as string[];
    return [];
  } catch (error) {
    console.warn('Failed to load recent images', error);
    return [];
  }
};

export const addRecentImage = async (imagePathOrUri: string): Promise<void> => {
  try {
    const existing = await getRecentImages();
    const withoutDup = existing.filter((x) => x !== imagePathOrUri);
    const updated = [imagePathOrUri, ...withoutDup].slice(0, MAX_ITEMS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save recent image', error);
  }
};

export const removeRecentImage = async (imagePathOrUri: string): Promise<void> => {
  try {
    const existing = await getRecentImages();
    const updated = existing.filter((x) => x !== imagePathOrUri);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to remove recent image', error);
  }
};

export const clearRecentImages = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear recent images', error);
  }
};


