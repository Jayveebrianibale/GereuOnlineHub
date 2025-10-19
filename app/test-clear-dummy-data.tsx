// ========================================
// CLEAR DUMMY DATA TEST
// ========================================
// Test component to clear dummy payment data and verify admin settings
// I-clear ang any dummy data na naka-store sa Firebase

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { clearDummyPaymentData, getAdminPaymentSettings } from './services/adminPaymentService';

export default function ClearDummyDataTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const addResult = (message: string) => {
    setResult(prev => prev + message + '\n');
  };

  const clearResults = () => {
    setResult('');
  };

  // ========================================
  // CLEAR DUMMY DATA
  // ========================================
  const clearDummyData = async () => {
    try {
      setLoading(true);
      addResult('🔄 Clearing Dummy Payment Data');
      addResult('=====================================');
      addResult('Checking for dummy data in Firebase...');
      addResult('');
      
      const success = await clearDummyPaymentData();
      
      if (success) {
        addResult('✅ Dummy data cleared successfully!');
        addResult('✅ Any dummy GCash numbers removed');
        addResult('✅ Any dummy QR codes removed');
        addResult('');
        addResult('💡 Admin payment settings should now be empty');
        addResult('💡 No more dummy data will be returned');
      } else {
        addResult('❌ Failed to clear dummy data');
        addResult('💡 Check console for error details');
      }
      
    } catch (error) {
      addResult(`❌ Error clearing dummy data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // CHECK ADMIN SETTINGS
  // ========================================
  const checkAdminSettings = async () => {
    try {
      setLoading(true);
      addResult('🔄 Checking Admin Payment Settings');
      addResult('=====================================');
      addResult('Fetching current admin settings...');
      addResult('');
      
      const settings = await getAdminPaymentSettings();
      
      if (settings) {
        addResult('📋 Admin Payment Settings:');
        addResult(`GCash Number: ${settings.gcashNumber || 'Not set'}`);
        addResult(`QR Code URL: ${settings.qrCodeImageUrl ? 'Set' : 'Not set'}`);
        addResult(`QR Code Base64: ${settings.qrCodeBase64 ? 'Set' : 'Not set'}`);
        addResult(`Updated At: ${new Date(settings.updatedAt).toLocaleString()}`);
        addResult('');
        
        if (settings.gcashNumber && settings.gcashNumber.trim() !== '') {
          addResult('✅ Admin has uploaded GCash number');
        } else {
          addResult('⚠️ Admin has NOT uploaded GCash number');
        }
        
        if (settings.qrCodeImageUrl && settings.qrCodeImageUrl.trim() !== '') {
          addResult('✅ Admin has uploaded QR code image');
        } else {
          addResult('⚠️ Admin has NOT uploaded QR code image');
        }
        
        if (!settings.gcashNumber || settings.gcashNumber.trim() === '' || 
            !settings.qrCodeImageUrl || settings.qrCodeImageUrl.trim() === '') {
          addResult('');
          addResult('🚨 INCOMPLETE ADMIN SETUP');
          addResult('💡 Admin must upload both GCash number and QR code image');
          addResult('💡 QR code fallback will not work until admin uploads both');
        } else {
          addResult('');
          addResult('✅ COMPLETE ADMIN SETUP');
          addResult('💡 Admin has uploaded both required information');
          addResult('💡 QR code fallback will work properly');
        }
        
      } else {
        addResult('❌ No admin payment settings found');
        addResult('💡 Admin has not uploaded any payment information');
        addResult('💡 QR code fallback will not work');
      }
      
    } catch (error) {
      addResult(`❌ Error checking admin settings: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // SHOW SOLUTIONS
  // ========================================
  const showSolutions = () => {
    Alert.alert(
      'Admin Payment Setup Solutions',
      'If admin has not uploaded payment information:\n\n' +
      '1. Admin must upload GCash number\n' +
      '2. Admin must upload QR code image\n' +
      '3. Both are required for QR code fallback\n' +
      '4. Without both, payment will fail\n\n' +
      'Admin can upload these in the Payment Settings modal.',
      [
        { text: 'Got it!', style: 'default' }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedText style={styles.title}>Clear Dummy Data Test</ThemedText>
        <ThemedText style={styles.subtitle}>
          Clear dummy payment data and check admin settings
        </ThemedText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={clearDummyData}
            disabled={loading}
          >
            <MaterialIcons name="clear" size={24} color="white" />
            <ThemedText style={styles.buttonText}>
              {loading ? 'Clearing...' : 'Clear Dummy Data'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={checkAdminSettings}
          >
            <MaterialIcons name="settings" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Check Admin Settings</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={showSolutions}
          >
            <MaterialIcons name="info" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Show Solutions</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearResults}
          >
            <MaterialIcons name="refresh" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Clear Results</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.resultContainer}>
          <ThemedText style={styles.resultTitle}>Test Results:</ThemedText>
          <ScrollView style={styles.resultScrollView}>
            <ThemedText style={styles.resultText}>{result || 'No results yet. Click "Clear Dummy Data" to start.'}</ThemedText>
          </ScrollView>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.7,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  infoButton: {
    backgroundColor: '#FF9500',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 15,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultScrollView: {
    flex: 1,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
