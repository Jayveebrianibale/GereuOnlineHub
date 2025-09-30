import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { PaymentData, getPaymentStats, updatePaymentStatus } from '../services/paymentService';
import { formatPHP } from '../utils/currency';

interface PaymentTrackingProps {
  isDark?: boolean;
}

export function PaymentTracking({ isDark = false }: PaymentTrackingProps) {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [stats, setStats] = useState({
    totalPayments: 0,
    pendingPayments: 0,
    paidPayments: 0,
    failedPayments: 0,
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'failed'>('all');

  const bgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const subtitleColor = isDark ? '#B0B0B0' : '#666';
  const borderColor = isDark ? '#333' : '#eee';

  useEffect(() => {
    loadPayments();
    loadStats();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      // In a real app, you would get all payments for admin view
      // For now, we'll simulate with empty array
      setPayments([]);
    } catch (error) {
      console.error('Failed to load payments:', error);
      Alert.alert('Error', 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const paymentStats = await getPaymentStats();
      setStats(paymentStats);
    } catch (error) {
      console.error('Failed to load payment stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPayments(), loadStats()]);
    setRefreshing(false);
  };

  const handleUpdatePaymentStatus = async (paymentId: string, status: 'paid' | 'failed') => {
    try {
      const success = await updatePaymentStatus(paymentId, status);
      if (success) {
        await loadPayments();
        await loadStats();
        Alert.alert('Success', `Payment marked as ${status}`);
      } else {
        Alert.alert('Error', 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Failed to update payment status:', error);
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const getStatusColor = (status: string) => {
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
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'schedule';
      case 'paid':
        return 'check-circle';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'undo';
      default:
        return 'help';
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status === filter;
  });

  const renderStatsCard = (title: string, value: number, color: string, icon: string) => (
    <ThemedView style={[styles.statsCard, { backgroundColor: bgColor, borderColor }]}>
      <View style={styles.statsHeader}>
        <MaterialIcons name={icon as any} size={24} color={color} />
        <ThemedText style={[styles.statsTitle, { color: textColor }]}>{title}</ThemedText>
      </View>
      <ThemedText style={[styles.statsValue, { color }]}>
        {title.includes('Amount') ? formatPHP(value) : value.toString()}
      </ThemedText>
    </ThemedView>
  );

  const renderPaymentItem = (payment: PaymentData) => (
    <ThemedView key={payment.id} style={[styles.paymentItem, { backgroundColor: bgColor, borderColor }]}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <ThemedText style={[styles.paymentTitle, { color: textColor }]}>
            {payment.serviceType.charAt(0).toUpperCase() + payment.serviceType.slice(1)} Reservation
          </ThemedText>
          <ThemedText style={[styles.paymentReference, { color: subtitleColor }]}>
            Ref: {payment.referenceNumber}
          </ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
          <MaterialIcons 
            name={getStatusIcon(payment.status) as any} 
            size={16} 
            color={getStatusColor(payment.status)} 
          />
          <ThemedText style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <ThemedText style={[styles.detailLabel, { color: subtitleColor }]}>Amount:</ThemedText>
          <ThemedText style={[styles.detailValue, { color: textColor }]}>
            {formatPHP(payment.amount)}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText style={[styles.detailLabel, { color: subtitleColor }]}>Full Amount:</ThemedText>
          <ThemedText style={[styles.detailValue, { color: textColor }]}>
            {formatPHP(payment.fullAmount)}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText style={[styles.detailLabel, { color: subtitleColor }]}>Method:</ThemedText>
          <ThemedText style={[styles.detailValue, { color: textColor }]}>
            {payment.paymentMethod.toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText style={[styles.detailLabel, { color: subtitleColor }]}>Created:</ThemedText>
          <ThemedText style={[styles.detailValue, { color: textColor }]}>
            {new Date(payment.createdAt).toLocaleDateString()}
          </ThemedText>
        </View>
      </View>

      {payment.status === 'pending' && (
        <View style={styles.paymentActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleUpdatePaymentStatus(payment.id, 'paid')}
          >
            <MaterialIcons name="check" size={16} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Approve</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleUpdatePaymentStatus(payment.id, 'failed')}
          >
            <MaterialIcons name="close" size={16} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Reject</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8f9fa' }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Payment Statistics</ThemedText>
          <View style={styles.statsGrid}>
            {renderStatsCard('Total Payments', stats.totalPayments, '#3B82F6', 'receipt')}
            {renderStatsCard('Pending', stats.pendingPayments, '#F59E0B', 'schedule')}
            {renderStatsCard('Paid', stats.paidPayments, '#10B981', 'check-circle')}
            {renderStatsCard('Failed', stats.failedPayments, '#EF4444', 'error')}
            {renderStatsCard('Total Amount', stats.totalAmount, '#8B5CF6', 'account-balance-wallet')}
            {renderStatsCard('Pending Amount', stats.pendingAmount, '#F59E0B', 'schedule')}
          </View>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Recent Payments</ThemedText>
          <View style={styles.filterButtons}>
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'paid', label: 'Paid' },
              { key: 'failed', label: 'Failed' },
            ].map((filterOption) => (
              <TouchableOpacity
                key={filterOption.key}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: filter === filterOption.key ? '#00B2FF' : 'transparent',
                    borderColor: filter === filterOption.key ? '#00B2FF' : borderColor,
                  },
                ]}
                onPress={() => setFilter(filterOption.key as any)}
              >
                <ThemedText
                  style={[
                    styles.filterButtonText,
                    {
                      color: filter === filterOption.key ? '#fff' : textColor,
                    },
                  ]}
                >
                  {filterOption.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payments List */}
        <View style={styles.paymentsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <MaterialIcons name="refresh" size={48} color={subtitleColor} />
              <ThemedText style={[styles.loadingText, { color: subtitleColor }]}>
                Loading payments...
              </ThemedText>
            </View>
          ) : filteredPayments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="payment" size={48} color={subtitleColor} />
              <ThemedText style={[styles.emptyText, { color: textColor }]}>
                No payments found
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: subtitleColor }]}>
                Payments will appear here when customers make reservations
              </ThemedText>
            </View>
          ) : (
            filteredPayments.map(renderPaymentItem)
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  paymentItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentReference: {
    fontSize: 12,
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
    fontWeight: '600',
    marginLeft: 4,
  },
  paymentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
