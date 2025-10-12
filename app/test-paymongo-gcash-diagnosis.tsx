// ========================================
// PAYMONGO GCASH DIAGNOSIS TEST
// ========================================
// Comprehensive test to diagnose GCash issues with PayMongo test API keys
// I-check ang different scenarios at i-provide ang solutions

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { createGCashSource, createPaymentIntent } from './services/paymongoService';

export default function PayMongoGCashDiagnosis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const addResult = (message: string) => {
    setResult(prev => prev + message + '\n');
  };

  const clearResults = () => {
    setResult('');
  };

  // ========================================
  // TEST 1: BASIC API CONNECTION
  // ========================================
  const testBasicConnection = async () => {
    try {
      addResult('🔍 TEST 1: Basic API Connection');
      addResult('Testing PayMongo API with test keys...');
      
      const testUrl = 'https://api.paymongo.com/v1/sources';
      const testData = {
        data: {
          attributes: {
            type: 'gcash',
            amount: 10000, // 100 PHP in centavos
            currency: 'PHP',
            redirect: {
              success: 'https://example.com/success',
              failed: 'https://example.com/failed',
            },
            billing: {
              name: 'Test Customer',
              email: 'test@example.com',
              phone: '+639000000000', // Test placeholder
            },
            metadata: {
              reference_number: 'TEST-' + Date.now(),
              description: 'GCash diagnosis test',
              environment: 'test',
            },
          },
        },
      };

      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa('sk_test_WL2guhaPujZZ5cw4ycEuyWue:')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      
      addResult(`Response Status: ${response.status}`);
      addResult(`Response Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      addResult(`Response Body: ${JSON.stringify(result, null, 2)}`);
      
      if (response.ok && result.data) {
        addResult('✅ Basic API connection successful');
        
        // Check if redirect URL is provided
        if (result.data.attributes.redirect) {
          addResult('✅ Redirect URL provided by PayMongo');
          addResult(`Redirect URL: ${JSON.stringify(result.data.attributes.redirect, null, 2)}`);
        } else {
          addResult('⚠️ No redirect URL provided - GCash might not be enabled');
        }
        
        return result.data;
      } else {
        addResult(`❌ API connection failed: ${result.message || 'Unknown error'}`);
        if (result.errors) {
          addResult(`Errors: ${JSON.stringify(result.errors, null, 2)}`);
        }
        return null;
      }
    } catch (error) {
      addResult(`❌ Connection test error: ${error}`);
      return null;
    }
  };

  // ========================================
  // TEST 2: PAYMENT INTENT CREATION
  // ========================================
  const testPaymentIntent = async () => {
    try {
      addResult('\n🔍 TEST 2: Payment Intent Creation');
      addResult('Testing Payment Intent with test keys...');
      
      const result = await createPaymentIntent(
        100,
        'GCash diagnosis test payment',
        'TEST-' + Date.now()
      );
      
      addResult(`Payment Intent Result: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        addResult('✅ Payment Intent created successfully');
        addResult(`Payment Intent ID: ${result.sourceId}`);
        addResult(`Status: ${result.status}`);
        addResult(`Client Key: ${result.clientKey}`);
        addResult(`Checkout URL: ${result.checkoutUrl || 'No checkout URL'}`);
      } else {
        addResult(`❌ Payment Intent creation failed: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      addResult(`❌ Payment Intent test error: ${error}`);
      return null;
    }
  };

  // ========================================
  // TEST 3: GCASH SOURCE CREATION
  // ========================================
  const testGCashSource = async () => {
    try {
      addResult('\n🔍 TEST 3: GCash Source Creation');
      addResult('Testing GCash Source with test keys...');
      
      const result = await createGCashSource({
        amount: 100,
        description: 'GCash diagnosis test payment',
        successUrl: 'https://example.com/success',
        failedUrl: 'https://example.com/failed',
        referenceNumber: 'TEST-' + Date.now()
      });
      
      addResult(`GCash Source Result: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        addResult('✅ GCash Source created successfully');
        addResult(`Source ID: ${result.sourceId}`);
        addResult(`Status: ${result.status}`);
        addResult(`Checkout URL: ${result.checkoutUrl}`);
        
        // Test the checkout URL
        if (result.checkoutUrl) {
          addResult(`\n🔍 Testing checkout URL: ${result.checkoutUrl}`);
          addResult('⚠️ This URL should be tested manually in a browser');
        }
      } else {
        addResult(`❌ GCash Source creation failed: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      addResult(`❌ GCash Source test error: ${error}`);
      return null;
    }
  };

  // ========================================
  // TEST 4: ALTERNATIVE PAYMENT METHODS
  // ========================================
  const testAlternativeMethods = async () => {
    try {
      addResult('\n🔍 TEST 4: Alternative Payment Methods');
      addResult('Testing if other payment methods work...');
      
      const testUrl = 'https://api.paymongo.com/v1/sources';
      const testData = {
        data: {
          attributes: {
            type: 'card', // Try card instead of gcash
            amount: 10000,
            currency: 'PHP',
            redirect: {
              success: 'https://example.com/success',
              failed: 'https://example.com/failed',
            },
            billing: {
              name: 'Test Customer',
              email: 'test@example.com',
              phone: '+639000000000', // Test placeholder
            },
            metadata: {
              reference_number: 'TEST-CARD-' + Date.now(),
              description: 'Card payment test',
              environment: 'test',
            },
          },
        },
      };

      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa('sk_test_WL2guhaPujZZ5cw4ycEuyWue:')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      
      addResult(`Card Source Response: ${JSON.stringify(result, null, 2)}`);
      
      if (response.ok && result.data) {
        addResult('✅ Card payment method works');
        if (result.data.attributes.redirect) {
          addResult('✅ Card redirect URL provided');
        }
      } else {
        addResult(`❌ Card payment method failed: ${result.message}`);
      }
    } catch (error) {
      addResult(`❌ Alternative methods test error: ${error}`);
    }
  };

  // ========================================
  // RUN ALL DIAGNOSIS TESTS
  // ========================================
  const runDiagnosis = async () => {
    try {
      setLoading(true);
      clearResults();
      
      addResult('🚀 PAYMONGO GCASH DIAGNOSIS STARTED');
      addResult('=====================================');
      addResult(`Test API Keys:`);
      addResult(`Secret: sk_test_WL2guhaPujZZ5cw4ycEuyWue`);
      addResult(`Public: pk_test_unHcUNnqqxMZZyLwcn9omjPz`);
      addResult('');
      
      // Run all tests
      await testBasicConnection();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testPaymentIntent();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testGCashSource();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testAlternativeMethods();
      
      addResult('\n🏁 DIAGNOSIS COMPLETED');
      addResult('=====================================');
      addResult('Check the results above to identify the issue.');
      
    } catch (error) {
      addResult(`❌ Diagnosis error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // PROVIDE SOLUTIONS
  // ========================================
  const showSolutions = () => {
    Alert.alert(
      'GCash Payment Solutions',
      'Based on the diagnosis results:\n\n' +
      '1. If GCash is not enabled: Contact PayMongo support\n' +
      '2. If no redirect URLs: Use QR code fallback\n' +
      '3. If API errors: Check account status\n' +
      '4. If test mode issues: Try live mode (with real payments)\n\n' +
      'Would you like to see the QR code fallback implementation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Show QR Code', onPress: () => addResult('\n💡 QR Code fallback is already implemented in the payment service!') }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedText style={styles.title}>PayMongo GCash Diagnosis</ThemedText>
        <ThemedText style={styles.subtitle}>
          Comprehensive test to identify GCash payment issues
        </ThemedText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={runDiagnosis}
            disabled={loading}
          >
            <MaterialIcons name="bug-report" size={24} color="white" />
            <ThemedText style={styles.buttonText}>
              {loading ? 'Running Diagnosis...' : 'Run Diagnosis'}
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
          <ThemedText style={styles.resultTitle}>Diagnosis Results:</ThemedText>
          <ScrollView style={styles.resultScrollView}>
            <ThemedText style={styles.resultText}>{result || 'No results yet. Click "Run Diagnosis" to start.'}</ThemedText>
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
