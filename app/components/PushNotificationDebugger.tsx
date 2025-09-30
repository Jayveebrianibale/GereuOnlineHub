import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import {
    getAdminPushTokens,
    getUserFcmToken,
    getUserIdByEmail,
    getUserPushToken,
    notifyAdmins,
    notifyUser,
    sendExpoPushAsync
} from '../services/notificationService';

export default function PushNotificationDebugger() {
  const { user } = useAuthContext();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addDebugLog = (info: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const clearDebugLogs = () => {
    setDebugLogs([]);
  };

  useEffect(() => {
    loadDebugInfo();
  }, [user]);

  const loadDebugInfo = async () => {
    if (!user) return;

    try {
      const expoToken = await getUserPushToken(user.uid);
      const fcmToken = await getUserFcmToken(user.uid);
      
      // FCM server key not needed - using Expo Push only
      
      setDebugInfo({
        userId: user.uid,
        userEmail: user.email,
        expoToken: expoToken ? `${expoToken.substring(0, 30)}...` : 'Not found',
        fcmToken: fcmToken ? `${fcmToken.substring(0, 30)}...` : 'Not found',
        hasExpoToken: !!expoToken,
        hasFcmToken: !!fcmToken,
      });
    } catch (error) {
      console.error('Error loading debug info:', error);
    }
  };

  const checkUserToken = async () => {
    if (!user) {
      addDebugLog('❌ No user logged in');
      return;
    }

    try {
      addDebugLog(`🔍 Checking push token for user: ${user.email}`);
      const token = await getUserPushToken(user.uid);
      if (token) {
        addDebugLog(`✅ User push token found: ${token.substring(0, 30)}...`);
      } else {
        addDebugLog('❌ No push token found for user');
      }
    } catch (error) {
      addDebugLog(`❌ Error checking user token: ${error}`);
    }
  };

  const testLocalNotification = async () => {
    setIsLoading(true);

    try {
      const Notifications = await import('expo-notifications');
      
      // Check permissions first
      const { granted } = await Notifications.getPermissionsAsync();
      console.log('Current notification permission status:', granted);
      
      if (!granted) {
        const { granted: newGranted } = await Notifications.requestPermissionsAsync();
        console.log('New notification permission status:', newGranted);
        if (!newGranted) {
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
        trigger: null,
      });
      
      Alert.alert('Success', 'Local notification scheduled! Check notification bar in 2 seconds.');
      addDebugLog('✅ Local notification scheduled successfully');
    } catch (error) {
      console.error('Local notification error:', error);
      Alert.alert('Error', `Failed to schedule local notification: ${(error as Error).message}`);
      addDebugLog(`❌ Error scheduling local notification: ${error}`);
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
      addDebugLog('✅ Expo push notification sent successfully');
    } catch (error) {
      console.error('Push notification error:', error);
      Alert.alert('Error', `Failed to send push notification: ${(error as Error).message}`);
      addDebugLog(`❌ Error sending push notification: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAdminTokens = async () => {
    try {
      addDebugLog('🔍 Checking admin push tokens...');
      const tokens = await getAdminPushTokens();
      addDebugLog(`📊 Found ${tokens.length} admin tokens`);
      tokens.forEach((token, index) => {
        addDebugLog(`  Admin ${index + 1}: ${token.substring(0, 30)}...`);
      });
    } catch (error) {
      addDebugLog(`❌ Error checking admin tokens: ${error}`);
    }
  };

  const testNotifyUser = async () => {
    if (!user) {
      Alert.alert('Error', 'User not logged in');
      addDebugLog('❌ No user logged in');
      return;
    }

    setIsLoading(true);
    try {
      addDebugLog('📤 Sending test notification to current user...');
      await notifyUser(
        user.uid,
        'Test User Notification',
        'This is a test user notification via notifyUser function',
        { test: true, timestamp: Date.now() }
      );
      
      Alert.alert('Success', 'User notification sent! Check notification bar.');
      addDebugLog('✅ Test notification sent successfully');
    } catch (error) {
      console.error('User notification error:', error);
      Alert.alert('Error', `Failed to send user notification: ${(error as Error).message}`);
      addDebugLog(`❌ Error sending test notification: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testNotifyAdmins = async () => {
    setIsLoading(true);
    try {
      addDebugLog('📤 Sending test notification to all admins...');
      await notifyAdmins(
        'Test Admin Notification',
        'This is a test admin notification via notifyAdmins function',
        { test: true, timestamp: Date.now() }
      );
      
      Alert.alert('Success', 'Admin notification sent! Check notification bar.');
      addDebugLog('✅ Test admin notification sent successfully');
    } catch (error) {
      console.error('Admin notification error:', error);
      Alert.alert('Error', `Failed to send admin notification: ${(error as Error).message}`);
      addDebugLog(`❌ Error sending admin notification: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkNotificationSettings = async () => {
    try {
      const Notifications = await import('expo-notifications');
      const { granted } = await Notifications.getPermissionsAsync();
      
      Alert.alert(
        'Notification Settings',
        `Permission Status: ${granted ? 'granted' : 'denied'}\n\n` +
        `If status is not 'granted', notifications won't work.\n\n` +
        `Please check:\n` +
        `1. App notification settings in Android\n` +
        `2. Do Not Disturb mode\n` +
        `3. Battery optimization settings\n` +
        `4. App-specific notification permissions`
      );
    } catch (error) {
      Alert.alert('Error', `Failed to check settings: ${(error as Error).message}`);
    }
  };

  const testEmailLookup = async () => {
    if (!user) {
      addDebugLog('❌ No user logged in');
      return;
    }

    try {
      addDebugLog(`🔍 Testing email lookup for: ${user.email}`);
      const userId = await getUserIdByEmail(user.email || '');
      if (userId) {
        addDebugLog(`✅ Email lookup successful: ${userId}`);
      } else {
        addDebugLog('❌ Email lookup failed - user not found');
      }
    } catch (error) {
      addDebugLog(`❌ Error in email lookup: ${error}`);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Push Notification Debugger</Text>
        <Text style={styles.subtitle}>Please log in to use the debugger</Text>
      </View>
    );
  }

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
      </View>



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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Tools</Text>
        
        <TouchableOpacity style={[styles.button, styles.testButton]} onPress={checkUserToken}>
          <Text style={styles.buttonText}>Check User Token</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.testButton]} onPress={checkAdminTokens}>
          <Text style={styles.buttonText}>Check Admin Tokens</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.testButton]} onPress={testEmailLookup}>
          <Text style={styles.buttonText}>Test Email Lookup</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearDebugLogs}>
          <Text style={styles.buttonText}>Clear Debug Logs</Text>
        </TouchableOpacity>
      </View>

      {debugLogs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Logs</Text>
          <ScrollView style={styles.debugContainer}>
            {debugLogs.map((log, index) => (
              <Text key={index} style={styles.logText}>{log}</Text>
            ))}
          </ScrollView>
        </View>
      )}

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
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
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
    color: '#666',
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
  testButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
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
  debugContainer: {
    maxHeight: 200,
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 10,
  },
  logText: {
    color: '#00FF00',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});