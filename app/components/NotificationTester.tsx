import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { notifyUser } from '../services/notificationService';

export default function NotificationTester() {
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const testNotification = async () => {
    if (!user) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    setIsLoading(true);
    try {
      await notifyUser(
        user.uid,
        'Test Notification',
        'This is a test notification to verify push notifications are working!',
        { type: 'test', timestamp: Date.now() }
      );
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Test notification failed:', error);
      Alert.alert('Error', 'Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Notification Tester</Text>
      <Text style={styles.subtitle}>Test if push notifications are working</Text>
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testNotification}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Sending...' : 'Send Test Notification'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.info}>
        Make sure to check your device's notification settings and allow notifications for this app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  info: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});