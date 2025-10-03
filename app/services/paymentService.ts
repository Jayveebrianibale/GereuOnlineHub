import { get, ref, set, update } from 'firebase/database';
import { db } from '../firebaseConfig';
import { getAdminPaymentSettings } from './adminPaymentService';

export interface PaymentData {
  id: string;
  userId: string;
  reservationId: string;
  serviceType: 'apartment' | 'laundry' | 'auto';
  serviceId: string;
  amount: number;
  downPaymentAmount: number;
  fullAmount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'gcash' | 'cash' | 'bank_transfer';
  gcashNumber?: string;
  qrCode?: string;
  referenceNumber?: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
}

export interface GCashPaymentData {
  amount: number;
  referenceNumber: string;
  qrCode: string;
  gcashNumber: string;
  dueDate: string;
}

// Generate a unique reference number for GCash payments
export function generateReferenceNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `GC${timestamp.slice(-6)}${random}`;
}

// Generate QR code data for GCash payment
export function generateGCashQRCode(paymentData: GCashPaymentData): string {
  // GCash QR code format: gcash://pay?amount=AMOUNT&reference=REFERENCE&merchant=MERCHANT
  const qrData = {
    amount: paymentData.amount,
    reference: paymentData.referenceNumber,
    merchant: 'GereuOnlineHub',
    description: `Payment for reservation - Ref: ${paymentData.referenceNumber}`
  };
  
  // Convert to URL format for QR code
  const qrString = `gcash://pay?amount=${qrData.amount}&reference=${qrData.reference}&merchant=${qrData.merchant}&description=${encodeURIComponent(qrData.description)}`;
  
  return qrString;
}

// Create a new payment record
export async function createPayment(
  userId: string,
  reservationId: string,
  serviceType: 'apartment' | 'laundry' | 'auto',
  serviceId: string,
  fullAmount: number,
  paymentMethod: 'gcash' | 'cash' | 'bank_transfer' = 'gcash'
): Promise<PaymentData> {
  try {
    const downPaymentAmount = serviceType === 'apartment' ? Math.round(fullAmount * 0.3) : fullAmount;
    const referenceNumber = generateReferenceNumber();
    
    // Fetch admin's GCash information from payment settings
    let gcashNumber = '+639123456789'; // Default fallback
    try {
      const adminSettings = await getAdminPaymentSettings();
      if (adminSettings?.gcashNumber) {
        gcashNumber = adminSettings.gcashNumber;
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
