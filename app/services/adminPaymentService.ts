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
    const snapshot = await database.ref(ADMIN_PAYMENT_SETTINGS_KEY).once('value');
    return snapshot.val();
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
      gcashNumber: settings.gcashNumber || currentSettings?.gcashNumber || '09123456789',
      qrCodeImageUrl: settings.qrCodeImageUrl || currentSettings?.qrCodeImageUrl,
      qrCodeBase64: settings.qrCodeBase64 || currentSettings?.qrCodeBase64,
      updatedAt: Date.now(),
    };

    await database.ref(ADMIN_PAYMENT_SETTINGS_KEY).set(updatedSettings);
    return true;
  } catch (error) {
    console.error('Error updating admin payment settings:', error);
    return false;
  }
};

export const uploadQRCodeImage = async (base64Image: string): Promise<string | null> => {
  try {
    // In a real app, you would upload to Firebase Storage here
    // For now, we'll store as base64 in the database
    const success = await updateAdminPaymentSettings({ qrCodeBase64: base64Image });
    return success ? base64Image : null;
  } catch (error) {
    console.error('Error uploading QR code image:', error);
    return null;
  }
};
