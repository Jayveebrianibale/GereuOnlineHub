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

// Simplified notification functions - Expo Push only
export async function notifyAdmins(title: string, body: string, data?: Record<string, any>): Promise<void> {
  console.log('📱 Notifying admins via Expo Push:', { title, body, data });
  
  const tokens = await getAdminPushTokens();
  if (!Array.isArray(tokens) || tokens.length === 0) {
    console.warn('No admin tokens found, skipping notification');
    return;
  }
  
  try {
    console.log(`📱 Sending notification to ${tokens.length} admin tokens`);
    await sendExpoPushAsync({ 
      to: tokens, 
      sound: 'default', 
      title, 
      body, 
      data: { ...data, type: 'admin' }, 
      priority: 'high' 
    });
    console.log('✅ Admin notification sent successfully via Expo Push');
  } catch (error) {
    console.error('❌ Admin notification failed:', error);
    throw error;
  }
}

export async function notifyUser(userId: string, title: string, body: string, data?: Record<string, any>): Promise<void> {
  console.log('📱 Notifying user via Expo Push:', { userId, title, body, data });
  
  const expoToken = await getUserPushToken(userId);
  
  if (!expoToken) {
    console.warn(`No push token found for user ${userId}, skipping notification`);
    return;
  }
  
  try {
    console.log('📱 Sending notification to user');
    await sendExpoPushAsync({ 
      to: expoToken, 
      sound: 'default', 
      title, 
      body, 
      data: { ...data, type: 'user' }, 
      priority: 'high' 
    });
    console.log('✅ User notification sent successfully via Expo Push');
  } catch (error) {
    console.error('❌ User notification failed:', error);
    throw error;
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
