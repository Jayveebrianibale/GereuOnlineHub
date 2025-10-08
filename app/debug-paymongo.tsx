// ========================================
// PAYMONGO DEBUG COMPONENT - PAMAMAHALA NG PAYMONGO DEBUGGING
// ========================================
// Debug component para sa PayMongo troubleshooting
// Helps identify and fix "invalid source" errors

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { createFreshSource, debugPaymentFlow, getPaymentDebugInfo, validateSourceBeforePayment } from './services/paymongoDebugService';

export default function PayMongoDebug() {
  const [paymentId, setPaymentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const debugPayment = async () => {
    if (!paymentId.trim()) {
      setResult('❌ Please enter a payment ID');
      return;
    }

    try {
      setLoading(true);
      setResult('🔍 Debugging payment flow...\n');
      
      // Get debug info
      const debugInfo = await getPaymentDebugInfo(paymentId);
      setResult(prev => prev + `📋 Payment Info:\n${JSON.stringify(debugInfo, null, 2)}\n\n`);
      
      // Debug payment flow
      const flowResult = await debugPaymentFlow(paymentId);
      setResult(prev => prev + `🔄 Flow Result:\n${JSON.stringify(flowResult, null, 2)}\n\n`);
      
    } catch (error) {
      setResult(prev => prev + `❌ ERROR: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testFreshSource = async () => {
    try {
      setLoading(true);
      setResult('🔄 Creating fresh source...\n');
      
      const result = await createFreshSource(
        100,
        'Test payment for debugging',
        `TEST_${Date.now()}`
      );
      
      setResult(prev => prev + `📊 Fresh Source Result:\n${JSON.stringify(result, null, 2)}\n\n`);
      
    } catch (error) {
      setResult(prev => prev + `❌ ERROR: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  const validateSource = async () => {
    if (!paymentId.trim()) {
      setResult('❌ Please enter a payment ID first');
      return;
    }

    try {
      setLoading(true);
      setResult('🔍 Validating source...\n');
      
      // Get payment info first
      const debugInfo = await getPaymentDebugInfo(paymentId);
      if (debugInfo.success && debugInfo.source) {
        const validation = await validateSourceBeforePayment(debugInfo.source.sourceId);
        setResult(prev => prev + `📊 Source Validation:\n${JSON.stringify(validation, null, 2)}\n\n`);
      } else {
        setResult(prev => prev + `❌ No source found for this payment\n`);
      }
      
    } catch (error) {
      setResult(prev => prev + `❌ ERROR: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="bug-report" size={32} color="#00B2FF" />
        <ThemedText type="title" style={styles.title}>
          PayMongo Debug Tool
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Debug "invalid source" errors
        </ThemedText>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Payment ID:</ThemedText>
        <TextInput
          style={styles.input}
          value={paymentId}
          onChangeText={setPaymentId}
          placeholder="Enter payment ID to debug"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#00B2FF' }]}
          onPress={debugPayment}
          disabled={loading}
        >
          <MaterialIcons name="search" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>
            {loading ? 'Debugging...' : 'Debug Payment'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#10B981' }]}
          onPress={validateSource}
          disabled={loading}
        >
          <MaterialIcons name="check-circle" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>
            Validate Source
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#F59E0B' }]}
          onPress={testFreshSource}
          disabled={loading}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>
            Test Fresh Source
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultContainer}>
        <ThemedText style={styles.resultTitle}>Debug Results:</ThemedText>
        <ThemedText style={styles.resultText}>
          {result || 'Enter a payment ID and click "Debug Payment" to start...'}
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
    flexWrap: 'wrap',
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
    minWidth: 120,
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
