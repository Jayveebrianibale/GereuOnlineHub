import Constants from 'expo-constants';
import { get, ref, set } from 'firebase/database';
import { db } from '../firebaseConfig';
import {
    initializeFirebaseAdmin,
    sendPushNotification
} from './firebaseAdminService';

type ExpoPushMessage = {
  to: string | string[];
  sound?: 'default' | null;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  priority?: 'default' | 'normal' | 'high';
};

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

// Get FCM server key from app configuration
function getFcmServerKey(): string | null {
  try {
    return Constants.expoConfig?.extra?.fcmServerKey || null;
  } catch (error) {
    console.warn('Could not get FCM server key from config:', error);
    return null;
  }
}

export async function saveExpoPushToken(userId: string, token: string): Promise<void> {
  try {
    await set(ref(db, `users/${userId}/expoPushToken`), token);
  } catch (error) {
    console.error('Failed to save Expo push token:', error);
  }
}

export async function saveFcmToken(userId: string, token: string): Promise<void> {
  try {
    await set(ref(db, `users/${userId}/fcmToken`), token);
  } catch (error) {
    console.error('Failed to save FCM token:', error);
  }
}

// Alias for compatibility
export const addFcmToken = saveFcmToken;

export async function getUserPushToken(userId: string): Promise<string | null> {
  try {
    const snap = await get(ref(db, `users/${userId}/expoPushToken`));
    if (snap.exists()) return snap.val();
    return null;
  } catch (error) {
    console.error('Failed to get user push token:', error);
    return null;
  }
}

export async function getUserFcmToken(userId: string): Promise<string | null> {
  try {
    const snap = await get(ref(db, `users/${userId}/fcmToken`));
    if (snap.exists()) return snap.val();
    return null;
  } catch (error) {
    console.error('Failed to get user FCM token:', error);
    return null;
  }
}

export async function getAdminPushTokens(): Promise<string[]> {
  try {
    const snap = await get(ref(db, 'users'));
    if (!snap.exists()) {
      console.warn('No users found in database');
      return [];
    }
    const users = snap.val() || {};
    console.log('All users:', Object.keys(users).length);
    
    const adminTokens = Object.values(users)
      .filter((u: any) => {
        const isAdmin = u.role === 'admin';
        // Check for both Expo and FCM tokens
        const hasExpoToken = typeof u.expoPushToken === 'string' && u.expoPushToken.startsWith('ExpoPushToken[');
        const hasFcmToken = typeof u.fcmToken === 'string' && u.fcmToken.length > 0;
        console.log(`User ${u.email || 'unknown'}: role=${u.role}, hasExpoToken=${hasExpoToken}, hasFcmToken=${hasFcmToken}`);
        return isAdmin && (hasExpoToken || hasFcmToken);
      })
      .map((u: any) => u.fcmToken || u.expoPushToken) // Prefer FCM token, fallback to Expo
      .filter(token => token); // Remove any null/undefined tokens
    
    console.log(`Found ${adminTokens.length} admin push tokens:`, adminTokens);
    return adminTokens;
  } catch (error) {
    console.error('Failed to get admin push tokens:', error);
    return [];
  }
}

// Initialize Firebase Admin SDK on first use
let adminInitialized = false;

async function ensureAdminInitialized() {
  if (!adminInitialized) {
    try {
      initializeFirebaseAdmin();
      adminInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }
}

export async function sendExpoPushAsync(message: ExpoPushMessage): Promise<void> {
  try {
    await ensureAdminInitialized();
    
    const to = message.to;
    console.log('Sending push notification to:', Array.isArray(to) ? `${to.length} tokens` : 'single token');
    console.log('Message:', { title: message.title, body: message.body, data: message.data });
    
    if (!to || (Array.isArray(to) && to.length === 0)) {
      console.warn('No valid tokens provided for push notification');
      return;
    }

    // Convert tokens to array and filter valid ones
    const tokens = Array.isArray(to) ? to : [to];
    const validTokens = tokens.filter(token => 
      token && typeof token === 'string' && token.length > 0
    );

    if (validTokens.length === 0) {
      console.warn('No valid tokens after filtering');
      return;
    }

    // Convert data to string format (FCM requires string values)
    const data = message.data ? 
      Object.fromEntries(
        Object.entries(message.data).map(([key, value]) => [key, String(value)])
      ) : {};

    // Send using Firebase Admin SDK
    const result = await sendPushNotification(
      validTokens,
      message.title || 'Notification',
      message.body || '',
      data
    );

    if (result.success) {
      console.log(`✅ Push notification sent successfully to ${result.successCount} tokens`);
      if (result.failureCount > 0) {
        console.warn(`⚠️ ${result.failureCount} tokens failed to receive the notification`);
      }
    } else {
      console.error('❌ Failed to send push notification:', result.error);
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

export async function notifyAdmins(title: string, body: string, data?: Record<string, any>): Promise<void> {
  console.log('Notifying admins:', { title, body, data });
  const tokens = await getAdminPushTokens();
  if (!Array.isArray(tokens) || tokens.length === 0) {
    console.warn('No admin tokens found, skipping notification');
    return;
  }
  await sendExpoPushAsync({ 
    to: tokens, 
    sound: 'default', 
    title, 
    body, 
    data: { ...data, type: 'admin' }, 
    priority: 'high' 
  });
}

export async function notifyUser(userId: string, title: string, body: string, data?: Record<string, any>): Promise<void> {
  console.log('Notifying user:', { userId, title, body, data });
  
  // Try to get both Expo and FCM tokens
  const [expoToken, fcmToken] = await Promise.all([
    getUserPushToken(userId),
    getUserFcmToken(userId)
  ]);
  
  console.log('User tokens found:', { 
    hasExpoToken: !!expoToken, 
    hasFcmToken: !!fcmToken,
    expoToken: expoToken ? expoToken.substring(0, 20) + '...' : 'none',
    fcmToken: fcmToken ? fcmToken.substring(0, 20) + '...' : 'none'
  });
  
  if (!expoToken && !fcmToken) {
    console.warn(`No push tokens found for user ${userId}, skipping notification`);
    return;
  }
  
  // Prefer FCM token, fallback to Expo token
  const tokenToUse = fcmToken || expoToken;
  
  try {
    console.log('Sending via Firebase Admin SDK...');
    await sendExpoPushAsync({ 
      to: tokenToUse, 
      sound: 'default', 
      title, 
      body, 
      data: { ...data, type: 'user' }, 
      priority: 'high' 
    });
    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Push notification failed:', error);
  }
}

// Get user ID by email
export async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    const snap = await get(ref(db, 'users'));
    if (!snap.exists()) return null;
    const users = snap.val() || {};
    const user = Object.values(users).find((u: any) => u.email === email);
    return user ? (user as any).id : null;
  } catch (error) {
    console.error('Failed to get user ID by email:', error);
    return null;
  }
}

// Send message notification to specific user by email
export async function notifyUserByEmail(email: string, title: string, body: string, data?: Record<string, any>): Promise<void> {
  console.log('Notifying user by email:', { email, title, body, data });
  const userId = await getUserIdByEmail(email);
  if (!userId) {
    console.warn(`No user found with email ${email}, skipping notification`);
    return;
  }
  await notifyUser(userId, title, body, data);
}

// Send message notification to specific admin by email
export async function notifyAdminByEmail(email: string, title: string, body: string, data?: Record<string, any>): Promise<void> {
  console.log('Notifying admin by email:', { email, title, body, data });
  const userId = await getUserIdByEmail(email);
  if (!userId) {
    console.warn(`No admin found with email ${email}, skipping notification`);
    return;
  }
  await notifyUser(userId, title, body, data);
}


