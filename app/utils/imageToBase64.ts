// ========================================
// IMAGE TO BASE64 UTILITIES - PAMAMAHALA NG IMAGE CONVERSION
// ========================================
// Ang file na ito ay naghahandle ng image conversion utilities
// May functions para sa pag-convert ng image URI to base64 string
// Ginagamit sa buong app para sa image storage at display

// Import ng Expo FileSystem at ImageManipulator
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

// ========================================
// IMAGE CONVERSION FUNCTIONS
// ========================================
// Main functions para sa image conversion

// Function para sa pag-convert ng image URI to base64 string
export const convertImageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    console.log('Converting image to base64:', imageUri);
    
    // ========================================
    // DIRECT FILE READ APPROACH
    // ========================================
    // I-try muna ang direct file read approach
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      console.log('File info:', fileInfo);
      
      if (fileInfo.exists && !fileInfo.isDirectory) {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        if (base64 && base64.length > 0) {
          // I-determine ang MIME type base sa file extension
          let mimeType = 'image/jpeg'; // default
          if (imageUri.toLowerCase().includes('.png')) {
            mimeType = 'image/png';
          } else if (imageUri.toLowerCase().includes('.gif')) {
            mimeType = 'image/gif';
          } else if (imageUri.toLowerCase().includes('.webp')) {
            mimeType = 'image/webp';
          }
          
          const dataUrl = `data:${mimeType};base64,${base64}`;
          console.log('Image converted to base64 successfully, length:', dataUrl.length);
          return dataUrl;
        }
      }
    } catch (fileError) {
      console.log('Direct file read failed, trying ImageManipulator approach:', fileError);
    }
    
    // ========================================
    // IMAGE MANIPULATOR FALLBACK APPROACH
    // ========================================
    // Fallback: I-use ang ImageManipulator para mag-create ng new file at i-convert
    try {
      console.log('Using ImageManipulator fallback approach...');
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [], // No manipulations, just get a fresh URI
        { 
          compress: 0.8, 
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true // This will return base64 directly
        }
      );
      
      if (manipResult.base64) {
        const dataUrl = `data:image/jpeg;base64,${manipResult.base64}`;
        console.log('Image converted to base64 via ImageManipulator, length:', dataUrl.length);
        return dataUrl;
      }
    } catch (manipError) {
      console.log('ImageManipulator approach failed:', manipError);
    }
    
    throw new Error('All conversion methods failed');
    
  } catch (error) {
    console.error('Error converting image to base64:', error);
    console.error('Image URI:', imageUri);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`Failed to convert image to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Check if a string is already a base64 data URL
export const isBase64DataUrl = (str: string): boolean => {
  return str.startsWith('data:image/') && str.includes('base64,');
};

// Check if a string is a Firebase Storage URL
export const isFirebaseStorageUrl = (str: string): boolean => {
  return str.startsWith('https://firebasestorage.googleapis.com/');
};
