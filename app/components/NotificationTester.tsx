import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { getAdminPushTokens, getUserPushToken, notifyAdmins, notifyUser } from '../services/notificationService';

export default function NotificationTester() {
  const { user } = useAuthContext();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testUserToken = async () => {
    if (!user) {
      addResult('❌ No user logged in');
      return;
    }
    
    setLoading(true);
    try {
      addResult('🔍 Checking user token...');
      const token = await getUserPushToken(user.uid);
      if (token) {
        addResult(`✅ User token found: ${token.substring(0, 30)}...`);
      } else {
        addResult('❌ No user token found');
      }
    } catch (error) {
      addResult(`❌ Error checking user token: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAdminTokens = async () => {
    setLoading(true);
    try {
      addResult('🔍 Checking admin tokens...');
      const tokens = await getAdminPushTokens();
      addResult(`📊 Found ${tokens.length} admin tokens`);
      
      if (tokens.length > 0) {
        tokens.forEach((token, index) => {
          addResult(`  ${index + 1}. ${token.substring(0, 30)}...`);
        });
      } else {
        addResult('⚠️ No admin tokens found - check if admin users have push tokens');
      }
    } catch (error) {
      addResult(`❌ Error checking admin tokens: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testUserNotification = async () => {
    if (!user) {
      addResult('❌ No user logged in');
      return;
    }
    
    setLoading(true);
    try {
      addResult('📤 Sending test notification to user...');
      await notifyUser(
        user.uid,
        'Test User Notification',
        'This is a test notification from the tester',
        { test: true, timestamp: Date.now() }
      );
      addResult('✅ User notification sent successfully');
    } catch (error) {
      addResult(`❌ Error sending user notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAdminNotification = async () => {
    setLoading(true);
    try {
      addResult('📤 Sending test notification to admins...');
      await notifyAdmins(
        'Test Admin Notification',
        'This is a test notification for admins',
        { test: true, timestamp: Date.now() }
      );
      addResult('✅ Admin notification sent successfully');
    } catch (error) {
      addResult(`❌ Error sending admin notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const runFullTest = async () => {
    clearResults();
    addResult('🚀 Starting full notification test...');
    
    // Test user token
    await testUserToken();
    
    // Test admin tokens
    await testAdminTokens();
    
    // Test user notification
    await testUserNotification();
    
    // Test admin notification
    await testAdminNotification();
    
    addResult('🏁 Test completed!');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedText type="title" style={styles.title}>
          Notification Tester
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          Test push notification functionality step by step
        </ThemedText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]} 
            onPress={runFullTest}
            disabled={loading}
          >
            <MaterialIcons name="play-arrow" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Run Full Test</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]} 
            onPress={testUserToken}
            disabled={loading}
          >
            <MaterialIcons name="person" size={20} color="#00B2FF" />
            <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>Test User Token</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]} 
            onPress={testAdminTokens}
            disabled={loading}
          >
            <MaterialIcons name="admin-panel-settings" size={20} color="#00B2FF" />
            <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>Test Admin Tokens</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.testButton, loading && styles.buttonDisabled]} 
            onPress={testUserNotification}
            disabled={loading}
          >
            <MaterialIcons name="notifications" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Test User Notification</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.testButton, loading && styles.buttonDisabled]} 
            onPress={testAdminNotification}
            disabled={loading}
          >
            <MaterialIcons name="notifications-active" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Test Admin Notification</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.clearButton, loading && styles.buttonDisabled]} 
            onPress={clearResults}
            disabled={loading}
          >
            <MaterialIcons name="clear" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Clear Results</ThemedText>
          </TouchableOpacity>
        </View>

        {testResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <ThemedText type="subtitle" style={styles.resultsTitle}>
              Test Results
            </ThemedText>
            
            <ScrollView style={styles.resultsScroll} nestedScrollEnabled>
              {testResults.map((result, index) => (
                <ThemedText key={index} style={styles.resultText}>
                  {result}
                </ThemedText>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#001A5C',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 24,
    color: '#0051C1',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#00B2FF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00B2FF',
  },
  testButton: {
    backgroundColor: '#10B981',
  },
  clearButton: {
    backgroundColor: '#6B7280',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#00B2FF',
  },
  resultsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    maxHeight: 400,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#001A5C',
  },
  resultsScroll: {
    maxHeight: 300,
  },
  resultText: {
    fontSize: 12,
    color: '#212529',
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16,
  },
});
