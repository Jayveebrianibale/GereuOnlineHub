// ========================================
// LIVE API KEYS TESTING
// ========================================
// Test ng live API keys para sa PayMongo integration
// I-demonstrate kung paano gumagana ang live keys

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { createGCashSource, createPaymentIntent } from './services/paymongoService';

export default function LiveKeysTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const addResult = (message: string) => {
    setResult(prev => prev + message + '\n');
  };

  const clearResults = () => {
    setResult('');
  };

  // ========================================
  // TEST LIVE API KEYS
  // ========================================
  const testLiveKeys = async () => {
    try {
      setLoading(true);
      addResult('🔑 TESTING LIVE API KEYS');
      addResult('=====================================');
      addResult('⚠️ WARNING: This will use LIVE API keys!');
      addResult('⚠️ This will process REAL payments!');
      addResult('⚠️ You may be charged transaction fees!');
      addResult('');
      
      // I-check kung may live keys
      addResult('🔍 Checking for live API keys...');
      addResult('Note: You need to set your live keys in the config file first.');
      addResult('');
      
      // I-test ang Payment Intent with live keys
      addResult('🔄 Testing Payment Intent with live keys...');
      const paymentIntentResult = await createPaymentIntent(
        1, // 1 PHP - minimum amount for testing
        'Live API test payment',
        'LIVE-TEST-' + Date.now()
      );
      
      addResult(`Payment Intent Result: ${JSON.stringify(paymentIntentResult, null, 2)}`);
      
      if (paymentIntentResult.success) {
        addResult('✅ Payment Intent created successfully with live keys!');
        addResult(`Payment Intent ID: ${paymentIntentResult.sourceId}`);
        addResult(`Status: ${paymentIntentResult.status}`);
        addResult(`Client Key: ${paymentIntentResult.clientKey}`);
        addResult(`Checkout URL: ${paymentIntentResult.checkoutUrl || 'No checkout URL'}`);
      } else {
        addResult(`❌ Payment Intent failed: ${paymentIntentResult.error}`);
      }
      
      addResult('');
      
      // I-test ang GCash Source with live keys
      addResult('🔄 Testing GCash Source with live keys...');
      const gcashSourceResult = await createGCashSource({
        amount: 1, // 1 PHP - minimum amount for testing
        description: 'Live API test GCash payment',
        successUrl: 'https://example.com/success',
        failedUrl: 'https://example.com/failed',
        referenceNumber: 'LIVE-GCASH-' + Date.now()
      });
      
      addResult(`GCash Source Result: ${JSON.stringify(gcashSourceResult, null, 2)}`);
      
      if (gcashSourceResult.success) {
        addResult('✅ GCash Source created successfully with live keys!');
        addResult(`Source ID: ${gcashSourceResult.sourceId}`);
        addResult(`Status: ${gcashSourceResult.status}`);
        addResult(`Checkout URL: ${gcashSourceResult.checkoutUrl}`);
        
        if (gcashSourceResult.checkoutUrl) {
          addResult('\n🌐 LIVE CHECKOUT URL:');
          addResult(`URL: ${gcashSourceResult.checkoutUrl}`);
          addResult('⚠️ This URL will process REAL payments!');
          addResult('⚠️ Test with small amounts only!');
        }
      } else {
        addResult(`❌ GCash Source failed: ${gcashSourceResult.error}`);
      }
      
      addResult('\n✅ Live API keys test completed!');
      
    } catch (error) {
      addResult(`❌ Live API keys test error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // SHOW LIVE KEYS SETUP
  // ========================================
  const showLiveKeysSetup = () => {
    Alert.alert(
      'Live API Keys Setup',
      'To use live API keys for testing:\n\n' +
      '1. Get your live keys from PayMongo Dashboard\n' +
      '2. Update the config file with your live keys\n' +
      '3. Uncomment the live keys section\n' +
      '4. Test with small amounts (1 PHP)\n\n' +
      '⚠️ Remember: Live keys process REAL payments!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Show Config', onPress: () => addResult('\n💻 Update app/config/paymongoConfig.ts with your live keys') }
      ]
    );
  };

  // ========================================
  // SHOW SAFETY TIPS
  // ========================================
  const showSafetyTips = () => {
    Alert.alert(
      'Live API Keys Safety Tips',
      'When using live API keys for testing:\n\n' +
      '✅ Use small amounts (1-10 PHP)\n' +
      '✅ Test with your own money first\n' +
      '✅ Keep track of test payments\n' +
      '✅ Refund test payments if needed\n' +
      '✅ Use separate test account if possible\n\n' +
      '❌ Don\'t test with large amounts\n' +
      '❌ Don\'t test with customer money\n' +
      '❌ Don\'t forget to switch back to test keys',
      [
        { text: 'Got it!', style: 'default' }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedText style={styles.title}>Live API Keys Testing</ThemedText>
        <ThemedText style={styles.subtitle}>
          Test PayMongo with live API keys (REAL payments!)
        </ThemedText>

        <View style={styles.warningContainer}>
          <MaterialIcons name="warning" size={24} color="#FF9500" />
          <ThemedText style={styles.warningText}>
            ⚠️ WARNING: This will process REAL payments with REAL money!
          </ThemedText>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={testLiveKeys}
            disabled={loading}
          >
            <MaterialIcons name="payment" size={24} color="white" />
            <ThemedText style={styles.buttonText}>
              {loading ? 'Testing Live Keys...' : 'Test Live API Keys'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={showLiveKeysSetup}
          >
            <MaterialIcons name="settings" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Setup Instructions</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={showSafetyTips}
          >
            <MaterialIcons name="security" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Safety Tips</ThemedText>
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
            <ThemedText style={styles.resultText}>{result || 'No results yet. Click "Test Live API Keys" to start.'}</ThemedText>
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
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  warningText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
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
  infoButton: {
    backgroundColor: '#34C759',
  },
  warningButton: {
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
