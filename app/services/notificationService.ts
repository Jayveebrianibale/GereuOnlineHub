import Constants from 'expo-constants';
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

// Get FCM server key from app configuration
function getFcmServerKey(): string | null {
  try {
    return Constants.expoConfig?.extra?.fcmServerKey || null;
  } catch (error) {
    console.warn('Could not get FCM server key from config:', error);
    return null;
  }
}

// Send FCM notification directly using Firebase REST API
export async function sendFCMNotificationDirect(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    const fcmServerKey = getFcmServerKey();
    
    if (!fcmServerKey) {
      throw new Error('FCM server key not configured. Run: node configure-fcm.js --key YOUR_SERVER_KEY');
    }

    const message = {
      to: fcmToken,
      notification: {
        title,
        body,
        sound: 'default',
      },
      data: data || {},
      android: {
        notification: {
          channelId: 'default',
          priority: 'high',
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

    console.log('📱 Sending FCM notification directly:', {
      token: fcmToken.substring(0, 20) + '...',
      title,
      body,
      data
    });

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`FCM API error: ${result.error || 'Unknown error'}`);
    }

    if (result.failure > 0) {
      console.warn('⚠️ Some FCM notifications failed:', result.results);
    }

    console.log('✅ FCM notification sent successfully:', {
      success: result.success,
      failure: result.failure,
      messageId: result.multicast_id
    });

  } catch (error) {
    console.error('❌ Failed to send FCM notification:', error);
    throw error;
  }
}

// Send FCM notification to multiple tokens
export async function sendFCMNotificationMulticast(
  fcmTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    const fcmServerKey = getFcmServerKey();
    
    if (!fcmServerKey) {
      throw new Error('FCM server key not configured. Run: node configure-fcm.js --key YOUR_SERVER_KEY');
    }

    const message = {
      registration_ids: fcmTokens,
      notification: {
        title,
        body,
        sound: 'default',
      },
      data: data || {},
      android: {
        notification: {
          channelId: 'default',
          priority: 'high',
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

    console.log('📱 Sending FCM multicast notification:', {
      tokenCount: fcmTokens.length,
      title,
      body,
      data
    });

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`FCM API error: ${result.error || 'Unknown error'}`);
    }

    console.log('✅ FCM multicast notification sent:', {
      success: result.success,
      failure: result.failure,
      messageId: result.multicast_id
    });

    // Log individual results
    if (result.results) {
      result.results.forEach((res: any, index: number) => {
        if (res.error) {
          console.error(`❌ FCM failed for token ${index}:`, res.error);
        } else {
          console.log(`✅ FCM success for token ${index}:`, res.message_id);
        }
      });
    }

  } catch (error) {
    console.error('❌ Failed to send FCM multicast notification:', error);
    throw error;
  }
}

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
        const hasToken = typeof u.expoPushToken === 'string' && u.expoPushToken.startsWith('ExpoPushToken[');
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
    const fcmServerKey = getFcmServerKey();
    
    console.log('Sending push notification to:', Array.isArray(to) ? `${to.length} tokens` : 'single token');
    console.log('Message:', { title: message.title, body: message.body, data: message.data });
    console.log('FCM Server Key configured:', fcmServerKey ? 'Yes' : 'No');
    
    if (!to || (Array.isArray(to) && to.length === 0)) {
      console.warn('No valid tokens provided for push notification');
      return;
    }

    const messages = Array.isArray(to)
      ? to
          .filter((token) => {
            const isValid = typeof token === 'string' && token.startsWith('ExpoPushToken[');
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
      // Check if it's just the FCM server key warning (which is non-fatal)
      const fcmErrors = errors.filter((error: any) => 
        error?.details?.error === 'InvalidCredentials' && 
        error?.message?.includes('FCM server key')
      );
      
      if (fcmErrors.length > 0) {
        if (fcmServerKey) {
          console.warn('FCM server key is configured but still getting errors - check if key is correct');
        } else {
          console.warn('FCM server key not configured - notifications will still work but may be slower');
          console.log('To fix: Run "node configure-fcm.js --key YOUR_SERVER_KEY" (see FCM_SETUP_GUIDE.md)');
        }
      } else {
        console.warn('Expo push returned errors:', errors);
      }
    } else {
      console.log('Push notification sent successfully');
    }
  } catch (error) {
    console.error('Failed to send Expo push:', error);
  }
}

export async function notifyAdmins(title: string, body: string, data?: Record<string, any>): Promise<void> {
  console.log('Notifying admins:', { title, body, data });
  
  // Try FCM first (direct FCM API)
  try {
    console.log('📱 Attempting to send admin notification via FCM...');
    const fcmTokens = await getAdminFcmTokens();
    
    if (fcmTokens.length > 0) {
      await sendFCMNotificationMulticast(fcmTokens, title, body, data as Record<string, string>);
      console.log('✅ FCM admin notification sent successfully');
      return; // Success, no need to try Expo
    } else {
      console.warn('⚠️ No admin FCM tokens found, trying Expo fallback');
    }
  } catch (fcmError) {
    console.warn('⚠️ FCM admin notification failed, trying Expo fallback:', fcmError);
  }
  
  // Fallback to Expo push
  const tokens = await getAdminPushTokens();
  if (!Array.isArray(tokens) || tokens.length === 0) {
    console.warn('No admin tokens found, skipping notification');
    return;
  }
  
  try {
    console.log('📱 Sending admin notification via Expo push as fallback...');
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
    console.error('❌ Both FCM and Expo admin notifications failed:', error);
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
  
  // Try FCM first (direct FCM API)
  if (fcmToken) {
    try {
      console.log('📱 Sending via FCM (direct API)...');
      await sendFCMNotificationDirect(fcmToken, title, body, data as Record<string, string>);
      console.log('✅ FCM notification sent successfully');
      return; // Success, no need to try Expo
    } catch (fcmError) {
      console.warn('⚠️ FCM failed, trying Expo fallback:', fcmError);
    }
  }
  
  // Fallback to Expo push
  if (expoToken) {
    try {
      console.log('📱 Sending via Expo push as fallback...');
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
      console.error('❌ Both FCM and Expo push failed:', error);
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