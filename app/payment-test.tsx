import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PaymentModal } from './components/PaymentModal';
import { PaymentData, createPayment, getPaymentStats, verifyPayment } from './services/paymentService';

export default function PaymentTestScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [stats, setStats] = useState({
    totalPayments: 0,
    pendingPayments: 0,
    paidPayments: 0,
    failedPayments: 0,
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
  });

  const bgColor = isDark ? '#121212' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const subtitleColor = isDark ? '#B0B0B0' : '#666';

  const handleTestPayment = () => {
    setPaymentModalVisible(true);
  };

  const handlePaymentSuccess = async (payment: PaymentData) => {
    Alert.alert('Payment Success', `Payment ${payment.id} was successful!`);
    setPaymentModalVisible(false);
    await loadStats();
  };

  const handlePaymentClose = () => {
    setPaymentModalVisible(false);
  };

  const loadStats = async () => {
    try {
      const paymentStats = await getPaymentStats();
      setStats(paymentStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const testCreatePayment = async () => {
    try {
      const payment = await createPayment(
        'test-user-id',
        'test-reservation-id',
        'apartment',
        'test-service-id',
        50000, // ₱50,000
        'gcash'
      );
      Alert.alert('Payment Created', `Payment created with ID: ${payment.id}`);
      await loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to create payment');
    }
  };

  const testVerifyPayment = async () => {
    try {
      // This would normally use a real payment ID
      const isVerified = await verifyPayment('test-payment-id');
      Alert.alert('Verification Result', `Payment verification: ${isVerified ? 'Success' : 'Failed'}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to verify payment');
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={[styles.title, { color: textColor }]}>
          Payment System Test
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>
          Test the GCash payment integration
        </ThemedText>
      </View>

      <View style={styles.statsContainer}>
        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
          Payment Statistics
        </ThemedText>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1E1E1E' : '#f8f9fa' }]}>
            <ThemedText style={[styles.statValue, { color: textColor }]}>
              {stats.totalPayments}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: subtitleColor }]}>
              Total Payments
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1E1E1E' : '#f8f9fa' }]}>
            <ThemedText style={[styles.statValue, { color: '#F59E0B' }]}>
              {stats.pendingPayments}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: subtitleColor }]}>
              Pending
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1E1E1E' : '#f8f9fa' }]}>
            <ThemedText style={[styles.statValue, { color: '#10B981' }]}>
              {stats.paidPayments}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: subtitleColor }]}>
              Paid
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1E1E1E' : '#f8f9fa' }]}>
            <ThemedText style={[styles.statValue, { color: '#EF4444' }]}>
              {stats.failedPayments}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: subtitleColor }]}>
              Failed
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
          Test Actions
        </ThemedText>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#00B2FF' }]}
          onPress={handleTestPayment}
        >
          <MaterialIcons name="payment" size={20} color="#fff" />
          <ThemedText style={styles.actionButtonText}>
            Test Payment Modal
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#10B981' }]}
          onPress={testCreatePayment}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
          <ThemedText style={styles.actionButtonText}>
            Create Test Payment
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
          onPress={testVerifyPayment}
        >
          <MaterialIcons name="verified" size={20} color="#fff" />
          <ThemedText style={styles.actionButtonText}>
            Test Payment Verification
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
          onPress={loadStats}
        >
          <MaterialIcons name="refresh" size={20} color="#fff" />
          <ThemedText style={styles.actionButtonText}>
            Refresh Statistics
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Payment Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        onClose={handlePaymentClose}
        onPaymentSuccess={handlePaymentSuccess}
        userId="test-user-id"
        reservationId="test-reservation-id"
        serviceType="apartment"
        serviceId="test-service-id"
        serviceTitle="Test Apartment"
        fullAmount={50000}
        isDark={isDark}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  statsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionsContainer: {
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
