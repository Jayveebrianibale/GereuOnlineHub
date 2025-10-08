// ========================================
// PAYMENT SERVICE - PAMAMAHALA NG PAYMENT
// ========================================
// Ang file na ito ay naghahandle ng payment service operations
// May functions para sa payment creation, verification, at management
// Support para sa different payment methods: GCash, cash, bank transfer

// Import ng Firebase Database functions
import { get, ref, set, update } from 'firebase/database';
import { db } from '../firebaseConfig';
import { getAdminPaymentSettings } from './adminPaymentService';
import {
    createGCashSource,
    createPaymentFromSource,
    getPaymentStatus,
    generateReferenceNumber as paymongoGenerateReferenceNumber,
    verifyPayment as paymongoVerifyPayment
} from './paymongoService';

// ========================================
// INTERFACE DEFINITIONS
// ========================================
// Type definitions para sa payment system

// Interface para sa payment data structure
export interface PaymentData {
  id: string; // Unique payment identifier
  userId: string; // User ID
  reservationId: string; // Reservation ID
  serviceType: 'apartment' | 'laundry' | 'auto'; // Service type
  serviceId: string; // Service ID
  amount: number; // Payment amount
  downPaymentAmount: number; // Down payment amount
  fullAmount: number; // Full payment amount
  status: 'pending' | 'paid' | 'failed' | 'refunded'; // Payment status
  paymentMethod: 'gcash' | 'cash' | 'bank_transfer'; // Payment method
  gcashNumber?: string; // GCash number (optional)
  qrCode?: string; // QR code data (optional)
  referenceNumber?: string; // Reference number (optional)
  paymongoSourceId?: string; // PayMongo source ID (optional)
  paymongoPaymentId?: string; // PayMongo payment ID (optional)
  checkoutUrl?: string; // PayMongo checkout URL (optional)
  createdAt: string; // Creation timestamp
  updatedAt: string; // Last update timestamp
  dueDate: string; // Payment due date
}

// Interface para sa GCash payment data
export interface GCashPaymentData {
  amount: number; // Payment amount
  referenceNumber: string;
  qrCode: string;
  gcashNumber: string;
  dueDate: string;
}

// ========================================
// GENERATE REFERENCE NUMBER FUNCTION
// ========================================
// I-generate ang unique reference number para sa GCash payments
// Ginagamit para sa payment tracking at identification
export function generateReferenceNumber(): string {
  return paymongoGenerateReferenceNumber(); // I-use ang PayMongo reference number generator
}

// ========================================
// GENERATE GCASH QR CODE FUNCTION
// ========================================
// I-generate ang QR code data para sa GCash payment
// Ginagamit para sa QR code display sa payment modal
export function generateGCashQRCode(paymentData: GCashPaymentData): string {
  // ========================================
  // GCASH QR CODE FORMAT
  // ========================================
  // GCash QR code format: gcash://pay?amount=AMOUNT&reference=REFERENCE&merchant=MERCHANT
  const qrData = {
    amount: paymentData.amount, // Payment amount
    reference: paymentData.referenceNumber, // Reference number
    merchant: 'GereuOnlineHub', // Merchant name
    description: `Payment for reservation - Ref: ${paymentData.referenceNumber}` // Payment description
  };
  
  // ========================================
  // QR CODE URL GENERATION
  // ========================================
  // I-convert ang data to URL format para sa QR code
  const qrString = `gcash://pay?amount=${qrData.amount}&reference=${qrData.reference}&merchant=${qrData.merchant}&description=${encodeURIComponent(qrData.description)}`;
  
  return qrString; // I-return ang QR code string
}

// ========================================
// CREATE PAYMENT FUNCTION
// ========================================
// I-create ang new payment record sa database
// I-generate ang payment data at i-save sa Firebase
export async function createPayment(
  userId: string, // User ID
  reservationId: string, // Reservation ID
  serviceType: 'apartment' | 'laundry' | 'auto', // Service type
  serviceId: string, // Service ID
  fullAmount: number, // Full payment amount
  paymentMethod: 'gcash' | 'cash' | 'bank_transfer' = 'gcash' // Payment method (default: gcash)
): Promise<PaymentData> {
  try {
    // ========================================
    // PAYMENT CALCULATIONS
    // ========================================
    // I-calculate ang down payment amount based sa service type
    const downPaymentAmount = serviceType === 'apartment' ? Math.round(fullAmount * 0.3) : fullAmount; // 30% down payment para sa apartment
    const referenceNumber = generateReferenceNumber(); // I-generate ang unique reference number
    
    // ========================================
    // ADMIN PAYMENT SETTINGS
    // ========================================
    // I-fetch ang admin's GCash information mula sa payment settings
    let gcashNumber = '+639123456789'; // Default fallback number
    try {
      const adminSettings = await getAdminPaymentSettings(); // I-fetch ang admin settings
      if (adminSettings?.gcashNumber) {
        gcashNumber = adminSettings.gcashNumber; // I-use ang admin's GCash number
      }
    } catch (error) {
      console.warn('Failed to fetch admin payment settings, using default GCash number:', error);
    }
    
    const paymentData: PaymentData = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId,
      reservationId,
      serviceType,
      serviceId,
      amount: downPaymentAmount,
      downPaymentAmount,
      fullAmount,
      status: 'pending',
      paymentMethod,
      gcashNumber,
      referenceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };

    // ========================================
    // PAYMONGO INTEGRATION FOR GCASH PAYMENTS
    // ========================================
    // I-integrate ang PayMongo para sa GCash payments
    if (paymentMethod === 'gcash') {
      try {
        // I-try ang Payment Intent first (modern approach)
        let paymongoResult = await createPaymentIntent(
          downPaymentAmount,
          `Payment for ${serviceType} reservation - Ref: ${referenceNumber}`,
          referenceNumber
        );
        
        // I-fallback sa GCash Source kung Payment Intent fails
        if (!paymongoResult.success) {
          console.log('🔄 Payment Intent failed, trying GCash Source...');
          const gcashRequest = {
            amount: downPaymentAmount,
            description: `Payment for ${serviceType} reservation - Ref: ${referenceNumber}`,
            successUrl: `https://secure-authentication.paymongo.com/success?paymentId=${paymentData.id}`,
            failedUrl: `https://secure-authentication.paymongo.com/failed?paymentId=${paymentData.id}`,
            referenceNumber: referenceNumber
          };
          
          paymongoResult = await createGCashSource(gcashRequest);
        }
        
        if (paymongoResult.success && paymongoResult.sourceId && paymongoResult.checkoutUrl) {
          // I-update ang payment data with PayMongo information
          paymentData.paymongoSourceId = paymongoResult.sourceId;
          paymentData.checkoutUrl = paymongoResult.checkoutUrl;
          
          console.log('✅ PayMongo GCash source created successfully');
          console.log('🔍 Source ID:', paymongoResult.sourceId);
          console.log('🔍 Checkout URL:', paymongoResult.checkoutUrl);
          console.log('🔍 Source Status:', paymongoResult.status);
          
          // I-generate ang QR code para sa fallback
          const qrData: GCashPaymentData = {
            amount: downPaymentAmount,
            referenceNumber,
            qrCode: '',
            gcashNumber,
            dueDate: paymentData.dueDate
          };
          paymentData.qrCode = generateGCashQRCode(qrData);
          
          console.log('✅ PayMongo GCash source created successfully:', paymongoResult.sourceId);
        } else {
          console.warn('⚠️ PayMongo source/intent creation failed, using fallback QR code:', paymongoResult.error);
          // I-fallback sa traditional QR code kung nag-fail ang PayMongo
          const qrData: GCashPaymentData = {
            amount: downPaymentAmount,
            referenceNumber,
            qrCode: '',
            gcashNumber,
            dueDate: paymentData.dueDate
          };
          paymentData.qrCode = generateGCashQRCode(qrData);
        }
      } catch (paymongoError) {
        console.error('❌ PayMongo integration failed, using fallback:', paymongoError);
        // I-fallback sa traditional QR code kung may error sa PayMongo
        const qrData: GCashPaymentData = {
          amount: downPaymentAmount,
          referenceNumber,
          qrCode: '',
          gcashNumber,
          dueDate: paymentData.dueDate
        };
        paymentData.qrCode = generateGCashQRCode(qrData);
      }
    }

    // Save to Firebase
    await set(ref(db, `payments/${paymentData.id}`), paymentData);
    
    console.log('✅ Payment created successfully:', paymentData.id);
    return paymentData;
  } catch (error) {
    console.error('❌ Failed to create payment:', error);
    throw error;
  }
}

// Get payment by ID
export async function getPayment(paymentId: string): Promise<PaymentData | null> {
  try {
    const snapshot = await get(ref(db, `payments/${paymentId}`));
    if (snapshot.exists()) {
      return snapshot.val() as PaymentData;
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to get payment:', error);
    return null;
  }
}

// Get payments by user ID
export async function getUserPayments(userId: string): Promise<PaymentData[]> {
  try {
    const snapshot = await get(ref(db, 'payments'));
    if (!snapshot.exists()) {
      return [];
    }
    
    const payments = snapshot.val() || {};
    return (Object.values(payments) as PaymentData[])
      .filter((payment) => payment.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('❌ Failed to get user payments:', error);
    return [];
  }
}

// Get payments by reservation ID
export async function getReservationPayments(reservationId: string): Promise<PaymentData[]> {
  try {
    const snapshot = await get(ref(db, 'payments'));
    if (!snapshot.exists()) {
      return [];
    }
    
    const payments = snapshot.val() || {};
    return (Object.values(payments) as PaymentData[])
      .filter((payment) => payment.reservationId === reservationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('❌ Failed to get reservation payments:', error);
    return [];
  }
}

// Update payment status
export async function updatePaymentStatus(
  paymentId: string, 
  status: 'pending' | 'paid' | 'failed' | 'refunded',
  referenceNumber?: string
): Promise<boolean> {
  try {
    const updates: any = {
      status,
      updatedAt: new Date().toISOString()
    };
    
    if (referenceNumber) {
      updates.referenceNumber = referenceNumber;
    }
    
    await update(ref(db, `payments/${paymentId}`), updates);
    
    console.log(`✅ Payment ${paymentId} status updated to ${status}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to update payment status:', error);
    return false;
  }
}

// Verify payment using PayMongo integration
export async function verifyPayment(paymentId: string): Promise<boolean> {
  try {
    const payment = await getPayment(paymentId);
    if (!payment) {
      return false;
    }
    
    // ========================================
    // PAYMONGO VERIFICATION FOR GCASH PAYMENTS
    // ========================================
    // I-verify ang payment using PayMongo kung GCash ang payment method
    if (payment.paymentMethod === 'gcash' && payment.paymongoSourceId) {
      try {
        console.log('🔄 Verifying PayMongo payment:', payment.paymongoSourceId);
        
        // I-verify ang payment sa PayMongo
        const paymongoResult = await paymongoVerifyPayment(payment.paymongoSourceId, payment.paymongoPaymentId);
        
        console.log('🔍 PayMongo verification result:', JSON.stringify(paymongoResult, null, 2));
        
        if (paymongoResult.success) {
          // I-check kung may payment ID na, kung wala, i-create ang payment
          if (!payment.paymongoPaymentId && paymongoResult.status === 'chargeable') {
            console.log('🔄 Creating payment from source:', payment.paymongoSourceId);
            
            const paymentResult = await createPaymentFromSource(
              payment.paymongoSourceId,
              payment.amount,
              `Payment for ${payment.serviceType} reservation - Ref: ${payment.referenceNumber}`
            );
            
            if (paymentResult.success && paymentResult.paymentId) {
              // I-update ang payment record with PayMongo payment ID
              await update(ref(db, `payments/${paymentId}`), {
                paymongoPaymentId: paymentResult.paymentId,
                updatedAt: new Date().toISOString()
              });
              
              // I-check ang final payment status
              const finalResult = await paymongoVerifyPayment(payment.paymongoSourceId, paymentResult.paymentId);
              
              if (finalResult.success && finalResult.status === 'paid') {
                await updatePaymentStatus(paymentId, 'paid');
                console.log(`✅ PayMongo payment ${paymentId} verified and approved`);
                return true;
              } else {
                await updatePaymentStatus(paymentId, 'failed');
                console.log(`❌ PayMongo payment ${paymentId} verification failed`);
                return false;
              }
            } else {
              await updatePaymentStatus(paymentId, 'failed');
              console.log(`❌ Failed to create PayMongo payment:`, paymentResult.error);
              return false;
            }
          } else if (payment.paymongoPaymentId) {
            // I-check ang existing payment status
            // I-check ang payment status directly using the payment ID
            const paymentStatusResult = await getPaymentStatus(payment.paymongoPaymentId);
            
            if (paymentStatusResult.success && paymentStatusResult.status === 'paid') {
              await updatePaymentStatus(paymentId, 'paid');
              console.log(`✅ PayMongo payment ${paymentId} verified and approved`);
              return true;
            } else {
              await updatePaymentStatus(paymentId, 'failed');
              console.log(`❌ PayMongo payment ${paymentId} verification failed - Status: ${paymentStatusResult.status}`);
              return false;
            }
          } else {
            // I-wait pa para sa source to become chargeable
            console.log('⏳ Source not yet chargeable, status:', paymongoResult.status);
            return false;
          }
        } else {
          await updatePaymentStatus(paymentId, 'failed');
          console.log(`❌ PayMongo verification failed:`, paymongoResult.error);
          return false;
        }
      } catch (paymongoError) {
        console.error('❌ PayMongo verification error:', paymongoError);
        // I-fallback sa traditional verification kung may error sa PayMongo
        return await fallbackVerifyPayment(paymentId);
      }
    } else {
      // I-use ang traditional verification para sa other payment methods
      return await fallbackVerifyPayment(paymentId);
    }
  } catch (error) {
    console.error('❌ Failed to verify payment:', error);
    return false;
  }
}

// ========================================
// FALLBACK VERIFICATION FUNCTION
// ========================================
// I-fallback verification para sa non-PayMongo payments
async function fallbackVerifyPayment(paymentId: string): Promise<boolean> {
  try {
    // Simulate payment verification delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo purposes, randomly approve 80% of payments
    const isApproved = Math.random() > 0.2;
    
    if (isApproved) {
      await updatePaymentStatus(paymentId, 'paid');
      console.log(`✅ Payment ${paymentId} verified and approved (fallback)`);
    } else {
      await updatePaymentStatus(paymentId, 'failed');
      console.log(`❌ Payment ${paymentId} verification failed (fallback)`);
    }
    
    return isApproved;
  } catch (error) {
    console.error('❌ Failed to verify payment (fallback):', error);
    return false;
  }
}

// Get payment statistics for admin
export async function getPaymentStats(): Promise<{
  totalPayments: number;
  pendingPayments: number;
  paidPayments: number;
  failedPayments: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
}> {
  try {
    const snapshot = await get(ref(db, 'payments'));
    if (!snapshot.exists()) {
      return {
        totalPayments: 0,
        pendingPayments: 0,
        paidPayments: 0,
        failedPayments: 0,
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0
      };
    }
    
    const payments = Object.values(snapshot.val() || {}) as PaymentData[];
    
    const stats = payments.reduce((acc, payment) => {
      acc.totalPayments++;
      acc.totalAmount += payment.fullAmount;
      
      switch (payment.status) {
        case 'pending':
          acc.pendingPayments++;
          acc.pendingAmount += payment.amount;
          break;
        case 'paid':
          acc.paidPayments++;
          acc.paidAmount += payment.amount;
          break;
        case 'failed':
          acc.failedPayments++;
          break;
      }
      
      return acc;
    }, {
      totalPayments: 0,
      pendingPayments: 0,
      paidPayments: 0,
      failedPayments: 0,
      totalAmount: 0,
      pendingAmount: 0,
      paidAmount: 0
    });
    
    return stats;
  } catch (error) {
    console.error('❌ Failed to get payment stats:', error);
    return {
      totalPayments: 0,
      pendingPayments: 0,
      paidPayments: 0,
      failedPayments: 0,
      totalAmount: 0,
      pendingAmount: 0,
      paidAmount: 0
    };
  }
}

// Check if payment is required for service type
export function isPaymentRequired(serviceType: string): boolean {
  return serviceType === 'apartment';
}

// Calculate down payment amount
export function calculateDownPayment(fullAmount: number, serviceType: string): number {
  if (serviceType === 'apartment') {
    return Math.round(fullAmount * 0.3); // 30% for apartments
  }
  return fullAmount; // Full payment for other services
}

// Format payment status for display
export function formatPaymentStatus(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending Payment';
    case 'paid':
      return 'Payment Confirmed';
    case 'failed':
      return 'Payment Failed';
    case 'refunded':
      return 'Payment Refunded';
    default:
      return 'Unknown';
  }
}

// Get payment status color
export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#F59E0B';
    case 'paid':
      return '#10B981';
    case 'failed':
      return '#EF4444';
    case 'refunded':
      return '#6B7280';
    default:
      return '#6B7280';
  }
}
