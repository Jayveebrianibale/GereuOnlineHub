import * as FileSystem from 'expo-file-system/legacy';
import { ImageSourcePropType } from 'react-native';

// Image mapping utility to convert between string paths and require() statements
const imageMap: { [key: string]: ImageSourcePropType } = {
  'apartment1.webp': require('@/assets/images/apartment1.webp'),
  'apartment2.webp': require('@/assets/images/apartment2.webp'),
  'apartment3.avif': require('@/assets/images/apartment3.avif'),
  'auto1.jpg': require('@/assets/images/auto1.jpg'),
  'auto2.avif': require('@/assets/images/auto2.avif'),
  'auto3.avif': require('@/assets/images/auto3.avif'),
  'laundry1.webp': require('@/assets/images/laundry1.webp'),
  'laundry2.webp': require('@/assets/images/laundry2.webp'),
  'laundry3.webp': require('@/assets/images/laundry3.webp'),
};

// Reverse mapping for getting path from require() statement
const reverseImageMap = new Map<ImageSourcePropType, string>();
Object.entries(imageMap).forEach(([path, source]) => {
  reverseImageMap.set(source, path);
});

// Function to get image source from image path
export const getImageSource = (imagePath: string | ImageSourcePropType): ImageSourcePropType => {
  try {
    // If imagePath is already a require() statement or object, return it directly
    if (typeof imagePath !== 'string') {
      return imagePath;
    }
    
    // Handle different URI types
    const lower = imagePath.toLowerCase();
    
    // For local file URIs (like from ImageManipulator), we need to handle them specially
    if (lower.startsWith('file://')) {
      // Check if it's a problematic local cache file
      if (imagePath.includes('/cache/ImageManipulator/') || imagePath.includes('/data/user/0/host.exp.exponent/cache/')) {
        console.warn('⚠️ Local cache file detected, using fallback image:', imagePath);
        return require('@/assets/images/apartment1.webp');
      }
      console.log('🖼️ Using local file URI:', imagePath);
      return { uri: imagePath } as ImageSourcePropType;
    }
    
    // For Android content URIs
    if (lower.startsWith('content://')) {
      return { uri: imagePath } as ImageSourcePropType;
    }
    
    // For HTTP/HTTPS URIs and data URLs
    if (lower.startsWith('http:') || lower.startsWith('https:') || lower.startsWith('data:')) {
      console.log('🖼️ Using URI image source:', imagePath);
      return { uri: imagePath } as ImageSourcePropType;
    }

    // If the imagePath is a full path, extract just the filename
    const fileName = imagePath.split('/').pop() || imagePath;
    
    // Check if the image exists in our map
    if (imageMap[fileName]) {
      console.log('🖼️ Using mapped image:', fileName);
      return imageMap[fileName];
    }
    
    // If not found (like "26"), log warning and return default
    console.warn(`⚠️ Invalid image reference: "${fileName}". Using default image.`);
    return require('@/assets/images/apartment1.webp');
    
  } catch (error) {
    console.error('❌ Error loading image:', error);
    return require('@/assets/images/apartment1.webp');
  }
};

// Async function to get image source with base64 conversion for problematic URIs
export const getImageSourceAsync = async (imagePath: string | ImageSourcePropType): Promise<ImageSourcePropType> => {
  try {
    // If imagePath is already a require() statement or object, return it directly
    if (typeof imagePath !== 'string') {
      return imagePath;
    }
    
    // Handle different URI types
    const lower = imagePath.toLowerCase();
    
    // For local file URIs (like from ImageManipulator), try to convert to base64
    if (lower.startsWith('file://')) {
      // Check if it's a problematic local cache file
      if (imagePath.includes('/cache/ImageManipulator/') || imagePath.includes('/data/user/0/host.exp.exponent/cache/')) {
        console.log('🔄 Attempting to convert problematic local file to base64:', imagePath);
        const base64Uri = await convertLocalFileToBase64(imagePath);
        if (base64Uri) {
          console.log('✅ Successfully converted to base64');
          return { uri: base64Uri } as ImageSourcePropType;
        } else {
          console.warn('⚠️ Failed to convert to base64, using fallback image');
          return require('@/assets/images/apartment1.webp');
        }
      }
      console.log('🖼️ Using local file URI:', imagePath);
      return { uri: imagePath } as ImageSourcePropType;
    }
    
    // For Android content URIs
    if (lower.startsWith('content://')) {
      return { uri: imagePath } as ImageSourcePropType;
    }

    // For HTTP/HTTPS URIs and data URLs
    if (lower.startsWith('http:') || lower.startsWith('https:') || lower.startsWith('data:')) {
      console.log('🖼️ Using URI image source:', imagePath);
      return { uri: imagePath } as ImageSourcePropType;
    }

    // If the imagePath is a full path, extract just the filename
    const fileName = imagePath.split('/').pop() || imagePath;
    
    // Check if the image exists in our map
    if (imageMap[fileName]) {
      console.log('🖼️ Using mapped image:', fileName);
      return imageMap[fileName];
    }
    
    // If not found (like "26"), log warning and return default
    console.warn(`⚠️ Invalid image reference: "${fileName}". Using default image.`);
    return require('@/assets/images/apartment1.webp');
    
  } catch (error) {
    console.error('❌ Error loading image:', error);
    return require('@/assets/images/apartment1.webp');
  }
};

// Function to get image path from image source (for saving to Firebase)
export const getImagePath = (imageSource: ImageSourcePropType): string => {
  try {
    // Try to find the path in reverse mapping
    const path = reverseImageMap.get(imageSource);
    if (path) {
      return path;
    }
    
    // If not found and it's an object source with a URI, return the URI directly
    if (typeof imageSource === 'object' && imageSource && (imageSource as any).uri) {
      return (imageSource as any).uri as string;
    }

    // If not found, return a default path
    return 'apartment1.webp';
  } catch (error) {
    console.error('❌ Error getting image path:', error);
    return 'apartment1.webp';
  }
};

// Function to convert problematic local file URIs to base64 data URIs
const convertLocalFileToBase64 = async (fileUri: string): Promise<string | null> => {
  try {
    // Get file info and ensure it exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    if (!fileInfo.exists || fileInfo.isDirectory) {
      console.warn('⚠️ File does not exist or is not accessible:', fileUri);
      return null;
    }
    
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64',
    });
    
    // Determine the file extension for proper MIME type
    const extension = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : 
                    extension === 'png' ? 'image/png' : 
                    extension === 'webp' ? 'image/webp' : 'image/jpeg';
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('❌ Error converting file to base64:', error);
    return null;
  }
};

// Function to get all available apartment images
export const getApartmentImages = (): { [key: string]: ImageSourcePropType } => {
  return {
    'apartment1.webp': require('@/assets/images/apartment1.webp'),
    'apartment2.webp': require('@/assets/images/apartment2.webp'),
    'apartment3.avif': require('@/assets/images/apartment3.avif'),
  };
};