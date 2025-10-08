// ========================================
// PAYMENT STATUS CARD - PAMAMAHALA NG PAYMENT STATUS DISPLAY
// ========================================
// Ang component na ito ay naghahandle ng payment status display para sa admin
// May comprehensive features: payment summary, recent payments, status tracking

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PaymentStatusInfo, PaymentSummary, getPaymentSummary, getRecentPayments } from '../services/paymentStatusService';
import { formatPHP } from '../utils/currency';

interface PaymentStatusCardProps {
  isDark: boolean;
  onViewAllPayments?: () => void;
}

export function PaymentStatusCard({ isDark, onViewAllPayments }: PaymentStatusCardProps) {
  const [summary, setSummary] = useState<PaymentSummary>({
    totalPayments: 0,
    paidPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
  });
  const [recentPayments, setRecentPayments] = useState<PaymentStatusInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      const [summaryData, recentData] = await Promise.all([
        getPaymentSummary(),
        getRecentPayments(5)
      ]);
      setSummary(summaryData);
      setRecentPayments(recentData);
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#F59E0B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return 'check-circle';
      case 'pending':
        return 'schedule';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'cancel';
      default:
        return 'schedule';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'gcash':
        return 'account-balance-wallet';
      case 'qr':
        return 'qr-code';
      case 'cash':
        return 'money';
      default:
        return 'payment';
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="refresh" size={24} color="#6B7280" />
          <ThemedText style={[styles.loadingText, { color: '#6B7280' }]}>
            Loading payment data...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="account-balance-wallet" size={24} color="#00B2FF" />
          <ThemedText style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
            Payment Status
          </ThemedText>
        </View>
        {onViewAllPayments && (
          <TouchableOpacity onPress={onViewAllPayments} style={styles.viewAllButton}>
            <ThemedText style={[styles.viewAllText, { color: '#00B2FF' }]}>
              View All
            </ThemedText>
            <MaterialIcons name="arrow-forward" size={16} color="#00B2FF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: isDark ? '#2A2A2A' : '#f8f9fa' }]}>
          <MaterialIcons name="receipt" size={20} color="#00B2FF" />
          <ThemedText style={[styles.summaryNumber, { color: isDark ? '#fff' : '#000' }]}>
            {summary.totalPayments}
          </ThemedText>
          <ThemedText style={[styles.summaryLabel, { color: '#6B7280' }]}>
            Total
          </ThemedText>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: isDark ? '#2A2A2A' : '#f8f9fa' }]}>
          <MaterialIcons name="check-circle" size={20} color="#10B981" />
          <ThemedText style={[styles.summaryNumber, { color: isDark ? '#fff' : '#000' }]}>
            {summary.paidPayments}
          </ThemedText>
          <ThemedText style={[styles.summaryLabel, { color: '#6B7280' }]}>
            Paid
          </ThemedText>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: isDark ? '#2A2A2A' : '#f8f9fa' }]}>
          <MaterialIcons name="schedule" size={20} color="#F59E0B" />
          <ThemedText style={[styles.summaryNumber, { color: isDark ? '#fff' : '#000' }]}>
            {summary.pendingPayments}
          </ThemedText>
          <ThemedText style={[styles.summaryLabel, { color: '#6B7280' }]}>
            Pending
          </ThemedText>
        </View>
      </View>

      {/* Amount Summary */}
      <View style={[styles.amountContainer, { backgroundColor: isDark ? '#2A2A2A' : '#f8f9fa' }]}>
        <View style={styles.amountRow}>
          <ThemedText style={[styles.amountLabel, { color: '#6B7280' }]}>
            Total Amount:
          </ThemedText>
          <ThemedText style={[styles.amountValue, { color: isDark ? '#fff' : '#000' }]}>
            {formatPHP(summary.totalAmount)}
          </ThemedText>
        </View>
        <View style={styles.amountRow}>
          <ThemedText style={[styles.amountLabel, { color: '#6B7280' }]}>
            Paid Amount:
          </ThemedText>
          <ThemedText style={[styles.amountValue, { color: '#10B981' }]}>
            {formatPHP(summary.paidAmount)}
          </ThemedText>
        </View>
        <View style={styles.amountRow}>
          <ThemedText style={[styles.amountLabel, { color: '#6B7280' }]}>
            Pending Amount:
          </ThemedText>
          <ThemedText style={[styles.amountValue, { color: '#F59E0B' }]}>
            {formatPHP(summary.pendingAmount)}
          </ThemedText>
        </View>
      </View>

      {/* Recent Payments */}
      <View style={styles.recentContainer}>
        <ThemedText style={[styles.recentTitle, { color: isDark ? '#fff' : '#000' }]}>
          Recent Payments
        </ThemedText>
        
        {recentPayments.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="inbox" size={32} color="#6B7280" />
            <ThemedText style={[styles.emptyText, { color: '#6B7280' }]}>
              No payments yet
            </ThemedText>
          </View>
        ) : (
          <ScrollView style={styles.paymentsList} showsVerticalScrollIndicator={false}>
            {recentPayments.map((payment) => (
              <View key={payment.paymentId} style={[styles.paymentItem, { backgroundColor: isDark ? '#2A2A2A' : '#f8f9fa' }]}>
                <View style={styles.paymentLeft}>
                  <MaterialIcons 
                    name={getPaymentMethodIcon(payment.paymentMethod)} 
                    size={20} 
                    color="#00B2FF" 
                  />
                  <View style={styles.paymentInfo}>
                    <ThemedText style={[styles.paymentService, { color: isDark ? '#fff' : '#000' }]}>
                      {payment.serviceType.charAt(0).toUpperCase() + payment.serviceType.slice(1)}
                    </ThemedText>
                    <ThemedText style={[styles.paymentRef, { color: '#6B7280' }]}>
                      Ref: {payment.referenceNumber}
                    </ThemedText>
                  </View>
                </View>
                
                <View style={styles.paymentRight}>
                  <ThemedText style={[styles.paymentAmount, { color: isDark ? '#fff' : '#000' }]}>
                    {formatPHP(payment.amount)}
                  </ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
                    <MaterialIcons 
                      name={getStatusIcon(payment.status)} 
                      size={12} 
                      color={getStatusColor(payment.status)} 
                    />
                    <ThemedText style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  amountContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 14,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  recentContainer: {
    marginTop: 8,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  paymentsList: {
    maxHeight: 200,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentInfo: {
    marginLeft: 8,
    flex: 1,
  },
  paymentService: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentRef: {
    fontSize: 12,
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});
