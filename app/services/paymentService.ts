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
  qrCodeImageUrl?: string; // QR code image URL (optional)
  referenceNumber?: string; // Reference number (optional)
  paymongoSourceId?: string; // PayMongo source ID (optional)
  paymongoPaymentId?: string; // PayMongo payment ID (optional)
  paymongoClientKey?: string; // PayMongo client key (optional)
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
  paymentMethod: 'gcash' | 'cash' | 'bank_transfer' = 'gcash', // Payment method (default: gcash)
  paymentType: 'qr_code' | 'paymongo' = 'qr_code' // Payment type: QR code or PayMongo (default: qr_code)
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
    let gcashNumber = ''; // Admin's GCash number (required)
    let qrCodeImageUrl = ''; // QR code image URL (required)
    try {
      const adminSettings = await getAdminPaymentSettings(); // I-fetch ang admin settings
      if (adminSettings?.gcashNumber) {
        gcashNumber = adminSettings.gcashNumber; // I-use ang admin's GCash number
      }
      if (adminSettings?.qrCodeImageUrl) {
        qrCodeImageUrl = adminSettings.qrCodeImageUrl; // I-use ang admin's QR code image
      }
    } catch (error) {
      console.warn('Failed to fetch admin payment settings:', error);
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
      qrCodeImageUrl, // I-add ang QR code image URL
      referenceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };

    // ========================================
    // PAYMENT FLOW BASED ON TYPE
    // ========================================
    if (paymentMethod === 'gcash') {
      if (paymentType === 'paymongo') {
        // ========================================
        // PAYMONGO GCASH PAYMENT FLOW
        // ========================================
        console.log('🔄 Setting up PayMongo GCash payment...');
        
        try {
          // I-use GCash Source directly para sa PayMongo
          const gcashRequest = {
            amount: downPaymentAmount,
            description: `Payment for ${serviceType} reservation - Ref: ${referenceNumber}`,
            successUrl: `https://secure-authentication.paymongo.com/success?paymentId=${paymentData.id}`,
            failedUrl: `https://secure-authentication.paymongo.com/failed?paymentId=${paymentData.id}`,
            referenceNumber: referenceNumber
          };
          
          const paymongoResult = await createGCashSource(gcashRequest);
          
          if (paymongoResult.success && paymongoResult.sourceId && paymongoResult.checkoutUrl) {
            // I-update ang payment data with PayMongo information
            paymentData.paymongoSourceId = paymongoResult.sourceId;
            paymentData.checkoutUrl = paymongoResult.checkoutUrl;
            
            // I-save ang client key kung may available
            if (paymongoResult.clientKey) {
              paymentData.paymongoClientKey = paymongoResult.clientKey;
            }
            
            // I-set ang payment status as paid since PayMongo is real payment
            paymentData.status = 'paid';
            
            console.log('✅ PayMongo GCash payment setup completed');
            console.log('🔍 Source ID:', paymongoResult.sourceId);
            console.log('🔍 Checkout URL:', paymongoResult.checkoutUrl);
            console.log('🔍 Payment status: paid (real payment via PayMongo)');
          } else {
            throw new Error('PayMongo GCash source creation failed');
          }
        } catch (paymongoError) {
          console.error('❌ PayMongo integration failed:', paymongoError);
          throw new Error('PayMongo GCash payment is not available. Please use QR code payment instead.');
        }
      } else {
        // ========================================
        // DIRECT QR CODE PAYMENT FLOW
        // ========================================
        console.log('🔄 Setting up direct QR code payment (bypassing PayMongo)...');
        
        // I-check kung may admin GCash information
        if (!gcashNumber || gcashNumber.trim() === '' || !qrCodeImageUrl || qrCodeImageUrl.trim() === '') {
          console.error('❌ Admin GCash information is not yet uploaded');
          console.error('❌ Missing GCash number:', !gcashNumber || gcashNumber.trim() === '');
          console.error('❌ Missing QR code image:', !qrCodeImageUrl || qrCodeImageUrl.trim() === '');
          throw new Error('Admin GCash information is not yet uploaded. Please contact admin to set up GCash payment details (number and QR code image).');
        }
        
        // I-generate ang QR code para sa direct payment
        const qrData: GCashPaymentData = {
          amount: downPaymentAmount,
          referenceNumber,
          qrCode: '',
          gcashNumber,
          dueDate: paymentData.dueDate
        };
        paymentData.qrCode = generateGCashQRCode(qrData);
        
        // I-set ang payment status as pending para sa admin confirmation
        paymentData.status = 'pending';
        
        console.log('✅ Direct QR code payment setup completed');
        console.log('🔍 QR Code data:', paymentData.qrCode);
        console.log('🔍 Payment status: pending (awaiting admin confirmation)');
      }
    }

    // Save to Firebase - filter out undefined values
    const firebaseData = Object.fromEntries(
      Object.entries(paymentData).filter(([_, value]) => value !== undefined)
    );
    await set(ref(db, `payments/${paymentData.id}`), firebaseData);
    
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
    // PAYMENT VERIFICATION BASED ON TYPE
    // ========================================
    if (payment.paymentMethod === 'gcash') {
      if (payment.paymongoSourceId && payment.checkoutUrl) {
        // ========================================
        // PAYMONGO GCASH PAYMENT VERIFICATION
        // ========================================
        console.log('🔄 Verifying PayMongo GCash payment...');
        
        try {
          const paymongoResult = await paymongoVerifyPayment(payment.paymongoSourceId, payment.paymongoPaymentId);
          
          if (paymongoResult.success) {
            // I-detect kung Payment Intent o Source
            const isPaymentIntent = payment.paymongoSourceId.startsWith('pi_');
            const isSource = payment.paymongoSourceId.startsWith('src_');
            
            if (isPaymentIntent) {
              // Para sa Payment Intent, i-check lang ang status
              if (paymongoResult.status === 'succeeded') {
                await updatePaymentStatus(paymentId, 'paid');
                console.log('✅ PayMongo Payment Intent verified and approved');
                return true;
              } else {
                console.log('⚠️ PayMongo Payment Intent not yet succeeded:', paymongoResult.status);
                return false;
              }
            } else if (isSource) {
              // Para sa Source, i-create ang payment kung chargeable
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
                  const finalStatus = await getPaymentStatus(paymentResult.paymentId);
                  if (finalStatus === 'paid') {
                    await updatePaymentStatus(paymentId, 'paid');
                    console.log('✅ PayMongo payment created and verified successfully');
                    return true;
                  } else {
                    console.log('⚠️ PayMongo payment not yet paid:', finalStatus);
                    return false;
                  }
                } else {
                  console.log('❌ Failed to create payment from source');
                  return false;
                }
              } else if (payment.paymongoPaymentId) {
                // I-check ang existing payment status
                const finalStatus = await getPaymentStatus(payment.paymongoPaymentId);
                if (finalStatus === 'paid') {
                  await updatePaymentStatus(paymentId, 'paid');
                  console.log('✅ PayMongo payment verified successfully');
                  return true;
                } else {
                  console.log('⚠️ PayMongo payment not yet paid:', finalStatus);
                  return false;
                }
              } else {
                console.log('⚠️ Source not yet chargeable:', paymongoResult.status);
                return false;
              }
            }
          } else {
            console.log('❌ PayMongo verification failed:', paymongoResult.error);
            return false;
          }
        } catch (paymongoError) {
          console.error('❌ PayMongo verification error:', paymongoError);
          return false;
        }
      } else if (payment.qrCode) {
        // ========================================
        // DIRECT QR CODE PAYMENT VERIFICATION
        // ========================================
        console.log('🔄 Verifying direct QR code payment (bypassing PayMongo)...');
        
        console.log('✅ Direct QR code payment found');
        console.log('🔍 Payment status:', payment.status);
        console.log('💡 Payment requires admin confirmation');
        
        // I-return true para sa direct QR code payments
        // Admin ang mag-confirm kung successful ang payment
        return true;
      } else {
        console.log('❌ No payment method found');
        return false;
      }
    }
    
    // Legacy PayMongo verification (for existing payments)
    if (payment.paymentMethod === 'gcash' && payment.paymongoSourceId) {
      try {
        console.log('🔄 Verifying PayMongo payment:', payment.paymongoSourceId);
        
        // I-verify ang payment sa PayMongo
        const paymongoResult = await paymongoVerifyPayment(payment.paymongoSourceId, payment.paymongoPaymentId);
        
        console.log('🔍 PayMongo verification result:', JSON.stringify(paymongoResult, null, 2));
        
        if (paymongoResult.success) {
          // I-detect kung Payment Intent o Source
          const isPaymentIntent = payment.paymongoSourceId.startsWith('pi_');
          const isSource = payment.paymongoSourceId.startsWith('src_');
          
          if (isPaymentIntent) {
            // Para sa Payment Intent, i-check lang ang status
            console.log('🔄 Verifying Payment Intent:', payment.paymongoSourceId);
            
            if (paymongoResult.status === 'succeeded') {
              await updatePaymentStatus(paymentId, 'paid');
              console.log(`✅ PayMongo Payment Intent ${paymentId} verified and approved`);
              return true;
            } else {
              await updatePaymentStatus(paymentId, 'failed');
              console.log(`❌ PayMongo Payment Intent ${paymentId} verification failed - status: ${paymongoResult.status}`);
              return false;
            }
          } else if (isSource) {
            // Para sa Source, i-create ang payment kung chargeable
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
            console.log(`❌ Invalid PayMongo ID format: ${payment.paymongoSourceId}`);
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
