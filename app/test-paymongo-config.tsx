// ========================================
// PAYMONGO CONFIGURATION TEST
// ========================================
// Test file para sa PayMongo configuration validation

import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { paymongoConfig, validatePayMongoConfig, validatePayMongoKeys } from './config/paymongoConfig';

export default function PayMongoConfigTest() {
  const [configStatus, setConfigStatus] = useState<string>('Checking...');
  const [configDetails, setConfigDetails] = useState<any>({});

  useEffect(() => {
    testConfiguration();
  }, []);

  const testConfiguration = () => {
    try {
      console.log('🔍 Testing PayMongo Configuration...');
      
      // I-log ang current configuration
      console.log('🔍 Current config:', {
        secretKey: paymongoConfig.secretKey ? `${paymongoConfig.secretKey.substring(0, 10)}...` : 'NOT SET',
        publicKey: paymongoConfig.publicKey ? `${paymongoConfig.publicKey.substring(0, 10)}...` : 'NOT SET',
        apiBaseUrl: paymongoConfig.apiBaseUrl,
        currency: paymongoConfig.currency,
        environment: paymongoConfig.environment,
      });

      // I-check ang environment variables
      console.log('🔍 Environment variables:');
      console.log('EXPO_PUBLIC_PAYMONGO_SECRET_KEY:', process.env.EXPO_PUBLIC_PAYMONGO_SECRET_KEY ? 'SET' : 'NOT SET');
      console.log('EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY:', process.env.EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY ? 'SET' : 'NOT SET');

      // I-validate ang keys
      const keysValid = validatePayMongoKeys();
      console.log('🔍 Keys validation result:', keysValid);

      // I-validate ang complete configuration
      const configValid = validatePayMongoConfig();
      console.log('🔍 Complete config validation result:', configValid);

      setConfigDetails({
        secretKey: paymongoConfig.secretKey ? `${paymongoConfig.secretKey.substring(0, 15)}...` : 'NOT SET',
        publicKey: paymongoConfig.publicKey ? `${paymongoConfig.publicKey.substring(0, 15)}...` : 'NOT SET',
        apiBaseUrl: paymongoConfig.apiBaseUrl,
        currency: paymongoConfig.currency,
        environment: paymongoConfig.environment,
        keysValid,
        configValid,
        envSecretKey: process.env.EXPO_PUBLIC_PAYMONGO_SECRET_KEY ? 'SET' : 'NOT SET',
        envPublicKey: process.env.EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY ? 'SET' : 'NOT SET',
      });

      if (configValid) {
        setConfigStatus('✅ Configuration is valid!');
      } else {
        setConfigStatus('❌ Configuration is invalid!');
      }
    } catch (error) {
      console.error('❌ Configuration test error:', error);
      setConfigStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>PayMongo Configuration Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={[styles.status, configStatus.includes('✅') ? styles.success : styles.error]}>
          {configStatus}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration Details</Text>
        <Text style={styles.detail}>Secret Key: {configDetails.secretKey}</Text>
        <Text style={styles.detail}>Public Key: {configDetails.publicKey}</Text>
        <Text style={styles.detail}>API Base URL: {configDetails.apiBaseUrl}</Text>
        <Text style={styles.detail}>Currency: {configDetails.currency}</Text>
        <Text style={styles.detail}>Environment: {configDetails.environment}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environment Variables</Text>
        <Text style={styles.detail}>EXPO_PUBLIC_PAYMONGO_SECRET_KEY: {configDetails.envSecretKey}</Text>
        <Text style={styles.detail}>EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY: {configDetails.envPublicKey}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Validation Results</Text>
        <Text style={[styles.detail, configDetails.keysValid ? styles.success : styles.error]}>
          Keys Validation: {configDetails.keysValid ? '✅ PASS' : '❌ FAIL'}
        </Text>
        <Text style={[styles.detail, configDetails.configValid ? styles.success : styles.error]}>
          Complete Config: {configDetails.configValid ? '✅ PASS' : '❌ FAIL'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#F44336',
  },
  detail: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
});
