import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAdminPushTokens, notifyAdmins } from '../services/notificationService';

export default function AdminTokenTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testAdminTokens = async () => {
    setIsLoading(true);
    addLog('🔍 Testing admin token detection...');
    
    try {
      const tokens = await getAdminPushTokens();
      addLog(`📊 Found ${tokens.length} admin tokens`);
      
      tokens.forEach((token, index) => {
        addLog(`   Token ${index + 1}: ${token.substring(0, 30)}...`);
      });
      
      if (tokens.length > 0) {
        addLog('✅ Admin tokens detected successfully!');
        Alert.alert('Success', `Found ${tokens.length} admin tokens`);
      } else {
        addLog('⚠️ No admin tokens found');
        Alert.alert('Warning', 'No admin tokens found');
      }
    } catch (error) {
      addLog(`❌ Error getting admin tokens: ${error}`);
      Alert.alert('Error', `Error getting admin tokens: ${error}`);
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
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Admin Token Tester</Text>
      
      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testAdminTokens}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Admin Token Detection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testAdminNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Admin Notification</Text>
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
        <Text style={styles.infoTitle}>ℹ️ What this tests:</Text>
        <Text style={styles.infoText}>
          • Admin token detection from Firebase database{'\n'}
          • Token validation and filtering{'\n'}
          • Notification sending with fallback{'\n'}
          • Server connection (if server is running){'\n'}
          • Expo Push fallback (if server fails)
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
