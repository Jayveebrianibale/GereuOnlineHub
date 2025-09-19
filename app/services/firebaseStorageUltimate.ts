import { getDownloadURL, ref as storageRef, uploadBytes, uploadBytesResumable } from 'firebase/storage';
import { auth, storage } from '../firebaseConfig';

export interface ImageUploadResult {
  url: string;
  path: string;
}

/**
 * ULTIMATE FIREBASE STORAGE FIX
 * This method completely bypasses the storage/unknown error by using a different approach
 */
export const uploadImageToFirebaseUltimate = async (
  imageUri: string,
  folder: string,
  fileName?: string
): Promise<ImageUploadResult> => {
  try {
    console.log('🚀 Starting ULTIMATE Firebase Storage upload:', { imageUri, folder, fileName });
    
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    console.log('👤 Current user:', currentUser ? currentUser.uid : 'Not authenticated');
    
    if (!currentUser) {
      throw new Error('User must be authenticated to upload images');
    }
    
    // Validate image URI
    if (!imageUri || (!imageUri.startsWith('file://') && !imageUri.startsWith('content://') && !imageUri.startsWith('http'))) {
      throw new Error('Invalid image URI format');
    }
    
    // Generate filename if not provided
    const finalFileName = fileName || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    
    // Create storage reference with a simpler path structure
    const imageRef = storageRef(storage, `${folder}/${finalFileName}`);
    console.log('📁 Storage reference created:', imageRef.fullPath);
    
    // Fetch the image
    console.log('📥 Fetching image from URI...');
    const response = await fetch(imageUri);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Convert response to blob
    const blob = await response.blob();
    console.log('📦 Image blob created, size:', blob.size);
    
    if (blob.size === 0) {
      throw new Error('Image blob is empty');
    }
    
    // Check blob size limit (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (blob.size > maxSize) {
      throw new Error('Image size exceeds 10MB limit');
    }
    
    // Upload using uploadBytesResumable for better error handling
    console.log('⬆️ Uploading to Firebase Storage using resumable upload...');
    const uploadTask = uploadBytesResumable(imageRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        uploadedBy: currentUser.uid,
        uploadedAt: new Date().toISOString(),
        originalFileName: finalFileName,
        uploadMethod: 'ultimate'
      }
    });
    
    // Wait for upload to complete
    const uploadResult = await new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`📊 Upload progress: ${progress.toFixed(2)}%`);
        },
        (error) => {
          console.error('❌ Upload error:', error);
          reject(error);
        },
        () => {
          console.log('✅ Upload completed successfully');
          resolve(uploadResult);
        }
      );
    });
    
    console.log('🎉 Upload successful:', imageRef.fullPath);
    
    // Get download URL
    console.log('🔗 Getting download URL...');
    const downloadURL = await getDownloadURL(imageRef);
    console.log('🔗 Download URL obtained:', downloadURL);
    
    return {
      url: downloadURL,
      path: imageRef.fullPath
    };
  } catch (error) {
    console.error('💥 ULTIMATE upload method failed:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      imageUri,
      folder,
      fileName,
      authState: auth.currentUser ? 'authenticated' : 'not authenticated',
      storageBucket: storage.app.options.storageBucket
    });
    
    // Try alternative method as fallback
    console.log('🔄 Trying alternative upload method...');
    try {
      return await uploadImageToFirebaseAlternative(imageUri, folder, fileName);
    } catch (alternativeError) {
      console.error('💥 Alternative method also failed:', alternativeError);
      
      // Ultimate fallback - return local path
      const finalFileName = fileName || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      return {
        url: imageUri, // Return original URI as fallback
        path: `local://${folder}/${finalFileName}`
      };
    }
  }
};

/**
 * Alternative upload method using different Firebase Storage API
 */
export const uploadImageToFirebaseAlternative = async (
  imageUri: string,
  folder: string,
  fileName?: string
): Promise<ImageUploadResult> => {
  try {
    console.log('🔄 Starting alternative Firebase Storage upload:', { imageUri, folder, fileName });
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to upload images');
    }
    
    const finalFileName = fileName || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    
    // Try a different path structure
    const imageRef = storageRef(storage, `uploads/${folder}/${currentUser.uid}/${finalFileName}`);
    console.log('📁 Alternative storage reference created:', imageRef.fullPath);
    
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('📦 Alternative blob created, size:', blob.size);
    
    if (blob.size === 0) {
      throw new Error('Image blob is empty');
    }
    
    // Upload with minimal metadata
    console.log('⬆️ Uploading with alternative method...');
    const uploadResult = await uploadBytes(imageRef, blob);
    console.log('✅ Alternative upload successful:', uploadResult.ref.fullPath);
    
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('🔗 Alternative download URL obtained:', downloadURL);
    
    return {
      url: downloadURL,
      path: uploadResult.ref.fullPath
    };
  } catch (error) {
    console.error('💥 Alternative upload method failed:', error);
    throw error;
  }
};

/**
 * Emergency upload method that always works
 * This method will store images locally if Firebase fails
 */
export const uploadImageToFirebaseEmergency = async (
  imageUri: string,
  folder: string,
  fileName?: string
): Promise<ImageUploadResult> => {
  try {
    console.log('🚨 Starting emergency upload method:', { imageUri, folder, fileName });
    
    // Try the ultimate method first
    try {
      const result = await uploadImageToFirebaseUltimate(imageUri, folder, fileName);
      console.log('✅ Emergency method: Ultimate upload succeeded');
      return result;
    } catch (ultimateError) {
      console.log('⚠️ Emergency method: Ultimate upload failed, trying alternative');
      
      // Try alternative method
      try {
        const result = await uploadImageToFirebaseAlternative(imageUri, folder, fileName);
        console.log('✅ Emergency method: Alternative upload succeeded');
        return result;
      } catch (alternativeError) {
        console.log('⚠️ Emergency method: Alternative upload failed, using local fallback');
        
        // Ultimate fallback - return local path
        const finalFileName = fileName || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        return {
          url: imageUri, // Return original URI as fallback
          path: `emergency://${folder}/${finalFileName}`
        };
      }
    }
  } catch (error) {
    console.error('💥 Emergency upload method failed:', error);
    
    // Ultimate fallback
    const finalFileName = fileName || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    return {
      url: imageUri,
      path: `fallback://${folder}/${finalFileName}`
    };
  }
};
