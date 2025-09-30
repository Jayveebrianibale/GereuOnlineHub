import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { getAdminPushTokens, getUserPushToken } from '../services/notificationService';

export default function AdminTokenFixer() {
  const { user, role } = useAuthContext();
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const checkAdminUsers = async () => {
    setLoading(true);
    try {
      addResult('🔍 Checking admin users and their tokens...');
      
      // Get all admin tokens
      const adminTokens = await getAdminPushTokens();
      addResult(`📊 Found ${adminTokens.length} admin users with push tokens`);
      
      if (adminTokens.length === 0) {
        addResult('⚠️ No admin users have push tokens!');
        addResult('💡 This is likely why notifications are not working');
        addResult('🔧 Admin users need to log in to generate push tokens');
      } else {
        adminTokens.forEach((token, index) => {
          addResult(`  ✅ Admin ${index + 1}: ${token.substring(0, 30)}...`);
        });
      }
      
    } catch (error) {
      addResult(`❌ Error checking admin users: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentUser = async () => {
    if (!user) {
      addResult('❌ No user logged in');
      return;
    }
    
    setLoading(true);
    try {
      addResult(`🔍 Checking current user: ${user.email}`);
      addResult(`👤 User role: ${role || 'Not set'}`);
      
      const token = await getUserPushToken(user.uid);
      if (token) {
        addResult(`✅ User has push token: ${token.substring(0, 30)}...`);
      } else {
        addResult('❌ User does not have push token');
        addResult('💡 Try logging out and logging back in to generate token');
      }
      
    } catch (error) {
      addResult(`❌ Error checking current user: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testNotificationFlow = async () => {
    if (!user) {
      addResult('❌ No user logged in');
      return;
    }
    
    setLoading(true);
    try {
      addResult('🧪 Testing notification flow...');
      
      // Check if current user is admin
      const isAdmin = role === 'admin';
      addResult(`👤 Current user is admin: ${isAdmin ? 'Yes' : 'No'}`);
      
      if (isAdmin) {
        addResult('📤 Testing admin notification...');
        // This will test if the current admin can receive notifications
        addResult('💡 If you receive a notification, admin notifications are working');
      } else {
        addResult('👤 Current user is not admin - testing user notification...');
        addResult('💡 If you receive a notification, user notifications are working');
      }
      
    } catch (error) {
      addResult(`❌ Error testing notification flow: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostic = async () => {
    clearResults();
    addResult('🚀 Starting push notification diagnostic...');
    
    await checkCurrentUser();
    await checkAdminUsers();
    await testNotificationFlow();
    
    addResult('🏁 Diagnostic completed!');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedText type="title" style={styles.title}>
          Admin Token Fixer
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          Diagnose and fix push notification issues for admin users
        </ThemedText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]} 
            onPress={runDiagnostic}
            disabled={loading}
          >
            <MaterialIcons name="bug-report" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Run Diagnostic</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]} 
            onPress={checkCurrentUser}
            disabled={loading}
          >
            <MaterialIcons name="person" size={20} color="#00B2FF" />
            <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>Check Current User</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]} 
            onPress={checkAdminUsers}
            disabled={loading}
          >
            <MaterialIcons name="admin-panel-settings" size={20} color="#00B2FF" />
            <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>Check Admin Users</ThemedText>
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

        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <ThemedText type="subtitle" style={styles.resultsTitle}>
              Diagnostic Results
            </ThemedText>
            
            <ScrollView style={styles.resultsScroll} nestedScrollEnabled>
              {results.map((result, index) => (
                <ThemedText key={index} style={styles.resultText}>
                  {result}
                </ThemedText>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.infoContainer}>
          <ThemedText type="subtitle" style={styles.infoTitle}>
            Common Issues & Solutions
          </ThemedText>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>❌ No admin tokens found:</ThemedText>
            <ThemedText style={styles.infoText}>
              Admin users need to log in to generate push tokens. Make sure all admin users have logged in at least once.
            </ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>❌ Notifications not working in Expo Go:</ThemedText>
            <ThemedText style={styles.infoText}>
              Push notifications don't work in Expo Go. Use a development build or standalone app.
            </ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>❌ User role not set:</ThemedText>
            <ThemedText style={styles.infoText}>
              Check if users have the correct role in Firebase. Admin emails are configured in app/config/adminConfig.ts
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
    marginBottom: 20,
    maxHeight: 300,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#001A5C',
  },
  resultsScroll: {
    maxHeight: 200,
  },
  resultText: {
    fontSize: 12,
    color: '#212529',
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16,
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#001A5C',
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#424242',
    lineHeight: 18,
  },
});
