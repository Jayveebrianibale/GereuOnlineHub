// ========================================
// PAYMENT INTENT TEST - PAMAMAHALA NG PAYMENT INTENT TESTING
// ========================================
// Test component para sa PayMongo Payment Intent integration
// Tests the new Payment Intent API approach

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { createPaymentIntent, generateReferenceNumber } from './services/paymongoService';

export default function PaymentIntentTest() {
  const [amount, setAmount] = useState('100');
  const [description, setDescription] = useState('Test Payment Intent');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testPaymentIntent = async () => {
    try {
      setLoading(true);
      setResult('🔄 Testing Payment Intent creation...\n');
      
      const testAmount = parseFloat(amount) || 100;
      const refNumber = generateReferenceNumber();
      
      setResult(prev => prev + `Amount: ₱${testAmount}\n`);
      setResult(prev => prev + `Description: ${description}\n`);
      setResult(prev => prev + `Reference: ${refNumber}\n\n`);
      
      const result = await createPaymentIntent(testAmount, description, refNumber);
      
      if (result.success) {
        setResult(prev => prev + `✅ SUCCESS!\n`);
        setResult(prev => prev + `Payment Intent ID: ${result.sourceId}\n`);
        setResult(prev => prev + `Checkout URL: ${result.checkoutUrl}\n`);
        setResult(prev => prev + `Status: ${result.status}\n`);
        if (result.clientKey) {
          setResult(prev => prev + `Client Key: ${result.clientKey}\n`);
        }
      } else {
        setResult(prev => prev + `❌ FAILED: ${result.error}\n`);
      }
      
    } catch (error) {
      setResult(prev => prev + `❌ ERROR: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testWithDifferentAmounts = async () => {
    const amounts = [50, 100, 500, 1000, 5000];
    setResult('🔄 Testing different amounts...\n\n');
    
    for (const testAmount of amounts) {
      try {
        setResult(prev => prev + `Testing ₱${testAmount}... `);
        const result = await createPaymentIntent(testAmount, `Test payment for ₱${testAmount}`, `TEST_${Date.now()}`);
        
        if (result.success) {
          setResult(prev => prev + `✅ Success\n`);
        } else {
          setResult(prev => prev + `❌ Failed: ${result.error}\n`);
        }
      } catch (error) {
        setResult(prev => prev + `❌ Error: ${error}\n`);
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="account-balance-wallet" size={32} color="#00B2FF" />
        <ThemedText type="title" style={styles.title}>
          Payment Intent Test
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Test PayMongo Payment Intent API
        </ThemedText>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Amount (₱):</ThemedText>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter amount"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Description:</ThemedText>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter description"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#00B2FF' }]}
          onPress={testPaymentIntent}
          disabled={loading}
        >
          <MaterialIcons name="play-arrow" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>
            {loading ? 'Testing...' : 'Test Payment Intent'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#10B981' }]}
          onPress={testWithDifferentAmounts}
          disabled={loading}
        >
          <MaterialIcons name="list" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>
            Test Multiple Amounts
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultContainer}>
        <ThemedText style={styles.resultTitle}>Test Results:</ThemedText>
        <ThemedText style={styles.resultText}>
          {result || 'Enter amount and description, then click "Test Payment Intent"...'}
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
