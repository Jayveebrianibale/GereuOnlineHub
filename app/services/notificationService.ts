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

export async function saveExpoPushToken(userId: string, token: string): Promise<void> {
  try {
    await set(ref(db, `users/${userId}/expoPushToken`), token);
  } catch (error) {
    console.error('Failed to save Expo push token:', error);
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

    await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
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


