import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';

export default function NotificationEndpointTester() {
  const { user } = useAuthContext();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testExpoPushEndpoint = async () => {
    if (!user) {
      addResult('❌ No user logged in');
      return;
    }

    setIsLoading(true);
    try {
      addResult('🧪 Testing Expo Push API endpoint...');
      
      // Test with a dummy token to see if the endpoint is working
      const testMessage = {
        to: 'ExpoPushToken[test-token]',
        title: 'Test Notification',
        body: 'This is a test notification',
        data: { type: 'test' }
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([testMessage]),
      });

      addResult(`📡 Expo Push API Response Status: ${response.status}`);
      
      const responseText = await response.text();
      addResult(`📡 Response: ${responseText.substring(0, 200)}...`);
      
      if (response.ok) {
        addResult('✅ Expo Push API endpoint is accessible');
      } else {
        addResult('❌ Expo Push API endpoint returned error');
      }
    } catch (error) {
      addResult(`❌ Error testing Expo Push API: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFirebaseConnection = async () => {
    if (!user) {
      addResult('❌ No user logged in');
      return;
    }

    setIsLoading(true);
    try {
      addResult('🔥 Testing Firebase connection...');
      
      // Test Firebase connection by trying to read user data
      const { get, ref } = await import('firebase/database');
      const { db } = await import('../firebaseConfig');
      
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        addResult('✅ Firebase connection successful');
        addResult(`👤 User data: ${JSON.stringify(userData, null, 2).substring(0, 200)}...`);
      } else {
        addResult('❌ User data not found in Firebase');
      }
    } catch (error) {
      addResult(`❌ Firebase connection error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testNotificationPermissions = async () => {
    setIsLoading(true);
    try {
      addResult('🔔 Testing notification permissions...');
      
      const Notifications = await import('expo-notifications');
      const { status } = await Notifications.getPermissionsAsync();
      
      addResult(`📱 Current permission status: ${status}`);
      
      if (status !== 'granted') {
        addResult('⚠️ Requesting notification permissions...');
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        addResult(`📱 New permission status: ${newStatus}`);
      } else {
        addResult('✅ Notification permissions already granted');
      }
    } catch (error) {
      addResult(`❌ Error testing permissions: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPushTokenGeneration = async () => {
    if (!user) {
      addResult('❌ No user logged in');
      return;
    }

    setIsLoading(true);
    try {
      addResult('🎫 Testing push token generation...');
      
      const Constants = await import('expo-constants');
      const Notifications = await import('expo-notifications');
      
      const expoConfig = Constants.default?.expoConfig as any;
      const projectId = expoConfig?.extra?.eas?.projectId;
      
      addResult(`🆔 Project ID: ${projectId}`);
      
      if (!projectId) {
        addResult('❌ No project ID found');
        return;
      }
      
      const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
      
      if (pushToken?.data) {
        addResult(`✅ Push token generated: ${pushToken.data.substring(0, 50)}...`);
      } else {
        addResult('❌ Failed to generate push token');
      }
    } catch (error) {
      addResult(`❌ Error generating push token: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Notification Endpoint Tester</Text>
        <Text style={styles.subtitle}>Please log in to use the tester</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Endpoint Tester</Text>
      <Text style={styles.subtitle}>Test notification system components</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={testExpoPushEndpoint}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Expo Push API</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.firebaseButton]} 
          onPress={testFirebaseConnection}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Firebase Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.permissionButton]} 
          onPress={testNotificationPermissions}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Permissions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.tokenButton]} 
          onPress={testPushTokenGeneration}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Token Generation</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </ScrollView>
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
    fontSize: 20,
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
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: '#007AFF',
  },
  firebaseButton: {
    backgroundColor: '#FF9500',
  },
  permissionButton: {
    backgroundColor: '#34C759',
  },
  tokenButton: {
    backgroundColor: '#AF52DE',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 10,
  },
  resultText: {
    color: '#00FF00',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
