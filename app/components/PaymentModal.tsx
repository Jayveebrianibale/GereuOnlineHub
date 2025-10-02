import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { getAdminPaymentSettings } from '../services/adminPaymentService';
import { PaymentData, createPayment, verifyPayment } from '../services/paymentService';
import { formatPHP } from '../utils/currency';
import { QRCodeDisplay } from './QRCodeDisplay';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentSuccess: (payment: PaymentData) => void;
  userId: string;
  reservationId: string;
  serviceType: 'apartment' | 'laundry' | 'auto';
  serviceId: string;
  serviceTitle: string;
  fullAmount: number;
  isDark?: boolean;
}

export function PaymentModal({
  visible,
  onClose,
  onPaymentSuccess,
  userId,
  reservationId,
  serviceType,
  serviceId,
  serviceTitle,
  fullAmount,
  isDark = false
}: PaymentModalProps) {
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState<'payment' | 'verification' | 'success'>('payment');
  const [adminPaymentSettings, setAdminPaymentSettings] = useState<any>(null);

  const downPaymentAmount = serviceType === 'apartment' ? Math.round(fullAmount * 0.3) : fullAmount;
  const remainingAmount = fullAmount - downPaymentAmount;

  const bgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const subtitleColor = isDark ? '#B0B0B0' : '#666';

  useEffect(() => {
    if (visible) {
      loadAdminPaymentSettings();
      initializePayment();
    } else {
      // Reset state when modal closes
      setPayment(null);
      setStep('payment');
      setLoading(false);
      setVerifying(false);
      setAdminPaymentSettings(null);
    }
  }, [visible]);

  const loadAdminPaymentSettings = async () => {
    try {
      const settings = await getAdminPaymentSettings();
      setAdminPaymentSettings(settings);
    } catch (error) {
      console.error('Failed to load admin payment settings:', error);
    }
  };

  const initializePayment = async () => {
    try {
      setLoading(true);
      const newPayment = await createPayment(
        userId,
        reservationId,
        serviceType,
        serviceId,
        fullAmount,
        'gcash'
      );
      setPayment(newPayment);
    } catch (error) {
      console.error('Failed to create payment:', error);
      Alert.alert('Error', 'Failed to initialize payment. Please try again.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!payment) return;

    try {
      setVerifying(true);
      setStep('verification');
      
      // Simulate verification process
      const isVerified = await verifyPayment(payment.id);
      
      if (isVerified) {
        setStep('success');
        setTimeout(() => {
          onPaymentSuccess(payment);
          onClose();
        }, 2000);
      } else {
        Alert.alert(
          'Payment Verification Failed',
          'Your payment could not be verified. Please try again or contact support.',
          [{ text: 'OK', onPress: () => setStep('payment') }]
        );
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      Alert.alert('Error', 'Payment verification failed. Please try again.');
      setStep('payment');
    } finally {
      setVerifying(false);
    }
  };

  const handleSkipPayment = () => {
    if (serviceType === 'apartment') {
      Alert.alert(
        'Payment Required',
        'A 30% down payment is required for apartment reservations. You cannot skip this step.',
        [{ text: 'OK' }]
      );
    } else {
      onClose();
    }
  };

  const renderPaymentStep = () => (
    <ScrollView style={styles.scrollView}>
      <View style={styles.header}>
        <ThemedText type="title" style={[styles.title, { color: textColor }]}>
          Payment Required
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>
          {serviceType === 'apartment' 
            ? '30% down payment required to secure your reservation'
            : 'Complete payment to confirm your reservation'
          }
        </ThemedText>
      </View>

      <View style={[styles.serviceInfo, { backgroundColor: isDark ? '#2A2A2A' : '#f8f9fa' }]}>
        <ThemedText style={[styles.serviceTitle, { color: textColor }]}>
          {serviceTitle}
        </ThemedText>
        <View style={styles.amountBreakdown}>
          <View style={styles.amountRow}>
            <ThemedText style={[styles.amountLabel, { color: textColor }]}>
              Total Amount:
            </ThemedText>
            <ThemedText style={[styles.amountValue, { color: textColor }]}>
              {formatPHP(fullAmount)}
            </ThemedText>
          </View>
          {serviceType === 'apartment' && (
            <>
              <View style={styles.amountRow}>
                <ThemedText style={[styles.amountLabel, { color: textColor }]}>
                  Down Payment (30%):
                </ThemedText>
                <ThemedText style={[styles.downPaymentValue, { color: '#00B2FF' }]}>
                  {formatPHP(downPaymentAmount)}
                </ThemedText>
              </View>
              <View style={styles.amountRow}>
                <ThemedText style={[styles.amountLabel, { color: textColor }]}>
                  Remaining Balance:
                </ThemedText>
                <ThemedText style={[styles.amountValue, { color: subtitleColor }]}>
                  {formatPHP(remainingAmount)}
                </ThemedText>
              </View>
            </>
          )}
        </View>
      </View>

      {payment && (
        <QRCodeDisplay
          qrCode={payment.qrCode || ''}
          amount={payment.amount}
          referenceNumber={payment.referenceNumber || ''}
          gcashNumber={payment.gcashNumber || ''}
          dueDate={payment.dueDate}
          adminQRCode={adminPaymentSettings?.qrCodeBase64}
        />
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.verifyButton, { backgroundColor: '#00B2FF' }]}
          onPress={handleVerifyPayment}
          disabled={!payment}
        >
          <MaterialIcons name="verified" size={20} color="#fff" />
          <ThemedText style={styles.verifyButtonText}>
            I've Made the Payment
          </ThemedText>
        </TouchableOpacity>

        {serviceType !== 'apartment' && (
          <TouchableOpacity
            style={[styles.skipButton, { borderColor: '#6c757d' }]}
            onPress={handleSkipPayment}
          >
            <ThemedText style={[styles.skipButtonText, { color: '#6c757d' }]}>
              Skip Payment
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderVerificationStep = () => (
    <View style={styles.verificationContainer}>
      <ActivityIndicator size="large" color="#00B2FF" />
      <ThemedText style={[styles.verificationTitle, { color: textColor }]}>
        Verifying Payment...
      </ThemedText>
      <ThemedText style={[styles.verificationSubtitle, { color: subtitleColor }]}>
        Please wait while we verify your payment
      </ThemedText>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <MaterialIcons name="check-circle" size={80} color="#10B981" />
      <ThemedText style={[styles.successTitle, { color: textColor }]}>
        Payment Confirmed!
      </ThemedText>
      <ThemedText style={[styles.successSubtitle, { color: subtitleColor }]}>
        Your reservation has been secured
      </ThemedText>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>
            Payment
          </ThemedText>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00B2FF" />
            <ThemedText style={[styles.loadingText, { color: textColor }]}>
              Initializing Payment...
            </ThemedText>
          </View>
        ) : step === 'payment' ? (
          renderPaymentStep()
        ) : step === 'verification' ? (
          renderVerificationStep()
        ) : (
          renderSuccessStep()
        )}
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  serviceInfo: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  amountBreakdown: {
    gap: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 16,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  downPaymentValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  verificationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 40,
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  verificationSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
