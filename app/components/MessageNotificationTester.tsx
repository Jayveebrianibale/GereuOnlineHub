import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { getAdminPushTokens, notifyAdminByEmail, notifyUserByEmail } from '../services/notificationService';

export default function MessageNotificationTester() {
  const { user } = useAuthContext();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testUserToAdminMessage = async () => {
    if (!user) {
      addResult('❌ No user logged in');
      return;
    }
    
    setLoading(true);
    try {
      addResult('📤 Testing user to admin message notification...');
      
      await notifyAdminByEmail(
        'jayveebriani@gmail.com',
        'Test Message from User',
        'This is a test message notification from user to admin',
        {
          type: 'message',
          chatId: 'test_chat_123',
          senderEmail: user.email,
          senderName: user.displayName || 'Test User',
          messageId: 'test_msg_123'
        }
      );
      
      addResult('✅ User to admin notification sent successfully');
    } catch (error) {
      addResult(`❌ Error sending user to admin notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAdminToUserMessage = async () => {
    if (!user) {
      addResult('❌ No user logged in');
      return;
    }
    
    setLoading(true);
    try {
      addResult('📤 Testing admin to user message notification...');
      
      await notifyUserByEmail(
        user.email || '',
        'Test Message from Admin',
        'This is a test message notification from admin to user',
        {
          type: 'message',
          chatId: 'test_chat_123',
          senderEmail: 'jayveebriani@gmail.com',
          senderName: 'Admin',
          messageId: 'test_msg_123'
        }
      );
      
      addResult('✅ Admin to user notification sent successfully');
    } catch (error) {
      addResult(`❌ Error sending admin to user notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testImageMessage = async () => {
    if (!user) {
      addResult('❌ No user logged in');
      return;
    }
    
    setLoading(true);
    try {
      addResult('📤 Testing image message notification...');
      
      await notifyAdminByEmail(
        'jayveebriani@gmail.com',
        'New image from User',
        `📷 ${user.displayName || 'Test User'} sent an image`,
        {
          type: 'message',
          chatId: 'test_chat_123',
          senderEmail: user.email,
          senderName: user.displayName || 'Test User',
          messageId: 'test_img_123',
          messageType: 'image'
        }
      );
      
      addResult('✅ Image message notification sent successfully');
    } catch (error) {
      addResult(`❌ Error sending image message notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testApartmentInquiry = async () => {
    if (!user) {
      addResult('❌ No user logged in');
      return;
    }
    
    setLoading(true);
    try {
      addResult('📤 Testing apartment inquiry notification...');
      
      await notifyAdminByEmail(
        'jayveebriani@gmail.com',
        'New apartment inquiry',
        'User interested in: Test Apartment',
        {
          type: 'apartment_inquiry',
          chatId: 'test_chat_123',
          senderEmail: user.email,
          senderName: user.displayName || 'Test User',
          serviceId: 'test_apartment_123',
          apartmentTitle: 'Test Apartment'
        }
      );
      
      addResult('✅ Apartment inquiry notification sent successfully');
    } catch (error) {
      addResult(`❌ Error sending apartment inquiry notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminTokens = async () => {
    setLoading(true);
    try {
      addResult('🔍 Checking admin push tokens...');
      const tokens = await getAdminPushTokens();
      addResult(`📊 Found ${tokens.length} admin tokens`);
      
      if (tokens.length > 0) {
        tokens.forEach((token, index) => {
          addResult(`  ${index + 1}. ${token.substring(0, 30)}...`);
        });
      } else {
        addResult('⚠️ No admin tokens found - admin users need to log in');
      }
    } catch (error) {
      addResult(`❌ Error checking admin tokens: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    clearResults();
    addResult('🚀 Starting all message notification tests...');
    
    await checkAdminTokens();
    await testUserToAdminMessage();
    await testAdminToUserMessage();
    await testImageMessage();
    await testApartmentInquiry();
    
    addResult('🏁 All tests completed!');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedText type="title" style={styles.title}>
          Message Notification Tester
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          Test push notifications for messaging between users and admins
        </ThemedText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]} 
            onPress={runAllTests}
            disabled={loading}
          >
            <MaterialIcons name="play-arrow" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Run All Tests</ThemedText>
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
            onPress={testUserToAdminMessage}
            disabled={loading}
          >
            <MaterialIcons name="message" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Test User → Admin</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.testButton, loading && styles.buttonDisabled]} 
            onPress={testAdminToUserMessage}
            disabled={loading}
          >
            <MaterialIcons name="admin-panel-settings" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Test Admin → User</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.testButton, loading && styles.buttonDisabled]} 
            onPress={testImageMessage}
            disabled={loading}
          >
            <MaterialIcons name="image" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Test Image Message</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.testButton, loading && styles.buttonDisabled]} 
            onPress={testApartmentInquiry}
            disabled={loading}
          >
            <MaterialIcons name="home" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>Test Apartment Inquiry</ThemedText>
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

        <View style={styles.infoContainer}>
          <ThemedText type="subtitle" style={styles.infoTitle}>
            How Message Notifications Work
          </ThemedText>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>📱 User → Admin:</ThemedText>
            <ThemedText style={styles.infoText}>
              When a user sends a message to admin, admin receives a push notification with the message content.
            </ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>👨‍💼 Admin → User:</ThemedText>
            <ThemedText style={styles.infoText}>
              When an admin sends a message to user, user receives a push notification with the message content.
            </ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>📷 Image Messages:</ThemedText>
            <ThemedText style={styles.infoText}>
              When someone sends an image, recipient gets a notification saying "📷 Sent an image".
            </ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>🏠 Apartment Inquiries:</ThemedText>
            <ThemedText style={styles.infoText}>
              When user shows interest in an apartment, admin gets a notification about the inquiry.
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
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#c8e6c9',
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
    color: '#2e7d32',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#424242',
    lineHeight: 18,
  },
});
