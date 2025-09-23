import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import {
    getAdminPushTokens,
    getUserIdByEmail,
    getUserPushToken,
    notifyAdmins,
    notifyUser
} from '../services/notificationService';

export default function PushNotificationDebugger() {
  const { user } = useAuthContext();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  const checkUserToken = async () => {
    if (!user) {
      addDebugInfo('❌ No user logged in');
      return;
    }

    try {
      addDebugInfo(`🔍 Checking push token for user: ${user.email}`);
      const token = await getUserPushToken(user.uid);
      if (token) {
        addDebugInfo(`✅ User push token found: ${token.substring(0, 30)}...`);
      } else {
        addDebugInfo('❌ No push token found for user');
      }
    } catch (error) {
      addDebugInfo(`❌ Error checking user token: ${error}`);
    }
  };

  const checkAdminTokens = async () => {
    try {
      addDebugInfo('🔍 Checking admin push tokens...');
      const tokens = await getAdminPushTokens();
      addDebugInfo(`📊 Found ${tokens.length} admin tokens`);
      tokens.forEach((token, index) => {
        addDebugInfo(`  Admin ${index + 1}: ${token.substring(0, 30)}...`);
      });
    } catch (error) {
      addDebugInfo(`❌ Error checking admin tokens: ${error}`);
    }
  };

  const testUserNotification = async () => {
    if (!user) {
      addDebugInfo('❌ No user logged in');
      return;
    }

    setIsLoading(true);
    try {
      addDebugInfo('📤 Sending test notification to current user...');
      await notifyUser(
        user.uid,
        'Test Notification',
        'This is a test notification from the debugger',
        { type: 'test', timestamp: Date.now() }
      );
      addDebugInfo('✅ Test notification sent successfully');
    } catch (error) {
      addDebugInfo(`❌ Error sending test notification: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAdminNotification = async () => {
    setIsLoading(true);
    try {
      addDebugInfo('📤 Sending test notification to all admins...');
      await notifyAdmins(
        'Test Admin Notification',
        'This is a test notification to all admins',
        { type: 'test', timestamp: Date.now() }
      );
      addDebugInfo('✅ Test admin notification sent successfully');
    } catch (error) {
      addDebugInfo(`❌ Error sending admin notification: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testEmailLookup = async () => {
    if (!user) {
      addDebugInfo('❌ No user logged in');
      return;
    }

    try {
      addDebugInfo(`🔍 Testing email lookup for: ${user.email}`);
      const userId = await getUserIdByEmail(user.email);
      if (userId) {
        addDebugInfo(`✅ Email lookup successful: ${userId}`);
      } else {
        addDebugInfo('❌ Email lookup failed - user not found');
      }
    } catch (error) {
      addDebugInfo(`❌ Error in email lookup: ${error}`);
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
    <View style={styles.container}>
      <Text style={styles.title}>Push Notification Debugger</Text>
      <Text style={styles.subtitle}>Debug push notification issues</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={checkUserToken}>
          <Text style={styles.buttonText}>Check User Token</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={checkAdminTokens}>
          <Text style={styles.buttonText}>Check Admin Tokens</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testEmailLookup}>
          <Text style={styles.buttonText}>Test Email Lookup</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={testUserNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Sending...' : 'Test User Notification'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={testAdminNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Sending...' : 'Test Admin Notification'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearDebugInfo}>
          <Text style={styles.buttonText}>Clear Debug Info</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.debugContainer}>
        {debugInfo.map((info, index) => (
          <Text key={index} style={styles.debugText}>{info}</Text>
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
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  debugContainer: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 10,
  },
  debugText: {
    color: '#00FF00',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});