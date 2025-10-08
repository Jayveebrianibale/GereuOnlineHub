// ========================================
// PAYMENT MODAL COMPONENT - PAMAMAHALA NG PAYMENT
// ========================================
// Ang file na ito ay naghahandle ng payment modal component
// May comprehensive features: payment processing, verification, QR code display
// Support para sa different payment methods: GCash, cash, bank transfer

// Import ng React Native components at custom components
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
    View
} from 'react-native';
import { getAdminPaymentSettings } from '../services/adminPaymentService';
import { PaymentData, createPayment, verifyPayment } from '../services/paymentService';
import { formatPHP } from '../utils/currency';
import { QRCodeDisplay } from './QRCodeDisplay';

// ========================================
// INTERFACE DEFINITIONS
// ========================================
// Type definitions para sa payment modal

// Interface para sa payment modal props
interface PaymentModalProps {
  visible: boolean; // Modal visibility state
  onClose: () => void; // Close modal callback
  onPaymentSuccess: (payment: PaymentData) => void; // Payment success callback
  userId: string; // User ID
  reservationId: string; // Reservation ID
  serviceType: 'apartment' | 'laundry' | 'auto'; // Service type
  serviceId: string; // Service ID
  serviceTitle: string; // Service title
  fullAmount: number; // Full payment amount
  isDark?: boolean; // Dark mode flag (optional)
}

// ========================================
// PAYMENT MODAL COMPONENT
// ========================================
// Main component na naghahandle ng payment modal
// May comprehensive features para sa payment processing
export function PaymentModal({
  visible, // Modal visibility state
  onClose, // Close modal callback
  onPaymentSuccess, // Payment success callback
  userId, // User ID
  reservationId, // Reservation ID
  serviceType, // Service type
  serviceId, // Service ID
  serviceTitle, // Service title
  fullAmount, // Full payment amount
  isDark = false // Dark mode flag (default: false)
}: PaymentModalProps) {
  // ========================================
  // STATE VARIABLES
  // ========================================
  // State management para sa payment modal
  const [payment, setPayment] = useState<PaymentData | null>(null); // Payment data
  const [loading, setLoading] = useState(false); // Loading state
  const [verifying, setVerifying] = useState(false); // Verification state
  const [step, setStep] = useState<'payment' | 'verification' | 'success'>('payment'); // Current step
  const [adminPaymentSettings, setAdminPaymentSettings] = useState<any>(null); // Admin payment settings
  const [showPayMongoOption, setShowPayMongoOption] = useState(true); // Show PayMongo option

  // ========================================
  // PAYMENT CALCULATIONS
  // ========================================
  // Calculate payment amounts based sa service type
  const downPaymentAmount = serviceType === 'apartment' ? Math.round(fullAmount * 0.3) : fullAmount; // 30% down payment para sa apartment
  const remainingAmount = fullAmount - downPaymentAmount; // Remaining amount after down payment

  // ========================================
  // THEME COLORS
  // ========================================
  // Dynamic colors based sa theme
  const bgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const subtitleColor = isDark ? '#B0B0B0' : '#666';

  // ========================================
  // USEEFFECT - MODAL VISIBILITY HANDLER
  // ========================================
  // I-handle ang modal visibility changes
  // I-initialize ang payment kapag nag-open ang modal
  // I-reset ang state kapag nag-close ang modal
  useEffect(() => {
    if (visible) {
      // I-load ang admin payment settings at i-initialize ang payment
      loadAdminPaymentSettings();
      initializePayment();
    } else {
      // ========================================
      // RESET STATE - MODAL CLOSE
      // ========================================
      // I-reset ang lahat ng state kapag nag-close ang modal
      setPayment(null); // Clear payment data
      setStep('payment'); // Reset to payment step
      setLoading(false); // Clear loading state
      setVerifying(false); // Clear verification state
      setAdminPaymentSettings(null); // Clear admin settings
    }
  }, [visible]);

  // ========================================
  // LOAD ADMIN PAYMENT SETTINGS FUNCTION
  // ========================================
  // I-load ang admin payment settings mula sa database
  // Ginagamit para sa payment configuration
  const loadAdminPaymentSettings = async () => {
    try {
      const settings = await getAdminPaymentSettings(); // I-fetch ang admin payment settings
      setAdminPaymentSettings(settings); // I-set ang settings sa state
    } catch (error) {
      console.error('Failed to load admin payment settings:', error); // I-log ang error
    }
  };

  // ========================================
  // INITIALIZE PAYMENT FUNCTION
  // ========================================
  // I-initialize ang payment process
  // I-create ang payment record sa database
  const initializePayment = async () => {
    try {
      setLoading(true); // I-set ang loading state
      const newPayment = await createPayment( // I-create ang payment record
        userId, // User ID
        reservationId, // Reservation ID
        serviceType, // Service type
        serviceId, // Service ID
        fullAmount, // Full amount
        'gcash' // Payment method (GCash)
      );
      setPayment(newPayment); // I-set ang payment sa state
    } catch (error) {
      console.error('Failed to create payment:', error); // I-log ang error
      // ========================================
      // ERROR ALERT - PAYMENT INITIALIZATION FAILED
      // ========================================
      // I-display ang error alert kung nag-fail ang payment initialization
      Alert.alert('Error', 'Failed to initialize payment. Please try again.');
      onClose(); // I-close ang modal
    } finally {
      setLoading(false); // I-clear ang loading state
    }
  };

  // ========================================
  // HANDLE VERIFY PAYMENT FUNCTION
  // ========================================
  // I-handle ang payment verification process
  // I-verify ang payment at i-update ang status
  const handleVerifyPayment = async () => {
    if (!payment) return; // I-check kung may payment data

    try {
      setVerifying(true); // I-set ang verifying state
      setStep('verification'); // I-set ang step to verification
      
      // ========================================
      // PAYMENT VERIFICATION PROCESS
      // ========================================
      // I-verify ang payment sa backend
      const isVerified = await verifyPayment(payment.id);
      
      if (isVerified) {
        // ========================================
        // PAYMENT SUCCESS - VERIFICATION SUCCESSFUL
        // ========================================
        // I-set ang step to success at i-trigger ang success callback
        setStep('success');
        setTimeout(() => {
          onPaymentSuccess(payment); // I-trigger ang success callback
          onClose(); // I-close ang modal
        }, 2000); // 2 second delay para sa success animation
      } else {
        // ========================================
        // PAYMENT VERIFICATION FAILED ALERT
        // ========================================
        // I-display ang error alert kung nag-fail ang verification
        Alert.alert(
          'Payment Verification Failed', // Alert title - verification failed
          'Your payment could not be verified. Please try again or contact support.', // Alert message - instruction to try again
          [{ text: 'OK', onPress: () => setStep('payment') }] // OK button na mag-reset sa payment step
        );
      }
    } catch (error) {
      console.error('Payment verification failed:', error); // I-log ang error
      // ========================================
      // ERROR ALERT - VERIFICATION ERROR
      // ========================================
      // I-display ang error alert kung may error sa verification
      Alert.alert('Error', 'Payment verification failed. Please try again.');
      setStep('payment'); // I-reset sa payment step
    } finally {
      setVerifying(false); // I-clear ang verifying state
    }
  };

  // ========================================
  // HANDLE DIRECT GCASH PAYMENT FUNCTION
  // ========================================
  // I-handle ang direct GCash payment process
  // I-show ang QR code para sa direct payment
  const handleDirectGCashPayment = () => {
    if (!payment) {
      Alert.alert('Error', 'Payment information not available. Please try again.');
      return;
    }

    try {
      console.log('🔄 Showing direct GCash payment QR code');
      
      // I-show ang instruction sa user na i-scan ang QR code
      Alert.alert(
        'GCash Payment',
        'Please scan the QR code below using your GCash app to complete the payment.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
      
      // I-show ang verification step para sa manual verification
      setStep('verification');
    } catch (error) {
      console.error('❌ Failed to show GCash payment:', error);
      Alert.alert('Error', 'Failed to show GCash payment. Please try again.');
    }
  };

  // ========================================
  // HANDLE SKIP PAYMENT FUNCTION
  // ========================================
  // I-handle ang skip payment action
  // I-check kung pwede i-skip ang payment based sa service type
  const handleSkipPayment = () => {
    if (serviceType === 'apartment') {
      // ========================================
      // PAYMENT REQUIRED ALERT - APARTMENT RESERVATION
      // ========================================
      // I-display ang alert kung apartment ang service type
      // Hindi pwede i-skip ang payment para sa apartment reservations
      Alert.alert(
        'Payment Required', // Alert title - payment required
        'A 30% down payment is required for apartment reservations. You cannot skip this step.', // Alert message - explanation ng payment requirement
        [{ text: 'OK' }] // OK button para sa pag-close ng alert
      );
    } else {
      // ========================================
      // SKIP PAYMENT - OTHER SERVICES
      // ========================================
      // I-close ang modal kung hindi apartment ang service type
      // Pwede i-skip ang payment para sa other services
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
        <>
          {/* Direct GCash Payment Option */}
          {payment.qrCode && showPayMongoOption && (
            <View style={[styles.paymongoContainer, { backgroundColor: isDark ? '#2A2A2A' : '#f8f9fa' }]}>
              <View style={styles.paymongoHeader}>
                <MaterialIcons name="account-balance-wallet" size={24} color="#00B2FF" />
                <ThemedText style={[styles.paymongoTitle, { color: textColor }]}>
                  Pay with GCash
                </ThemedText>
              </View>
              <ThemedText style={[styles.paymongoDescription, { color: subtitleColor }]}>
                Direct payment to our GCash number. Click below to view QR code for payment.
              </ThemedText>
              
              <TouchableOpacity
                style={[styles.paymongoButton, { backgroundColor: '#00B2FF' }]}
                onPress={handleDirectGCashPayment}
                disabled={!payment}
              >
                <MaterialIcons name="qr-code" size={20} color="#fff" />
                <ThemedText style={styles.paymongoButtonText}>
                  Pay with GCash
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.paymongoToggle}
                onPress={() => setShowPayMongoOption(false)}
              >
                <ThemedText style={[styles.paymongoToggleText, { color: subtitleColor }]}>
                  Use QR Code instead
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Traditional QR Code Display */}
          {(!payment.checkoutUrl || !showPayMongoOption) && (
            <>
              <QRCodeDisplay
                qrCode={payment.qrCode || ''}
                amount={payment.amount}
                referenceNumber={payment.referenceNumber || ''}
                gcashNumber={payment.gcashNumber || ''}
                dueDate={payment.dueDate}
                adminQRCode={adminPaymentSettings?.qrCodeBase64}
              />
              
              {payment.checkoutUrl && (
                <TouchableOpacity
                  style={styles.paymongoToggle}
                  onPress={() => setShowPayMongoOption(true)}
                >
                  <ThemedText style={[styles.paymongoToggleText, { color: subtitleColor }]}>
                    Use PayMongo GCash instead
                  </ThemedText>
                </TouchableOpacity>
              )}
            </>
          )}
        </>
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
      <MaterialIcons name="payment" size={60} color="#00B2FF" />
      <ThemedText style={[styles.verificationTitle, { color: textColor }]}>
        Payment Verification
      </ThemedText>
      <ThemedText style={[styles.verificationSubtitle, { color: subtitleColor }]}>
        After completing your payment in GCash, click the button below to verify your payment status.
      </ThemedText>
      
      <TouchableOpacity
        style={[styles.verifyButton, { backgroundColor: '#00B2FF' }]}
        onPress={handleVerifyPayment}
        disabled={verifying}
      >
        <MaterialIcons name="verified" size={20} color="#fff" />
        <ThemedText style={styles.verifyButtonText}>
          {verifying ? 'Verifying...' : 'Verify Payment'}
        </ThemedText>
      </TouchableOpacity>
      
      {verifying && (
        <ActivityIndicator size="small" color="#00B2FF" style={{ marginTop: 16 }} />
      )}
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
  // PayMongo Styles
  paymongoContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 178, 255, 0.2)',
  },
  paymongoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymongoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  paymongoDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  paymongoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  paymongoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paymongoToggle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymongoToggleText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
