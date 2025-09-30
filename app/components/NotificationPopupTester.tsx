// Safe import to prevent Expo Go errors
let Notifications: any = null;

const loadNotifications = async () => {
  try {
    const Constants = await import('expo-constants');
    if (Constants.default?.appOwnership !== 'expo') {
      Notifications = await import('expo-notifications');
    }
  } catch (error) {
    console.warn('expo-notifications not available:', error);
  }
};
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NotificationPopupTester() {
  const [isLoading, setIsLoading] = useState(false);

  const testNotificationPopup = async () => {
    setIsLoading(true);
    
    try {
      await loadNotifications();
      
      if (!Notifications) {
        Alert.alert('Not Available', 'Push notifications are not available in Expo Go. Use a development build to test notifications.');
        return;
      }
      
      // Test local notification that should pop up at the top
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Test Popup Notification',
          body: 'This should appear as a popup at the top of your screen',
          data: { test: true },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
      });
      
      Alert.alert('Success', 'Test notification scheduled! Check if it appears as a popup at the top.');
    } catch (error) {
      Alert.alert('Error', `Failed to schedule notification: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkNotificationSettings = async () => {
    try {
      await loadNotifications();
      
      if (!Notifications) {
        Alert.alert('Not Available', 'Push notifications are not available in Expo Go. Use a development build to test notifications.');
        return;
      }
      
      const { status } = await Notifications.getPermissionsAsync();
      Alert.alert(
        'Notification Status', 
        `Permission Status: ${status}\n\n` +
        `If status is not 'granted', notifications won't show as popups.\n\n` +
        `Make sure to:\n` +
        `1. Grant notification permissions\n` +
        `2. Check device notification settings\n` +
        `3. Ensure app notifications are enabled`
      );
    } catch (error) {
      Alert.alert('Error', `Failed to check permissions: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Notification Popup Tester</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testNotificationPopup}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Popup Notification'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={checkNotificationSettings}
      >
        <Text style={styles.buttonText}>Check Notification Settings</Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>📋 What to Check:</Text>
        <Text style={styles.infoText}>• Notification should appear as popup at top</Text>
        <Text style={styles.infoText}>• Should play sound and vibrate</Text>
        <Text style={styles.infoText}>• Should show in notification panel</Text>
        <Text style={styles.infoText}>• Should bypass Do Not Disturb</Text>
      </View>
    </View>
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
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  info: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
});
