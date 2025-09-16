import { get, ref, set, update } from 'firebase/database';
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

export async function saveExpoPushToken(userId: string, token: string): Promise<void> {
  try {
    await set(ref(db, `users/${userId}/expoPushToken`), token);
  } catch (error) {
    console.error('Failed to save Expo push token:', error);
  }
}

<<<<<<< HEAD
// FCM token storage (supports multiple tokens per user)
export async function addFcmToken(userId: string, token: string): Promise<void> {
  try {
    const path = `users/${userId}/fcmTokens/${token}`;
    await update(ref(db), { [path]: true });
  } catch (error) {
    console.error('Failed to add FCM token:', error);
=======
export async function saveFcmToken(userId: string, token: string): Promise<void> {
  try {
    await set(ref(db, `users/${userId}/fcmToken`), token);
  } catch (error) {
    console.error('Failed to save FCM token:', error);
>>>>>>> 1489bc7c5ef7e59c8d4a18c1a991f816be78ee86
  }
}

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
    if (!snap.exists()) return [];
    const users = snap.val() || {};
    return Object.values(users)
      .filter((u: any) => (u.role === 'admin') && typeof u.expoPushToken === 'string' && u.expoPushToken.startsWith('ExpoPushToken['))
      .map((u: any) => u.expoPushToken as string);
  } catch (error) {
    console.error('Failed to get admin push tokens:', error);
    return [];
  }
}

export async function sendExpoPushAsync(message: ExpoPushMessage): Promise<void> {
  try {
    const to = message.to;
    if (!to || (Array.isArray(to) && to.length === 0)) return;

    const messages = Array.isArray(to)
      ? to
          .filter((token) => typeof token === 'string' && token.startsWith('ExpoPushToken['))
          .map((token) => ({ ...message, to: token }))
      : [message];

    if (messages.length === 0) return;

    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

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
    }
  } catch (error) {
    console.error('Failed to send Expo push:', error);
  }
}

export async function notifyAdmins(title: string, body: string, data?: Record<string, any>): Promise<void> {
  const tokens = await getAdminPushTokens();
  if (!Array.isArray(tokens) || tokens.length === 0) return;
  await sendExpoPushAsync({ to: tokens, sound: 'default', title, body, data, priority: 'high' });
}

export async function notifyUser(userId: string, title: string, body: string, data?: Record<string, any>): Promise<void> {
  const token = await getUserPushToken(userId);
  if (!token) return;
  await sendExpoPushAsync({ to: token, sound: 'default', title, body, data, priority: 'high' });
}


