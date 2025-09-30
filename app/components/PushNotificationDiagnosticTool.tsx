import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import {
    cleanupInvalidTokens,
    getAdminPushTokens,
    getUserPushToken,
    notifyAdmins,
    notifyUser
} from '../services/notificationService';

export default function PushNotificationDiagnostic() {
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const runDiagnostic = async () => {
    setIsLoading(true);
    setLogs([]);
    addLog('🔍 Starting push notification diagnostic...');
    
    const results: any = {
      userAuthenticated: false,
      userToken: null,
      adminTokens: [],
      expoConfig: false,
      permissions: false,
      tokenValidation: false,
    };

    try {
      // Check user authentication
      if (user) {
        results.userAuthenticated = true;
        addLog('✅ User is authenticated');
        
        // Check user's push token
        const userToken = await getUserPushToken(user.uid);
        results.userToken = userToken;
        if (userToken) {
          addLog(`✅ User push token found: ${userToken.substring(0, 30)}...`);
          results.tokenValidation = userToken.startsWith('ExponentPushToken[') || userToken.startsWith('ExpoPushToken[');
        } else {
          addLog('❌ No user push token found');
        }
      } else {
        addLog('❌ User not authenticated');
      }

      // Check admin tokens
      const adminTokens = await getAdminPushTokens();
      results.adminTokens = adminTokens;
      addLog(`📊 Found ${adminTokens.length} admin tokens`);

      // Check Expo configuration
      try {
        const Constants = await import('expo-constants');
        const expoConfig = Constants.default?.expoConfig;
        const projectId = expoConfig?.extra?.eas?.projectId;
        results.expoConfig = !!projectId;
        if (projectId) {
          addLog(`✅ EAS projectId found: ${projectId}`);
        } else {
          addLog('❌ No EAS projectId found');
        }
      } catch (error) {
        addLog('❌ Failed to check Expo config');
      }

      // Check notification permissions
      try {
        const Constants = await import('expo-constants');
        const appOwnership = Constants.default?.appOwnership;
        if (appOwnership === 'expo') {
          results.permissions = false;
          addLog('❌ Running in Expo Go - permissions not available');
        } else {
          const Notifications = await import('expo-notifications');
          const { status } = await Notifications.getPermissionsAsync();
          results.permissions = status === 'granted';
          if (status === 'granted') {
            addLog('✅ Notification permissions granted');
          } else {
            addLog(`❌ Notification permissions: ${status}`);
          }
        }
      } catch (error) {
        addLog('❌ Failed to check permissions');
      }

    } catch (error) {
      addLog(`❌ Diagnostic error: ${error}`);
    }

    setDiagnosticResults(results);
    setIsLoading(false);
    addLog('✅ Diagnostic completed');
  };

  const testUserNotification = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      addLog('📱 Testing user notification...');
      await notifyUser(user.uid, 'Test Notification', 'This is a test notification from the diagnostic tool');
      addLog('✅ User notification sent');
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      addLog(`❌ User notification failed: ${error}`);
      Alert.alert('Error', 'Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  };

  const testAdminNotification = async () => {
    setIsLoading(true);
    try {
      addLog('📱 Testing admin notification...');
      await notifyAdmins('Test Admin Notification', 'This is a test notification for admins');
      addLog('✅ Admin notification sent');
      Alert.alert('Success', 'Test admin notification sent!');
    } catch (error) {
      addLog(`❌ Admin notification failed: ${error}`);
      Alert.alert('Error', 'Failed to send admin notification');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupTokens = async () => {
    setIsLoading(true);
    try {
      addLog('🧹 Cleaning up invalid tokens...');
      await cleanupInvalidTokens();
      addLog('✅ Token cleanup completed');
      Alert.alert('Success', 'Token cleanup completed!');
    } catch (error) {
      addLog(`❌ Token cleanup failed: ${error}`);
      Alert.alert('Error', 'Token cleanup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Push Notification Diagnostic</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={runDiagnostic}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Running Diagnostic...' : 'Run Diagnostic'}
        </Text>
      </TouchableOpacity>

      {diagnosticResults && (
        <View style={styles.results}>
          <Text style={styles.sectionTitle}>Diagnostic Results</Text>
          
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>User Authenticated:</Text>
            <Text style={[styles.resultValue, { color: diagnosticResults.userAuthenticated ? 'green' : 'red' }]}>
              {diagnosticResults.userAuthenticated ? '✅ Yes' : '❌ No'}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>User Token:</Text>
            <Text style={[styles.resultValue, { color: diagnosticResults.userToken ? 'green' : 'red' }]}>
              {diagnosticResults.userToken ? `✅ ${diagnosticResults.userToken.substring(0, 30)}...` : '❌ None'}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Token Valid:</Text>
            <Text style={[styles.resultValue, { color: diagnosticResults.tokenValidation ? 'green' : 'red' }]}>
              {diagnosticResults.tokenValidation ? '✅ Valid Expo Token' : '❌ Invalid Token'}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Admin Tokens:</Text>
            <Text style={[styles.resultValue, { color: diagnosticResults.adminTokens.length > 0 ? 'green' : 'orange' }]}>
              {diagnosticResults.adminTokens.length > 0 ? `✅ ${diagnosticResults.adminTokens.length} tokens` : '⚠️ No admin tokens'}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Expo Config:</Text>
            <Text style={[styles.resultValue, { color: diagnosticResults.expoConfig ? 'green' : 'red' }]}>
              {diagnosticResults.expoConfig ? '✅ Configured' : '❌ Missing'}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Permissions:</Text>
            <Text style={[styles.resultValue, { color: diagnosticResults.permissions ? 'green' : 'red' }]}>
              {diagnosticResults.permissions ? '✅ Granted' : '❌ Denied'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Test Notifications</Text>
        
        <TouchableOpacity 
          style={[styles.testButton, isLoading && styles.buttonDisabled]} 
          onPress={testUserNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test User Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.testButton, isLoading && styles.buttonDisabled]} 
          onPress={testAdminNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Admin Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.testButton, isLoading && styles.buttonDisabled]} 
          onPress={cleanupTokens}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Cleanup Invalid Tokens</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logSection}>
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>Diagnostic Logs</Text>
          <TouchableOpacity onPress={clearLogs}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.logContainer}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
        </ScrollView>
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
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  testSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  logSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logContainer: {
    maxHeight: 200,
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 4,
  },
  logText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
});
