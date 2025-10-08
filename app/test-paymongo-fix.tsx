// ========================================
// PAYMONGO FIX TEST - PAMAMAHALA NG PAYMONGO TESTING
// ========================================
// Test component para sa PayMongo fix verification
// Tests the corrected PayMongo integration

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createGCashSource, generateReferenceNumber } from './services/paymongoService';

export default function PayMongoFixTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testPayMongoFix = async () => {
    try {
      setLoading(true);
      setResult('Testing PayMongo fix...\n');
      
      // Test reference number generation
      const refNumber = generateReferenceNumber();
      setResult(prev => prev + `Reference Number: ${refNumber}\n`);
      
      // Test GCash source creation
      setResult(prev => prev + 'Creating GCash source...\n');
      
      const testRequest = {
        amount: 100,
        description: 'Test payment for PayMongo integration fix',
        successUrl: 'https://secure-authentication.paymongo.com/success',
        failedUrl: 'https://secure-authentication.paymongo.com/failed',
        referenceNumber: refNumber
      };
      
      const sourceResult = await createGCashSource(testRequest);
      
      if (sourceResult.success) {
        setResult(prev => prev + `✅ SUCCESS! Fix is working!\n`);
        setResult(prev => prev + `Source ID: ${sourceResult.sourceId}\n`);
        setResult(prev => prev + `Checkout URL: ${sourceResult.checkoutUrl}\n`);
        setResult(prev => prev + `Status: ${sourceResult.status}\n`);
      } else {
        setResult(prev => prev + `❌ FAILED: ${sourceResult.error}\n`);
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
          PayMongo Fix Test
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Testing the "Cannot read property 'create' of undefined" fix
        </ThemedText>
      </View>

      <TouchableOpacity
        style={[styles.testButton, { backgroundColor: '#00B2FF' }]}
        onPress={testPayMongoFix}
        disabled={loading}
      >
        <MaterialIcons name="play-arrow" size={20} color="#fff" />
        <Text style={styles.buttonText}>
          {loading ? 'Testing Fix...' : 'Test PayMongo Fix'}
        </Text>
      </TouchableOpacity>

      <View style={styles.resultContainer}>
        <ThemedText type="subtitle" style={styles.resultTitle}>
          Test Result:
        </ThemedText>
        <Text style={styles.resultText}>
          {result || 'Click "Test PayMongo Fix" to start...'}
        </Text>
      </View>
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
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
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
