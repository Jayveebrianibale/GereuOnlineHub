import admin from 'firebase-admin';
import { get, ref } from 'firebase/database';
import { db } from '../firebaseConfig';

// Initialize Firebase Admin SDK
let adminApp: admin.app.App | null = null;

function initializeAdminSDK() {
  if (adminApp) {
    return adminApp;
  }

  try {
    // Try to use the service account file
    const serviceAccount = require('../../gereuonlinehub-firebase-adminsdk-fbsvc-9ad1f6a162.json');
    
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://gereuonlinehub-default-rtdb.firebaseio.com',
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return adminApp;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

// Get Firebase Admin messaging instance
function getMessaging() {
  const app = initializeAdminSDK();
  return admin.messaging(app);
}

// Send notification using Firebase Admin SDK
export async function sendFCMNotification(
  tokens: string | string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    const messaging = getMessaging();
    
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens: Array.isArray(tokens) ? tokens : [tokens],
      android: {
        notification: {
          channelId: 'default',
          priority: 'high' as admin.messaging.AndroidNotificationPriority,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    console.log('📱 Sending FCM notification:', {
      tokenCount: Array.isArray(tokens) ? tokens.length : 1,
      title,
      body,
      data
    });

    const response = await messaging.sendMulticast(message);
    
    console.log('✅ FCM notification sent successfully:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses.map((resp, index) => ({
        token: Array.isArray(tokens) ? tokens[index] : tokens,
        success: resp.success,
        error: resp.error?.message || null,
      }))
    });

    // Log any failures
    if (response.failureCount > 0) {
      response.responses.forEach((resp, index) => {
        if (!resp.success && resp.error) {
          console.error(`❌ FCM failed for token ${index}:`, resp.error.message);
        }
      });
    }

  } catch (error) {
    console.error('❌ Failed to send FCM notification:', error);
    throw error;
  }
}

// Send notification to specific user by FCM token
export async function sendFCMToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    console.log('🔍 Getting FCM token for user:', userId);
    
    // Get user's FCM token from database
    const snap = await get(ref(db, `users/${userId}/fcmToken`));
    if (!snap.exists()) {
      console.warn('❌ No FCM token found for user:', userId);
      return;
    }

    const fcmToken = snap.val();
    if (!fcmToken || typeof fcmToken !== 'string') {
      console.warn('❌ Invalid FCM token for user:', userId);
      return;
    }

    console.log('✅ FCM token found for user:', fcmToken.substring(0, 20) + '...');
    
    await sendFCMNotification(fcmToken, title, body, data);
  } catch (error) {
    console.error('❌ Failed to send FCM to user:', error);
    throw error;
  }
}

// Send notification to all admins using FCM
export async function sendFCMToAdmins(
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    console.log('🔍 Getting admin FCM tokens...');
    
    const snap = await get(ref(db, 'users'));
    if (!snap.exists()) {
      console.warn('❌ No users found in database');
      return;
    }

    const users = snap.val() || {};
    const adminTokens = Object.values(users)
      .filter((u: any) => {
        const isAdmin = u.role === 'admin';
        const hasFcmToken = typeof u.fcmToken === 'string' && u.fcmToken.length > 0;
        console.log(`User ${u.email || 'unknown'}: role=${u.role}, hasFcmToken=${hasFcmToken}`);
        return isAdmin && hasFcmToken;
      })
      .map((u: any) => u.fcmToken as string);

    if (adminTokens.length === 0) {
      console.warn('❌ No admin FCM tokens found');
      return;
    }

    console.log(`✅ Found ${adminTokens.length} admin FCM tokens`);
    await sendFCMNotification(adminTokens, title, body, data);
  } catch (error) {
    console.error('❌ Failed to send FCM to admins:', error);
    throw error;
  }
}

// Send notification to user by email using FCM
export async function sendFCMToUserByEmail(
  email: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    console.log('🔍 Looking up user by email:', email);
    
    const snap = await get(ref(db, 'users'));
    if (!snap.exists()) {
      console.warn('❌ No users found in database');
      return;
    }

    const users = snap.val() || {};
    const user = Object.values(users).find((u: any) => u.email === email);
    
    if (!user) {
      console.warn('❌ User not found with email:', email);
      return;
    }

    const userId = (user as any).uid;
    console.log('✅ User found:', { email, userId });
    
    await sendFCMToUser(userId, title, body, data);
  } catch (error) {
    console.error('❌ Failed to send FCM to user by email:', error);
    throw error;
  }
}

// Hybrid approach: Try FCM first, fallback to Expo
export async function sendHybridNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    console.log('🔄 Attempting hybrid notification (FCM + Expo fallback)...');
    
    // Try FCM first
    try {
      await sendFCMToUser(userId, title, body, data as Record<string, string>);
      console.log('✅ FCM notification sent successfully');
      return;
    } catch (fcmError) {
      console.warn('⚠️ FCM failed, trying Expo fallback:', fcmError);
    }

    // Fallback to Expo push
    const { sendExpoPushAsync, getUserPushToken } = await import('./notificationService');
    const expoToken = await getUserPushToken(userId);
    
    if (expoToken) {
      console.log('📱 Sending via Expo push as fallback...');
      await sendExpoPushAsync({
        to: expoToken,
        title,
        body,
        data: { ...data, type: 'user' },
        priority: 'high',
        sound: 'default'
      });
      console.log('✅ Expo push notification sent successfully');
    } else {
      console.warn('❌ No push tokens available for user:', userId);
    }
  } catch (error) {
    console.error('❌ Hybrid notification failed:', error);
    throw error;
  }
}
