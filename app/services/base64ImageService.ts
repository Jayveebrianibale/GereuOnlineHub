import { get, push, ref, update } from 'firebase/database';
import { db } from '../firebaseConfig';

export interface Base64ImageResult {
  base64: string;
  messageId: string;
  timestamp: number;
}

/**
 * Convert image URI to base64 string
 * @param imageUri - Local URI of the image to convert
 * @param quality - Image quality (0.1 to 1.0, default 0.8)
 * @returns Promise<string> - Base64 encoded image string
 */
export const convertImageToBase64 = async (
  imageUri: string,
  quality: number = 0.8
): Promise<string> => {
  try {
    console.log('🖼️ Converting image to base64...', { imageUri, quality });
    
    // Validate image URI
    if (!imageUri || (!imageUri.startsWith('file://') && !imageUri.startsWith('content://') && !imageUri.startsWith('http'))) {
      throw new Error('Invalid image URI format');
    }
    
    // Fetch the image
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Convert to blob
    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('Image blob is empty');
    }
    
    // Check file size limit (5MB for base64)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (blob.size > maxSize) {
      throw new Error(`Image size (${Math.round(blob.size / 1024 / 1024)}MB) exceeds 5MB limit for base64 conversion`);
    }
    
    // Convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix if present
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        console.log('✅ Base64 conversion successful, length:', base64.length);
        resolve(base64);
      };
      reader.onerror = () => {
        console.error('❌ FileReader error during base64 conversion');
        reject(new Error('Failed to convert image to base64'));
      };
      reader.readAsDataURL(blob);
    });
    
  } catch (error) {
    console.error('💥 Base64 conversion failed:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

/**
 * Store base64 image in Firebase Realtime Database
 * @param base64Image - Base64 encoded image string
 * @param chatId - Chat ID for the message
 * @param senderEmail - Email of the sender
 * @param recipientEmail - Email of the recipient
 * @param messageText - Optional text message to accompany the image
 * @returns Promise<Base64ImageResult> - Contains base64 string, message ID, and timestamp
 */
export const storeBase64ImageInDatabase = async (
  base64Image: string,
  chatId: string,
  senderEmail: string,
  recipientEmail: string,
  messageText: string = '📷 Image'
): Promise<Base64ImageResult> => {
  try {
    console.log('💾 Storing base64 image in Firebase Realtime Database...', { chatId, senderEmail, recipientEmail });
    
    // Validate inputs
    if (!base64Image || !chatId || !senderEmail || !recipientEmail) {
      throw new Error('Missing required parameters for storing base64 image');
    }
    
    // Check base64 string length (should be reasonable for an image)
    if (base64Image.length < 100) {
      throw new Error('Invalid base64 image data');
    }
    
    // Create message data
    const messageData = {
      text: messageText,
      sender: senderEmail.includes('admin') ? 'Admin' : 'User',
      senderEmail: senderEmail,
      timestamp: Date.now(),
      chatId: chatId,
      isAdmin: senderEmail.includes('admin'),
      recipientEmail: recipientEmail,
      recipientName: recipientEmail.split('@')[0],
      senderName: senderEmail.split('@')[0],
      messageType: 'image',
      base64Image: base64Image, // Store base64 directly in the message
      deletedFor: [],
      readBy: []
    };
    
    // Push to Firebase Realtime Database
    const messagesRef = ref(db, 'messages');
    const newMessageRef = push(messagesRef, messageData);
    
    if (!newMessageRef.key) {
      throw new Error('Failed to create message reference');
    }
    
    console.log('✅ Base64 image stored successfully in database', { messageId: newMessageRef.key });
    
    return {
      base64: base64Image,
      messageId: newMessageRef.key,
      timestamp: messageData.timestamp
    };
    
  } catch (error) {
    console.error('💥 Failed to store base64 image in database:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

/**
 * Complete function to convert image to base64 and store in database
 * @param imageUri - Local URI of the image
 * @param chatId - Chat ID for the message
 * @param senderEmail - Email of the sender
 * @param recipientEmail - Email of the recipient
 * @param messageText - Optional text message to accompany the image
 * @param quality - Image quality (0.1 to 1.0, default 0.8)
 * @returns Promise<Base64ImageResult> - Contains base64 string, message ID, and timestamp
 */
export const convertAndStoreImageAsBase64 = async (
  imageUri: string,
  chatId: string,
  senderEmail: string,
  recipientEmail: string,
  messageText: string = '📷 Image',
  quality: number = 0.8
): Promise<Base64ImageResult> => {
  try {
    console.log('🚀 Starting complete base64 image process...', { imageUri, chatId, senderEmail, recipientEmail });
    
    // Step 1: Convert image to base64
    const base64Image = await convertImageToBase64(imageUri, quality);
    
    // Step 2: Store in Firebase Realtime Database
    const result = await storeBase64ImageInDatabase(
      base64Image,
      chatId,
      senderEmail,
      recipientEmail,
      messageText
    );
    
    console.log('🎉 Complete base64 image process successful!', { messageId: result.messageId });
    return result;
    
  } catch (error) {
    console.error('💥 Complete base64 image process failed:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

/**
 * Get base64 image from Firebase Realtime Database
 * @param messageId - ID of the message containing the image
 * @returns Promise<string | null> - Base64 image string or null if not found
 */
export const getBase64ImageFromDatabase = async (messageId: string): Promise<string | null> => {
  try {
    console.log('🔍 Retrieving base64 image from database...', { messageId });
    
    const messageRef = ref(db, `messages/${messageId}`);
    const snapshot = await get(messageRef);
    
    if (snapshot.exists()) {
      const messageData = snapshot.val();
      if (messageData.base64Image) {
        console.log('✅ Base64 image retrieved successfully');
        return messageData.base64Image;
      } else {
        console.log('⚠️ Message found but no base64 image data');
        return null;
      }
    } else {
      console.log('❌ Message not found');
      return null;
    }
    
  } catch (error) {
    console.error('💥 Failed to retrieve base64 image from database:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

/**
 * Update message with base64 image (for existing messages)
 * @param messageId - ID of the message to update
 * @param base64Image - Base64 encoded image string
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export const updateMessageWithBase64Image = async (
  messageId: string,
  base64Image: string
): Promise<boolean> => {
  try {
    console.log('🔄 Updating message with base64 image...', { messageId });
    
    const messageRef = ref(db, `messages/${messageId}`);
    const updates = {
      base64Image: base64Image,
      messageType: 'image',
      updatedAt: Date.now()
    };
    
    await update(messageRef, updates);
    console.log('✅ Message updated with base64 image successfully');
    return true;
    
  } catch (error) {
    console.error('💥 Failed to update message with base64 image:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

/**
 * Compress base64 image to reduce size
 * @param base64Image - Original base64 image string
 * @param quality - Compression quality (0.1 to 1.0, default 0.7)
 * @returns Promise<string> - Compressed base64 image string
 */
export const compressBase64Image = async (
  base64Image: string,
  quality: number = 0.7
): Promise<string> => {
  try {
    console.log('🗜️ Compressing base64 image...', { quality });
    
    // Create a temporary image element to compress
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Calculate new dimensions (max 800px width/height)
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // Remove data:image/jpeg;base64, prefix
        const result = compressedBase64.includes(',') ? compressedBase64.split(',')[1] : compressedBase64;
        
        console.log('✅ Base64 image compressed successfully', { 
          originalLength: base64Image.length, 
          compressedLength: result.length 
        });
        
        resolve(result);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
      
      img.src = `data:image/jpeg;base64,${base64Image}`;
    });
    
  } catch (error) {
    console.error('💥 Base64 image compression failed:', error instanceof Error ? error.message : 'Unknown error');
    // Return original if compression fails
    return base64Image;
  }
};
