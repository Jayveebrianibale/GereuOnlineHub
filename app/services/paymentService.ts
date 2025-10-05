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
  const timestamp = Date.now().toString(); // I-get ang current timestamp
  const random = Math.random().toString(36).substring(2, 8).toUpperCase(); // I-generate ang random string
  return `GC${timestamp.slice(-6)}${random}`; // I-combine ang timestamp at random string
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

    // Generate QR code for GCash payments
    if (paymentMethod === 'gcash') {
      const qrData: GCashPaymentData = {
        amount: downPaymentAmount,
        referenceNumber,
        qrCode: '',
        gcashNumber,
        dueDate: paymentData.dueDate
      };
      paymentData.qrCode = generateGCashQRCode(qrData);
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

// Verify payment (simulate verification process)
export async function verifyPayment(paymentId: string): Promise<boolean> {
  try {
    const payment = await getPayment(paymentId);
    if (!payment) {
      return false;
    }
    
    // Simulate payment verification delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo purposes, randomly approve 80% of payments
    const isApproved = Math.random() > 0.2;
    
    if (isApproved) {
      await updatePaymentStatus(paymentId, 'paid');
      console.log(`✅ Payment ${paymentId} verified and approved`);
    } else {
      await updatePaymentStatus(paymentId, 'failed');
      console.log(`❌ Payment ${paymentId} verification failed`);
    }
    
    return isApproved;
  } catch (error) {
    console.error('❌ Failed to verify payment:', error);
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
