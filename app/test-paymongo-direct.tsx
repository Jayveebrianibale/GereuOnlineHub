// ========================================
// DIRECT PAYMONGO TEST - PAMAMAHALA NG DIRECT API TESTING
// ========================================
// Direct test ng PayMongo API endpoints
// Tests both Payment Intents and Sources APIs

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function DirectPayMongoTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testPaymentIntentAPI = async () => {
    try {
      setLoading(true);
      setResult('🔄 Testing Payment Intent API directly...\n');
      
      const url = 'https://api.paymongo.com/v1/payment_intents';
      const options = {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': 'Basic ' + btoa('sk_test_WL2guhaPujZZ5cw4ycEuyWue:')
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: 2000,
              payment_method_allowed: ['qrph', 'card', 'dob', 'paymaya', 'billease', 'gcash', 'grab_pay'],
              payment_method_options: { card: { request_three_d_secure: 'any' } },
              currency: 'PHP',
              capture_type: 'automatic'
            }
          }
        })
      };

      const response = await fetch(url, options);
      const json = await response.json();
      
      setResult(prev => prev + `Status: ${response.status}\n`);
      setResult(prev => prev + `Response: ${JSON.stringify(json, null, 2)}\n\n`);
      
    } catch (error) {
      setResult(prev => prev + `❌ ERROR: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testSourcesAPI = async () => {
    try {
      setLoading(true);
      setResult('🔄 Testing Sources API directly...\n');
      
      const url = 'https://api.paymongo.com/v1/sources';
      const options = {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': 'Basic ' + btoa('sk_test_WL2guhaPujZZ5cw4ycEuyWue:')
        },
        body: JSON.stringify({
          data: {
            attributes: {
              type: 'gcash',
              amount: 2000,
              currency: 'PHP',
              redirect: {
                success: 'https://secure-authentication.paymongo.com/success',
                failed: 'https://secure-authentication.paymongo.com/failed'
              }
            }
          }
        })
      };

      const response = await fetch(url, options);
      const json = await response.json();
      
      setResult(prev => prev + `Status: ${response.status}\n`);
      setResult(prev => prev + `Response: ${JSON.stringify(json, null, 2)}\n\n`);
      
    } catch (error) {
      setResult(prev => prev + `❌ ERROR: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testBothAPIs = async () => {
    setResult('🔄 Testing both APIs...\n\n');
    await testPaymentIntentAPI();
    await testSourcesAPI();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="api" size={32} color="#00B2FF" />
        <ThemedText type="title" style={styles.title}>
          Direct PayMongo API Test
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Test PayMongo APIs directly
        </ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#00B2FF' }]}
          onPress={testPaymentIntentAPI}
          disabled={loading}
        >
          <MaterialIcons name="play-arrow" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>
            Test Payment Intent API
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#10B981' }]}
          onPress={testSourcesAPI}
          disabled={loading}
        >
          <MaterialIcons name="play-arrow" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>
            Test Sources API
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#F59E0B' }]}
          onPress={testBothAPIs}
          disabled={loading}
        >
          <MaterialIcons name="list" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>
            Test Both APIs
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultContainer}>
        <ThemedText style={styles.resultTitle}>API Test Results:</ThemedText>
        <ThemedText style={styles.resultText}>
          {result || 'Click a button to test the PayMongo APIs...'}
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
