import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { auth, storage } from '../firebaseConfig';
import { ImageUploadResult } from './imageUploadService';

/**
 * REAL FIREBASE STORAGE UPLOAD
 * This method actually uploads images to Firebase Storage
 */
export const uploadImageToFirebaseReal = async (
  imageUri: string,
  folder: string,
  fileName?: string
): Promise<ImageUploadResult> => {
  try {
    console.log('🔥 REAL FIREBASE UPLOAD: Uploading to Firebase Storage...');
    
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to upload images');
    }
    
    // Generate filename if not provided
    const finalFileName = fileName || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    
    // Create Firebase Storage reference
    const imageRef = storageRef(storage, `${folder}/${currentUser.uid}/${finalFileName}`);
    console.log('📁 Firebase reference created:', imageRef.fullPath);
    
    // Fetch the image
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('📦 Image blob created, size:', blob.size);
    
    if (blob.size === 0) {
      throw new Error('Image blob is empty');
    }
    
    // Upload to Firebase Storage
    console.log('⬆️ Uploading to Firebase Storage...');
    const uploadResult = await uploadBytes(imageRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        uploadedBy: currentUser.uid,
        uploadedAt: new Date().toISOString(),
        originalFileName: finalFileName
      }
    });
    console.log('✅ Firebase upload successful:', uploadResult.ref.fullPath);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('🔗 Firebase download URL obtained:', downloadURL);
    
    return {
      url: downloadURL,
      path: uploadResult.ref.fullPath
    };
  } catch (error) {
    console.error('❌ Real Firebase upload failed:', error);
    throw error;
  }
};

/**
 * SMART UPLOAD WITH FIREBASE STORAGE
 * This method tries Firebase Storage first, then falls back to local storage
 */
export const uploadImageToFirebaseSmart = async (
  imageUri: string,
  folder: string,
  fileName?: string
): Promise<ImageUploadResult> => {
  try {
    console.log('🧠 SMART UPLOAD: Trying Firebase Storage first...');
    
    // Try Firebase Storage first
    const result = await uploadImageToFirebaseReal(imageUri, folder, fileName);
    console.log('✅ SMART UPLOAD: Firebase Storage succeeded');
    return result;
  } catch (error) {
    console.error('❌ SMART UPLOAD: Firebase Storage failed, using local fallback');
    
    // Fall back to local storage
    const finalFileName = fileName || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    const localPath = `local://${folder}/${finalFileName}`;
    
    console.log('🔄 SMART UPLOAD: Using local fallback');
    return {
      url: imageUri, // Return original URI as fallback
      path: localPath
    };
  }
};
