import Constants from 'expo-constants';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { addFcmToken } from '../services/notificationService';
import { useToast } from './Toast';

export default function FCMRegistrar() {
  const { user } = useAuthContext();
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    async function register() {
      if (!user) return;
      
      // Check if running in Expo Go
      const isExpoGo = Constants.appOwnership === 'expo';
      if (isExpoGo) {
        console.log('Running in Expo Go - Push notifications not available. Use development build for full functionality.');
        return;
      }
      
      try {
        // Native (iOS/Android) via Expo Notifications
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          const Notifications = await import('expo-notifications');

          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus !== 'granted') return;

          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
              name: 'default',
              importance: Notifications.AndroidImportance.MAX,
            });
          }

          const deviceToken = await Notifications.getDevicePushTokenAsync();
          const token = (deviceToken as any)?.data;
          if (!isMounted) return;
          if (token) {
            await addFcmToken(user.uid, token);
            showToast('Push enabled', 'success');
          }

          Notifications.addNotificationReceivedListener((notification) => {
            const t = (notification?.request?.content?.title as any) || 'Update';
            const b = (notification?.request?.content?.body as any) || '';
            const combined = b ? `${t}: ${b}` : t;
            showToast(combined, 'info');
          });
          return;
        }

        if (Platform.OS === 'web') {
          // Web FCM
          const { initializeApp } = await import('firebase/app');
          const { getMessaging, getToken, onMessage, isSupported } = await import('firebase/messaging');
          const supported = await isSupported();
          if (!supported) return;
          const firebaseConfig = (await import('../firebaseConfigWeb')).default;
          const app = initializeApp(firebaseConfig);
          const messaging = getMessaging(app);
          // VAPID key – set your public key in env or config
          const vapidKey = (window as any)?.VAPID_PUBLIC_KEY;
          const token = await getToken(messaging, { vapidKey });
          if (!isMounted) return;
          if (token) {
            await addFcmToken(user.uid, token);
            showToast('Push enabled (web)', 'success');
          }
          onMessage(messaging, (payload) => {
            const title = (payload?.notification as any)?.title || 'Update';
            const body = (payload?.notification as any)?.body || '';
            const combined = body ? `${title}: ${body}` : title;
            showToast(combined, 'info');
          });
        }
      } catch (err) {
        console.warn('FCM registration skipped:', (err as any)?.message || err);
      }
    }

    register();
    return () => {
      isMounted = false;
    };
  }, [user]);

  return null;
}


