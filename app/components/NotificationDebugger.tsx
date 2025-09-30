import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { getAdminPushTokens, getUserPushToken, notifyUserByEmail } from '../services/notificationService';
// Safe import to prevent Expo Go errors
let Notifications: any = null;

const loadNotifications = async () => {
  try {
    const Constants = await import('expo-constants');
    if (Constants.default?.appOwnership !== 'expo') {
      Notifications = await import('expo-notifications');
    }
  } catch (error) {
    console.warn('expo-notifications not available:', error);
  }
};

export default function NotificationDebugger() {
  const { user } = useAuthContext();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('Unknown');
  const [expoToken, setExpoToken] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  useEffect(() => {
    checkInitialStatus();
  }, []);

  const checkInitialStatus = async () => {
    addDebugInfo('🔍 Checking initial notification status...');
    
    // Check if running in Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';
    addDebugInfo(`📱 App ownership: ${Constants.appOwnership}`);
    
    if (isExpoGo) {
      addDebugInfo('⚠️ Running in Expo Go - Push notifications limited');
      addDebugInfo('💡 Use development build for full functionality');
    }

    // Check device info
    addDebugInfo(`📱 Device: ${Device.isDevice ? 'Real device' : 'Simulator/Emulator'}`);
    addDebugInfo(`📱 Platform: ${Device.osName} ${Device.osVersion}`);
    
    setDeviceInfo({
      isDevice: Device.isDevice,
      osName: Device.osName,
      osVersion: Device.osVersion,
      isExpoGo
    });

    // Check permissions
    try {
      await loadNotifications();
      
      if (!Notifications) {
        addDebugInfo('⚠️ Running in Expo Go - Push notifications not available');
        setPermissionStatus('unavailable');
        return;
      }
      
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
      addDebugInfo(`🔐 Permission status: ${status}`);
      
      if (status === 'granted') {
        addDebugInfo('✅ Notifications are enabled');
      } else {
        addDebugInfo('❌ Notifications are disabled');
      }
    } catch (error) {
      addDebugInfo(`❌ Error checking permissions: ${error}`);
    }
  };

  const requestPermissions = async () => {
    setLoading(true);
    try {
      addDebugInfo('🔐 Requesting notification permissions...');
      
      await loadNotifications();
      
      if (!Notifications) {
        addDebugInfo('⚠️ Running in Expo Go - Cannot request permissions');
        Alert.alert('Not Available', 'Push notifications are not available in Expo Go. Use a development build to test notifications.');
        return;
      }
      
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        addDebugInfo('✅ Permission granted!');
        Alert.alert('Success', 'Notification permissions granted!');
      } else {
        addDebugInfo('❌ Permission denied');
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings');
      }
    } catch (error) {
      addDebugInfo(`❌ Error requesting permissions: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getExpoPushToken = async () => {
    setLoading(true);
    try {
      addDebugInfo('🔑 Getting Expo push token...');
      
      if (Constants.appOwnership === 'expo') {
        addDebugInfo('⚠️ Cannot get push token in Expo Go');
        return;
      }

      if (!Device.isDevice) {
        addDebugInfo('⚠️ Cannot get push token on simulator');
        return;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        addDebugInfo('❌ No EAS project ID found');
        return;
      }

      addDebugInfo(`📋 Project ID: ${projectId}`);
      
      await loadNotifications();
      
      if (!Notifications) {
        addDebugInfo('⚠️ Running in Expo Go - Cannot get push token');
        return;
      }
      
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      setExpoToken(token.data);
      addDebugInfo(`✅ Expo token: ${token.data.substring(0, 30)}...`);
      
    } catch (error) {
      addDebugInfo(`❌ Error getting Expo token: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testLocalNotification = async () => {
    setLoading(true);
    try {
      addDebugInfo('🔔 Testing local notification...');
      
      await loadNotifications();
      
      if (!Notifications) {
        addDebugInfo('⚠️ Running in Expo Go - Cannot test notifications');
        Alert.alert('Not Available', 'Push notifications are not available in Expo Go. Use a development build to test notifications.');
        return;
      }
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from the debugger',
          data: { test: true },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 },
      });
      
      addDebugInfo('✅ Local notification scheduled');
    } catch (error) {
      addDebugInfo(`❌ Error scheduling notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testPushNotification = async () => {
    if (!user) {
      addDebugInfo('❌ No user logged in');
      return;
    }

    setLoading(true);
    try {
      addDebugInfo('📤 Testing push notification to current user...');
      
      const userToken = await getUserPushToken(user.uid);
      if (!userToken) {
        addDebugInfo('❌ No push token found for current user');
        return;
      }

      addDebugInfo(`📋 User token: ${userToken.substring(0, 30)}...`);
      
      await notifyUserByEmail(
        user.email || '',
        'Debug Test Notification',
        'This is a test push notification from the debugger',
        {
          type: 'debug',
          timestamp: Date.now(),
          debug: true
        }
      );
      
      addDebugInfo('✅ Push notification sent');
    } catch (error) {
      addDebugInfo(`❌ Error sending push notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminTokens = async () => {
    setLoading(true);
    try {
      addDebugInfo('👨‍💼 Checking admin tokens...');
      
      const tokens = await getAdminPushTokens();
      addDebugInfo(`📊 Found ${tokens.length} admin tokens`);
      
      if (tokens.length > 0) {
        tokens.forEach((token, index) => {
          addDebugInfo(`  ${index + 1}. ${token.substring(0, 30)}...`);
        });
      } else {
        addDebugInfo('⚠️ No admin tokens found');
      }
    } catch (error) {
      addDebugInfo(`❌ Error checking admin tokens: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const runFullDiagnostic = async () => {
    clearDebugInfo();
    addDebugInfo('🚀 Starting full diagnostic...');
    
    await checkInitialStatus();
    await getExpoPushToken();
    await checkAdminTokens();
    
    addDebugInfo('🏁 Diagnostic complete!');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedText type="title" style={styles.title}>
          Notification Debugger
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          Debug and test push notification functionality
        </ThemedText>

        {/* Status Cards */}
        <View style={styles.statusContainer}>
          <View style={styles.statusCard}>
            <ThemedText style={styles.statusLabel}>Permission Status</ThemedText>
            <ThemedText style={[
              styles.statusValue,
              permissionStatus === 'granted' ? styles.statusSuccess : styles.statusError
            ]}>
              {permissionStatus}
            </ThemedText>
          </View>

          <View style={styles.statusCard}>
            <ThemedText style={styles.statusLabel}>Device Type</ThemedText>
            <ThemedText style={styles.statusValue}>
              {deviceInfo?.isDevice ? 'Real Device' : 'Simulator'}
            </ThemedText>
          </View>

          <View style={styles.statusCard}>
            <ThemedText style={styles.statusLabel}>App Environment</ThemedText>
            <ThemedText style={styles.statusValue}>
              {deviceInfo?.isExpoGo ? 'Expo Go' : 'Development Build'}
            </ThemedText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]} 
            onPress={runFullDiagnostic}
            disabled={loading}
          >
            <MaterialIcons name="bug-report" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Run Full Diagnostic</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]} 
            onPress={requestPermissions}
            disabled={loading}
          >
            <MaterialIcons name="notifications" size={20} color="#00B2FF" />
            <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>Request Permissions</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.testButton, loading && styles.buttonDisabled]} 
            onPress={getExpoPushToken}
            disabled={loading}
          >
            <MaterialIcons name="vpn-key" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Get Push Token</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.testButton, loading && styles.buttonDisabled]} 
            onPress={testLocalNotification}
            disabled={loading}
          >
            <MaterialIcons name="notifications-active" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Test Local Notification</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.testButton, loading && styles.buttonDisabled]} 
            onPress={testPushNotification}
            disabled={loading}
          >
            <MaterialIcons name="send" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Test Push Notification</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.clearButton, loading && styles.buttonDisabled]} 
            onPress={clearDebugInfo}
            disabled={loading}
          >
            <MaterialIcons name="clear" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Clear Debug Info</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Debug Output */}
        {debugInfo.length > 0 && (
          <View style={styles.debugContainer}>
            <ThemedText type="subtitle" style={styles.debugTitle}>
              Debug Information
            </ThemedText>
            
            <ScrollView style={styles.debugScroll} nestedScrollEnabled>
              {debugInfo.map((info, index) => (
                <ThemedText key={index} style={styles.debugText}>
                  {info}
                </ThemedText>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Token Display */}
        {expoToken && (
          <View style={styles.tokenContainer}>
            <ThemedText type="subtitle" style={styles.tokenTitle}>
              Expo Push Token
            </ThemedText>
            <ThemedText style={styles.tokenText}>
              {expoToken}
            </ThemedText>
          </View>
        )}

        {/* Troubleshooting Tips */}
        <View style={styles.tipsContainer}>
          <ThemedText type="subtitle" style={styles.tipsTitle}>
            Troubleshooting Tips
          </ThemedText>
          
          <View style={styles.tipItem}>
            <ThemedText style={styles.tipLabel}>🔔 Notifications not showing?</ThemedText>
            <ThemedText style={styles.tipText}>
              • Check if permissions are granted{'\n'}
              • Ensure you're using a development build (not Expo Go){'\n'}
              • Test with local notifications first
            </ThemedText>
          </View>
          
          <View style={styles.tipItem}>
            <ThemedText style={styles.tipLabel}>📱 Expo Go limitations:</ThemedText>
            <ThemedText style={styles.tipText}>
              • Push notifications are limited in Expo Go{'\n'}
              • Use 'npx expo run:android' or 'npx expo run:ios' for full functionality
            </ThemedText>
          </View>
          
          <View style={styles.tipItem}>
            <ThemedText style={styles.tipLabel}>🔧 Development Build:</ThemedText>
            <ThemedText style={styles.tipText}>
              • Run 'npx expo run:android' or 'npx expo run:ios'{'\n'}
              • This gives you full push notification capabilities
            </ThemedText>
          </View>
        </View>
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
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statusCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statusLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  statusSuccess: {
    color: '#28a745',
  },
  statusError: {
    color: '#dc3545',
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
  debugContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 20,
    maxHeight: 300,
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#001A5C',
  },
  debugScroll: {
    maxHeight: 200,
  },
  debugText: {
    fontSize: 12,
    color: '#212529',
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16,
  },
  tokenContainer: {
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    marginBottom: 20,
  },
  tokenTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#001A5C',
  },
  tokenText: {
    fontSize: 12,
    color: '#2e7d32',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  tipsContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#001A5C',
  },
  tipItem: {
    marginBottom: 12,
  },
  tipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
});
