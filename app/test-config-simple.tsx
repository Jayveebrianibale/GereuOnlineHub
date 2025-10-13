// Simple test to check PayMongo configuration
import Constants from 'expo-constants';
import { paymongoConfig, validatePayMongoKeys } from './config/paymongoConfig';

console.log('=== PAYMONGO CONFIGURATION TEST ===');
console.log('Environment variables:');
console.log('EXPO_PUBLIC_PAYMONGO_SECRET_KEY:', process.env.EXPO_PUBLIC_PAYMONGO_SECRET_KEY ? 'SET' : 'NOT SET');
console.log('EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY:', process.env.EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY ? 'SET' : 'NOT SET');

console.log('\nApp.json configuration:');
console.log('Constants.expoConfig?.extra?.paymongo?.secretKey:', Constants.expoConfig?.extra?.paymongo?.secretKey ? 'SET' : 'NOT SET');
console.log('Constants.expoConfig?.extra?.paymongo?.publicKey:', Constants.expoConfig?.extra?.paymongo?.publicKey ? 'SET' : 'NOT SET');

console.log('\nFinal configuration values:');
console.log('Secret Key:', paymongoConfig.secretKey ? `${paymongoConfig.secretKey.substring(0, 15)}...` : 'NOT SET');
console.log('Public Key:', paymongoConfig.publicKey ? `${paymongoConfig.publicKey.substring(0, 15)}...` : 'NOT SET');
console.log('API Base URL:', paymongoConfig.apiBaseUrl);

console.log('\nValidation:');
const isValid = validatePayMongoKeys();
console.log('Keys valid:', isValid);

if (isValid) {
  console.log('✅ PayMongo configuration is working!');
} else {
  console.log('❌ PayMongo configuration has issues');
}
