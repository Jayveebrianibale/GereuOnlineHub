import { get, ref, set } from 'firebase/database';
import { db } from '../firebaseConfig';

type ExpoPushMessage = {
  to: string | string[];
  sound?: 'default' | null;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  priority?: 'default' | 'normal' | 'high';
};

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const SERVER_API_BASE = 'http://localhost:3001/api'; // Update this to your server URL

// Simplified notification service - Expo Push only
// This eliminates all server connection issues

export async function saveExpoPushToken(userId: string, token: string): Promise<void> {
  try {
    console.log('💾 Saving Expo push token to Firebase:', { userId, token: token.substring(0, 30) + '...' });
    await set(ref(db, `users/${userId}/expoPushToken`), token);
    console.log('✅ Expo push token saved to Firebase successfully');
  } catch (error) {
    console.error('❌ Failed to save Expo push token:', error);
  }
}

export async function saveFcmToken(userId: string, token: string): Promise<void> {
  try {
    console.log('💾 Saving FCM token to Firebase:', { userId, token: token.substring(0, 30) + '...' });
    await set(ref(db, `users/${userId}/fcmToken`), token);
    console.log('✅ FCM token saved to Firebase successfully');
  } catch (error) {
    console.error('❌ Failed to save FCM token:', error);
  }
}

// Alias for compatibility
export const addFcmToken = saveFcmToken;

export async function getUserPushToken(userId: string): Promise<string | null> {
  try {
    console.log('🔍 Getting user push token for:', userId);
    const snap = await get(ref(db, `users/${userId}/expoPushToken`));
    if (snap.exists()) {
      const token = snap.val();
      const isValidExpoToken = token && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));
      if (isValidExpoToken) {
        console.log('✅ Valid Expo push token found:', token?.substring(0, 30) + '...');
        return token;
      } else {
        console.warn('❌ Invalid token format (not an Expo push token):', token?.substring(0, 30) + '...');
        return null;
      }
    }
    console.warn('❌ No push token found for user:', userId);
    return null;
  } catch (error) {
    console.error('❌ Failed to get user push token:', error);
    return null;
  }
}

export async function getUserFcmToken(userId: string): Promise<string | null> {
  try {
    console.log('🔍 Getting user FCM token for:', userId);
    const snap = await get(ref(db, `users/${userId}/fcmToken`));
    if (snap.exists()) {
      const token = snap.val();
      console.log('✅ User FCM token found:', token?.substring(0, 30) + '...');
      return token;
    }
    console.warn('❌ No FCM token found for user:', userId);
    return null;
  } catch (error) {
    console.error('❌ Failed to get user FCM token:', error);
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
        const hasToken = typeof u.expoPushToken === 'string' && u.expoPushToken.length > 0;
        const isValidExpoToken = hasToken && (u.expoPushToken.startsWith('ExponentPushToken[') || u.expoPushToken.startsWith('ExpoPushToken['));
        console.log(`User ${u.email || 'unknown'}: role=${u.role}, hasToken=${hasToken}, isValidExpoToken=${isValidExpoToken}, token=${u.expoPushToken?.substring(0, 20)}...`);
        return isAdmin && hasToken && isValidExpoToken;
        // Check for both Expo and FCM tokens
        const hasExpoToken = typeof u.expoPushToken === 'string' && u.expoPushToken.startsWith('ExpoPushToken[');
        const hasFcmToken = typeof u.fcmToken === 'string' && u.fcmToken.length > 0;
        console.log(`User ${u.email || 'unknown'}: role=${u.role}, hasExpoToken=${hasExpoToken}, hasFcmToken=${hasFcmToken}`);
        return isAdmin && (hasExpoToken || hasFcmToken);
      })
      .map((u: any) => u.fcmToken || u.expoPushToken) // Prefer FCM token, fallback to Expo
      .filter(token => token); // Remove any null/undefined tokens
    
    console.log(`Found ${adminTokens.length} valid admin Expo push tokens:`, adminTokens);
    return adminTokens;
  } catch (error) {
    console.error('Failed to get admin push tokens:', error);
    return [];
  }
}

export async function getAdminFcmTokens(): Promise<string[]> {
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
        const hasFcmToken = typeof u.fcmToken === 'string' && u.fcmToken.length > 0;
        console.log(`User ${u.email || 'unknown'}: role=${u.role}, hasFcmToken=${hasFcmToken}, token=${u.fcmToken?.substring(0, 20)}...`);
        return isAdmin && hasFcmToken;
      })
      .map((u: any) => u.fcmToken as string);
    
    console.log(`Found ${adminTokens.length} admin FCM tokens:`, adminTokens);
    return adminTokens;
  } catch (error) {
    console.error('Failed to get admin FCM tokens:', error);
    return [];
  }
}

// Server API helper functions
async function sendNotificationViaServer(tokens: string[], title: string, body: string, data?: Record<string, string>) {
  try {
    const response = await fetch(`${SERVER_API_BASE}/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokens,
        title,
        body,
        data: data || {}
      }),
    });

    if (!response.ok) {
      throw new Error(`Server API error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Failed to send notification via server:', error);
    throw error;
  }
}

export async function sendExpoPushAsync(message: ExpoPushMessage): Promise<void> {
  try {
    const to = message.to;
    
    console.log('📤 Sending push notification to:', Array.isArray(to) ? `${to.length} tokens` : 'single token');
    console.log('📤 Message:', { title: message.title, body: message.body, data: message.data });
    
    if (!to || (Array.isArray(to) && to.length === 0)) {
      console.warn('❌ No valid tokens provided for push notification');
      return;
    }

    // Separate Expo tokens and FCM tokens
    const tokens = Array.isArray(to) ? to : [to];
    const expoTokens = tokens.filter(token => 
      token && typeof token === 'string' && token.length > 0 && 
      (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
    );
    const fcmTokens = tokens.filter(token => 
      token && typeof token === 'string' && token.length > 0 && 
      !token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')
    );

    console.log(`📤 Found ${expoTokens.length} Expo tokens and ${fcmTokens.length} FCM tokens`);

    // Send Expo push notifications
    if (expoTokens.length > 0) {
      const expoMessages = expoTokens.map((token) => ({ 
        ...message, 
        to: token,
        // Add Android-specific channel based on notification type
        channelId: message.data?.type === 'message' ? 'messages' : 
                  message.data?.type === 'reservation' ? 'reservations' : 'default'
      }));

      console.log(`📤 Sending ${expoMessages.length} push messages to Expo API`);

      const response = await fetch(EXPO_PUSH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expoMessages),
      });

      console.log('📤 Expo push response status:', response.status);
      
      // Inspect Expo push API response for errors
      const json: any = await (response as any).json().catch(() => null);
      if (!response.ok) {
        console.error('❌ Expo push HTTP error:', response.status, json || (await (response as any).text().catch(() => '')));
        throw new Error(`Expo push failed with status ${response.status}`);
      }

      const responseData = (json && json.data) || [];
      const errors = (Array.isArray(responseData) ? responseData : [responseData]).filter((item: any) => item?.status !== 'ok');
      if (errors.length > 0) {
        console.warn('⚠️ Expo push returned errors:', errors);
        throw new Error(`Expo push errors: ${JSON.stringify(errors)}`);
      }
      
      console.log('✅ Expo push notifications sent successfully');
    }

    // Send FCM notifications via server
    if (fcmTokens.length > 0) {
      console.log(`📤 Sending ${fcmTokens.length} FCM notifications via server`);
      
      // Convert data to string format (FCM requires string values)
      const data = message.data ? 
        Object.fromEntries(
          Object.entries(message.data).map(([key, value]) => [key, String(value)])
        ) : {};

      const result = await sendNotificationViaServer(
        fcmTokens,
        message.title || 'Notification',
        message.body || '',
        data
      );

      if (result.success) {
        console.log(`✅ FCM notifications sent successfully to ${result.successCount} tokens`);
        if (result.failureCount > 0) {
          console.warn(`⚠️ ${result.failureCount} FCM tokens failed to receive the notification`);
        }
      } else {
        console.error('❌ Failed to send FCM notifications:', result.error);
      }
    }
  } catch (error) {
    console.error('❌ Failed to send push notifications:', error);
    throw error;
  }
}

// Simplified notification functions - Expo Push only
export async function notifyAdmins(title: string, body: string, data?: Record<string, any>): Promise<void> {
  console.log('📱 Notifying admins:', { title, body, data });
  
  try {
    // Check if running in Expo Go BEFORE any imports
    const Constants = await import('expo-constants');
    const appOwnership = Constants.default?.appOwnership;
    if (appOwnership === 'expo') {
      console.log('⚠️ Running in Expo Go - Push notifications not available. Skipping notification.');
      console.log('📱 To enable push notifications, use a development build instead of Expo Go.');
      return;
    }

    // Clean up any invalid tokens first
    await cleanupInvalidTokens();
    
    // Get both Expo and FCM tokens
    const expoTokens = await getAdminPushTokens();
    const fcmTokens = await getAdminFcmTokens();
    const allTokens = [...expoTokens, ...fcmTokens];
    
    if (allTokens.length === 0) {
      console.warn('No admin tokens found, skipping notification');
      return;
    }
    
    console.log(`📱 Sending notification to ${allTokens.length} admin tokens (${expoTokens.length} Expo, ${fcmTokens.length} FCM)`);
    await sendExpoPushAsync({ 
      to: allTokens, 
      sound: 'default', 
      title, 
      body, 
      data: { ...data, type: 'admin' }, 
      priority: 'high' 
    });
    console.log('✅ Admin notification sent successfully');
  } catch (error) {
    console.error('❌ Admin notification failed:', error);
    // Don't throw the error to prevent app crashes
    // Just log it and continue
    console.warn('⚠️ Continuing without notification due to error');
  }
}

export async function notifyUser(userId: string, title: string, body: string, data?: Record<string, any>): Promise<void> {
  console.log('📱 Notifying user:', { userId, title, body, data });
  
  try {
    // Check if running in Expo Go BEFORE any imports
    const Constants = await import('expo-constants');
    const appOwnership = Constants.default?.appOwnership;
    if (appOwnership === 'expo') {
      console.log('⚠️ Running in Expo Go - Push notifications not available. Skipping notification.');
      console.log('📱 To enable push notifications, use a development build instead of Expo Go.');
      return;
    }

    // Get both Expo and FCM tokens for the user
    const expoToken = await getUserPushToken(userId);
    const fcmToken = await getUserFcmToken(userId);
    const tokens = [expoToken, fcmToken].filter(token => token); // Remove null/undefined tokens
    
    if (tokens.length === 0) {
      console.warn(`No push tokens found for user ${userId}, skipping notification`);
      return;
    }
    
    console.log(`📱 Sending notification to user with ${tokens.length} tokens`);
    await sendExpoPushAsync({ 
      to: tokens, 
      sound: 'default', 
      title, 
      body, 
      data: { ...data, type: 'user' }, 
      priority: 'high' 
    });
    console.log('✅ User notification sent successfully');
  } catch (error) {
    console.error('❌ User notification failed:', error);
    // Don't throw the error to prevent app crashes
    // Just log it and continue
    console.warn('⚠️ Continuing without notification due to error');
  }
}

// Get user ID by email
export async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    console.log('🔍 Looking up user ID by email:', email);
    const snap = await get(ref(db, 'users'));
    if (!snap.exists()) {
      console.warn('❌ No users found in database');
      return null;
    }
    const users = snap.val() || {};
    const user = Object.values(users).find((u: any) => u.email === email);
    if (user) {
      console.log('✅ User found:', { email, uid: (user as any).uid });
      return (user as any).uid;
    }
    console.warn('❌ User not found with email:', email);
    return null;
  } catch (error) {
    console.error('❌ Failed to get user ID by email:', error);
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

// Clean up invalid tokens from database
export async function cleanupInvalidTokens(): Promise<void> {
  try {
    console.log('🧹 Cleaning up invalid tokens from database...');
    const snap = await get(ref(db, 'users'));
    if (!snap.exists()) {
      console.log('No users found to clean up');
      return;
    }
    
    const users = snap.val() || {};
    let cleanedCount = 0;
    
    for (const [userId, userData] of Object.entries(users)) {
      const user = userData as any;
      let needsUpdate = false;
      const updates: any = {};
      
      // Check expoPushToken
      if (user.expoPushToken && typeof user.expoPushToken === 'string') {
        const isValidExpoToken = user.expoPushToken.startsWith('ExponentPushToken[') || user.expoPushToken.startsWith('ExpoPushToken[');
        if (!isValidExpoToken) {
          console.log(`🧹 Removing invalid expoPushToken for user ${user.email || userId}:`, user.expoPushToken.substring(0, 30) + '...');
          updates.expoPushToken = null;
          needsUpdate = true;
        }
      }
      
      // Remove FCM tokens entirely since we're not using them
      if (user.fcmToken) {
        console.log(`🧹 Removing FCM token for user ${user.email || userId}:`, user.fcmToken.substring(0, 30) + '...');
        updates.fcmToken = null;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await set(ref(db, `users/${userId}`), { ...user, ...updates });
        cleanedCount++;
      }
    }
    
    console.log(`✅ Cleaned up tokens for ${cleanedCount} users`);
  } catch (error) {
    console.error('❌ Failed to cleanup invalid tokens:', error);
  }
}
