// ========================================
// PAYMONGO CONFIGURATION
// ========================================
// Configuration file para sa PayMongo payment integration
// Contains API keys, validation functions, at payment settings

// ========================================
// ENVIRONMENT CONFIGURATION
// ========================================
// I-set ang environment (development o production)
const ENVIRONMENT = __DEV__ ? 'development' : 'production';

// ========================================
// PAYMONGO API CONFIGURATION
// ========================================
// Configuration object para sa PayMongo API

// I-import ang app configuration
import Constants from 'expo-constants';

// I-get ang keys from different sources
const getSecretKey = () => {
  return process.env.EXPO_PUBLIC_PAYMONGO_SECRET_KEY || 
         Constants.expoConfig?.extra?.paymongo?.secretKey || 
         'sk_test_WL2guhaPujZZ5cw4ycEuyWue';
};

const getPublicKey = () => {
  return process.env.EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY || 
         Constants.expoConfig?.extra?.paymongo?.publicKey || 
         'pk_test_unHcUNnqqxMZZyLwcn9omjPz';
};

export const paymongoConfig = {
  // API Keys - I-set ang actual keys sa environment variables o app.json
  secretKey: getSecretKey(),
  publicKey: getPublicKey(),
  
  // API Base URL
  apiBaseUrl: 'https://api.paymongo.com/v1',
  
  // Currency settings
  currency: 'PHP',
  
  // Amount validation
  minimumAmount: 1.00, // Minimum amount in PHP
  maximumAmount: 100000.00, // Maximum amount in PHP
  
  // Environment
  environment: ENVIRONMENT,
  
  // Payment method settings
  defaultPaymentMethods: ['gcash', 'grab_pay', 'maya'],
  
  // Timeout settings
  requestTimeout: 30000, // 30 seconds
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

// ========================================
// VALIDATION FUNCTIONS
// ========================================
// Functions para sa validation ng configuration at data

// I-validate ang PayMongo API keys
export function validatePayMongoKeys(): boolean {
  try {
    // I-check kung may secret key
    if (!paymongoConfig.secretKey || paymongoConfig.secretKey === 'sk_test_placeholder') {
      console.warn('⚠️ PayMongo secret key not set or using placeholder');
      return false;
    }
    
    // I-check kung may public key
    if (!paymongoConfig.publicKey || paymongoConfig.publicKey === 'pk_test_placeholder') {
      console.warn('⚠️ PayMongo public key not set or using placeholder');
      return false;
    }
    
    // I-check kung valid ang key format
    const secretKeyValid = paymongoConfig.secretKey.startsWith('sk_');
    const publicKeyValid = paymongoConfig.publicKey.startsWith('pk_');
    
    if (!secretKeyValid) {
      console.error('❌ Invalid PayMongo secret key format - must start with "sk_"');
      return false;
    }
    
    if (!publicKeyValid) {
      console.error('❌ Invalid PayMongo public key format - must start with "pk_"');
      return false;
    }
    
    // I-check kung test o live keys
    const isTestSecret = paymongoConfig.secretKey.includes('_test_');
    const isTestPublic = paymongoConfig.publicKey.includes('_test_');
    
    if (isTestSecret !== isTestPublic) {
      console.warn('⚠️ PayMongo key mismatch - one is test, one is live');
    }
    
    console.log('✅ PayMongo API keys validated successfully');
    console.log(`🔍 Using ${isTestSecret ? 'TEST' : 'LIVE'} environment`);
    
    return true;
  } catch (error) {
    console.error('❌ Error validating PayMongo keys:', error);
    return false;
  }
}

// I-validate ang amount para sa PayMongo
export function validateAmount(amount: number): boolean {
  try {
    // I-check kung number ang amount
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.error('❌ Amount must be a valid number');
      return false;
    }
    
    // I-check kung positive ang amount
    if (amount <= 0) {
      console.error('❌ Amount must be greater than 0');
      return false;
    }
    
    // I-check kung within ang minimum at maximum range
    if (amount < paymongoConfig.minimumAmount) {
      console.error(`❌ Amount must be at least ${paymongoConfig.minimumAmount} PHP`);
      return false;
    }
    
    if (amount > paymongoConfig.maximumAmount) {
      console.error(`❌ Amount must not exceed ${paymongoConfig.maximumAmount} PHP`);
      return false;
    }
    
    // I-check kung may decimal places (max 2)
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      console.error('❌ Amount cannot have more than 2 decimal places');
      return false;
    }
    
    console.log(`✅ Amount validation passed: ${amount} PHP`);
    return true;
  } catch (error) {
    console.error('❌ Error validating amount:', error);
    return false;
  }
}

// I-validate ang currency
export function validateCurrency(currency: string): boolean {
  try {
    if (!currency || typeof currency !== 'string') {
      console.error('❌ Currency must be a valid string');
      return false;
    }
    
    const validCurrencies = ['PHP', 'USD', 'EUR', 'GBP'];
    if (!validCurrencies.includes(currency.toUpperCase())) {
      console.error(`❌ Unsupported currency: ${currency}. Supported: ${validCurrencies.join(', ')}`);
      return false;
    }
    
    console.log(`✅ Currency validation passed: ${currency}`);
    return true;
  } catch (error) {
    console.error('❌ Error validating currency:', error);
    return false;
  }
}

// I-validate ang payment method
export function validatePaymentMethod(paymentMethod: string): boolean {
  try {
    if (!paymentMethod || typeof paymentMethod !== 'string') {
      console.error('❌ Payment method must be a valid string');
      return false;
    }
    
    const validMethods = ['gcash', 'grab_pay', 'maya', 'card', 'qrph', 'dob', 'billease'];
    if (!validMethods.includes(paymentMethod.toLowerCase())) {
      console.error(`❌ Unsupported payment method: ${paymentMethod}. Supported: ${validMethods.join(', ')}`);
      return false;
    }
    
    console.log(`✅ Payment method validation passed: ${paymentMethod}`);
    return true;
  } catch (error) {
    console.error('❌ Error validating payment method:', error);
    return false;
  }
}

// I-validate ang reference number
export function validateReferenceNumber(referenceNumber: string): boolean {
  try {
    if (!referenceNumber || typeof referenceNumber !== 'string') {
      console.error('❌ Reference number must be a valid string');
      return false;
    }
    
    // I-check kung may minimum length
    if (referenceNumber.length < 5) {
      console.error('❌ Reference number must be at least 5 characters long');
      return false;
    }
    
    // I-check kung may maximum length
    if (referenceNumber.length > 50) {
      console.error('❌ Reference number must not exceed 50 characters');
      return false;
    }
    
    // I-check kung alphanumeric lang
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(referenceNumber)) {
      console.error('❌ Reference number must contain only alphanumeric characters');
      return false;
    }
    
    console.log(`✅ Reference number validation passed: ${referenceNumber}`);
    return true;
  } catch (error) {
    console.error('❌ Error validating reference number:', error);
    return false;
  }
}

// ========================================
// CONFIGURATION HELPERS
// ========================================
// Helper functions para sa configuration management

// I-get ang current environment
export function getEnvironment(): string {
  return paymongoConfig.environment;
}

// I-check kung development environment
export function isDevelopment(): boolean {
  return paymongoConfig.environment === 'development';
}

// I-check kung production environment
export function isProduction(): boolean {
  return paymongoConfig.environment === 'production';
}

// I-get ang API base URL
export function getApiBaseUrl(): string {
  return paymongoConfig.apiBaseUrl;
}

// I-get ang secret key
export function getSecretKeyValue(): string {
  return paymongoConfig.secretKey;
}

// I-get ang public key
export function getPublicKeyValue(): string {
  return paymongoConfig.publicKey;
}

// I-get ang currency
export function getCurrency(): string {
  return paymongoConfig.currency;
}

// I-get ang minimum amount
export function getMinimumAmount(): number {
  return paymongoConfig.minimumAmount;
}

// I-get ang maximum amount
export function getMaximumAmount(): number {
  return paymongoConfig.maximumAmount;
}

// I-get ang available payment methods
export function getAvailablePaymentMethods(): string[] {
  return paymongoConfig.defaultPaymentMethods;
}

// ========================================
// CONFIGURATION VALIDATION
// ========================================
// I-validate ang complete configuration

// I-validate ang complete PayMongo configuration
export function validatePayMongoConfig(): boolean {
  try {
    console.log('🔄 Validating PayMongo configuration...');
    
    // I-validate ang API keys
    if (!validatePayMongoKeys()) {
      return false;
    }
    
    // I-validate ang currency
    if (!validateCurrency(paymongoConfig.currency)) {
      return false;
    }
    
    // I-validate ang amount limits
    if (paymongoConfig.minimumAmount <= 0) {
      console.error('❌ Minimum amount must be greater than 0');
      return false;
    }
    
    if (paymongoConfig.maximumAmount <= paymongoConfig.minimumAmount) {
      console.error('❌ Maximum amount must be greater than minimum amount');
      return false;
    }
    
    // I-validate ang API base URL
    if (!paymongoConfig.apiBaseUrl || !paymongoConfig.apiBaseUrl.startsWith('https://')) {
      console.error('❌ Invalid API base URL');
      return false;
    }
    
    console.log('✅ PayMongo configuration validated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error validating PayMongo configuration:', error);
    return false;
  }
}

// ========================================
// ENVIRONMENT VARIABLES SETUP
// ========================================
// Instructions para sa environment variables setup

/*
ENVIRONMENT VARIABLES SETUP:

1. I-create ang .env file sa project root:
   EXPO_PUBLIC_PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
   EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here

2. I-set ang actual PayMongo keys:
   - Para sa development: Use test keys (sk_test_... at pk_test_...)
   - Para sa production: Use live keys (sk_live_... at pk_live_...)

3. I-restart ang development server after setting environment variables

4. I-check ang console logs para sa validation status

NOTES:
- I-keep ang secret key secure at hindi i-commit sa version control
- I-use ang test keys para sa development
- I-validate ang keys before using sa production
- I-check ang PayMongo dashboard para sa key status
*/

// ========================================
// EXPORTS
// ========================================
// I-export ang configuration at functions

export default paymongoConfig;
