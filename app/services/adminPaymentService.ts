import { get, ref, set } from 'firebase/database';
import { db as database } from '../firebaseConfig';

export interface AdminPaymentSettings {
  gcashNumber: string;
  qrCodeImageUrl?: string;
  qrCodeBase64?: string;
  updatedAt: number;
}

const ADMIN_PAYMENT_SETTINGS_KEY = 'adminPaymentSettings';

export const getAdminPaymentSettings = async (): Promise<AdminPaymentSettings | null> => {
  try {
    if (!database) {
      console.error('Firebase database not initialized');
      return null;
    }

    // Get settings from adminPaymentSettings
    const settingsSnapshot = await get(ref(database, ADMIN_PAYMENT_SETTINGS_KEY));
    const settings = settingsSnapshot.val();

    // Get QR code from Payment_Information
    const qrSnapshot = await get(ref(database, 'Payment_Information/qrCode'));
    const qrCodeUrl = qrSnapshot.val();

    // Get GCash number from Payment_Information
    const gcashSnapshot = await get(ref(database, 'Payment_Information/gcashNumber'));
    const gcashNumber = gcashSnapshot.val();

    // Combine settings with QR code and GCash number
    if (settings) {
      return {
        ...settings,
        gcashNumber: gcashNumber || settings.gcashNumber,
        qrCodeImageUrl: qrCodeUrl || settings.qrCodeImageUrl,
        qrCodeBase64: qrCodeUrl ? qrCodeUrl.split(',')[1] : settings.qrCodeBase64
      };
    }

    // I-check kung may data sa Payment_Information path
    if (gcashNumber || qrCodeUrl) {
      return {
        gcashNumber: gcashNumber || '',
        qrCodeImageUrl: qrCodeUrl || '',
        qrCodeBase64: qrCodeUrl ? qrCodeUrl.split(',')[1] : '',
        updatedAt: Date.now()
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching admin payment settings:', error);
    return null;
  }
};

export const updateAdminPaymentSettings = async (settings: Partial<AdminPaymentSettings>): Promise<boolean> => {
  try {
    if (!database) {
      console.error('Firebase database not initialized');
      return false;
    }
    const currentSettings = await getAdminPaymentSettings();
    const updatedSettings: AdminPaymentSettings = {
      gcashNumber: settings.gcashNumber !== undefined ? settings.gcashNumber : (currentSettings?.gcashNumber || ''),
      qrCodeImageUrl: settings.qrCodeImageUrl !== undefined ? settings.qrCodeImageUrl : (currentSettings?.qrCodeImageUrl || ''),
      qrCodeBase64: settings.qrCodeBase64 !== undefined ? settings.qrCodeBase64 : (currentSettings?.qrCodeBase64 || ''),
      updatedAt: Date.now(),
    };

    // Update adminPaymentSettings
    await set(ref(database, ADMIN_PAYMENT_SETTINGS_KEY), updatedSettings);
    
    // Also update Payment_Information path for GCash number
    if (settings.gcashNumber !== undefined) {
      await set(ref(database, 'Payment_Information/gcashNumber'), settings.gcashNumber);
      await set(ref(database, 'Payment_Information/gcashNumberUpdatedAt'), new Date().toISOString());
    }
    
    return true;
  } catch (error) {
    console.error('Error updating admin payment settings:', error);
    return false;
  }
};

export const uploadQRCodeImage = async (imageUri: string): Promise<{ url: string; path: string }> => {
  try {
    if (!database) {
      console.error('Firebase database not initialized');
      throw new Error('Firebase database not initialized');
    }

    // Convert image to base64 using ImageManipulator (similar to profile.tsx)
    const { manipulateAsync } = await import('expo-image-manipulator');
    
    const base64Result = await manipulateAsync(
      imageUri,
      [{ resize: { width: 400 } }], // Resize to reasonable size
      { 
        compress: 0.8, 
        format: 'jpeg' as any,
        base64: true
      }
    );
    
    if (!base64Result.base64) {
      throw new Error('Failed to convert image to base64');
    }
    
    const dataUrl = `data:image/jpeg;base64,${base64Result.base64}`;
    
    // Store in Realtime Database under Payment_Information
    await set(ref(database, 'Payment_Information/qrCode'), dataUrl);
    await set(ref(database, 'Payment_Information/qrCodeUpdatedAt'), new Date().toISOString());
    
    return {
      url: dataUrl,
      path: 'Payment_Information/qrCode'
    };
  } catch (error) {
    console.error('Error uploading QR code image:', error);
    throw new Error('Failed to upload QR code image');
  }
};

// ========================================
// CLEAR DUMMY DATA FUNCTION
// ========================================
// I-clear ang any dummy data sa Payment_Information path
export const clearDummyPaymentData = async (): Promise<boolean> => {
  try {
    if (!database) {
      console.error('Firebase database not initialized');
      return false;
    }

    // I-check kung may dummy data sa Payment_Information
    const gcashSnapshot = await get(ref(database, 'Payment_Information/gcashNumber'));
    const qrSnapshot = await get(ref(database, 'Payment_Information/qrCode'));
    
    const gcashNumber = gcashSnapshot.val();
    const qrCode = qrSnapshot.val();
    
    // I-check kung dummy data ang naka-store
    const isDummyGCash = gcashNumber && (
      gcashNumber.includes('09123456789') || 
      gcashNumber.includes('+639123456789') ||
      gcashNumber.includes('639123456789')
    );
    
    const isDummyQR = qrCode && qrCode.includes('dummy');
    
    // I-clear ang dummy data
    if (isDummyGCash) {
      await set(ref(database, 'Payment_Information/gcashNumber'), '');
      console.log('✅ Cleared dummy GCash number');
    }
    
    if (isDummyQR) {
      await set(ref(database, 'Payment_Information/qrCode'), '');
      console.log('✅ Cleared dummy QR code');
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing dummy payment data:', error);
    return false;
  }
};
