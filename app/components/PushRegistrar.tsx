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

        // Enhanced handler: show alerts and play sounds when app is foreground
        Notifications.setNotificationHandler({
          handleNotification: async (notification) => {
            console.log('📱 Notification received in foreground:', notification);
            console.log('📱 Notification data:', notification.request.content.data);
            console.log('📱 Notification title:', notification.request.content.title);
            console.log('📱 Notification body:', notification.request.content.body);
            
            return {
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
              shouldShowBanner: true,
              shouldShowList: true,
            };
          },
        });

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.warn('❌ Notification permissions not granted:', finalStatus);
          return;
        }
        console.log('✅ Notification permissions granted:', finalStatus);

        if (Platform.OS === 'android') {
          try {
            await Notifications.setNotificationChannelAsync('default', {
              name: 'Default Notifications',
              description: 'Default notification channel for app notifications',
              importance: Notifications.AndroidImportance.HIGH,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF231F7C',
              sound: 'default',
              enableVibrate: true,
              enableLights: true,
              showBadge: true,
              lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
              bypassDnd: true,
            });
            console.log('✅ Default notification channel created');
            
            // Create a high priority channel for messages
            await Notifications.setNotificationChannelAsync('messages', {
              name: 'Messages',
              description: 'Chat message notifications',
              importance: Notifications.AndroidImportance.HIGH,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF231F7C',
              sound: 'default',
              enableVibrate: true,
              enableLights: true,
              showBadge: true,
              lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
              bypassDnd: true,
            });
            console.log('✅ Messages notification channel created');
          } catch (channelError) {
            console.error('❌ Failed to create notification channels:', channelError);
          }
        }

        // In development builds, `projectId` may be required explicitly
        const expoConfig = Constants.default?.expoConfig as any;
        const easConfig = (Constants as any)?.default?.easConfig as any;
        const projectId = expoConfig?.extra?.eas?.projectId ?? easConfig?.projectId;

        if (!projectId) {
          console.warn('❌ No EAS projectId found. Skipping remote push registration.');
          return;
        }
        console.log('✅ EAS projectId found:', projectId);

        try {
          const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
          if (!isMounted) return;
          if (pushToken?.data) {
            console.log('✅ Expo push token generated:', pushToken.data);
            console.log('💾 Saving token for user:', user.uid);
            await saveExpoPushToken(user.uid, pushToken.data);
            console.log('✅ Expo push token saved successfully');
          } else {
            console.warn('❌ No push token data received from Expo');
          }
        } catch (tokenError) {
          console.error('❌ Failed to get Expo push token:', tokenError);
        }

        // Try to fetch native FCM token on Android (EAS/dev client or standalone builds)
        if (Platform.OS === 'android' && Notifications.getDevicePushTokenAsync) {
          try {
            const deviceToken = await Notifications.getDevicePushTokenAsync();
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

        // Add notification received listener for background notifications
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
          console.log('📱 Background notification received:', notification);
          console.log('📱 Background notification data:', notification.request.content.data);
          console.log('📱 Background notification title:', notification.request.content.title);
          console.log('📱 Background notification body:', notification.request.content.body);
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('📱 Notification response received:', response);
          console.log('📱 Notification response data:', response.notification.request.content.data);
          
          // Handle notification tap - navigate to chat if it's a message notification
          const data = response.notification.request.content.data;
          if (data?.type === 'message' && data?.chatId) {
            console.log('📱 Navigating to chat:', data.chatId);
            // You can add navigation logic here if needed
          }
        });

        // Store listeners for cleanup
        if (isMounted) {
          // Store listeners in a way that can be cleaned up
          (window as any).__notificationListeners = {
            notification: notificationListener,
            response: responseListener
          };
        }
      } catch (err) {
        // Silently ignore if expo-notifications is not installed or fails
        console.warn('Push registration skipped:', (err as any)?.message || err);
      }
    }

    register();
    return () => {
      isMounted = false;
      // Cleanup listeners if they exist
      if ((window as any).__notificationListeners) {
        (window as any).__notificationListeners.notification?.remove();
        (window as any).__notificationListeners.response?.remove();
        delete (window as any).__notificationListeners;
      }
    };
  }, [user]);

  return null;
}


