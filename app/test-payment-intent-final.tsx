// ========================================
// FINAL PAYMENT INTENT TEST - PAMAMAHALA NG FINAL TESTING
// ========================================
// Final test ng PayMongo Payment Intent integration
// Tests the complete flow from creation to checkout URL

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { createPaymentIntent } from './services/paymongoService';

export default function FinalPaymentIntentTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');

  const testPaymentIntent = async () => {
    try {
      setLoading(true);
      setResult('🔄 Testing Payment Intent creation...\n');
      
      const testAmount = 100; // 100 PHP
      const testDescription = 'Test Payment Intent - Final Integration';
      const testReference = 'TEST-' + Date.now();
      
      const paymentIntentResult = await createPaymentIntent(
        testAmount,
        testDescription,
        testReference
      );
      
      if (paymentIntentResult.success) {
        setPaymentIntentId(paymentIntentResult.sourceId || '');
        setResult(prev => prev + `✅ SUCCESS!\n`);
        setResult(prev => prev + `Payment Intent ID: ${paymentIntentResult.sourceId}\n`);
        setResult(prev => prev + `Checkout URL: ${paymentIntentResult.checkoutUrl}\n`);
        setResult(prev => prev + `Status: ${paymentIntentResult.status}\n`);
        setResult(prev => prev + `Client Key: ${paymentIntentResult.clientKey}\n\n`);
        setResult(prev => prev + `🎯 Ready for payment processing!\n`);
      } else {
        setResult(prev => prev + `❌ FAILED: ${paymentIntentResult.error}\n`);
      }
      
    } catch (error: any) {
      setResult(prev => prev + `❌ ERROR: ${error.message || 'Unknown error'}\n`);
    } finally {
      setLoading(false);
    }
  };

  const openCheckout = async () => {
    if (!paymentIntentId) {
      Alert.alert('Error', 'No Payment Intent created yet. Please create one first.');
      return;
    }
    
    try {
      const checkoutUrl = `https://paymongo.com/payment_intents/${paymentIntentId}`;
      const canOpen = await Linking.canOpenURL(checkoutUrl);
      
      if (canOpen) {
        await Linking.openURL(checkoutUrl);
        setResult(prev => prev + `\n🌐 Opened checkout URL: ${checkoutUrl}\n`);
      } else {
        Alert.alert('Error', 'Cannot open checkout URL. Please check your device settings.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open checkout URL');
    }
  };

  const clearResults = () => {
    setResult('');
    setPaymentIntentId('');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="check-circle" size={32} color="#10B981" />
        <ThemedText type="title" style={styles.title}>
          Final Payment Intent Test
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Test complete PayMongo integration
        </ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#10B981' }]}
          onPress={testPaymentIntent}
          disabled={loading}
        >
          <MaterialIcons name="play-arrow" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>
            {loading ? 'Creating...' : 'Create Payment Intent'}
          </ThemedText>
        </TouchableOpacity>

        {paymentIntentId && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#3B82F6' }]}
            onPress={openCheckout}
          >
            <MaterialIcons name="open-in-browser" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>
              Open Checkout
            </ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#6B7280' }]}
          onPress={clearResults}
        >
          <MaterialIcons name="clear" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>
            Clear Results
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultContainer}>
        <ThemedText style={styles.resultTitle}>Test Results:</ThemedText>
        <ThemedText style={styles.resultText}>
          {result || 'Click "Create Payment Intent" to start testing...'}
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});
