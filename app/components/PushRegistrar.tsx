import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { saveExpoPushToken } from '../services/notificationService';
import safeNotificationHandler from '../utils/safeNotifications';

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
        if (appOwnership === 'expo') {
          console.log('⚠️ Running in Expo Go - Push notifications not available. Use development build for full functionality.');
          console.log('📱 To enable push notifications:');
          console.log('   1. Run: npx expo run:android (or npx expo run:ios)');
          console.log('   2. Or build with EAS: eas build --profile development');
          return;
        }

        const Device = await import('expo-device');
        if (!Device.isDevice) {
          console.log('⚠️ Not running on a physical device - push notifications not available');
          return;
        }

        // Use safe notification handler
        await safeNotificationHandler.setNotificationHandler({
          handleNotification: async (notification: any) => {
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

        const { status: existingStatus } = await safeNotificationHandler.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await safeNotificationHandler.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.warn('❌ Notification permissions not granted:', finalStatus);
          return;
        }
        console.log('✅ Notification permissions granted:', finalStatus);

        if (Platform.OS === 'android') {
          // Create multiple notification channels for better organization
          await safeNotificationHandler.setNotificationChannelAsync('default', {
            name: 'Default Notifications',
            description: 'Default notification channel for app notifications',
            importance: 4, // HIGH
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: 'default',
            enableVibrate: true,
            enableLights: true,
            showBadge: true,
          });

          // Create specific channels for different types of notifications
          await safeNotificationHandler.setNotificationChannelAsync('messages', {
            name: 'Messages',
            description: 'Chat and message notifications',
            importance: 4, // HIGH
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: 'default',
            enableVibrate: true,
            enableLights: true,
            showBadge: true,
          });

          await safeNotificationHandler.setNotificationChannelAsync('reservations', {
            name: 'Reservations',
            description: 'Reservation and booking notifications',
            importance: 4, // HIGH
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: 'default',
            enableVibrate: true,
            enableLights: true,
            showBadge: true,
          });
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
          const pushToken = await safeNotificationHandler.getExpoPushTokenAsync({ projectId });
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

        // FCM token fetching removed - using Expo Push only

        // Add notification received listener for background notifications
        const notificationListener = safeNotificationHandler.addNotificationReceivedListener((notification: any) => {
          console.log('📱 Background notification received:', notification);
          console.log('📱 Background notification data:', notification.request.content.data);
          console.log('📱 Background notification title:', notification.request.content.title);
          console.log('📱 Background notification body:', notification.request.content.body);
        });

        const responseListener = safeNotificationHandler.addNotificationResponseReceivedListener((response: any) => {
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


