// ========================================
// SIMPLE GCASH SOURCE TEST
// ========================================
// Simple test to verify GCash Source creation works
// I-test lang ang basic functionality

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { createGCashSource } from './services/paymongoService';

export default function SimpleGCashSourceTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const addResult = (message: string) => {
    setResult(prev => prev + message + '\n');
  };

  const clearResults = () => {
    setResult('');
  };

  // ========================================
  // TEST GCASH SOURCE CREATION
  // ========================================
  const testGCashSource = async () => {
    try {
      setLoading(true);
      addResult('🔄 Testing GCash Source Creation');
      addResult('=====================================');
      addResult('Using your working API keys...');
      addResult('');
      
      const gcashRequest = {
        amount: 20, // 20 PHP
        description: 'Simple GCash test payment',
        successUrl: 'https://example.com/success',
        failedUrl: 'https://example.com/failed',
        referenceNumber: 'SIMPLE-TEST-' + Date.now()
      };
      
      addResult('📤 Creating GCash Source...');
      addResult(`Amount: ₱${gcashRequest.amount}`);
      addResult(`Description: ${gcashRequest.description}`);
      addResult(`Reference: ${gcashRequest.referenceNumber}`);
      addResult('');

      const result = await createGCashSource(gcashRequest);
      
      addResult('📥 PayMongo Response:');
      addResult(JSON.stringify(result, null, 2));
      addResult('');
      
      if (result.success) {
        addResult('✅ GCash Source created successfully!');
        addResult(`Source ID: ${result.sourceId}`);
        addResult(`Status: ${result.status}`);
        addResult(`Checkout URL: ${result.checkoutUrl}`);
        addResult('');
        
        if (result.checkoutUrl) {
          addResult('🌐 WORKING CHECKOUT URL:');
          addResult(`URL: ${result.checkoutUrl}`);
          addResult('');
          addResult('💡 This URL should work for GCash payments!');
          addResult('💡 Test this URL in your browser to verify.');
          addResult('💡 If it works, your PayMongo integration is working!');
        } else {
          addResult('⚠️ No checkout URL provided');
          addResult('💡 This might indicate GCash is not enabled for your account');
        }
      } else {
        addResult('❌ GCash Source creation failed');
        addResult(`Error: ${result.error}`);
        addResult('');
        addResult('💡 This explains why your checkout URLs aren\'t working');
        addResult('💡 You may need to contact PayMongo to enable GCash');
      }
      
    } catch (error) {
      addResult(`❌ Test error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // SHOW SOLUTIONS
  // ========================================
  const showSolutions = () => {
    Alert.alert(
      'GCash Payment Solutions',
      'If GCash Source creation fails:\n\n' +
      '1. Contact PayMongo support to enable GCash\n' +
      '2. Use QR code fallback (already implemented)\n' +
      '3. Try with live API keys\n' +
      '4. Check your PayMongo account status\n\n' +
      'The QR code fallback will work regardless!',
      [
        { text: 'Got it!', style: 'default' }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedText style={styles.title}>Simple GCash Source Test</ThemedText>
        <ThemedText style={styles.subtitle}>
          Test if GCash Source creation works with your API keys
        </ThemedText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={testGCashSource}
            disabled={loading}
          >
            <MaterialIcons name="payment" size={24} color="white" />
            <ThemedText style={styles.buttonText}>
              {loading ? 'Testing...' : 'Test GCash Source'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={showSolutions}
          >
            <MaterialIcons name="lightbulb" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Show Solutions</ThemedText>
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
            <ThemedText style={styles.resultText}>{result || 'No results yet. Click "Test GCash Source" to start.'}</ThemedText>
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
