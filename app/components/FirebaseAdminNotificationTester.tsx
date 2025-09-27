import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { sendFCMNotification, sendFCMToAdmins, sendFCMToUserByEmail } from '../services/firebaseAdminService';
import { notifyAdmins, notifyUser } from '../services/notificationService';

export default function FirebaseAdminNotificationTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testDirectFCM = async () => {
    setIsLoading(true);
    addLog('🧪 Testing direct FCM notification...');
    
    try {
      // This is a test - you'll need to replace with actual FCM tokens
      const testTokens = ['test-token-1', 'test-token-2'];
      
      await sendFCMNotification(
        testTokens,
        'Firebase Admin SDK Test',
        'This is a test notification sent via Firebase Admin SDK',
        { test: 'true', source: 'admin-sdk' }
      );
      
      addLog('✅ Direct FCM test completed');
      Alert.alert('Success', 'Direct FCM notification test completed');
    } catch (error) {
      addLog(`❌ Direct FCM test failed: ${error}`);
      Alert.alert('Error', `Direct FCM test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFCMToAdmins = async () => {
    setIsLoading(true);
    addLog('🧪 Testing FCM notification to admins...');
    
    try {
      await sendFCMToAdmins(
        'Admin FCM Test',
        'This notification was sent to all admins via Firebase Admin SDK',
        { test: 'true', source: 'admin-sdk', type: 'admin' }
      );
      
      addLog('✅ FCM admin notification test completed');
      Alert.alert('Success', 'FCM admin notification test completed');
    } catch (error) {
      addLog(`❌ FCM admin notification test failed: ${error}`);
      Alert.alert('Error', `FCM admin notification test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFCMToUser = async () => {
    setIsLoading(true);
    addLog('🧪 Testing FCM notification to user by email...');
    
    try {
      // Replace with an actual user email from your database
      const testEmail = 'test@example.com';
      
      await sendFCMToUserByEmail(
        testEmail,
        'User FCM Test',
        'This notification was sent to a specific user via Firebase Admin SDK',
        { test: 'true', source: 'admin-sdk', type: 'user' }
      );
      
      addLog('✅ FCM user notification test completed');
      Alert.alert('Success', 'FCM user notification test completed');
    } catch (error) {
      addLog(`❌ FCM user notification test failed: ${error}`);
      Alert.alert('Error', `FCM user notification test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testHybridNotification = async () => {
    setIsLoading(true);
    addLog('🧪 Testing hybrid notification (FCM + Expo fallback)...');
    
    try {
      // Replace with an actual user ID from your database
      const testUserId = 'test-user-id';
      
      await notifyUser(
        testUserId,
        'Hybrid Notification Test',
        'This notification uses FCM first, then falls back to Expo if needed',
        { test: 'true', source: 'hybrid', type: 'user' }
      );
      
      addLog('✅ Hybrid notification test completed');
      Alert.alert('Success', 'Hybrid notification test completed');
    } catch (error) {
      addLog(`❌ Hybrid notification test failed: ${error}`);
      Alert.alert('Error', `Hybrid notification test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testHybridAdminNotification = async () => {
    setIsLoading(true);
    addLog('🧪 Testing hybrid admin notification...');
    
    try {
      await notifyAdmins(
        'Hybrid Admin Test',
        'This admin notification uses FCM first, then falls back to Expo',
        { test: 'true', source: 'hybrid', type: 'admin' }
      );
      
      addLog('✅ Hybrid admin notification test completed');
      Alert.alert('Success', 'Hybrid admin notification test completed');
    } catch (error) {
      addLog(`❌ Hybrid admin notification test failed: ${error}`);
      Alert.alert('Error', `Hybrid admin notification test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Firebase Admin SDK Notification Tester</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Direct FCM Tests</Text>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testDirectFCM}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Direct FCM</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testFCMToAdmins}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test FCM to Admins</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testFCMToUser}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test FCM to User by Email</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hybrid Tests (FCM + Expo Fallback)</Text>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testHybridNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Hybrid User Notification</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testHybridAdminNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Hybrid Admin Notification</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>Test Logs</Text>
          <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.logContainer}>
          {logs.length === 0 ? (
            <Text style={styles.noLogs}>No logs yet. Run a test to see results.</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logText}>{log}</Text>
            ))
          )}
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️ Important Notes:</Text>
        <Text style={styles.infoText}>
          • Replace test tokens/emails with real ones from your database{'\n'}
          • FCM tokens must be valid and registered{'\n'}
          • Check console logs for detailed error information{'\n'}
          • Hybrid tests will try FCM first, then fallback to Expo{'\n'}
          • Make sure Firebase Admin SDK is properly configured
        </Text>
      </View>
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
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  logContainer: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    maxHeight: 200,
  },
  noLogs: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  logText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});
