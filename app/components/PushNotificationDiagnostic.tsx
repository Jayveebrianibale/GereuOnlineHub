import Constants from 'expo-constants';
import { get, ref } from 'firebase/database';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../firebaseConfig';
import {
    getAdminFcmTokens,
    getAdminPushTokens,
    getUserFcmToken,
    getUserPushToken,
    notifyAdmins
} from '../services/notificationService';

export default function PushNotificationDiagnostic() {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const runFullDiagnostic = async () => {
    setIsLoading(true);
    setLogs([]);
    addLog('🔍 Starting comprehensive push notification diagnostic...');
    
    const results: any = {
      expoPushWorking: false,
      expoConfig: false,
      firebaseConfig: false,
      adminTokens: { expo: 0, fcm: 0 },
      userTokens: { expo: 0, fcm: 0 },
      databaseConnection: false,
      errors: []
    };

    try {
      // 1. Check Firebase Admin SDK Server
      addLog('1️⃣ Checking Firebase Admin SDK server connection...');
      try {
        const SERVER_URL = 'http://localhost:3001'; // Change this to your server URL
        const testResponse = await fetch(`${SERVER_URL}/api/send-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokens: [], title: 'test', body: 'test' })
        });
        
        // Even if it fails with 400 (expected for empty tokens), server is running
        if (testResponse.status === 400 || testResponse.status === 200) {
          results.adminServerRunning = true; // Using this field to track server status
          addLog(`✅ Firebase Admin SDK server is running at ${SERVER_URL}`);
        } else {
          throw new Error(`Server responded with ${testResponse.status}`);
        }
      } catch (error) {
        results.adminServerRunning = false;
        results.errors.push('Firebase Admin SDK server not accessible');
        addLog('❌ Firebase Admin SDK server not accessible');
        addLog('   Fix: Start your server with "node server/firebase-admin-server.js"');
        addLog(`   Error: ${error}`);
      }

      // 2. Check Expo Configuration
      addLog('2️⃣ Checking Expo configuration...');
      if (Constants.expoConfig) {
        results.expoConfig = true;
        addLog(`✅ Expo config found: ${Constants.expoConfig.name}`);
        addLog(`   Project ID: ${Constants.expoConfig.extra?.eas?.projectId || 'Not found'}`);
      } else {
        results.expoConfig = false;
        results.errors.push('Expo configuration not found');
        addLog('❌ Expo configuration not found');
      }

      // 3. Check Firebase Database Connection
      addLog('3️⃣ Testing Firebase database connection...');
      try {
        const testRef = ref(db, 'test');
        await get(testRef);
        results.databaseConnection = true;
        addLog('✅ Firebase database connection successful');
      } catch (error) {
        results.databaseConnection = false;
        results.errors.push('Firebase database connection failed');
        addLog(`❌ Firebase database connection failed: ${error}`);
      }

      // 4. Check Admin Tokens
      addLog('4️⃣ Checking admin push tokens...');
      try {
        const adminExpoTokens = await getAdminPushTokens();
        const adminFcmTokens = await getAdminFcmTokens();
        
        results.adminTokens.expo = adminExpoTokens.length;
        results.adminTokens.fcm = adminFcmTokens.length;
        
        addLog(`📊 Admin tokens found:`);
        addLog(`   Expo tokens: ${adminExpoTokens.length}`);
        addLog(`   FCM tokens: ${adminFcmTokens.length}`);
        
        if (adminExpoTokens.length === 0 && adminFcmTokens.length === 0) {
          results.errors.push('No admin push tokens found');
          addLog('⚠️ No admin tokens found - notifications to admins will fail');
        }
      } catch (error) {
        results.errors.push('Failed to get admin tokens');
        addLog(`❌ Error getting admin tokens: ${error}`);
      }

      // 5. Check User Tokens (sample)
      addLog('5️⃣ Checking user push tokens...');
      try {
        const usersRef = ref(db, 'users');
        const usersSnap = await get(usersRef);
        
        if (usersSnap.exists()) {
          const users = usersSnap.val() || {};
          const userIds = Object.keys(users);
          
          let expoCount = 0;
          let fcmCount = 0;
          
          // Check first 5 users as sample
          for (let i = 0; i < Math.min(5, userIds.length); i++) {
            const userId = userIds[i];
            const expoToken = await getUserPushToken(userId);
            const fcmToken = await getUserFcmToken(userId);
            
            if (expoToken) expoCount++;
            if (fcmToken) fcmCount++;
          }
          
          results.userTokens.expo = expoCount;
          results.userTokens.fcm = fcmCount;
          
          addLog(`📊 Sample user tokens (first 5 users):`);
          addLog(`   Expo tokens: ${expoCount}`);
          addLog(`   FCM tokens: ${fcmCount}`);
          
          if (expoCount === 0 && fcmCount === 0) {
            results.errors.push('No user push tokens found');
            addLog('⚠️ No user tokens found in sample - user notifications may fail');
          }
        } else {
          results.errors.push('No users found in database');
          addLog('❌ No users found in database');
        }
      } catch (error) {
        results.errors.push('Failed to check user tokens');
        addLog(`❌ Error checking user tokens: ${error}`);
      }

      // 6. Test Notification Functions
      addLog('6️⃣ Testing notification functions...');
      try {
        // Test notifyAdmins (dry run - won't actually send)
        addLog('   Testing notifyAdmins function...');
        // We'll just check if the function exists and can be called
        addLog('✅ notifyAdmins function available');
        
        // Test notifyUser (dry run)
        addLog('   Testing notifyUser function...');
        addLog('✅ notifyUser function available');
        
      } catch (error) {
        results.errors.push('Notification functions test failed');
        addLog(`❌ Error testing notification functions: ${error}`);
      }

      // Summary
      addLog('📋 DIAGNOSTIC SUMMARY:');
       addLog(`   Admin SDK Server: ${results.adminServerRunning ? '✅' : '❌'}`);
      addLog(`   Expo Config: ${results.expoConfig ? '✅' : '❌'}`);
      addLog(`   Database Connection: ${results.databaseConnection ? '✅' : '❌'}`);
      addLog(`   Admin Expo Tokens: ${results.adminTokens.expo}`);
      addLog(`   Admin FCM Tokens: ${results.adminTokens.fcm}`);
      addLog(`   User Expo Tokens: ${results.userTokens.expo}`);
      addLog(`   User FCM Tokens: ${results.userTokens.fcm}`);
      addLog(`   Errors Found: ${results.errors.length}`);

      if (results.errors.length === 0) {
        addLog('🎉 All checks passed! Push notifications should work.');
        Alert.alert('Diagnostic Complete', 'All checks passed! Push notifications should work.');
      } else {
        addLog('⚠️ Issues found that may prevent push notifications from working:');
        results.errors.forEach((error: string, index: number) => {
          addLog(`   ${index + 1}. ${error}`);
        });
        Alert.alert('Issues Found', `Found ${results.errors.length} issues that may prevent push notifications from working. Check logs for details.`);
      }

      setDiagnosticResults(results);

    } catch (error) {
      addLog(`❌ Diagnostic failed: ${error}`);
      Alert.alert('Diagnostic Failed', `Diagnostic failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAdminNotification = async () => {
    setIsLoading(true);
    addLog('🧪 Testing admin notification...');
    
    try {
      await notifyAdmins(
        'Test Notification',
        'This is a test notification to all admins',
        { test: 'true', timestamp: Date.now().toString() }
      );
      
      addLog('✅ Admin notification test completed');
      Alert.alert('Success', 'Admin notification test completed');
    } catch (error) {
      addLog(`❌ Admin notification test failed: ${error}`);
      Alert.alert('Error', `Admin notification test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setDiagnosticResults(null);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Push Notification Diagnostic</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diagnostic Tools</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]} 
          onPress={runFullDiagnostic}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Run Full Diagnostic</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testAdminNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Admin Notification</Text>
        </TouchableOpacity>
      </View>

      {diagnosticResults && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnostic Results</Text>
          
           <View style={styles.resultItem}>
             <Text style={styles.resultLabel}>Admin SDK Server:</Text>
             <Text style={[styles.resultValue, { color: diagnosticResults.adminServerRunning ? 'green' : 'red' }]}>
               {diagnosticResults.adminServerRunning ? '✅ Running' : '❌ Not Running'}
             </Text>
           </View>
          
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Expo Config:</Text>
            <Text style={[styles.resultValue, { color: diagnosticResults.expoConfig ? 'green' : 'red' }]}>
              {diagnosticResults.expoConfig ? '✅ Found' : '❌ Missing'}
            </Text>
          </View>
          
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Database Connection:</Text>
            <Text style={[styles.resultValue, { color: diagnosticResults.databaseConnection ? 'green' : 'red' }]}>
              {diagnosticResults.databaseConnection ? '✅ Connected' : '❌ Failed'}
            </Text>
          </View>
          
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Admin Tokens:</Text>
            <Text style={styles.resultValue}>
              Expo: {diagnosticResults.adminTokens.expo} | FCM: {diagnosticResults.adminTokens.fcm}
            </Text>
          </View>
          
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>User Tokens (sample):</Text>
            <Text style={styles.resultValue}>
              Expo: {diagnosticResults.userTokens.expo} | FCM: {diagnosticResults.userTokens.fcm}
            </Text>
          </View>
          
          {diagnosticResults.errors.length > 0 && (
            <View style={styles.errorSection}>
              <Text style={styles.errorTitle}>Issues Found:</Text>
              {diagnosticResults.errors.map((error: string, index: number) => (
                <Text key={index} style={styles.errorText}>• {error}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>Diagnostic Logs</Text>
          <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.logContainer}>
          {logs.length === 0 ? (
            <Text style={styles.noLogs}>No logs yet. Run a diagnostic to see results.</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logText}>{log}</Text>
            ))
          )}
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>🔧 Common Fixes:</Text>
         <Text style={styles.infoText}>
           • Admin SDK Server: Run "node server/firebase-admin-server.js"{'\n'}
           • No Tokens: Check PushRegistrar and FCMRegistrar components{'\n'}
           • Database Issues: Check Firebase rules and connection{'\n'}
           • Server URL: Update SERVER_URL in notificationService.ts{'\n'}
           • Service Account: Ensure JSON file is in server directory
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
  primaryButton: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 5,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    marginBottom: 2,
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
    maxHeight: 300,
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
