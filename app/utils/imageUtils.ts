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
  // If imagePath is already a require() statement or object, return it directly
  if (typeof imagePath !== 'string') {
    return imagePath;
  }
  
  // If the imagePath is a full path, extract just the filename
  const fileName = imagePath.split('/').pop() || imagePath;
  
  // Return the mapped image or a default image if not found
  return imageMap[fileName] || require('@/assets/images/apartment1.webp');
};

// Function to get image path from image source (for saving to Firebase)
export const getImagePath = (imageSource: ImageSourcePropType): string => {
  // Try to find the path in reverse mapping
  const path = reverseImageMap.get(imageSource);
  if (path) {
    return path;
  }
  
  // If not found, return a default path
  return 'apartment1.webp';
};

// Function to get all available apartment images
export const getApartmentImages = (): { [key: string]: ImageSourcePropType } => {
  return {
    'apartment1.webp': require('@/assets/images/apartment1.webp'),
    'apartment2.webp': require('@/assets/images/apartment2.webp'),
    'apartment3.avif': require('@/assets/images/apartment3.avif'),
  };
};