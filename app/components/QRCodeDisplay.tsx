import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { Image, StyleSheet, View } from 'react-native';

interface QRCodeDisplayProps {
  qrCode: string;
  amount: number;
  referenceNumber: string;
  gcashNumber: string;
  dueDate: string;
  adminQRCode?: string; // Admin's uploaded QR code (base64)
}

export function QRCodeDisplay({ 
  qrCode, 
  amount, 
  referenceNumber, 
  gcashNumber, 
  dueDate,
  adminQRCode
}: QRCodeDisplayProps) {


  return (
    <ThemedView style={styles.container}>
      {/* QR Code Display */}
      <View style={styles.qrCodeContainer}>
        {adminQRCode ? (
          <View style={styles.qrCodeImageContainer}>
            <Image 
              source={{ uri: `data:image/jpeg;base64,${adminQRCode}` }}
              style={styles.qrCodeImage}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={styles.qrCodePlaceholder}>
            <MaterialIcons name="qr-code" size={160} color="#00B2FF" />
          </View>
        )}
      </View>

      {/* QR Code Labels */}
      <View style={styles.qrCodeLabels}>
        <ThemedText style={styles.qrCodeText}>
          {adminQRCode ? 'Scan to Pay' : 'QR Code'}
        </ThemedText>
        <ThemedText style={styles.qrCodeSubtext}>
          {adminQRCode ? 'Use GCash app to scan' : 'Scan with GCash app'}
        </ThemedText>
      </View>

      {/* Payment Details */}
      <View style={styles.paymentDetails}>
        <View style={styles.amountRow}>
          <ThemedText style={[styles.amountLabel, { color: '#333' }]}>Amount to Pay:</ThemedText>
          <ThemedText style={styles.amountValue}>₱{amount.toLocaleString()}</ThemedText>
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


      {/* Instructions */}
      <View style={styles.instructions}>
        <ThemedText style={[styles.instructionsTitle, { color: '#0066cc' }]}>Payment Instructions:</ThemedText>
        <ThemedText style={[styles.instructionText, { color: '#0066cc' }]}>
          1. Open your GCash app{'\n'}
          2. Tap "Send Money" or scan QR code{'\n'}
          3. Enter the amount: ₱{amount.toLocaleString()}{'\n'}
          4. Complete the payment
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  qrCodeContainer: {
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  qrCodeLabels: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCodeImageContainer: {
    width: 280,
    height: 280,
    maxWidth: '95%',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  qrCodeImage: {
    width: 240,
    height: 240,
    borderRadius: 12,
    maxWidth: '100%',
    maxHeight: '100%',
  },
  qrCodePlaceholder: {
    width: 280,
    height: 280,
    maxWidth: '95%',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  qrCodeText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 0,
    color: '#00B2FF',
    textAlign: 'center',
  },
  qrCodeSubtext: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
    textAlign: 'center',
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
