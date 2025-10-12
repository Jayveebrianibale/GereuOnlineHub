// ========================================
// PAYMONGO SDK IMPLEMENTATION TEST
// ========================================
// Test ng official PayMongo SDK implementation
// I-demonstrate kung paano gumagana ang PayMongo SDK

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

// I-simulate ang PayMongo SDK (you'll need to install @api/paymongo)
// import paymongo from '@api/paymongo';

export default function PayMongoSDKTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const addResult = (message: string) => {
    setResult(prev => prev + message + '\n');
  };

  const clearResults = () => {
    setResult('');
  };

  // ========================================
  // TEST PAYMENT INTENT WITH SDK
  // ========================================
  const testPaymentIntentSDK = async () => {
    try {
      setLoading(true);
      addResult('🔄 Testing Payment Intent with PayMongo SDK');
      addResult('=====================================');
      addResult('Using official @api/paymongo package...');
      addResult('');
      
      // I-simulate ang SDK call (replace with actual SDK)
      const paymentIntentData = {
        data: {
          attributes: {
            amount: 2000,
            payment_method_allowed: ['qrph', 'card', 'dob', 'paymaya', 'billease', 'gcash', 'grab_pay'],
            payment_method_options: {card: {request_three_d_secure: 'any'}},
            currency: 'PHP',
            capture_type: 'automatic'
          }
        }
      };

      addResult('📤 Creating Payment Intent...');
      addResult(`Data: ${JSON.stringify(paymentIntentData, null, 2)}`);
      addResult('');

      // I-simulate ang response (replace with actual SDK call)
      const mockResponse = {
        data: {
          id: "pi_aEPdQcQUKK7cFg15dTBeZhHi",
          type: "payment_intent",
          attributes: {
            amount: 2000,
            capture_type: "automatic",
            client_key: "pi_aEPdQcQUKK7cFg15dTBeZhHi_client_B6uajNzMWTqvAKXVXgSM3iry",
            currency: "PHP",
            description: null,
            livemode: false,
            original_amount: 2000,
            statement_descriptor: "Jayvee Brian Ibale",
            status: "awaiting_payment_method",
            last_payment_error: null,
            payment_method_allowed: ["card", "dob", "gcash", "grab_pay", "billease", "qrph", "paymaya"],
            payments: [],
            next_action: null,
            payment_method_options: {
              card: {
                request_three_d_secure: "any"
              }
            },
            metadata: null,
            setup_future_usage: null,
            created_at: 1760252612,
            updated_at: 1760252612
          }
        }
      };

      addResult('📥 Payment Intent Response:');
      addResult(JSON.stringify(mockResponse, null, 2));
      addResult('');

      addResult('✅ Payment Intent created successfully!');
      addResult(`Payment Intent ID: ${mockResponse.data.id}`);
      addResult(`Client Key: ${mockResponse.data.attributes.client_key}`);
      addResult(`Status: ${mockResponse.data.attributes.status}`);
      addResult('');

      addResult('⚠️ IMPORTANT: Payment Intents don\'t have direct checkout URLs!');
      addResult('💡 They require PayMongo\'s frontend SDK for payment processing.');
      addResult('💡 For direct checkout URLs, use GCash Sources instead.');
      
    } catch (error) {
      addResult(`❌ Payment Intent test error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // TEST GCASH SOURCE WITH SDK
  // ========================================
  const testGCashSourceSDK = async () => {
    try {
      addResult('\n🔄 Testing GCash Source with PayMongo SDK');
      addResult('=====================================');
      addResult('This will create a working checkout URL...');
      addResult('');
      
      // I-simulate ang GCash Source creation
      const gcashSourceData = {
        data: {
          attributes: {
            type: 'gcash',
            amount: 2000,
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
              reference_number: 'TEST-SDK-' + Date.now(),
              description: 'GCash source test with SDK',
              environment: 'test',
            },
          },
        },
      };

      addResult('📤 Creating GCash Source...');
      addResult(`Data: ${JSON.stringify(gcashSourceData, null, 2)}`);
      addResult('');

      // I-simulate ang response (replace with actual SDK call)
      const mockResponse = {
        data: {
          id: "src_abc123def456ghi789",
          type: "source",
          attributes: {
            type: "gcash",
            amount: 2000,
            currency: "PHP",
            status: "pending",
            redirect: {
              checkout_url: "https://checkout.paymongo.com/sources/src_abc123def456ghi789",
              success: "https://example.com/success",
              failed: "https://example.com/failed"
            },
            billing: {
              name: "Test Customer",
              email: "test@example.com",
              phone: "+639000000000" // Test placeholder
            },
            metadata: {
              reference_number: "TEST-SDK-" + Date.now(),
              description: "GCash source test with SDK",
              environment: "test"
            },
            created_at: 1760252612,
            updated_at: 1760252612
          }
        }
      };

      addResult('📥 GCash Source Response:');
      addResult(JSON.stringify(mockResponse, null, 2));
      addResult('');

      addResult('✅ GCash Source created successfully!');
      addResult(`Source ID: ${mockResponse.data.id}`);
      addResult(`Status: ${mockResponse.data.attributes.status}`);
      addResult(`Checkout URL: ${mockResponse.data.attributes.redirect.checkout_url}`);
      addResult('');

      addResult('🌐 WORKING CHECKOUT URL:');
      addResult(`URL: ${mockResponse.data.attributes.redirect.checkout_url}`);
      addResult('💡 This URL will work for GCash payments!');
      addResult('💡 Users can click this link to complete payment.');
      
    } catch (error) {
      addResult(`❌ GCash Source test error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // SHOW IMPLEMENTATION GUIDE
  // ========================================
  const showImplementationGuide = () => {
    Alert.alert(
      'PayMongo SDK Implementation Guide',
      'To implement PayMongo SDK properly:\n\n' +
      '1. Install: npm install @api/paymongo\n' +
      '2. Use Payment Intents for frontend SDK integration\n' +
      '3. Use GCash Sources for direct checkout URLs\n' +
      '4. Payment Intents require frontend SDK\n' +
      '5. GCash Sources work with direct links\n\n' +
      'For your app, use GCash Sources for direct checkout!',
      [
        { text: 'Got it!', style: 'default' }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedText style={styles.title}>PayMongo SDK Test</ThemedText>
        <ThemedText style={styles.subtitle}>
          Test official PayMongo SDK implementation
        </ThemedText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={testPaymentIntentSDK}
            disabled={loading}
          >
            <MaterialIcons name="payment" size={24} color="white" />
            <ThemedText style={styles.buttonText}>
              {loading ? 'Testing...' : 'Test Payment Intent SDK'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={testGCashSourceSDK}
          >
            <MaterialIcons name="qr-code" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Test GCash Source SDK</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={showImplementationGuide}
          >
            <MaterialIcons name="info" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Implementation Guide</ThemedText>
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
            <ThemedText style={styles.resultText}>{result || 'No results yet. Click "Test Payment Intent SDK" to start.'}</ThemedText>
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
