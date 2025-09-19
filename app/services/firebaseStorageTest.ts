import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { auth, storage } from '../firebaseConfig';

/**
 * Test Firebase Storage connectivity and permissions
 * Enhanced to diagnose storage/unknown errors
 */
export const testFirebaseStorage = async () => {
  try {
    console.log('Testing Firebase Storage...');
    console.log('Storage bucket:', storage.app.options.storageBucket);
    console.log('Current user:', auth.currentUser ? auth.currentUser.uid : 'Not authenticated');
    
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to test Firebase Storage');
    }
    
    // Create a test reference with user-specific path
    const testRef = storageRef(storage, `test/${auth.currentUser.uid}/test-connection.txt`);
    console.log('Test reference created:', testRef.fullPath);
    
    // Create a simple test blob
    const testBlob = new Blob(['Firebase Storage Test'], { type: 'text/plain' });
    console.log('Test blob created, size:', testBlob.size);
    
    // Try to upload with metadata
    console.log('Attempting test upload...');
    const uploadResult = await uploadBytes(testRef, testBlob, {
      contentType: 'text/plain',
      customMetadata: {
        testUpload: 'true',
        uploadedBy: auth.currentUser.uid,
        uploadedAt: new Date().toISOString()
      }
    });
    console.log('Test upload successful:', uploadResult.ref.fullPath);
    
    // Try to get download URL
    console.log('Getting test download URL...');
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('Test download URL:', downloadURL);
    
    return {
      success: true,
      message: 'Firebase Storage is working correctly',
      downloadURL,
      storageBucket: storage.app.options.storageBucket,
      userAuthenticated: !!auth.currentUser,
      userId: auth.currentUser.uid
    };
  } catch (error) {
    console.error('Firebase Storage test failed:', error);
    
    // Enhanced error analysis
    let errorAnalysis = '';
    if (error instanceof Error) {
      if (error.message.includes('storage/unknown')) {
        errorAnalysis = 'This is likely a Firebase Storage rules issue. Update your storage rules.';
      } else if (error.message.includes('storage/bucket-not-found')) {
        errorAnalysis = 'Storage bucket not found. Check your Firebase configuration.';
      } else if (error.message.includes('storage/unauthorized')) {
        errorAnalysis = 'Unauthorized. User may not be properly authenticated.';
      } else if (error.message.includes('storage/quota-exceeded')) {
        errorAnalysis = 'Storage quota exceeded. Check your Firebase plan.';
      }
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      errorAnalysis,
      error,
      storageBucket: storage.app.options.storageBucket,
      userAuthenticated: !!auth.currentUser,
      userId: auth.currentUser?.uid || null
    };
  }
};

/**
 * Test image upload specifically
 * Enhanced to match the fixed upload method
 */
export const testImageUpload = async (imageUri: string) => {
  try {
    console.log('Testing image upload with URI:', imageUri);
    
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to test image upload');
    }
    
    // Create a test reference for image with user-specific path
    const testRef = storageRef(storage, `test/${auth.currentUser.uid}/test-image.jpg`);
    console.log('Test image reference created:', testRef.fullPath);
    
    // Fetch the image
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch test image: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('Test image blob created, size:', blob.size);
    
    if (blob.size === 0) {
      throw new Error('Test image blob is empty');
    }
    
    // Upload the test image with proper metadata
    console.log('Uploading test image...');
    const uploadResult = await uploadBytes(testRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        testUpload: 'true',
        uploadedBy: auth.currentUser.uid,
        uploadedAt: new Date().toISOString(),
        originalFileName: 'test-image.jpg'
      }
    });
    console.log('Test image upload successful:', uploadResult.ref.fullPath);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('Test image download URL:', downloadURL);
    
    return {
      success: true,
      message: 'Image upload test successful',
      downloadURL,
      imageSize: blob.size,
      userId: auth.currentUser.uid
    };
  } catch (error) {
    console.error('Image upload test failed:', error);
    
    // Enhanced error analysis
    let errorAnalysis = '';
    if (error instanceof Error) {
      if (error.message.includes('storage/unknown')) {
        errorAnalysis = 'This is likely a Firebase Storage rules issue. Update your storage rules.';
      } else if (error.message.includes('storage/bucket-not-found')) {
        errorAnalysis = 'Storage bucket not found. Check your Firebase configuration.';
      } else if (error.message.includes('storage/unauthorized')) {
        errorAnalysis = 'Unauthorized. User may not be properly authenticated.';
      } else if (error.message.includes('storage/quota-exceeded')) {
        errorAnalysis = 'Storage quota exceeded. Check your Firebase plan.';
      }
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      errorAnalysis,
      error,
      userId: auth.currentUser?.uid || null
    };
  }
};
