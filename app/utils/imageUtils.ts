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
  'laundry3.jpg': require('@/assets/images/laundry3.jpg'),
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
    
    // If imagePath is a URI or data URL, return it as an object source
    const lower = imagePath.toLowerCase();
    if (lower.startsWith('file:') || lower.startsWith('http:') || lower.startsWith('https:') || lower.startsWith('data:')) {
      return { uri: imagePath } as ImageSourcePropType;
    }

    // If the imagePath is a full path, extract just the filename
    const fileName = imagePath.split('/').pop() || imagePath;
    
    // Check if the image exists in our map
    if (imageMap[fileName]) {
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

// Function to get all available apartment images
export const getApartmentImages = (): { [key: string]: ImageSourcePropType } => {
  return {
    'apartment1.webp': require('@/assets/images/apartment1.webp'),
    'apartment2.webp': require('@/assets/images/apartment2.webp'),
    'apartment3.avif': require('@/assets/images/apartment3.avif'),
  };
};