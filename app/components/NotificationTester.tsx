import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { sendExpoPushAsync } from '../services/notificationService';

export default function NotificationTester() {
  const { user } = useAuthContext();

  const testNotification = async () => {
    if (!user) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    try {
      await sendExpoPushAsync({
        to: user.uid, // This should be the push token, not user ID
        title: 'Test Notification',
        body: 'This is a test notification from the app',
        sound: 'default',
        priority: 'high',
        data: { test: true }
      });
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Test notification error:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const testLocalNotification = async () => {
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Local Test Notification',
          body: 'This is a local test notification',
          sound: 'default',
        },
        trigger: { seconds: 1 },
      });
      Alert.alert('Success', 'Local test notification scheduled!');
    } catch (error) {
      console.error('Local notification error:', error);
      Alert.alert('Error', 'Failed to schedule local notification');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Tester</Text>
      <TouchableOpacity style={styles.button} onPress={testLocalNotification}>
        <Text style={styles.buttonText}>Test Local Notification</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={testNotification}>
        <Text style={styles.buttonText}>Test Push Notification</Text>
      </TouchableOpacity>
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
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});