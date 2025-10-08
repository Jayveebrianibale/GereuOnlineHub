// ========================================
// PAYMONGO SERVICE - PAMAMAHALA NG PAYMONGO PAYMENTS
// ========================================
// Ang file na ito ay naghahandle ng PayMongo payment service operations
// May functions para sa GCash payment processing, source creation, at payment verification
// Support para sa PayMongo API integration

// Import ng configuration
import { paymongoConfig, validateAmount, validatePayMongoKeys } from '../config/paymongoConfig';

// ========================================
// PAYMONGO CONFIGURATION
// ========================================
// Configuration para sa PayMongo API
const PAYMONGO_SECRET_KEY = paymongoConfig.secretKey;
const PAYMONGO_PUBLIC_KEY = paymongoConfig.publicKey;
const PAYMONGO_API_BASE_URL = paymongoConfig.apiBaseUrl;

// I-validate ang configuration before initializing
if (!validatePayMongoKeys()) {
  console.error('❌ Invalid PayMongo configuration. Please check your API keys.');
  throw new Error('Invalid PayMongo configuration');
}

// ========================================
// PAYMONGO API CLIENT
// ========================================
// React Native compatible PayMongo API client using fetch
class PayMongoClient {
  private secretKey: string;
  private baseUrl: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
    this.baseUrl = PAYMONGO_API_BASE_URL;
  }

  private base64Encode(str: string): string {
    // React Native compatible base64 encoding
    if (typeof btoa !== 'undefined') {
      return btoa(str);
    }
    
    // Fallback for React Native
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '';
    let i = 0;
    
    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = i < str.length ? str.charCodeAt(i++) : 0;
      const c = i < str.length ? str.charCodeAt(i++) : 0;
      
      const bitmap = (a << 16) | (b << 8) | c;
      
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
    }
    
    return result;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', data?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`🔍 PayMongo API Request: ${method} ${url}`);
    if (data) {
      console.log('🔍 Request data:', JSON.stringify(data, null, 2));
    }
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Basic ${this.base64Encode(this.secretKey + ':')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      console.log(`🔍 PayMongo API Response: ${response.status} ${response.statusText}`);
      console.log('🔍 Response data:', JSON.stringify(result, null, 2));

      if (!response.ok) {
        const errorMessage = result.message || result.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ PayMongo API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      return result;
    } catch (error) {
      console.error('❌ PayMongo API Request Error:', error);
      throw error;
    }
  }

  // Payment Intents API methods
  async createPaymentIntent(data: any) {
    return this.makeRequest('/payment_intents', 'POST', data);
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    return this.makeRequest(`/payment_intents/${paymentIntentId}`);
  }

  async attachPaymentMethod(paymentIntentId: string, data: any) {
    return this.makeRequest(`/payment_intents/${paymentIntentId}/attach`, 'POST', data);
  }

  // Legacy methods for backward compatibility
  async createSource(data: any) {
    return this.makeRequest('/sources', 'POST', data);
  }

  async retrieveSource(sourceId: string) {
    return this.makeRequest(`/sources/${sourceId}`);
  }

  async createPayment(data: any) {
    return this.makeRequest('/payments', 'POST', data);
  }

  async retrievePayment(paymentId: string) {
    return this.makeRequest(`/payments/${paymentId}`);
  }
}

// Initialize PayMongo client
const paymongo = new PayMongoClient(PAYMONGO_SECRET_KEY);

// ========================================
// INTERFACE DEFINITIONS
// ========================================
// Type definitions para sa PayMongo payment system

// Interface para sa PayMongo source data
export interface PayMongoSourceData {
  id: string;
  type: 'source';
  attributes: {
    type: 'gcash';
    amount: number;
    currency: 'PHP';
    status: 'pending' | 'chargeable' | 'failed' | 'cancelled';
    redirect: {
      checkout_url: string;
      success: string;
      failed: string;
    };
    created_at: number;
    updated_at: number;
  };
}

// Interface para sa PayMongo payment data
export interface PayMongoPaymentData {
  id: string;
  type: 'payment';
  attributes: {
    amount: number;
    currency: 'PHP';
    status: 'pending' | 'paid' | 'failed' | 'cancelled';
    description: string;
    source: {
      id: string;
      type: 'source';
    };
    created_at: number;
    updated_at: number;
  };
}

// Interface para sa PayMongo Payment Intent data
export interface PayMongoPaymentIntentData {
  id: string;
  type: 'payment_intent';
  attributes: {
    amount: number;
    currency: 'PHP';
    status: 'awaiting_payment_method' | 'awaiting_next_action' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
    payment_method_allowed: string[];
    payment_method_options: any;
    capture_type: 'automatic' | 'manual';
    client_key: string;
    created_at: number;
    updated_at: number;
  };
}

// Interface para sa GCash payment request
export interface GCashPaymentRequest {
  amount: number;
  description: string;
  successUrl: string;
  failedUrl: string;
  referenceNumber: string;
}

// Interface para sa payment result
export interface PayMongoPaymentResult {
  success: boolean;
  sourceId?: string;
  paymentId?: string;
  checkoutUrl?: string;
  error?: string;
  status?: string;
}

// ========================================
// CREATE PAYMENT INTENT FUNCTION
// ========================================
// I-create ang Payment Intent para sa modern payment flow
// I-support ang multiple payment methods including GCash
export async function createPaymentIntent(amount: number, description: string, referenceNumber: string): Promise<PayMongoPaymentResult> {
  try {
    console.log('🔄 Creating Payment Intent for amount:', amount);

    // I-validate ang amount
    if (!validatePayMongoAmount(amount)) {
      throw new Error(`Amount must be between ${paymongoConfig.minimumAmount} and ${paymongoConfig.maximumAmount} PHP`);
    }

    // I-create ang payment intent data
    const paymentIntentData = {
      data: {
        attributes: {
          amount: amount * 100, // Convert to centavos
          payment_method_allowed: ['qrph', 'card', 'dob', 'paymaya', 'billease', 'gcash', 'grab_pay'],
          payment_method_options: {
            card: { request_three_d_secure: 'any' }
          },
          currency: paymongoConfig.currency,
          capture_type: 'automatic',
          metadata: {
            reference_number: referenceNumber,
            description: description,
            environment: paymongoConfig.environment,
          }
        }
      }
    };

    // I-create ang payment intent sa PayMongo
    const response = await paymongo.createPaymentIntent(paymentIntentData);
    
    if (response.data && response.data.attributes) {
      const paymentIntent = response.data as PayMongoPaymentIntentData;
      
      console.log('✅ Payment Intent created successfully:', paymentIntent.id);
      
      return {
        success: true,
        sourceId: paymentIntent.id, // Using sourceId field for compatibility
        checkoutUrl: `https://paymongo.com/payment_intents/${paymentIntent.id}`, // Generate checkout URL
        status: paymentIntent.attributes.status,
        clientKey: paymentIntent.attributes.client_key,
      };
    } else {
      throw new Error('Invalid response from PayMongo');
    }
  } catch (error: any) {
    console.error('❌ Failed to create Payment Intent:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to create Payment Intent',
    };
  }
}

// ========================================
// CREATE GCASH SOURCE FUNCTION (LEGACY)
// ========================================
// I-create ang GCash source para sa payment authorization
// I-generate ang checkout URL para sa customer authorization
export async function createGCashSource(request: GCashPaymentRequest): Promise<PayMongoPaymentResult> {
  try {
    console.log('🔄 Creating GCash source for amount:', request.amount);
    console.log('🔄 Request details:', JSON.stringify(request, null, 2));

    // I-validate ang amount
    if (!validatePayMongoAmount(request.amount)) {
      throw new Error(`Amount must be between ${paymongoConfig.minimumAmount} and ${paymongoConfig.maximumAmount} PHP`);
    }

    // I-validate ang required fields
    if (!request.successUrl || !request.failedUrl) {
      throw new Error('Success and failed URLs are required');
    }

    // I-create ang source data with proper validation
    const sourceData = {
      data: {
        attributes: {
          type: 'gcash',
          amount: Math.round(request.amount * 100), // Convert to centavos and ensure integer
          currency: paymongoConfig.currency,
          redirect: {
            success: request.successUrl,
            failed: request.failedUrl,
          },
          billing: {
            name: 'Customer',
            email: 'customer@example.com',
            phone: '+639123456789',
          },
          metadata: {
            reference_number: request.referenceNumber,
            description: request.description,
            environment: paymongoConfig.environment,
          },
        },
      },
    };

    console.log('🔍 Source data to send:', JSON.stringify(sourceData, null, 2));

    // I-create ang source sa PayMongo
    const response = await paymongo.createSource(sourceData);
    
    console.log('🔍 PayMongo Source Response:', JSON.stringify(response, null, 2));
    
    // I-check kung may error sa response
    if (response.errors && response.errors.length > 0) {
      const errorMessage = response.errors.map((error: any) => error.detail || error.message).join(', ');
      throw new Error(`PayMongo API Error: ${errorMessage}`);
    }
    
    if (response.data && response.data.attributes) {
      const source = response.data as PayMongoSourceData;
      
      console.log('✅ GCash source created successfully:', source.id);
      console.log('🔍 Source attributes:', JSON.stringify(source.attributes, null, 2));
      console.log('🔍 Redirect object:', JSON.stringify(source.attributes.redirect, null, 2));
      
      // I-validate ang source ID
      if (!source.id || source.id.length < 10) {
        throw new Error('Invalid source ID received from PayMongo');
      }
      
      // I-extract ang checkout URL from different possible locations
      let checkoutUrl = '';
      
      if (source.attributes.redirect) {
        // I-check ang different possible properties
        checkoutUrl = source.attributes.redirect.checkout_url || 
                     source.attributes.redirect.url || 
                     source.attributes.redirect.checkoutUrl ||
                     source.attributes.redirect.redirect_url;
      }
      
      // I-fix ang checkout URL format - PayMongo uses paymongo.com, not secure-authentication.paymongo.com
      if (checkoutUrl && checkoutUrl.includes('secure-authentication.paymongo.com')) {
        // I-extract ang source ID from the URL parameter using regex
        const sourceIdMatch = checkoutUrl.match(/[?&]id=([^&]+)/);
        
        if (sourceIdMatch && sourceIdMatch[1]) {
          // I-create ang correct PayMongo checkout URL format
          checkoutUrl = `https://paymongo.com/sources/${sourceIdMatch[1]}`;
        } else {
          // I-fallback sa simple replacement
          checkoutUrl = checkoutUrl.replace('secure-authentication.paymongo.com', 'paymongo.com');
        }
      }
      
      // I-fallback sa PayMongo's official checkout URL format
      if (!checkoutUrl) {
        checkoutUrl = `https://paymongo.com/sources/${source.id}`;
      }
      
      console.log('🔍 Final checkout URL:', checkoutUrl);
      console.log('🔍 Source ID used for URL:', source.id);
      
      return {
        success: true,
        sourceId: source.id,
        checkoutUrl: checkoutUrl,
        status: source.attributes.status,
      };
    } else {
      console.error('❌ Invalid PayMongo response structure:', response);
      throw new Error('Invalid response from PayMongo - missing data or attributes');
    }
  } catch (error: any) {
    console.error('❌ Failed to create GCash source:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to create GCash source',
    };
  }
}

// ========================================
// CREATE PAYMENT FUNCTION
// ========================================
// I-create ang payment using ang source ID
// I-process ang payment after source authorization
export async function createPaymentFromSource(sourceId: string, amount: number, description: string): Promise<PayMongoPaymentResult> {
  try {
    console.log('🔄 Creating payment from source:', sourceId);

        // I-validate ang amount
        if (!validatePayMongoAmount(amount)) {
          throw new Error(`Amount must be between ${paymongoConfig.minimumAmount} and ${paymongoConfig.maximumAmount} PHP`);
        }

        // I-create ang payment data
        const paymentData = {
          data: {
            attributes: {
              amount: amount * 100, // Convert to centavos
              currency: paymongoConfig.currency,
              description: description,
              source: {
                id: sourceId,
                type: 'source',
              },
            },
          },
        };

    // I-create ang payment sa PayMongo
    const response = await paymongo.createPayment(paymentData);
    
    if (response.data && response.data.attributes) {
      const payment = response.data as PayMongoPaymentData;
      
      console.log('✅ Payment created successfully:', payment.id);
      
      return {
        success: true,
        paymentId: payment.id,
        status: payment.attributes.status,
      };
    } else {
      throw new Error('Invalid response from PayMongo');
    }
  } catch (error: any) {
    console.error('❌ Failed to create payment:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to create payment',
    };
  }
}

// ========================================
// GET SOURCE STATUS FUNCTION
// ========================================
// I-check ang source status para sa verification
// I-verify kung ready na ang source para sa payment
export async function getSourceStatus(sourceId: string): Promise<PayMongoPaymentResult> {
  try {
    console.log('🔄 Checking source status:', sourceId);

    // I-retrieve ang source details
    const response = await paymongo.retrieveSource(sourceId);
    
    if (response.data && response.data.attributes) {
      const source = response.data as PayMongoSourceData;
      
      console.log('✅ Source status retrieved:', source.attributes.status);
      
      return {
        success: true,
        sourceId: source.id,
        status: source.attributes.status,
      };
    } else {
      throw new Error('Invalid response from PayMongo');
    }
  } catch (error: any) {
    console.error('❌ Failed to get source status:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to get source status',
    };
  }
}

// ========================================
// GET PAYMENT STATUS FUNCTION
// ========================================
// I-check ang payment status para sa verification
// I-verify kung successful ang payment
export async function getPaymentStatus(paymentId: string): Promise<PayMongoPaymentResult> {
  try {
    console.log('🔄 Checking payment status:', paymentId);

    // I-retrieve ang payment details
    const response = await paymongo.retrievePayment(paymentId);
    
    if (response.data && response.data.attributes) {
      const payment = response.data as PayMongoPaymentData;
      
      console.log('✅ Payment status retrieved:', payment.attributes.status);
      
      return {
        success: true,
        paymentId: payment.id,
        status: payment.attributes.status,
      };
    } else {
      throw new Error('Invalid response from PayMongo');
    }
  } catch (error: any) {
    console.error('❌ Failed to get payment status:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to get payment status',
    };
  }
}

// ========================================
// VERIFY PAYMENT FUNCTION
// ========================================
// I-verify ang complete payment process
// I-check both source at payment status
export async function verifyPayment(sourceId: string, paymentId?: string): Promise<PayMongoPaymentResult> {
  try {
    console.log('🔄 Verifying payment:', { sourceId, paymentId });

    // I-check ang source status first
    const sourceResult = await getSourceStatus(sourceId);
    if (!sourceResult.success || sourceResult.status !== 'chargeable') {
      return {
        success: false,
        error: 'Source is not chargeable yet',
        status: sourceResult.status,
      };
    }

    // I-check ang payment status kung may payment ID
    if (paymentId) {
      const paymentResult = await getPaymentStatus(paymentId);
      if (!paymentResult.success) {
        return {
          success: false,
          error: 'Failed to verify payment',
        };
      }

      return {
        success: paymentResult.status === 'paid',
        paymentId: paymentResult.paymentId,
        status: paymentResult.status,
      };
    }

    return {
      success: true,
      sourceId: sourceId,
      status: 'chargeable',
    };
  } catch (error: any) {
    console.error('❌ Failed to verify payment:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to verify payment',
    };
  }
}

// ========================================
// GENERATE REFERENCE NUMBER FUNCTION
// ========================================
// I-generate ang unique reference number para sa payment
// I-use timestamp at random string para sa uniqueness
export function generateReferenceNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PM${timestamp}${random}`;
}

// ========================================
// FORMAT AMOUNT FUNCTION
// ========================================
// I-format ang amount para sa display
// I-convert from centavos to pesos
export function formatAmount(amountInCentavos: number): number {
  return amountInCentavos / 100;
}

// ========================================
// VALIDATE AMOUNT FUNCTION
// ========================================
// I-validate ang amount para sa PayMongo
// I-check kung valid ang amount range
export function validatePayMongoAmount(amount: number): boolean {
  return validateAmount(amount);
}

// ========================================
// GET PAYMENT METHODS FUNCTION
// ========================================
// I-get ang available payment methods
// I-return ang supported payment types
export function getAvailablePaymentMethods(): string[] {
  return ['gcash', 'grab_pay', 'maya'];
}

// ========================================
// ERROR HANDLING FUNCTIONS
// ========================================
// Error handling utilities para sa PayMongo integration

// I-format ang PayMongo error message
export function formatPayMongoError(error: any): string {
  if (error.response && error.response.data) {
    const data = error.response.data;
    if (data.errors && data.errors.length > 0) {
      return data.errors.map((err: any) => err.detail || err.title).join(', ');
    }
    return data.message || 'Payment processing failed';
  }
  return error.message || 'Unknown error occurred';
}

// I-check kung network error ang error
export function isNetworkError(error: any): boolean {
  return error.code === 'NETWORK_ERROR' || 
         error.message?.includes('network') ||
         error.message?.includes('timeout');
}

// I-check kung authentication error ang error
export function isAuthenticationError(error: any): boolean {
  return error.status === 401 || 
         error.message?.includes('unauthorized') ||
         error.message?.includes('authentication');
}
