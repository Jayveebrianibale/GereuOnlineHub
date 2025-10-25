import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { notifyAdmins, notifyUser } from '../services/notificationService';

export default function NotificationTester() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthContext();

  const testUserNotification = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    setIsLoading(true);
    try {
      await notifyUser(
        user.uid,
        '🧪 Test Notification',
        'This is a test push notification! If you see this, push notifications are working.',
        { type: 'test', timestamp: Date.now() }
      );
      Alert.alert('Success', 'Test notification sent! Check your notification bar.');
    } catch (error) {
      console.error('Test notification failed:', error);
      Alert.alert('Error', 'Failed to send test notification. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const testAdminNotification = async () => {
    setIsLoading(true);
    try {
      await notifyAdmins(
        '🧪 Admin Test Notification',
        'This is a test admin notification! If you see this, admin notifications are working.',
        { type: 'admin_test', timestamp: Date.now() }
      );
      Alert.alert('Success', 'Test admin notification sent! Check admin devices.');
    } catch (error) {
      console.error('Test admin notification failed:', error);
      Alert.alert('Error', 'Failed to send test admin notification. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkExpoGoStatus = () => {
    Alert.alert(
      'Expo Go Status',
      'If you are running in Expo Go, push notifications will NOT work. You need to create a development build or production build for push notifications to work.',
      [
        { text: 'OK' },
        { text: 'Create Build', onPress: () => {
          Alert.alert(
            'Create Build',
            'Run: eas build --profile development --platform android',
            [{ text: 'OK' }]
          );
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Notification Tester</Text>
      
      <TouchableOpacity 
        style={[styles.button, styles.userButton]} 
        onPress={testUserNotification}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test User Notification'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.adminButton]} 
        onPress={testAdminNotification}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Admin Notification'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.infoButton]} 
        onPress={checkExpoGoStatus}
      >
        <Text style={styles.buttonText}>Check Expo Go Status</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Note: Push notifications only work in development builds or production builds, not in Expo Go.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
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
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  userButton: {
    backgroundColor: '#007AFF',
  },
  adminButton: {
    backgroundColor: '#FF9500',
  },
  infoButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});