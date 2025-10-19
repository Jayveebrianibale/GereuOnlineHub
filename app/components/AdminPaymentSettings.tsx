import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { AdminPaymentSettings, getAdminPaymentSettings, updateAdminPaymentSettings, uploadQRCodeImage } from '../services/adminPaymentService';

interface AdminPaymentSettingsProps {
  isDark: boolean;
  onClose: () => void;
}

export function AdminPaymentSettingsModal({ isDark, onClose }: AdminPaymentSettingsProps) {
  const [settings, setSettings] = useState<AdminPaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newGCashNumber, setNewGCashNumber] = useState('');

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
      console.log('Loaded settings:', currentSettings);
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGCashNumber = () => {
    setNewGCashNumber(settings?.gcashNumber || '');
    setEditModalVisible(true);
  };

  const handleSaveGCashNumber = async () => {
    if (!newGCashNumber || newGCashNumber.trim() === '') {
      Alert.alert('Error', 'Please enter a valid GCash number');
      return;
    }

    setSaving(true);
    try {
      console.log('Updating GCash number to:', newGCashNumber.trim());
      const success = await updateAdminPaymentSettings({ gcashNumber: newGCashNumber.trim() });
      console.log('Update result:', success);
      if (success) {
        // I-update ang local state immediately
        setSettings(prev => {
          const updatedSettings = prev ? { ...prev, gcashNumber: newGCashNumber.trim() } : null;
          console.log('Updating local state with:', updatedSettings);
          return updatedSettings;
        });
        setEditModalVisible(false);
        
        // I-refetch ang data from Firebase to ensure sync
        console.log('Refetching data from Firebase...');
        await loadSettings();
        
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
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setNewGCashNumber('');
  };

  const handleUploadQRCode = () => {
    Alert.alert(
      'Upload QR Code',
      'Choose how you want to add your GCash QR code image',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: takePhotoWithCamera },
        { text: 'Photo Library', onPress: pickImageFromDevice }
      ]
    );
  };

  const processImage = async (uri: string) => {
    try {
      setSaving(true);
      // Process image to square format and compress
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 400 } }, // Resize to reasonable size
        ],
        { 
          compress: 0.8, 
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );
      return manipResult;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    } finally {
      setSaving(false);
    }
  };

  const pickImageFromDevice = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow photo library access to choose an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for QR code
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleQRCodeUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from device');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow camera access to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for QR code
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleQRCodeUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleQRCodeUpload = async (imageUri: string) => {
    try {
      setSaving(true);
      
      // Process the image using ImageManipulator (similar to profile.tsx)
      const processedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 400 } }], // Resize to reasonable size
        { 
          compress: 0.8, 
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );
      
      if (!processedImage.base64) {
        throw new Error('Failed to process image');
      }

      const dataUrl = `data:image/jpeg;base64,${processedImage.base64}`;
      
      // Upload to Realtime Database
      const uploadResult = await uploadQRCodeImage(imageUri);
      
      // Update settings with the base64 data
      const success = await updateAdminPaymentSettings({ 
        qrCodeBase64: processedImage.base64,
        qrCodeImageUrl: dataUrl
      });
      
      if (success) {
        setSettings(prev => prev ? { 
          ...prev, 
          qrCodeBase64: processedImage.base64,
          qrCodeImageUrl: dataUrl
        } : null);
        Alert.alert('Success', 'QR code uploaded successfully');
      } else {
        Alert.alert('Error', 'Failed to save QR code');
      }
    } catch (error) {
      console.error('Error uploading QR code:', error);
      Alert.alert('Error', 'Failed to upload QR code. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveQRCode = () => {
    Alert.alert(
      'Remove QR Code',
      'Are you sure you want to remove the QR code?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              
              // Remove from both adminPaymentSettings and Payment_Information
              const success = await updateAdminPaymentSettings({ 
                qrCodeBase64: undefined,
                qrCodeImageUrl: undefined
              });
              
              // Also remove from Payment_Information path
              const { ref: dbRef, set } = await import('firebase/database');
              const { db } = await import('../firebaseConfig');
              await set(dbRef(db, 'Payment_Information/qrCode'), '');
              await set(dbRef(db, 'Payment_Information/qrCodeUpdatedAt'), new Date().toISOString());
              
              if (success) {
                setSettings(prev => prev ? { 
                  ...prev, 
                  qrCodeBase64: undefined,
                  qrCodeImageUrl: undefined
                } : null);
                Alert.alert('Success', 'QR code removed successfully');
              } else {
                Alert.alert('Error', 'Failed to remove QR code');
              }
            } catch (error) {
              console.error('Error removing QR code:', error);
              Alert.alert('Error', 'Failed to remove QR code');
            } finally {
              setSaving(false);
            }
          }
        }
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
              <ThemedText style={[styles.settingValue, { 
                color: settings?.gcashNumber ? subtitleColor : '#F59E0B',
                fontStyle: settings?.gcashNumber ? 'normal' : 'italic'
              }]}>
                {settings?.gcashNumber || 'No GCash number added yet'}
              </ThemedText>
              {!settings?.gcashNumber && (
                <ThemedText style={[styles.settingSubtext, { color: subtitleColor }]}>
                  Add your GCash number to enable QR code payments
                </ThemedText>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.editButton, { 
                borderColor: settings?.gcashNumber ? '#00B2FF' : '#10B981',
                backgroundColor: settings?.gcashNumber ? 'transparent' : '#10B98120'
              }]}
              onPress={handleUpdateGCashNumber}
              disabled={saving}
            >
              <MaterialIcons 
                name={settings?.gcashNumber ? "edit" : "add"} 
                size={16} 
                color={settings?.gcashNumber ? '#00B2FF' : '#10B981'} 
              />
              <ThemedText style={[styles.editButtonText, { 
                color: settings?.gcashNumber ? '#00B2FF' : '#10B981' 
              }]}>
                {saving ? 'Saving...' : (settings?.gcashNumber ? 'Edit' : 'Add Number')}
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
              <View style={styles.qrCodeImageContainer}>
                <Image 
                  source={{ uri: `data:image/jpeg;base64,${settings.qrCodeBase64}` }}
                  style={styles.qrCodeImage}
                  resizeMode="contain"
                />
                <TouchableOpacity 
                  style={styles.removeQRButton}
                  onPress={handleRemoveQRCode}
                >
                  <MaterialIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.qrCodePlaceholder, { borderColor }]}>
                <MaterialIcons name="qr-code" size={48} color={subtitleColor} />
                <ThemedText style={[styles.placeholderText, { color: subtitleColor }]}>
                  No QR code uploaded yet
                </ThemedText>
                <ThemedText style={[styles.placeholderSubtext, { color: subtitleColor }]}>
                  Upload your GCash QR code to enable payments
                </ThemedText>
              </View>
            )}
            
            <TouchableOpacity 
              style={[styles.uploadButton, { borderColor: '#10B981' }]}
              onPress={handleUploadQRCode}
              disabled={saving}
            >
              <MaterialIcons name="cloud-upload" size={16} color="#10B981" />
              <ThemedText style={[styles.uploadButtonText, { color: '#10B981' }]}>
                {saving ? 'Uploading...' : (settings?.qrCodeBase64 ? 'Update QR Code' : 'Upload QR Code')}
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

      {/* Custom Edit GCash Number Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModal, { backgroundColor: bgColor, borderColor }]}>
            <View style={styles.editModalHeader}>
              <ThemedText style={[styles.editModalTitle, { color: textColor }]}>
                {settings?.gcashNumber ? 'Update GCash Number' : 'Add GCash Number'}
              </ThemedText>
              <TouchableOpacity onPress={handleCancelEdit}>
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.editModalBody}>
              <ThemedText style={[styles.editModalLabel, { color: textColor }]}>
                Enter your GCash number:
              </ThemedText>
              <TextInput
                style={[styles.editModalInput, { 
                  backgroundColor: isDark ? '#2A2A2A' : '#f8f9fa',
                  color: textColor,
                  borderColor: borderColor
                }]}
                value={newGCashNumber}
                onChangeText={setNewGCashNumber}
                placeholder="Enter GCash number"
                placeholderTextColor={subtitleColor}
                keyboardType="phone-pad"
                autoFocus
              />
            </View>
            
            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={[styles.editModalButton, styles.cancelButton, { borderColor }]}
                onPress={handleCancelEdit}
              >
                <ThemedText style={[styles.editModalButtonText, { color: textColor }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.editModalButton, styles.saveButton, { 
                  backgroundColor: saving ? '#ccc' : '#00B2FF',
                  opacity: saving ? 0.7 : 1
                }]}
                onPress={handleSaveGCashNumber}
                disabled={saving}
              >
                <ThemedText style={[styles.editModalButtonText, { color: '#fff' }]}>
                  {saving ? 'Saving...' : (settings?.gcashNumber ? 'Update' : 'Add')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  settingSubtext: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
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
  qrCodeImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  qrCodeImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  removeQRButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
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
  placeholderSubtext: {
    marginTop: 4,
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.8,
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
  // Edit Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editModalBody: {
    padding: 20,
  },
  editModalLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  editModalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  editModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    gap: 12,
  },
  editModalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  saveButton: {
    // backgroundColor and opacity set dynamically
  },
  editModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
