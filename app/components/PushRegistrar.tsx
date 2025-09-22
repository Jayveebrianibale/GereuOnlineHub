import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { saveExpoPushToken, saveFcmToken } from '../services/notificationService';

export default function PushRegistrar() {
  const { user } = useAuthContext();

  useEffect(() => {
    let isMounted = true;

    async function register() {
      if (!user) return;
      try {
        const Constants = await import('expo-constants');
        // Short-circuit in Expo Go BEFORE importing expo-notifications to avoid SDK 53 warning
        const appOwnership = Constants.default?.appOwnership;
        if (appOwnership === 'expo') return;

        const Device = await import('expo-device');
        if (!Device.isDevice) return;

        const Notifications = await import('expo-notifications');

        // Basic handler: show alerts and play sounds when app is foreground
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

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
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

        // In development builds, `projectId` may be required explicitly
        const expoConfig = Constants.default?.expoConfig as any;
        const easConfig = (Constants as any)?.default?.easConfig as any;
        const projectId = expoConfig?.extra?.eas?.projectId ?? easConfig?.projectId;

        if (!projectId) {
          console.warn('No EAS projectId found. Skipping remote push registration.');
          return;
        }

        const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
        if (!isMounted) return;
        if (pushToken?.data) {
          console.log('Expo push token generated:', pushToken.data);
          console.log('Saving token for user:', user.uid);
          await saveExpoPushToken(user.uid, pushToken.data);
          console.log('Expo push token saved successfully');
        } else {
          console.warn('No push token data received from Expo');
        }

        // Try to fetch native FCM token on Android (EAS/dev client or standalone builds)
        if (Platform.OS === 'android' && Notifications.getDevicePushTokenAsync) {
          try {
            const deviceToken = await Notifications.getDevicePushTokenAsync({
              projectId,
            } as any);
            const tokenString = (deviceToken as any)?.data || (deviceToken as any)?.token;
            if (tokenString) {
              console.log('Android device push token (FCM):', tokenString);
              await saveFcmToken(user.uid, tokenString);
            }
          } catch (err) {
            // Non-fatal
            console.warn('FCM token fetch failed:', (err as any)?.message || err);
          }
        }
      } catch (err) {
        // Silently ignore if expo-notifications is not installed or fails
        console.warn('Push registration skipped:', (err as any)?.message || err);
      }
    }

    register();
    return () => {
      isMounted = false;
    };
  }, [user]);

  return null;
}


