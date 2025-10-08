// ========================================
// PAYMONGO DEBUG SERVICE - PAMAMAHALA NG PAYMONGO DEBUGGING
// ========================================
// Ang file na ito ay naghahandle ng PayMongo debugging at troubleshooting
// May functions para sa source validation, error handling, at debugging

import { get, ref } from 'firebase/database';
import { db } from '../firebaseConfig';
import { createGCashSource, createPaymentFromSource, getSourceStatus } from './paymongoService';

// ========================================
// DEBUG PAYMENT FLOW
// ========================================
export const debugPaymentFlow = async (paymentId: string) => {
  try {
    console.log('🔍 Debugging payment flow for:', paymentId);
    
    // Get payment data from Firebase
    const paymentRef = ref(db, `payments/${paymentId}`);
    const paymentSnapshot = await get(paymentRef);
    
    if (!paymentSnapshot.exists()) {
      console.error('❌ Payment not found in Firebase');
      return { success: false, error: 'Payment not found' };
    }
    
    const payment = paymentSnapshot.val();
    console.log('📋 Payment data:', {
      id: paymentId,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      paymongoSourceId: payment.paymongoSourceId,
      paymongoPaymentId: payment.paymongoPaymentId,
      createdAt: payment.createdAt
    });
    
    // Check if source exists
    if (payment.paymongoSourceId) {
      console.log('🔍 Checking source status:', payment.paymongoSourceId);
      const sourceStatus = await getSourceStatus(payment.paymongoSourceId);
      console.log('📊 Source status result:', sourceStatus);
      
      if (sourceStatus.success) {
        console.log('✅ Source is valid, status:', sourceStatus.status);
        
        // If source is chargeable and no payment exists, create payment
        if (sourceStatus.status === 'chargeable' && !payment.paymongoPaymentId) {
          console.log('🔄 Creating payment from source...');
          const paymentResult = await createPaymentFromSource(
            payment.paymongoSourceId,
            payment.amount,
            `Payment for ${payment.serviceType} reservation - Ref: ${payment.referenceNumber}`
          );
          console.log('💳 Payment creation result:', paymentResult);
          return paymentResult;
        } else if (sourceStatus.status === 'paid' && payment.paymongoPaymentId) {
          console.log('✅ Payment already completed');
          return { success: true, status: 'paid' };
        } else {
          console.log('⏳ Source not ready for payment, status:', sourceStatus.status);
          return { success: false, error: `Source not ready: ${sourceStatus.status}` };
        }
      } else {
        console.error('❌ Source check failed:', sourceStatus.error);
        return { success: false, error: `Source check failed: ${sourceStatus.error}` };
      }
    } else {
      console.error('❌ No PayMongo source ID found');
      return { success: false, error: 'No PayMongo source ID found' };
    }
  } catch (error: any) {
    console.error('❌ Debug payment flow error:', error);
    return { success: false, error: error.message };
  }
};

// ========================================
// VALIDATE SOURCE BEFORE PAYMENT
// ========================================
export const validateSourceBeforePayment = async (sourceId: string) => {
  try {
    console.log('🔍 Validating source before payment:', sourceId);
    
    const sourceStatus = await getSourceStatus(sourceId);
    
    if (!sourceStatus.success) {
      return {
        valid: false,
        error: sourceStatus.error,
        status: 'unknown'
      };
    }
    
    const validStatuses = ['chargeable', 'paid'];
    const isValid = validStatuses.includes(sourceStatus.status || '');
    
    return {
      valid: isValid,
      status: sourceStatus.status,
      error: isValid ? null : `Source status '${sourceStatus.status}' is not valid for payment`
    };
  } catch (error: any) {
    console.error('❌ Source validation error:', error);
    return {
      valid: false,
      error: error.message,
      status: 'unknown'
    };
  }
};

// ========================================
// CREATE FRESH SOURCE
// ========================================
export const createFreshSource = async (amount: number, description: string, referenceNumber: string) => {
  try {
    console.log('🔄 Creating fresh PayMongo source...');
    
    const gcashRequest = {
      amount: amount,
      description: description,
      successUrl: 'https://secure-authentication.paymongo.com/success',
      failedUrl: 'https://secure-authentication.paymongo.com/failed',
      referenceNumber: referenceNumber
    };
    
    const result = await createGCashSource(gcashRequest);
    console.log('📊 Fresh source creation result:', result);
    
    return result;
  } catch (error: any) {
    console.error('❌ Fresh source creation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ========================================
// GET PAYMENT DEBUG INFO
// ========================================
export const getPaymentDebugInfo = async (paymentId: string) => {
  try {
    const paymentRef = ref(db, `payments/${paymentId}`);
    const paymentSnapshot = await get(paymentRef);
    
    if (!paymentSnapshot.exists()) {
      return { success: false, error: 'Payment not found' };
    }
    
    const payment = paymentSnapshot.val();
    
    let sourceInfo = null;
    if (payment.paymongoSourceId) {
      const sourceStatus = await getSourceStatus(payment.paymongoSourceId);
      sourceInfo = {
        sourceId: payment.paymongoSourceId,
        status: sourceStatus.status,
        valid: sourceStatus.success
      };
    }
    
    return {
      success: true,
      payment: {
        id: paymentId,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt,
        referenceNumber: payment.referenceNumber
      },
      source: sourceInfo,
      paymongoPaymentId: payment.paymongoPaymentId
    };
  } catch (error: any) {
    console.error('❌ Get payment debug info error:', error);
    return { success: false, error: error.message };
  }
};
