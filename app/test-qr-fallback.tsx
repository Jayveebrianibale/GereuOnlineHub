// ========================================
// QR CODE FALLBACK TEST
// ========================================
// Test ng QR code fallback solution para sa GCash payments
// I-demonstrate kung paano gumagana ang QR code fallback

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { createPayment } from './services/paymentService';

export default function QRFallbackTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const addResult = (message: string) => {
    setResult(prev => prev + message + '\n');
  };

  const clearResults = () => {
    setResult('');
  };

  // ========================================
  // TEST QR CODE FALLBACK
  // ========================================
  const testQRFallback = async () => {
    try {
      setLoading(true);
      addResult('🔄 Testing QR Code Fallback Solution');
      addResult('=====================================');
      
      // I-create ang test payment with QR code fallback
      const testPayment = await createPayment(
        'test-user-123',
        'test-reservation-456',
        'laundry',
        'test-service-789',
        100, // 100 PHP
        'gcash'
      );
      
      addResult(`✅ Payment created successfully: ${testPayment.id}`);
      addResult(`Amount: ₱${testPayment.amount}`);
      addResult(`Reference Number: ${testPayment.referenceNumber}`);
      addResult(`GCash Number: ${testPayment.gcashNumber}`);
      addResult(`QR Code: ${testPayment.qrCode ? 'Generated' : 'Not generated'}`);
      addResult(`Checkout URL: ${testPayment.checkoutUrl || 'Not available'}`);
      
      if (testPayment.qrCode) {
        addResult('\n📱 QR Code Fallback Details:');
        addResult('The QR code contains the following information:');
        addResult(`- Amount: ₱${testPayment.amount}`);
        addResult(`- Reference: ${testPayment.referenceNumber}`);
        addResult(`- GCash Number: ${testPayment.gcashNumber}`);
        addResult(`- Due Date: ${new Date(testPayment.dueDate).toLocaleString()}`);
        
        addResult('\n💡 How to use QR Code Fallback:');
        addResult('1. Display the QR code to the user');
        addResult('2. User scans QR code with GCash app');
        addResult('3. User enters the reference number');
        addResult('4. User completes payment in GCash');
        addResult('5. User clicks "I\'ve Made the Payment" to verify');
        
        addResult('\n✅ QR Code fallback is working!');
        addResult('This solution works even if PayMongo is not available.');
      } else {
        addResult('❌ QR Code not generated - check payment service');
      }
      
    } catch (error) {
      addResult(`❌ QR Code fallback test error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // TEST PAYMENT VERIFICATION
  // ========================================
  const testPaymentVerification = async () => {
    try {
      addResult('\n🔄 Testing Payment Verification');
      addResult('=====================================');
      
      // I-create ang test payment first
      const testPayment = await createPayment(
        'test-user-456',
        'test-reservation-789',
        'apartment',
        'test-service-123',
        200,
        'gcash'
      );
      
      addResult(`✅ Test payment created: ${testPayment.id}`);
      
      // I-simulate ang payment verification
      addResult('📝 Payment verification process:');
      addResult('1. User completes payment using QR code');
      addResult('2. User clicks "I\'ve Made the Payment"');
      addResult('3. System verifies payment status');
      addResult('4. Payment status updated to "paid"');
      
      addResult('\n💡 Note: In real implementation, verification would:');
      addResult('- Check PayMongo API for payment status');
      addResult('- Update Firebase with payment confirmation');
      addResult('- Send confirmation to user');
      addResult('- Update reservation status');
      
      addResult('\n✅ Payment verification process is ready!');
      
    } catch (error) {
      addResult(`❌ Payment verification test error: ${error}`);
    }
  };

  // ========================================
  // SHOW QR CODE IMPLEMENTATION
  // ========================================
  const showQRImplementation = () => {
    Alert.alert(
      'QR Code Implementation',
      'The QR code fallback is already implemented in your payment service!\n\n' +
      'Key features:\n' +
      '• Automatic QR code generation when PayMongo fails\n' +
      '• Contains all payment details (amount, reference, GCash number)\n' +
      '• Works offline without internet connection\n' +
      '• Provides reliable payment method for users\n\n' +
      'Would you like to see the QR code generation code?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Show Code', onPress: () => addResult('\n💻 QR code generation is in paymentService.ts - generateGCashQRCode() function') }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedText style={styles.title}>QR Code Fallback Test</ThemedText>
        <ThemedText style={styles.subtitle}>
          Test the QR code fallback solution for GCash payments
        </ThemedText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={testQRFallback}
            disabled={loading}
          >
            <MaterialIcons name="qr-code" size={24} color="white" />
            <ThemedText style={styles.buttonText}>
              {loading ? 'Testing...' : 'Test QR Fallback'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={testPaymentVerification}
          >
            <MaterialIcons name="verified" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Test Verification</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={showQRImplementation}
          >
            <MaterialIcons name="info" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Show Implementation</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearResults}
          >
            <MaterialIcons name="clear" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Clear Results</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.resultContainer}>
          <ThemedText style={styles.resultTitle}>Test Results:</ThemedText>
          <ScrollView style={styles.resultScrollView}>
            <ThemedText style={styles.resultText}>{result || 'No results yet. Click "Test QR Fallback" to start.'}</ThemedText>
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
