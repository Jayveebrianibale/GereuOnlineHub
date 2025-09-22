import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import {
    getAdminPushTokens,
    getUserPushToken,
    notifyAdmins,
    notifyUser
} from '../services/notificationService';

export default function PushNotificationDebugger() {
  const { user } = useAuthContext();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkUserToken = async () => {
    if (!user) {
      Alert.alert('Error', 'No user logged in');
      return;
    }
    
    setLoading(true);
    try {
      const token = await getUserPushToken(user.uid);
      setDebugInfo(prev => ({
        ...prev,
        userToken: token,
        userTokenStatus: token ? 'Found' : 'Not Found'
      }));
    } catch (error) {
      console.error('Error checking user token:', error);
      Alert.alert('Error', 'Failed to check user token');
    } finally {
      setLoading(false);
    }
  };

  const checkAdminTokens = async () => {
    setLoading(true);
    try {
      const tokens = await getAdminPushTokens();
      setDebugInfo(prev => ({
        ...prev,
        adminTokens: tokens,
        adminTokenCount: tokens.length
      }));
    } catch (error) {
      console.error('Error checking admin tokens:', error);
      Alert.alert('Error', 'Failed to check admin tokens');
    } finally {
      setLoading(false);
    }
  };

  const testUserNotification = async () => {
    if (!user) {
      Alert.alert('Error', 'No user logged in');
      return;
    }
    
    setLoading(true);
    try {
      await notifyUser(
        user.uid,
        'Test Notification',
        'This is a test notification from the debugger',
        { test: true, timestamp: Date.now() }
      );
      Alert.alert('Success', 'Test notification sent to user');
    } catch (error) {
      console.error('Error sending user notification:', error);
      Alert.alert('Error', 'Failed to send user notification');
    } finally {
      setLoading(false);
    }
  };

  const testAdminNotification = async () => {
    setLoading(true);
    try {
      await notifyAdmins(
        'Test Admin Notification',
        'This is a test notification for admins',
        { test: true, timestamp: Date.now() }
      );
      Alert.alert('Success', 'Test notification sent to admins');
    } catch (error) {
      console.error('Error sending admin notification:', error);
      Alert.alert('Error', 'Failed to send admin notification');
    } finally {
      setLoading(false);
    }
  };

  const runFullDiagnostic = async () => {
    setLoading(true);
    try {
      // Check user token
      const userToken = user ? await getUserPushToken(user.uid) : null;
      
      // Check admin tokens
      const adminTokens = await getAdminPushTokens();
      
      setDebugInfo({
        userToken,
        userTokenStatus: userToken ? 'Found' : 'Not Found',
        adminTokens,
        adminTokenCount: adminTokens.length,
        userRole: user?.role || 'Not logged in',
        userId: user?.uid || 'Not logged in',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error running diagnostic:', error);
      Alert.alert('Error', 'Failed to run diagnostic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedText type="title" style={styles.title}>
          Push Notification Debugger
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          Use this tool to debug push notification issues
        </ThemedText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={runFullDiagnostic}
            disabled={loading}
          >
            <MaterialIcons name="bug-report" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Run Full Diagnostic</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]} 
            onPress={checkUserToken}
            disabled={loading}
          >
            <MaterialIcons name="person" size={20} color="#00B2FF" />
            <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>Check User Token</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]} 
            onPress={checkAdminTokens}
            disabled={loading}
          >
            <MaterialIcons name="admin-panel-settings" size={20} color="#00B2FF" />
            <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>Check Admin Tokens</ThemedText>
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
        </View>

        {debugInfo && (
          <View style={styles.debugContainer}>
            <ThemedText type="subtitle" style={styles.debugTitle}>
              Debug Information
            </ThemedText>
            
            <View style={styles.debugItem}>
              <ThemedText style={styles.debugLabel}>User ID:</ThemedText>
              <ThemedText style={styles.debugValue}>{debugInfo.userId}</ThemedText>
            </View>
            
            <View style={styles.debugItem}>
              <ThemedText style={styles.debugLabel}>User Role:</ThemedText>
              <ThemedText style={styles.debugValue}>{debugInfo.userRole}</ThemedText>
            </View>
            
            <View style={styles.debugItem}>
              <ThemedText style={styles.debugLabel}>User Token Status:</ThemedText>
              <ThemedText style={[
                styles.debugValue, 
                debugInfo.userTokenStatus === 'Found' ? styles.success : styles.error
              ]}>
                {debugInfo.userTokenStatus}
              </ThemedText>
            </View>
            
            {debugInfo.userToken && (
              <View style={styles.debugItem}>
                <ThemedText style={styles.debugLabel}>User Token:</ThemedText>
                <ThemedText style={styles.debugValue} numberOfLines={2}>
                  {debugInfo.userToken.substring(0, 50)}...
                </ThemedText>
              </View>
            )}
            
            <View style={styles.debugItem}>
              <ThemedText style={styles.debugLabel}>Admin Token Count:</ThemedText>
              <ThemedText style={[
                styles.debugValue,
                debugInfo.adminTokenCount > 0 ? styles.success : styles.error
              ]}>
                {debugInfo.adminTokenCount}
              </ThemedText>
            </View>
            
            {debugInfo.adminTokens && debugInfo.adminTokens.length > 0 && (
              <View style={styles.debugItem}>
                <ThemedText style={styles.debugLabel}>Admin Tokens:</ThemedText>
                <ThemedText style={styles.debugValue}>
                  {debugInfo.adminTokens.map((token: string, index: number) => (
                    `${index + 1}. ${token.substring(0, 30)}...`
                  )).join('\n')}
                </ThemedText>
              </View>
            )}
            
            <View style={styles.debugItem}>
              <ThemedText style={styles.debugLabel}>Last Updated:</ThemedText>
              <ThemedText style={styles.debugValue}>{debugInfo.timestamp}</ThemedText>
            </View>
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
    backgroundColor: '#00B2FF',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00B2FF',
  },
  testButton: {
    backgroundColor: '#10B981',
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
  debugContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#001A5C',
  },
  debugItem: {
    marginBottom: 12,
  },
  debugLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  debugValue: {
    fontSize: 14,
    color: '#212529',
    fontFamily: 'monospace',
  },
  success: {
    color: '#10B981',
    fontWeight: '600',
  },
  error: {
    color: '#EF4444',
    fontWeight: '600',
  },
});
