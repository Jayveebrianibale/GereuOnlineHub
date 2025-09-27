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

// For Firebase Admin SDK approach, we'll use Expo Push API as the primary method
// and create a server-side endpoint for Admin SDK notifications

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
      console.log('✅ User push token found:', token?.substring(0, 30) + '...');
      return token;
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
        console.log(`User ${u.email || 'unknown'}: role=${u.role}, hasToken=${hasToken}, token=${u.expoPushToken?.substring(0, 20)}...`);
        return isAdmin && hasToken;
      })
      .map((u: any) => u.expoPushToken as string);
    
    console.log(`Found ${adminTokens.length} admin push tokens:`, adminTokens);
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

export async function sendExpoPushAsync(message: ExpoPushMessage): Promise<void> {
  try {
    const to = message.to;
    
    console.log('Sending push notification to:', Array.isArray(to) ? `${to.length} tokens` : 'single token');
    console.log('Message:', { title: message.title, body: message.body, data: message.data });
    
    if (!to || (Array.isArray(to) && to.length === 0)) {
      console.warn('No valid tokens provided for push notification');
      return;
    }

    const messages = Array.isArray(to)
      ? to
          .filter((token) => {
            const isValid = typeof token === 'string' && token.length > 0;
            if (!isValid) {
              console.warn('Invalid token filtered out:', token?.substring(0, 20) + '...');
            }
            return isValid;
          })
          .map((token) => ({ 
            ...message, 
            to: token,
            // Add Android-specific channel based on notification type
            channelId: message.data?.type === 'message' ? 'messages' : 
                      message.data?.type === 'reservation' ? 'reservations' : 'default'
          }))
      : [{
          ...message,
          // Add Android-specific channel based on notification type
          channelId: message.data?.type === 'message' ? 'messages' : 
                    message.data?.type === 'reservation' ? 'reservations' : 'default'
        }];

    if (messages.length === 0) {
      console.warn('No valid messages after filtering tokens');
      return;
    }

    console.log(`Sending ${messages.length} push messages to Expo API`);

    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    console.log('Expo push response status:', response.status);

    // Inspect Expo push API response for errors
    const json: any = await (response as any).json().catch(() => null);
    if (!response.ok) {
      console.error('Expo push HTTP error:', response.status, json || (await (response as any).text().catch(() => '')));
      return;
    }

    const data = (json && json.data) || [];
    const errors = (Array.isArray(data) ? data : [data]).filter((item: any) => item?.status !== 'ok');
    if (errors.length > 0) {
      console.warn('Expo push returned errors:', errors);
    } else {
      console.log('Push notification sent successfully');
    }
  } catch (error) {
    console.error('Failed to send Expo push:', error);
  }
}

// Send notification using Firebase Admin SDK via server endpoint
export async function sendAdminSDKNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    console.log('📱 Attempting Firebase Admin SDK server endpoint...');
    
    // Replace with your actual server URL
    const SERVER_URL = 'http://localhost:3001'; // Change this to your server URL
    
    const response = await fetch(`${SERVER_URL}/api/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokens,
        title,
        body,
        data
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Firebase Admin SDK notification sent successfully:', {
        successCount: result.successCount,
        failureCount: result.failureCount,
        messageId: result.messageId
      });
    } else {
      throw new Error(result.error || 'Unknown server error');
    }
    
  } catch (error) {
    // Silently handle network errors - don't log as errors since this is expected
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Network request failed') || 
        errorMessage.includes('Unable to connect') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('Failed to fetch')) {
      console.log('📱 Firebase Admin SDK server not available, using Expo Push instead');
      throw new Error('Server not available');
    }
    
    // For other errors, log them but don't make them look like critical errors
    console.warn('⚠️ Firebase Admin SDK error:', errorMessage);
    throw error;
  }
}

export async function notifyAdmins(title: string, body: string, data?: Record<string, any>): Promise<void> {
  console.log('Notifying admins:', { title, body, data });
  
  // Get admin tokens first
  const tokens = await getAdminPushTokens();
  if (!Array.isArray(tokens) || tokens.length === 0) {
    console.warn('No admin tokens found, skipping notification');
    return;
  }
  
  // Try Firebase Admin SDK first (via server endpoint) - but don't fail if server is down
  try {
    const fcmTokens = await getAdminFcmTokens();
    
    if (fcmTokens.length > 0) {
      await sendAdminSDKNotification(fcmTokens, title, body, data as Record<string, string>);
      console.log('✅ Admin SDK notification sent successfully');
      return; // Success, no need to try Expo
    } else {
      console.log('📱 No admin FCM tokens found, using Expo Push');
    }
  } catch (adminSDKError) {
    // This is expected when server is not running - don't log as error
    console.log('📱 Admin SDK not available, using Expo Push instead');
  }
  
  // Use Expo push as primary method
  try {
    console.log('📱 Sending admin notification via Expo push...');
    await sendExpoPushAsync({ 
      to: tokens, 
      sound: 'default', 
      title, 
      body, 
      data: { ...data, type: 'admin' }, 
      priority: 'high' 
    });
    console.log('✅ Expo admin notification sent successfully');
  } catch (error) {
    console.error('❌ Expo admin notification failed:', error);
    throw error;
  }
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
  
  // Try Firebase Admin SDK first (via server endpoint) - but don't fail if server is down
  if (fcmToken) {
    try {
      await sendAdminSDKNotification([fcmToken], title, body, data as Record<string, string>);
      console.log('✅ Admin SDK notification sent successfully');
      return; // Success, no need to try Expo
    } catch (adminSDKError) {
      // This is expected when server is not running - don't log as error
      console.log('📱 Admin SDK not available, using Expo Push instead');
    }
  }
  
  // Use Expo push as primary method
  if (expoToken) {
    try {
      console.log('📱 Sending via Expo push...');
      await sendExpoPushAsync({ 
        to: expoToken, 
        sound: 'default', 
        title, 
        body, 
        data: { ...data, type: 'user' }, 
        priority: 'high' 
      });
      console.log('✅ Expo push sent successfully');
    } catch (error) {
      console.error('❌ Expo push failed:', error);
      throw error;
    }
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