import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AdminPaymentSettings, getAdminPaymentSettings, updateAdminPaymentSettings } from '../services/adminPaymentService';

interface AdminPaymentSettingsProps {
  isDark: boolean;
  onClose: () => void;
}

export function AdminPaymentSettingsModal({ isDark, onClose }: AdminPaymentSettingsProps) {
  const [settings, setSettings] = useState<AdminPaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const bgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : '#333';
  const subtitleColor = isDark ? '#ccc' : '#666';
  const borderColor = isDark ? '#333' : '#eee';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await getAdminPaymentSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGCashNumber = () => {
    Alert.prompt(
      'Update GCash Number',
      'Enter your GCash number:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async (newNumber) => {
            if (!newNumber || newNumber.trim() === '') {
              Alert.alert('Error', 'Please enter a valid GCash number');
              return;
            }

            setSaving(true);
            try {
              const success = await updateAdminPaymentSettings({ gcashNumber: newNumber.trim() });
              if (success) {
                setSettings(prev => prev ? { ...prev, gcashNumber: newNumber.trim() } : null);
                Alert.alert('Success', 'GCash number updated successfully');
              } else {
                Alert.alert('Error', 'Failed to update GCash number');
              }
            } catch (error) {
              console.error('Error updating GCash number:', error);
              Alert.alert('Error', 'Failed to update GCash number');
            } finally {
              setSaving(false);
            }
          }
        }
      ],
      'plain-text',
      settings?.gcashNumber || '09123456789'
    );
  };

  const handleUploadQRCode = () => {
    Alert.alert(
      'Upload QR Code',
      'This feature will allow you to upload your GCash QR code image. For now, you can update your GCash number which will be used for payments.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Update GCash Number', onPress: handleUpdateGCashNumber }
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="refresh" size={48} color={subtitleColor} />
          <ThemedText style={[styles.loadingText, { color: subtitleColor }]}>
            Loading settings...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={[styles.title, { color: textColor }]}>
          Payment Settings
        </ThemedText>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* GCash Number Section */}
        <View style={[styles.section, { borderColor }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#00B2FF" />
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              GCash Information
            </ThemedText>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={[styles.settingLabel, { color: textColor }]}>
                GCash Number
              </ThemedText>
              <ThemedText style={[styles.settingValue, { color: subtitleColor }]}>
                {settings?.gcashNumber || 'Not set'}
              </ThemedText>
            </View>
            <TouchableOpacity 
              style={[styles.editButton, { borderColor: '#00B2FF' }]}
              onPress={handleUpdateGCashNumber}
              disabled={saving}
            >
              <MaterialIcons name="edit" size={16} color="#00B2FF" />
              <ThemedText style={[styles.editButtonText, { color: '#00B2FF' }]}>
                {saving ? 'Saving...' : 'Edit'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* QR Code Section */}
        <View style={[styles.section, { borderColor }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="qr-code" size={24} color="#10B981" />
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              QR Code
            </ThemedText>
          </View>
          
          <View style={styles.qrCodeContainer}>
            {settings?.qrCodeBase64 ? (
              <Image 
                source={{ uri: `data:image/png;base64,${settings.qrCodeBase64}` }}
                style={styles.qrCodeImage}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.qrCodePlaceholder, { borderColor }]}>
                <MaterialIcons name="qr-code" size={48} color={subtitleColor} />
                <ThemedText style={[styles.placeholderText, { color: subtitleColor }]}>
                  No QR code uploaded
                </ThemedText>
              </View>
            )}
            
            <TouchableOpacity 
              style={[styles.uploadButton, { borderColor: '#10B981' }]}
              onPress={handleUploadQRCode}
            >
              <MaterialIcons name="cloud-upload" size={16} color="#10B981" />
              <ThemedText style={[styles.uploadButtonText, { color: '#10B981' }]}>
                {settings?.qrCodeBase64 ? 'Update QR Code' : 'Upload QR Code'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Info */}
        <View style={[styles.infoSection, { backgroundColor: isDark ? '#2A2A2A' : '#f8f9fa' }]}>
          <MaterialIcons name="info" size={20} color="#00B2FF" />
          <ThemedText style={[styles.infoText, { color: subtitleColor }]}>
            This information will be used for all payment QR codes and references. 
            Make sure your GCash number is correct for successful payments.
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  qrCodeContainer: {
    alignItems: 'center',
  },
  qrCodeImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
  },
  qrCodePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  uploadButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  infoSection: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
});
