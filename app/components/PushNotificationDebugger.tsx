import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import {
    getUserFcmToken,
    getUserPushToken,
    notifyAdmins,
    notifyUser,
    sendExpoPushAsync
} from '../services/notificationService';

export default function PushNotificationDebugger() {
  const { user } = useAuthContext();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDebugInfo();
  }, [user]);

  const loadDebugInfo = async () => {
    if (!user) return;

    try {
      const expoToken = await getUserPushToken(user.uid);
      const fcmToken = await getUserFcmToken(user.uid);
      
      // Check FCM server key configuration
      let fcmServerKeyConfigured = false;
      try {
        const Constants = await import('expo-constants');
        fcmServerKeyConfigured = !!Constants.default?.expoConfig?.extra?.fcmServerKey;
      } catch (error) {
        console.warn('Could not check FCM server key configuration:', error);
      }
      
      setDebugInfo({
        userId: user.uid,
        userEmail: user.email,
        expoToken: expoToken ? `${expoToken.substring(0, 30)}...` : 'Not found',
        fcmToken: fcmToken ? `${fcmToken.substring(0, 30)}...` : 'Not found',
        hasExpoToken: !!expoToken,
        hasFcmToken: !!fcmToken,
        fcmServerKeyConfigured,
      });
    } catch (error) {
      console.error('Error loading debug info:', error);
    }
  };

  const testLocalNotification = async () => {
    setIsLoading(true);
    try {
      const Notifications = await import('expo-notifications');
      
      // Check permissions first
      const { status } = await Notifications.getPermissionsAsync();
      console.log('Current notification permission status:', status);
      
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        console.log('New notification permission status:', newStatus);
        if (newStatus !== 'granted') {
          Alert.alert('Permission Denied', 'Notification permission is required');
          return;
        }
      }

      // Schedule local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Local Test Notification',
          body: 'This is a local test notification - should appear in notification bar',
          sound: 'default',
          data: { test: true },
        },
        trigger: { seconds: 2 },
      });
      
      Alert.alert('Success', 'Local notification scheduled! Check notification bar in 2 seconds.');
    } catch (error) {
      console.error('Local notification error:', error);
      Alert.alert('Error', `Failed to schedule local notification: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testExpoPushNotification = async () => {
    if (!user) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    setIsLoading(true);
    try {
      const expoToken = await getUserPushToken(user.uid);
      if (!expoToken) {
        Alert.alert('Error', 'No Expo push token found for this user');
        return;
      }

      console.log('Sending test push notification to token:', expoToken);
      
      await sendExpoPushAsync({
        to: expoToken,
        title: 'Test Push Notification',
        body: 'This is a test push notification - should appear in notification bar',
        sound: 'default',
        priority: 'high',
        data: { test: true, timestamp: Date.now() }
      });
      
      Alert.alert('Success', 'Push notification sent! Check notification bar.');
    } catch (error) {
      console.error('Push notification error:', error);
      Alert.alert('Error', `Failed to send push notification: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testNotifyUser = async () => {
    if (!user) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    setIsLoading(true);
    try {
      await notifyUser(
        user.uid,
        'Test User Notification',
        'This is a test user notification via notifyUser function',
        { test: true, timestamp: Date.now() }
      );
      
      Alert.alert('Success', 'User notification sent! Check notification bar.');
    } catch (error) {
      console.error('User notification error:', error);
      Alert.alert('Error', `Failed to send user notification: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testNotifyAdmins = async () => {
    setIsLoading(true);
    try {
      await notifyAdmins(
        'Test Admin Notification',
        'This is a test admin notification via notifyAdmins function',
        { test: true, timestamp: Date.now() }
      );
      
      Alert.alert('Success', 'Admin notification sent! Check notification bar.');
    } catch (error) {
      console.error('Admin notification error:', error);
      Alert.alert('Error', `Failed to send admin notification: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  const checkNotificationSettings = async () => {
    try {
      const Notifications = await import('expo-notifications');
      const { status } = await Notifications.getPermissionsAsync();
      
      Alert.alert(
        'Notification Settings',
        `Permission Status: ${status}\n\n` +
        `If status is not 'granted', notifications won't work.\n\n` +
        `Please check:\n` +
        `1. App notification settings in Android\n` +
        `2. Do Not Disturb mode\n` +
        `3. Battery optimization settings\n` +
        `4. App-specific notification permissions`
      );
    } catch (error) {
      Alert.alert('Error', `Failed to check settings: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Push Notification Debugger</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Information</Text>
        <Text style={styles.debugText}>User ID: {debugInfo.userId || 'Not available'}</Text>
        <Text style={styles.debugText}>Email: {debugInfo.userEmail || 'Not available'}</Text>
        <Text style={styles.debugText}>Expo Token: {debugInfo.expoToken || 'Not found'}</Text>
        <Text style={styles.debugText}>FCM Token: {debugInfo.fcmToken || 'Not found'}</Text>
        <Text style={[styles.debugText, { color: debugInfo.hasExpoToken ? 'green' : 'red' }]}>
          Has Expo Token: {debugInfo.hasExpoToken ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.debugText, { color: debugInfo.hasFcmToken ? 'green' : 'red' }]}>
          Has FCM Token: {debugInfo.hasFcmToken ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.debugText, { color: debugInfo.fcmServerKeyConfigured ? 'green' : 'orange' }]}>
          FCM Server Key: {debugInfo.fcmServerKeyConfigured ? 'Configured' : 'Not configured'}
        </Text>
      </View>

      {!debugInfo.fcmServerKeyConfigured && (
        <View style={[styles.section, { backgroundColor: '#fff3cd', borderLeftWidth: 4, borderLeftColor: '#ffc107' }]}>
          <Text style={[styles.sectionTitle, { color: '#856404' }]}>⚠️ FCM Server Key Notice</Text>
          <Text style={[styles.debugText, { color: '#856404' }]}>
            FCM server key is not configured. Notifications will work but may be slower.
          </Text>
          <Text style={[styles.debugText, { color: '#856404' }]}>
            To configure: Run "node configure-fcm.js --key YOUR_SERVER_KEY"
          </Text>
          <Text style={[styles.debugText, { color: '#856404' }]}>
            Get your key from Firebase Console → Project Settings → Cloud Messaging
          </Text>
        </View>
      )}

      {debugInfo.fcmServerKeyConfigured && (
        <View style={[styles.section, { backgroundColor: '#d4edda', borderLeftWidth: 4, borderLeftColor: '#28a745' }]}>
          <Text style={[styles.sectionTitle, { color: '#155724' }]}>✅ FCM Server Key Configured</Text>
          <Text style={[styles.debugText, { color: '#155724' }]}>
            FCM server key is configured. Notifications should use optimized delivery.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Notifications</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.localButton]} 
          onPress={testLocalNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Local Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.expoButton]} 
          onPress={testExpoPushNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Expo Push Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.userButton]} 
          onPress={testNotifyUser}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test User Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.adminButton]} 
          onPress={testNotifyAdmins}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Admin Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.settingsButton]} 
          onPress={checkNotificationSettings}
        >
          <Text style={styles.buttonText}>Check Notification Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.refreshButton]} 
          onPress={loadDebugInfo}
        >
          <Text style={styles.buttonText}>Refresh Debug Info</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <Text style={styles.loadingText}>Loading...</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  debugText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  localButton: {
    backgroundColor: '#4CAF50',
  },
  expoButton: {
    backgroundColor: '#2196F3',
  },
  userButton: {
    backgroundColor: '#FF9800',
  },
  adminButton: {
    backgroundColor: '#9C27B0',
  },
  settingsButton: {
    backgroundColor: '#607D8B',
  },
  refreshButton: {
    backgroundColor: '#795548',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});