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
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
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
  // HOOKS
  // ========================================
  const router = useRouter(); // Navigation router
  
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
  const [selectedPaymentType, setSelectedPaymentType] = useState<'qr_code' | 'paymongo' | null>(null); // Selected payment type (null = not selected)

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
  const borderColor = isDark ? '#333' : '#e9ecef';

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
      console.log('🔄 Loading admin payment settings...');
      const settings = await getAdminPaymentSettings(); // I-fetch ang admin payment settings
      console.log('✅ Admin payment settings loaded:', settings);
      setAdminPaymentSettings(settings); // I-set ang settings sa state
      
      // ========================================
      // CHECK ADMIN GCASH INFORMATION
      // ========================================
      // I-check kung may admin GCash information para sa QR code payment only
      // PayMongo payments don't need admin GCash information
      if (settings) {
        const hasGCashNumber = settings.gcashNumber && settings.gcashNumber.trim() !== '';
        const hasQRCode = settings.qrCodeImageUrl && settings.qrCodeImageUrl.trim() !== '';
        
        console.log('🔍 Admin GCash information check:', {
          hasGCashNumber,
          hasQRCode,
          gcashNumber: settings.gcashNumber,
          qrCodeImageUrl: settings.qrCodeImageUrl
        });
        
        // I-show ang warning alert if admin GCash information is incomplete
        if (!hasGCashNumber || !hasQRCode) {
          console.warn('⚠️ Admin GCash information incomplete:', {
            hasGCashNumber,
            hasQRCode,
            gcashNumber: settings.gcashNumber,
            qrCodeImageUrl: settings.qrCodeImageUrl
          });
          
          // I-show ang warning alert
          Alert.alert(
            'QR Code Payment Unavailable',
            'Admin has not yet uploaded complete GCash payment information.\n\nTo use QR code payment, admin must upload:\n• GCash number\n• QR code image\n\nQR code payment is currently unavailable.\n\nPlease use PayMongo payment instead, or contact admin to complete the setup.',
            [
              { text: 'Use PayMongo', onPress: () => setSelectedPaymentType('paymongo') },
              { text: 'OK', style: 'cancel' }
            ]
          );
        }
      }
    } catch (error) {
      console.error('❌ Failed to load admin payment settings:', error); // I-log ang error
    }
  };

  // ========================================
  // PAYMENT METHOD SELECTION FUNCTION
  // ========================================
  // I-handle ang payment method selection at i-create ang payment
  const handlePaymentMethodSelection = async (paymentType: 'qr_code' | 'paymongo') => {
    try {
      setSelectedPaymentType(paymentType);
      setLoading(true);
      
      // I-load ang admin payment settings kung QR code ang selected
      if (paymentType === 'qr_code') {
        console.log('🔄 Loading admin payment settings for QR code payment...');
        await loadAdminPaymentSettings();
      }
      
      // I-create ang payment record
      const newPayment = await createPayment(
        userId,
        reservationId,
        serviceType,
        serviceId,
        fullAmount,
        'gcash',
        paymentType
      );
      
      setPayment(newPayment);
      // I-stay sa payment step para ma-show ang QR code information
      
    } catch (error) {
      console.error('Failed to create payment:', error);
      Alert.alert(
        'Payment Failed',
        'Failed to initialize payment. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
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
        'gcash', // Payment method (GCash)
        selectedPaymentType // Payment type (QR code or PayMongo)
      );
      setPayment(newPayment); // I-set ang payment sa state
    } catch (error: any) {
      console.error('Failed to create payment:', error); // I-log ang error
      
      // ========================================
      // ERROR ALERT - PAYMENT INITIALIZATION FAILED
      // ========================================
      // I-check kung specific error about admin GCash information
      if (error.message && error.message.includes('Admin GCash information is not yet uploaded')) {
        Alert.alert(
          'Payment Setup Required',
          'Admin has not yet uploaded GCash payment information.\n\nTo complete your payment, please:\n\n1. Contact the admin to set up GCash details\n2. Ask admin to upload GCash number and QR code\n3. Try again once admin has completed the setup\n\nYou can also try using PayMongo payment if available.',
          [
            { text: 'OK', onPress: () => onClose() },
            { text: 'Try PayMongo', onPress: () => {
              // I-try ang PayMongo payment as alternative
              setSelectedPaymentType('paymongo');
              initializePayment();
            }}
          ]
        );
      } else {
        // I-display ang generic error alert for other errors
        Alert.alert('Error', 'Failed to initialize payment. Please try again.');
        onClose(); // I-close ang modal
      }
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
      // PAYMENT VERIFICATION BASED ON TYPE
      // ========================================
      if (payment.paymentMethod === 'gcash') {
        if (payment.paymongoSourceId && payment.checkoutUrl) {
          // ========================================
          // PAYMONGO GCASH PAYMENT VERIFICATION
          // ========================================
          console.log('🔄 Verifying PayMongo GCash payment...');
          
          const isVerified = await verifyPayment(payment.id);
          
          if (isVerified) {
            // ========================================
            // PAYMONGO PAYMENT SUCCESS - REDIRECT TO BOOKINGS
            // ========================================
            setStep('success');
            
            Alert.alert(
              'Payment Successful!',
              'Your PayMongo GCash payment has been processed successfully. Redirecting to your bookings...',
              [
                { 
                  text: 'View Bookings', 
                  onPress: () => {
                    onPaymentSuccess(payment);
                    onClose();
                    // I-redirect sa bookings page
                    router.push('/(user-tabs)/bookings');
                  }
                }
              ]
            );
          } else {
            Alert.alert(
              'Payment Verification Failed',
              'We could not verify your PayMongo payment. Please try again or contact support.',
              [
                { text: 'OK', onPress: () => setStep('payment') }
              ]
            );
          }
        } else if (payment.qrCode) {
          // ========================================
          // DIRECT QR CODE PAYMENT VERIFICATION
          // ========================================
          console.log('🔄 Verifying direct QR code payment...');
          
          const isVerified = await verifyPayment(payment.id);
          
          if (isVerified) {
            // ========================================
            // QR CODE PAYMENT SUBMITTED - AWAITING ADMIN CONFIRMATION
            // ========================================
            setStep('success');
            
            Alert.alert(
              'Payment Submitted Successfully',
              'Your QR code payment has been submitted and is awaiting admin confirmation. You will be notified once the payment is verified.',
              [
                { 
                  text: 'OK', 
                  onPress: () => {
                    onPaymentSuccess(payment);
                    onClose();
                  }
                }
              ]
            );
          } else {
            Alert.alert(
              'Payment Verification Failed',
              'We could not verify your payment. Please try again or contact support if the problem persists.',
              [
                { text: 'OK', onPress: () => setStep('payment') }
              ]
            );
          }
        } else {
          Alert.alert(
            'Payment Error',
            'No payment method found. Please try again.',
            [
              { text: 'OK', onPress: () => setStep('payment') }
            ]
          );
        }
      } else {
        // ========================================
        // LEGACY PAYMENT VERIFICATION
        // ========================================
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
  // HANDLE PAYMONGO GCASH PAYMENT FUNCTION
  // ========================================
  // I-handle ang PayMongo GCash payment process
  // I-open ang GCash app or web browser para sa payment
  const handlePayMongoGCashPayment = async () => {
    if (!payment || !payment.checkoutUrl) {
      Alert.alert('Error', 'Payment checkout URL not available. Please try again.');
      return;
    }

    try {
      console.log('🔄 Opening PayMongo GCash checkout:', payment.checkoutUrl);
      
      // I-check kung test mode checkout URL
      if (payment.checkoutUrl.includes('test-checkout.paymongo.com')) {
        // I-simulate ang test mode payment process
        Alert.alert(
          'Test Mode Payment',
          'This is a test payment simulation.\n\nIn test mode, the payment will be automatically processed successfully.\n\nClick "Verify Payment" to complete the test payment.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // I-show ang verification step para sa test mode
                setStep('verification');
              }
            }
          ]
        );
        return;
      }
      
      // I-check kung supported ang deep linking sa platform
      const supported = await Linking.canOpenURL(payment.checkoutUrl);
      
      if (supported) {
        // I-open ang GCash app or web browser
        await Linking.openURL(payment.checkoutUrl);
        
        // I-show ang instruction sa user na i-complete ang payment
        Alert.alert(
          'Complete Payment',
          'Please complete your payment in the GCash app or browser. After payment, click "Verify Payment" to check the status.',
          [
            { text: 'OK', style: 'default' }
          ]
        );
        
        // I-show ang verification step para sa manual verification
        setStep('verification');
      } else {
        Alert.alert(
          'Cannot Open GCash',
          'Please install GCash app or use a web browser to complete the payment.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open in Browser', onPress: () => Linking.openURL(payment.checkoutUrl!) }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Failed to open PayMongo GCash checkout:', error);
      Alert.alert('Error', 'Failed to open GCash payment. Please try again.');
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

      {/* Payment Type Selection */}
      <View style={[styles.paymentTypeSection, { backgroundColor: isDark ? '#2A2A2A' : '#f8f9fa' }]}>
        <ThemedText style={[styles.paymentTypeTitle, { color: textColor }]}>
          Choose Payment Method
        </ThemedText>
        
        <TouchableOpacity
          style={[
            styles.paymentTypeOption,
            { 
              backgroundColor: selectedPaymentType === 'qr_code' ? '#00B2FF20' : 'transparent',
              borderColor: selectedPaymentType === 'qr_code' ? '#00B2FF' : borderColor,
              opacity: (() => {
                const hasGCashNumber = adminPaymentSettings?.gcashNumber && adminPaymentSettings.gcashNumber.trim() !== '';
                const hasQRCode = adminPaymentSettings?.qrCodeImageUrl && adminPaymentSettings.qrCodeImageUrl.trim() !== '';
                return (!hasGCashNumber || !hasQRCode) ? 0.5 : 1;
              })()
            }
          ]}
          onPress={() => {
            // I-check kung may admin GCash information (only for QR code payments)
            const hasGCashNumber = adminPaymentSettings?.gcashNumber && adminPaymentSettings.gcashNumber.trim() !== '';
            const hasQRCode = adminPaymentSettings?.qrCodeImageUrl && adminPaymentSettings.qrCodeImageUrl.trim() !== '';
            
            console.log('🔍 QR Code payment check:', {
              adminPaymentSettings: !!adminPaymentSettings,
              hasGCashNumber,
              hasQRCode,
              gcashNumber: adminPaymentSettings?.gcashNumber,
              qrCodeImageUrl: adminPaymentSettings?.qrCodeImageUrl
            });
            
            if (!hasGCashNumber || !hasQRCode) {
              Alert.alert(
                'QR Code Payment Unavailable',
                'Admin has not yet uploaded GCash payment information.\n\nTo use QR code payment, admin must upload:\n• GCash number\n• QR code image\n\nPlease use PayMongo payment instead, or contact admin to complete the setup.',
                [
                  { text: 'Switch to PayMongo', onPress: () => setSelectedPaymentType('paymongo') },
                  { text: 'OK', style: 'cancel' }
                ]
              );
            } else {
              handlePaymentMethodSelection('qr_code');
            }
          }}
        >
          <MaterialIcons 
            name="qr-code" 
            size={24} 
            color={selectedPaymentType === 'qr_code' ? '#00B2FF' : subtitleColor} 
          />
          <View style={styles.paymentTypeInfo}>
            <ThemedText style={[
              styles.paymentTypeName, 
              { color: selectedPaymentType === 'qr_code' ? '#00B2FF' : textColor }
            ]}>
              QR Code Payment
            </ThemedText>
            <ThemedText style={[styles.paymentTypeDesc, { color: subtitleColor }]}>
              {(() => {
                const hasGCashNumber = adminPaymentSettings?.gcashNumber && adminPaymentSettings.gcashNumber.trim() !== '';
                const hasQRCode = adminPaymentSettings?.qrCodeImageUrl && adminPaymentSettings.qrCodeImageUrl.trim() !== '';
                
                if (!hasGCashNumber || !hasQRCode) {
                  return 'Unavailable - Admin setup required';
                }
                return 'Scan QR code to pay directly to admin\'s GCash';
              })()}
            </ThemedText>
          </View>
          {selectedPaymentType === 'qr_code' && (
            <MaterialIcons name="check-circle" size={20} color="#00B2FF" />
          )}
          {(() => {
            const hasGCashNumber = adminPaymentSettings?.gcashNumber && adminPaymentSettings.gcashNumber.trim() !== '';
            const hasQRCode = adminPaymentSettings?.qrCodeImageUrl && adminPaymentSettings.qrCodeImageUrl.trim() !== '';
            
            if (!hasGCashNumber || !hasQRCode) {
              return <MaterialIcons name="warning" size={20} color="#FF9800" />;
            }
            return null;
          })()}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentTypeOption,
            { 
              backgroundColor: selectedPaymentType === 'paymongo' ? '#10B98120' : 'transparent',
              borderColor: selectedPaymentType === 'paymongo' ? '#10B981' : borderColor
            }
          ]}
          onPress={() => handlePaymentMethodSelection('paymongo')}
        >
          <MaterialIcons 
            name="account-balance-wallet" 
            size={24} 
            color={selectedPaymentType === 'paymongo' ? '#10B981' : subtitleColor} 
          />
          <View style={styles.paymentTypeInfo}>
            <ThemedText style={[
              styles.paymentTypeName, 
              { color: selectedPaymentType === 'paymongo' ? '#10B981' : textColor }
            ]}>
              PayMongo GCash
            </ThemedText>
            <ThemedText style={[styles.paymentTypeDesc, { color: subtitleColor }]}>
              Pay via PayMongo (real payment, automatically confirmed)
            </ThemedText>
          </View>
          {selectedPaymentType === 'paymongo' && (
            <MaterialIcons name="check-circle" size={20} color="#10B981" />
          )}
        </TouchableOpacity>
      </View>

      {/* Payment Method Selection - Only show if no payment method selected */}
      {!selectedPaymentType && (
        <View style={[styles.paymentMethodPrompt, { backgroundColor: isDark ? '#2A2A2A' : '#f8f9fa' }]}>
          <ThemedText style={[styles.paymentMethodPromptText, { color: textColor }]}>
            Please select a payment method above to continue
          </ThemedText>
        </View>
      )}

      {/* Payment Display - Only show if payment method is selected */}
      {payment && selectedPaymentType && (
        <>
          {/* QR Code Payment Display */}
          {selectedPaymentType === 'qr_code' && (
            <View style={[styles.qrCodeContainer, { backgroundColor: isDark ? '#2A2A2A' : '#f8f9fa' }]}>

              {adminPaymentSettings && adminPaymentSettings.gcashNumber && adminPaymentSettings.qrCodeImageUrl ? (
                <QRCodeDisplay
                  qrCode={payment.qrCode || ''}
                  amount={payment.amount}
                  referenceNumber={payment.referenceNumber || ''}
                  gcashNumber={adminPaymentSettings.gcashNumber}
                  dueDate={payment.dueDate}
                  adminQRCode={adminPaymentSettings.qrCodeBase64}
                />
              ) : (
                <View style={[styles.qrCodeError, { backgroundColor: isDark ? '#3A3A3A' : '#f8f9fa' }]}>
                  <MaterialIcons name="warning" size={48} color="#FF9800" />
                  <ThemedText style={[styles.qrCodeErrorTitle, { color: textColor }]}>
                    QR Code Payment Unavailable
                  </ThemedText>
                  <ThemedText style={[styles.qrCodeErrorText, { color: subtitleColor }]}>
                    Admin has not yet uploaded GCash payment information (number and QR code).\n\nTo complete your payment:
                  </ThemedText>
                  <View style={styles.qrCodeErrorSteps}>
                    <ThemedText style={[styles.qrCodeErrorStep, { color: subtitleColor }]}>
                      • Contact admin to set up GCash details
                    </ThemedText>
                    <ThemedText style={[styles.qrCodeErrorStep, { color: subtitleColor }]}>
                      • Use PayMongo payment instead
                    </ThemedText>
                    <ThemedText style={[styles.qrCodeErrorStep, { color: subtitleColor }]}>
                      • Try again once admin completes setup
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={[styles.switchToPayMongoButton, { backgroundColor: '#10B981' }]}
                    onPress={() => setSelectedPaymentType('paymongo')}
                  >
                    <MaterialIcons name="account-balance-wallet" size={20} color="#fff" />
                    <ThemedText style={styles.switchToPayMongoText}>
                      Switch to PayMongo Payment
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* PayMongo Payment Display */}
          {selectedPaymentType === 'paymongo' && payment.checkoutUrl && (
            <View style={[styles.paymongoContainer, { backgroundColor: isDark ? '#2A2A2A' : '#f8f9fa' }]}>
              <View style={styles.paymongoHeader}>
                <MaterialIcons name="account-balance-wallet" size={24} color="#10B981" />
                <ThemedText style={[styles.paymongoTitle, { color: textColor }]}>
                  Pay with PayMongo GCash
                </ThemedText>
                {payment.checkoutUrl.includes('test-checkout.paymongo.com') && (
                  <View style={styles.testModeBadge}>
                    <ThemedText style={styles.testModeText}>TEST MODE</ThemedText>
                  </View>
                )}
              </View>
              <ThemedText style={[styles.paymongoDescription, { color: subtitleColor }]}>
                {payment.checkoutUrl.includes('test-checkout.paymongo.com') 
                  ? 'This is a test payment simulation. Click below to simulate the payment process.'
                  : 'Click below to open PayMongo checkout and complete your payment securely.'
                }
              </ThemedText>
              
              <TouchableOpacity
                style={[styles.paymongoButton, { backgroundColor: '#10B981' }]}
                onPress={handlePayMongoGCashPayment}
                disabled={!payment.checkoutUrl}
              >
                <MaterialIcons name="payment" size={20} color="#fff" />
                <ThemedText style={styles.paymongoButtonText}>
                  {payment.checkoutUrl.includes('test-checkout.paymongo.com') 
                    ? 'Simulate Payment (Test Mode)'
                    : 'Open PayMongo Checkout'
                  }
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Action Buttons - Only show if payment method is selected */}
      {selectedPaymentType && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.verifyButton, { backgroundColor: '#00B2FF' }]}
            onPress={handleVerifyPayment}
            disabled={!payment || verifying}
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
      )}
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
  // Payment Type Selection Styles
  paymentTypeSection: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  paymentTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  paymentTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  paymentTypeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentTypeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentTypeDesc: {
    fontSize: 14,
    lineHeight: 18,
  },
  // Payment Method Prompt Styles
  paymentMethodPrompt: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  paymentMethodPromptText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // QR Code Error Styles
  qrCodeError: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 16,
  },
  qrCodeErrorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  qrCodeErrorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  qrCodeErrorSteps: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  qrCodeErrorStep: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  switchToPayMongoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  switchToPayMongoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Test Mode Badge Styles
  testModeBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  testModeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
