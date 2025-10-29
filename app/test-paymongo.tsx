// ========================================
// PAYMONGO TEST COMPONENT - PAMAMAHALA NG PAYMONGO TESTING
// ========================================
// Ang file na ito ay naghahandle ng PayMongo integration testing
// May test functions para sa PayMongo service verification
// Support para sa testing ng GCash payment flow

// Import ng React Native components
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Import ng PayMongo services
import { getEnvironment, isDevelopment, validatePayMongoKeys } from './config/paymongoConfig';
import {
  createGCashSource,
  generateReferenceNumber,
  getAvailablePaymentMethods,
  validatePayMongoAmount
} from './services/paymongoService';

// ========================================
// PAYMONGO TEST COMPONENT
// ========================================
// Main component para sa PayMongo testing
export default function PayMongoTest() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  // I-add ang test result sa list
  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // I-clear ang test results
  const clearTestResults = () => {
    setTestResults([]);
  };

  // ========================================
  // TEST CONFIGURATION
  // ========================================
  const testConfiguration = async () => {
    try {
      setLoading(true);
      addTestResult('Testing PayMongo configuration...');
      
      const env = getEnvironment();
      const dev = isDevelopment();
      const hasValidKeys = validatePayMongoKeys();
      addTestResult(`Environment: ${env}`);
      addTestResult(`Is Development: ${dev}`);
      addTestResult(`Has Valid Keys: ${hasValidKeys}`);
      
      if (hasValidKeys) {
        addTestResult('✅ Configuration test passed');
      } else {
        addTestResult('❌ Configuration test failed - Invalid API keys');
      }
    } catch (error) {
      addTestResult(`❌ Configuration test error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // TEST AMOUNT VALIDATION
  // ========================================
  const testAmountValidation = async () => {
    try {
      setLoading(true);
      addTestResult('Testing amount validation...');
      
      const testAmounts = [0.5, 1, 50, 100, 50000, 100000, 150000];
      
      testAmounts.forEach(amount => {
        const isValid = validatePayMongoAmount(amount);
        addTestResult(`Amount ${amount}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      });
      
      addTestResult('✅ Amount validation test completed');
    } catch (error) {
      addTestResult(`❌ Amount validation test error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // TEST REFERENCE NUMBER GENERATION
  // ========================================
  const testReferenceNumberGeneration = async () => {
    try {
      setLoading(true);
      addTestResult('Testing reference number generation...');
      
      const refNumbers = [];
      for (let i = 0; i < 5; i++) {
        const refNumber = generateReferenceNumber();
        refNumbers.push(refNumber);
        addTestResult(`Generated: ${refNumber}`);
      }
      
      // I-check kung unique ang mga reference numbers
      const uniqueRefs = new Set(refNumbers);
      if (uniqueRefs.size === refNumbers.length) {
        addTestResult('✅ Reference numbers are unique');
      } else {
        addTestResult('❌ Reference numbers are not unique');
      }
      
      addTestResult('✅ Reference number generation test completed');
    } catch (error) {
      addTestResult(`❌ Reference number generation test error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // TEST PAYMENT METHODS
  // ========================================
  const testPaymentMethods = async () => {
    try {
      setLoading(true);
      addTestResult('Testing available payment methods...');
      
      const methods = getAvailablePaymentMethods();
      addTestResult(`Available methods: ${methods.join(', ')}`);
      
      if (methods.includes('gcash')) {
        addTestResult('✅ GCash payment method available');
      } else {
        addTestResult('❌ GCash payment method not available');
      }
      
      addTestResult('✅ Payment methods test completed');
    } catch (error) {
      addTestResult(`❌ Payment methods test error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // TEST GCASH SOURCE CREATION
  // ========================================
  const testGCashSourceCreation = async () => {
    try {
      setLoading(true);
      addTestResult('Testing GCash source creation...');
      
      const testRequest = {
        amount: 100,
        description: 'Test payment for PayMongo integration',
        successUrl: 'https://your-app.com/payment/success',
        failedUrl: 'https://your-app.com/payment/failed',
        referenceNumber: generateReferenceNumber()
      };
      
      addTestResult(`Creating source for amount: ${testRequest.amount} PHP`);
      addTestResult(`Reference: ${testRequest.referenceNumber}`);
      
      const result = await createGCashSource(testRequest);
      
      if (result.success) {
        addTestResult(`✅ Source created successfully: ${result.sourceId}`);
        addTestResult(`Checkout URL: ${result.checkoutUrl}`);
        addTestResult(`Status: ${result.status}`);
      } else {
        addTestResult(`❌ Source creation failed: ${result.error}`);
      }
      
      addTestResult('✅ GCash source creation test completed');
    } catch (error) {
      addTestResult(`❌ GCash source creation test error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // RUN ALL TESTS
  // ========================================
  const runAllTests = async () => {
    clearTestResults();
    addTestResult('🚀 Starting PayMongo integration tests...');
    
    await testConfiguration();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testAmountValidation();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testReferenceNumberGeneration();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testPaymentMethods();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testGCashSourceCreation();
    
    addTestResult('🏁 All tests completed!');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="account-balance-wallet" size={32} color="#00B2FF" />
        <ThemedText type="title" style={styles.title}>
          PayMongo Integration Test
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Test PayMongo GCash payment integration
        </ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: '#00B2FF' }]}
          onPress={runAllTests}
          disabled={loading}
        >
          <MaterialIcons name="play-arrow" size={20} color="#fff" />
          <Text style={styles.buttonText}>
            {loading ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: '#6c757d' }]}
          onPress={clearTestResults}
          disabled={loading}
        >
          <MaterialIcons name="clear" size={20} color="#fff" />
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <ThemedText type="subtitle" style={styles.resultsTitle}>
          Test Results:
        </ThemedText>
        <View style={styles.resultsList}>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.resultItem}>
              {result}
            </Text>
          ))}
        </View>
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
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 30,
  },
  testButton: {
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
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultsList: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  resultItem: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
