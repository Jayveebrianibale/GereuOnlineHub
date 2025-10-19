// ========================================
// PAYMENT STATUS SERVICE - PAMAMAHALA NG PAYMENT STATUS
// ========================================
// Ang file na ito ay naghahandle ng payment status tracking para sa admin
// May functions para sa payment verification, status updates, at reporting

import { equalTo, get, orderByChild, query, ref } from 'firebase/database';
import { db } from '../firebaseConfig';

// ========================================
// INTERFACE DEFINITIONS
// ========================================
export interface PaymentStatusInfo {
  paymentId: string;
  userId: string;
  serviceType: string;
  serviceId: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  paymentMethod: 'gcash' | 'qr' | 'cash';
  paymongoSourceId?: string;
  paymongoPaymentId?: string;
  createdAt: number;
  updatedAt: number;
  referenceNumber: string;
}

export interface PaymentSummary {
  totalPayments: number;
  paidPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

// ========================================
// GET ALL PAYMENTS
// ========================================
export const getAllPayments = async (): Promise<PaymentStatusInfo[]> => {
  try {
    if (!db) {
      console.error('Firebase database not initialized');
      return [];
    }

    const paymentsRef = ref(db, 'payments');
    const snapshot = await get(paymentsRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const payments: PaymentStatusInfo[] = [];
    snapshot.forEach((childSnapshot) => {
      const payment = childSnapshot.val();
      payments.push({
        paymentId: childSnapshot.key!,
        ...payment
      });
    });

    return payments.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching all payments:', error);
    return [];
  }
};

// ========================================
// GET PAYMENTS BY STATUS
// ========================================
export const getPaymentsByStatus = async (status: string): Promise<PaymentStatusInfo[]> => {
  try {
    if (!db) {
      console.error('Firebase database not initialized');
      return [];
    }

    const paymentsRef = ref(db, 'payments');
    const statusQuery = query(paymentsRef, orderByChild('status'), equalTo(status));
    const snapshot = await get(statusQuery);
    
    if (!snapshot.exists()) {
      return [];
    }

    const payments: PaymentStatusInfo[] = [];
    snapshot.forEach((childSnapshot) => {
      const payment = childSnapshot.val();
      payments.push({
        paymentId: childSnapshot.key!,
        ...payment
      });
    });

    return payments.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error(`Error fetching payments by status ${status}:`, error);
    return [];
  }
};

// ========================================
// GET PAYMENT SUMMARY
// ========================================
export const getPaymentSummary = async (): Promise<PaymentSummary> => {
  try {
    const allPayments = await getAllPayments();
    
    const summary: PaymentSummary = {
      totalPayments: allPayments.length,
      paidPayments: allPayments.filter(p => p.status === 'paid').length,
      pendingPayments: allPayments.filter(p => p.status === 'pending').length,
      failedPayments: allPayments.filter(p => p.status === 'failed').length,
      totalAmount: allPayments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: allPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: allPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    };

    return summary;
  } catch (error) {
    console.error('Error calculating payment summary:', error);
    return {
      totalPayments: 0,
      paidPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
    };
  }
};

// ========================================
// GET PAYMENTS BY USER
// ========================================
export const getPaymentsByUser = async (userId: string): Promise<PaymentStatusInfo[]> => {
  try {
    if (!db) {
      console.error('Firebase database not initialized');
      return [];
    }

    const paymentsRef = ref(db, 'payments');
    const userQuery = query(paymentsRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(userQuery);
    
    if (!snapshot.exists()) {
      return [];
    }

    const payments: PaymentStatusInfo[] = [];
    snapshot.forEach((childSnapshot) => {
      const payment = childSnapshot.val();
      payments.push({
        paymentId: childSnapshot.key!,
        ...payment
      });
    });

    return payments.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error(`Error fetching payments for user ${userId}:`, error);
    return [];
  }
};

// ========================================
// GET PAYMENT BY ID
// ========================================
export const getPaymentById = async (paymentId: string): Promise<PaymentStatusInfo | null> => {
  try {
    if (!db) {
      console.error('Firebase database not initialized');
      return null;
    }

    const paymentRef = ref(db, `payments/${paymentId}`);
    const snapshot = await get(paymentRef);
    
    if (!snapshot.exists()) {
      return null;
    }

    const payment = snapshot.val();
    return {
      paymentId,
      ...payment
    };
  } catch (error) {
    console.error(`Error fetching payment ${paymentId}:`, error);
    return null;
  }
};

// ========================================
// GET RECENT PAYMENTS
// ========================================
export const getRecentPayments = async (limit: number = 10): Promise<PaymentStatusInfo[]> => {
  try {
    const allPayments = await getAllPayments();
    return allPayments.slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    return [];
  }
};
