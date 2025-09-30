import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { Alert, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

interface QRCodeDisplayProps {
  qrCode: string;
  amount: number;
  referenceNumber: string;
  gcashNumber: string;
  dueDate: string;
  onCopyReference?: () => void;
  onOpenGCash?: () => void;
}

export function QRCodeDisplay({ 
  qrCode, 
  amount, 
  referenceNumber, 
  gcashNumber, 
  dueDate,
  onCopyReference,
  onOpenGCash
}: QRCodeDisplayProps) {
  const handleOpenGCash = async () => {
    try {
      // Try to open GCash app with the payment data
      const gcashUrl = `gcash://pay?amount=${amount}&reference=${referenceNumber}`;
      const canOpen = await Linking.canOpenURL(gcashUrl);
      
      if (canOpen) {
        await Linking.openURL(gcashUrl);
        onOpenGCash?.();
      } else {
        // Fallback to GCash web or show instructions
        Alert.alert(
          'Open GCash',
          'Please open your GCash app and scan the QR code or use the reference number to make payment.',
          [
            { text: 'Copy Reference', onPress: onCopyReference },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('Failed to open GCash:', error);
      Alert.alert('Error', 'Unable to open GCash app. Please scan the QR code manually.');
    }
  };

  const handleCopyReference = () => {
    // In a real app, you would use Clipboard API here
    Alert.alert(
      'Reference Number',
      `Reference: ${referenceNumber}\n\nAmount: ₱${amount.toLocaleString()}\n\nPlease use this reference when paying via GCash.`,
      [{ text: 'OK' }]
    );
    onCopyReference?.();
  };

  return (
    <ThemedView style={styles.container}>
      {/* QR Code Placeholder - In a real app, you would use a QR code library */}
      <View style={styles.qrCodeContainer}>
        <View style={styles.qrCodePlaceholder}>
          <MaterialIcons name="qr-code" size={120} color="#00B2FF" />
          <ThemedText style={styles.qrCodeText}>QR Code</ThemedText>
          <ThemedText style={styles.qrCodeSubtext}>
            Scan with GCash app
          </ThemedText>
        </View>
      </View>

      {/* Payment Details */}
      <View style={styles.paymentDetails}>
        <View style={styles.amountRow}>
          <ThemedText style={[styles.amountLabel, { color: '#333' }]}>Amount to Pay:</ThemedText>
          <ThemedText style={styles.amountValue}>₱{amount.toLocaleString()}</ThemedText>
        </View>
        
        <View style={styles.referenceRow}>
          <ThemedText style={[styles.referenceLabel, { color: '#6c757d' }]}>Reference Number:</ThemedText>
          <View style={styles.referenceContainer}>
            <ThemedText style={[styles.referenceValue, { color: '#333' }]}>{referenceNumber}</ThemedText>
            <TouchableOpacity onPress={handleCopyReference} style={styles.copyButton}>
              <MaterialIcons name="content-copy" size={16} color="#00B2FF" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.gcashRow}>
          <ThemedText style={[styles.gcashLabel, { color: '#6c757d' }]}>GCash Number:</ThemedText>
          <ThemedText style={[styles.gcashValue, { color: '#333' }]}>{gcashNumber}</ThemedText>
        </View>
        
        <View style={styles.dueDateRow}>
          <ThemedText style={[styles.dueDateLabel, { color: '#856404' }]}>Payment Due:</ThemedText>
          <ThemedText style={[styles.dueDateValue, { color: '#856404' }]}>
            {new Date(dueDate).toLocaleDateString()} at {new Date(dueDate).toLocaleTimeString()}
          </ThemedText>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.gcashButton} onPress={handleOpenGCash}>
          <MaterialIcons name="payment" size={20} color="#fff" />
          <ThemedText style={[styles.gcashButtonText, { color: '#fff' }]}>Open GCash</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.copyButtonLarge} onPress={handleCopyReference}>
          <MaterialIcons name="content-copy" size={20} color="#00B2FF" />
          <ThemedText style={[styles.copyButtonText, { color: '#00B2FF' }]}>Copy Reference</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <ThemedText style={[styles.instructionsTitle, { color: '#0066cc' }]}>Payment Instructions:</ThemedText>
        <ThemedText style={[styles.instructionText, { color: '#0066cc' }]}>
          1. Open your GCash app{'\n'}
          2. Tap "Send Money" or scan QR code{'\n'}
          3. Enter the amount: ₱{amount.toLocaleString()}{'\n'}
          4. Use reference: {referenceNumber}{'\n'}
          5. Complete the payment
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  qrCodeContainer: {
    marginBottom: 24,
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCodeText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    color: '#00B2FF',
  },
  qrCodeSubtext: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  paymentDetails: {
    width: '100%',
    marginBottom: 24,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00B2FF',
  },
  referenceRow: {
    marginBottom: 12,
  },
  referenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#6c757d',
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  referenceValue: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  copyButton: {
    padding: 4,
  },
  gcashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  gcashLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  gcashValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  dueDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
  },
  dueDateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#856404',
  },
  dueDateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  gcashButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B2FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  gcashButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  copyButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#00B2FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  copyButtonText: {
    color: '#00B2FF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    width: '100%',
    backgroundColor: '#e7f3ff',
    padding: 16,
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#0066cc',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#0066cc',
  },
});
