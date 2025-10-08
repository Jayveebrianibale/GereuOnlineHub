// ========================================
// GCASH SOURCE TEST - PAMAMAHALA NG GCASH SOURCE TESTING
// ========================================
// Test ng GCash Source creation para sa debugging
// I-check ang actual response structure from PayMongo

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { createGCashSource } from './services/paymongoService';

export default function GCashSourceTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');

  const testGCashSource = async () => {
    try {
      setLoading(true);
      setResult('🔄 Testing GCash Source creation...\n');
      
      const gcashRequest = {
        amount: 100, // 100 PHP
        description: 'Test GCash Source - Debug',
        successUrl: 'https://secure-authentication.paymongo.com/success',
        failedUrl: 'https://secure-authentication.paymongo.com/failed',
        referenceNumber: 'TEST-' + Date.now()
      };
      
      const gcashResult = await createGCashSource(gcashRequest);
      
      if (gcashResult.success) {
        setCheckoutUrl(gcashResult.checkoutUrl || '');
        setResult(prev => prev + `✅ SUCCESS!\n`);
        setResult(prev => prev + `Source ID: ${gcashResult.sourceId}\n`);
        setResult(prev => prev + `Checkout URL: ${gcashResult.checkoutUrl}\n`);
        setResult(prev => prev + `Status: ${gcashResult.status}\n\n`);
        setResult(prev => prev + `🎯 Ready for payment!\n`);
      } else {
        setResult(prev => prev + `❌ FAILED: ${gcashResult.error}\n`);
      }
      
    } catch (error: any) {
      setResult(prev => prev + `❌ ERROR: ${error.message || 'Unknown error'}\n`);
    } finally {
      setLoading(false);
    }
  };

  const openCheckout = async () => {
    if (!checkoutUrl) {
      Alert.alert('Error', 'No checkout URL available. Please create a GCash source first.');
      return;
    }
    
    try {
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
    setCheckoutUrl('');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="account-balance-wallet" size={32} color="#00B2FF" />
        <ThemedText type="title" style={styles.title}>
          GCash Source Test
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Test GCash Source creation and checkout
        </ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#00B2FF' }]}
          onPress={testGCashSource}
          disabled={loading}
        >
          <MaterialIcons name="play-arrow" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>
            {loading ? 'Creating...' : 'Create GCash Source'}
          </ThemedText>
        </TouchableOpacity>

        {checkoutUrl && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#10B981' }]}
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
          {result || 'Click "Create GCash Source" to start testing...'}
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
