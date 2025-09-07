import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { RobustImage } from '../../components/RobustImage';
import {
  createAutoService,
  deleteAutoService,
  getAutoServices,
  updateAutoService,
  type AutoService
} from '../../services/autoService';
import { addRecentImage, clearRecentImages, getRecentImages, removeRecentImage } from '../../utils/recentImages';

const colorPalette = {
  lightest: '#C3F5FF',
  light: '#7FE6FF',
  primaryLight: '#4AD0FF',
  primary: '#00B2FF',
  primaryDark: '#007BE5',
  dark: '#0051C1',
  darker: '#002F87',
  darkest: '#001A5C',
};

// Initial empty auto service template
const emptyAutoService = {
  id: '',
  title: '',
  price: '',
  duration: '',
  image: 'auto2.avif',
  rating: 0,
  reviews: 0,
  description: '',
  services: [],
  includes: [],
  warranty: '',
  available: true,
};

export default function AdminAutoManagement() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';
  const dangerColor = isDark ? '#FF6B6B' : '#FF3B30';

  const [autoServices, setAutoServices] = useState<AutoService[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentService, setCurrentService] = useState<any>(emptyAutoService);
  const [isNewService, setIsNewService] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [imageSelectionVisible, setImageSelectionVisible] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [recentImages, setRecentImages] = useState<string[]>([]);

  useEffect(() => {
    if (imageSelectionVisible) {
      (async () => {
        const recents = await getRecentImages();
        setRecentImages(recents);
      })();
    }
  }, [imageSelectionVisible]);

  const selectAndClose = async (pathOrUri: string) => {
    setCurrentService({ ...currentService, image: pathOrUri });
    await addRecentImage(pathOrUri);
    setImageSelectionVisible(false);
  };

  const processImage = async (uri: string) => {
    // Crop to 4:3, resize to max width 1280, compress to ~0.7
    try {
      setIsProcessingImage(true);
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          // center crop approximation by resizing then cropping
          { resize: { width: 1280 } },
        ],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } finally {
      setIsProcessingImage(false);
    }
  };

  const pickImageFromDevice = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow photo library access to choose an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const processed = await processImage(result.assets[0].uri);
        await selectAndClose(processed);
      }
    } catch (error) {
      console.error('Error picking image: ', error);
      Alert.alert('Error', 'Failed to pick image from device');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow camera access to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const processed = await processImage(result.assets[0].uri);
        await selectAndClose(processed);
      }
    } catch (error) {
      console.error('Error taking photo: ', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Load auto services from Firebase
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await getAutoServices();
        setAutoServices(servicesData);
      } catch (error) {
        console.error('Error fetching auto services: ', error);
        Alert.alert('Error', 'Failed to fetch auto services');
      }
    };

    fetchServices();
  }, []);

  const handleAddNew = () => {
    setCurrentService({ ...emptyAutoService, id: Date.now().toString() });
    setIsNewService(true);
    setEditModalVisible(true);
  };

  const handleEdit = (service: any) => {
    // Ensure services and includes arrays are initialized if they don't exist
    const serviceWithArrays = {
      ...service,
      services: Array.isArray(service.services) ? service.services : [],
      includes: Array.isArray(service.includes) ? service.includes : []
    };
    setCurrentService(serviceWithArrays);
    setIsNewService(false);
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    if (!currentService.title || !currentService.price || !currentService.duration) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (isNewService) {
        // Remove the id property as it will be generated by Firebase
        const { id, ...serviceData } = currentService;
        const newService = await createAutoService(serviceData);
        setAutoServices([...autoServices, newService]);
      } else {
        // Update existing service
        const { id, ...serviceData } = currentService;
        await updateAutoService(id, serviceData);
        setAutoServices(autoServices.map(svc =>
          svc.id === currentService.id ? currentService : svc
        ));
      }
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error saving auto service: ', error);
      Alert.alert('Error', 'Failed to save auto service');
    }
  };

  const handleDelete = (id: string) => {
    setServiceToDelete(id);
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (serviceToDelete) {
      try {
        await deleteAutoService(serviceToDelete);
        setAutoServices(autoServices.filter(svc => svc.id !== serviceToDelete));
        setDeleteConfirmVisible(false);
        setServiceToDelete(null);
      } catch (error) {
        console.error('Error deleting auto service: ', error);
        Alert.alert('Error', 'Failed to delete auto service');
      }
    }
  };

  const handleServiceChange = (text: string, index: number, field: 'services' | 'includes') => {
    const updatedItems = [...currentService[field]];
    updatedItems[index] = text;
    setCurrentService({ ...currentService, [field]: updatedItems });
  };

  const addItem = (field: 'services' | 'includes') => {
    setCurrentService({ 
      ...currentService, 
      [field]: [...currentService[field], ''] 
    });
  };

  const removeItem = (index: number, field: 'services' | 'includes') => {
    const updatedItems = [...currentService[field]];
    updatedItems.splice(index, 1);
    setCurrentService({ ...currentService, [field]: updatedItems });
  };

  const renderServiceItem = ({ item }: { item: any }) => (
    <View style={[styles.serviceCard, { backgroundColor: cardBgColor, borderColor }]}>
      <RobustImage source={item.image} style={styles.serviceImage} resizeMode="cover" />
      <View style={styles.serviceContent}>
        <ThemedText type="subtitle" style={[styles.serviceTitle, { color: textColor }]}>
          {item.title}
        </ThemedText>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <MaterialIcons name="attach-money" size={16} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}>
              {item.price}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="timer-outline" size={16} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}>
              {item.duration}
            </ThemedText>
          </View>
        </View>
        <View style={styles.adminActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colorPalette.primary }]}
            onPress={() => handleEdit(item)}
          >
            <MaterialIcons name="edit" size={16} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: dangerColor }]}
            onPress={() => handleDelete(item.id)}
          >
            <MaterialIcons name="delete" size={16} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Delete</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBgColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colorPalette.primary} />
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.headerTitle, { color: textColor }]}>
          Auto Service Management
        </ThemedText>
        <TouchableOpacity
          style={styles.headerAddButton}
          onPress={handleAddNew}
        >
          <MaterialIcons name="add" size={24} color={colorPalette.primary} />
        </TouchableOpacity>
      </View>

      {/* Services List */}
      {autoServices.length > 0 ? (
        <FlatList
          data={autoServices}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ThemedView style={[styles.emptyState, { backgroundColor: bgColor }]}>
          <MaterialIcons name="car-repair" size={48} color={subtitleColor} />
          <ThemedText style={[styles.emptyText, { color: subtitleColor }]}>
            No auto services found. Add a new one to get started.
          </ThemedText>
        </ThemedView>
      )}

      {/* Edit/Create Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.editModal, { backgroundColor: cardBgColor }]}>
            <ScrollView contentContainerStyle={styles.editScrollContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="title" style={[styles.modalTitle, { color: textColor }]}>
                  {isNewService ? 'Add New Service' : 'Edit Service'}
                </ThemedText>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Service Title*</ThemedText>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor }]}
                  value={currentService.title}
                  onChangeText={(text) => setCurrentService({ ...currentService, title: text })}
                  placeholder="Service title"
                  placeholderTextColor={subtitleColor}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Price*</ThemedText>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor }]}
                  value={currentService.price}
                  onChangeText={(text) => setCurrentService({ ...currentService, price: text })}
                  placeholder="e.g. P300 or From P200"
                  placeholderTextColor={subtitleColor}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Duration*</ThemedText>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor }]}
                  value={currentService.duration}
                  onChangeText={(text) => setCurrentService({ ...currentService, duration: text })}
                  placeholder="e.g. 30 min or 1 hour"
                  placeholderTextColor={subtitleColor}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Warranty</ThemedText>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor }]}
                  value={currentService.warranty}
                  onChangeText={(text) => setCurrentService({ ...currentService, warranty: text })}
                  placeholder="e.g. 6 months warranty"
                  placeholderTextColor={subtitleColor}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Image</ThemedText>
                <TouchableOpacity
                  style={[styles.imagePreview, { borderColor }]}
                  onPress={() => setImageSelectionVisible(true)}
                >
                        <RobustImage
                            source={currentService.image}
                            style={styles.imagePreviewImage}
                            resizeMode="cover"
                        />
                  <View style={styles.imageOverlay}>
                    <MaterialIcons name="edit" size={20} color="#fff" />
                    <ThemedText style={styles.imageOverlayText}>Change Image</ThemedText>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Description</ThemedText>
                <TextInput
                  style={[styles.textarea, { color: textColor, borderColor }]}
                  value={currentService.description}
                  onChangeText={(text) => setCurrentService({ ...currentService, description: text })}
                  placeholder="Service description"
                  placeholderTextColor={subtitleColor}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.servicesHeader}>
                  <ThemedText style={[styles.label, { color: textColor }]}>Services Included*</ThemedText>
                  <TouchableOpacity 
                    style={styles.addItemButton}
                    onPress={() => addItem('services')}
                  >
                    <MaterialIcons name="add" size={20} color={colorPalette.primary} />
                  </TouchableOpacity>
                </View>
                
                {currentService.services.map((service: string, index: number) => (
                  <View key={`service-${index}`} style={styles.itemInputRow}>
                    <TextInput
                      style={[styles.input, { color: textColor, borderColor, flex: 1 }]}
                      value={service}
                      onChangeText={(text) => handleServiceChange(text, index, 'services')}
                      placeholder={`Service ${index + 1}`}
                      placeholderTextColor={subtitleColor}
                    />
                    <TouchableOpacity 
                      style={styles.removeItemButton}
                      onPress={() => removeItem(index, 'services')}
                    >
                      <MaterialIcons name="remove" size={20} color={dangerColor} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={styles.formGroup}>
                <View style={styles.servicesHeader}>
                  <ThemedText style={[styles.label, { color: textColor }]}>What&apos;s Included*</ThemedText>
                  <TouchableOpacity 
                    style={styles.addItemButton}
                    onPress={() => addItem('includes')}
                  >
                    <MaterialIcons name="add" size={20} color={colorPalette.primary} />
                  </TouchableOpacity>
                </View>
                
                {currentService.includes.map((include: string, index: number) => (
                  <View key={`include-${index}`} style={styles.itemInputRow}>
                    <TextInput
                      style={[styles.input, { color: textColor, borderColor, flex: 1 }]}
                      value={include}
                      onChangeText={(text) => handleServiceChange(text, index, 'includes')}
                      placeholder={`Included item ${index + 1}`}
                      placeholderTextColor={subtitleColor}
                    />
                    <TouchableOpacity 
                      style={styles.removeItemButton}
                      onPress={() => removeItem(index, 'includes')}
                    >
                      <MaterialIcons name="remove" size={20} color={dangerColor} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Availability</ThemedText>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioButton}
                    onPress={() => setCurrentService({ ...currentService, available: true })}
                  >
                    <MaterialIcons
                      name={currentService.available ? 'radio-button-checked' : 'radio-button-unchecked'}
                      size={20}
                      color={currentService.available ? colorPalette.primary : textColor}
                    />
                    <ThemedText style={[styles.radioLabel, { color: textColor, marginLeft: 8 }]}>
                      Available
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.radioButton, { marginLeft: 16 }]}
                    onPress={() => setCurrentService({ ...currentService, available: false })}
                  >
                    <MaterialIcons
                      name={!currentService.available ? 'radio-button-checked' : 'radio-button-unchecked'}
                      size={20}
                      color={!currentService.available ? dangerColor : textColor}
                    />
                    <ThemedText style={[styles.radioLabel, { color: textColor, marginLeft: 8 }]}>
                      Unavailable
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.cancelButton, { borderColor }]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: colorPalette.primary }]}
                  onPress={handleSave}
                >
                  <ThemedText style={styles.saveButtonText}>
                    {isNewService ? 'Add Service' : 'Save Changes'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.confirmModal, { backgroundColor: cardBgColor }]}>
            <ThemedText type="title" style={[styles.confirmTitle, { color: textColor }]}>
              Confirm Delete
            </ThemedText>
            <ThemedText style={[styles.confirmText, { color: subtitleColor }]}>
              Are you sure you want to delete this auto service? This action cannot be undone.
            </ThemedText>
            <View style={styles.confirmActions}>
            <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: borderColor }]}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <ThemedText style={{ color: textColor }}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: dangerColor }]}
                onPress={confirmDelete}
              >
                <ThemedText style={{ color: '#fff' }}>Delete</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
              </Modal>
        
        {/* Image Selection Modal */}
        <Modal
          visible={imageSelectionVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setImageSelectionVisible(false)}
        >
          <View style={styles.imageSelectionModal}>
            <View style={[styles.imageSelectionContainer, { backgroundColor: cardBgColor }]}>
              <View style={styles.imageSelectionHeader}>
                <ThemedText type="title" style={[styles.imageSelectionTitle, { color: textColor }]}>
                  Select Image
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={takePhotoWithCamera} style={{ marginRight: 12 }}>
                    <MaterialIcons name="photo-camera" size={24} color={textColor} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={pickImageFromDevice} style={{ marginRight: 12 }}>
                    <MaterialIcons name="photo-library" size={24} color={textColor} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={async () => { await clearRecentImages(); setRecentImages([]); }} style={{ marginRight: 12 }}>
                    <MaterialIcons name="delete-sweep" size={24} color={textColor} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setImageSelectionVisible(false)}>
                    <MaterialIcons name="close" size={24} color={textColor} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {recentImages.length === 0 ? (
                <ThemedText style={[styles.confirmText, { color: subtitleColor }]}>No recent images yet. Use the buttons above.</ThemedText>
              ) : (
                <FlatList
                  data={recentImages}
                  keyExtractor={(img) => img}
                  numColumns={2}
                  style={{ maxHeight: 420 }}
                  contentContainerStyle={styles.imageGrid}
                  columnWrapperStyle={{ justifyContent: 'space-between' }}
                  renderItem={({ item: img }) => (
                    <View style={{ width: '47%', marginBottom: 16 }}>
                      <TouchableOpacity
                        style={[
                          styles.imageGridItem,
                          currentService.image === img && styles.selectedImage
                        ]}
                        onPress={() => selectAndClose(img)}
                        activeOpacity={0.8}
                      >
                        <RobustImage
                          source={img}
                          style={styles.imageGridImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={async () => { await removeRecentImage(img); const rec = await getRecentImages(); setRecentImages(rec); }}
                        style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 14, padding: 4 }}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                      >
                        <MaterialIcons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                  showsVerticalScrollIndicator={true}
                />
              )}

              {isProcessingImage && (
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <MaterialIcons name="hourglass-top" size={36} color={textColor} />
                  <ThemedText style={{ marginTop: 8, color: textColor }}>Processing image...</ThemedText>
                </View>
              )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginTop: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerAddButton: {
    padding: 4,
  },
  listContainer: {
    padding: 20,
  },
  serviceCard: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 150,
  },
  serviceContent: {
    padding: 16,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    marginLeft: 4,
  },
  adminActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModal: {
    width: '100%',
    borderRadius: 16,
    maxHeight: '90%',
  },
  editScrollContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    height: 100,
    textAlignVertical: 'top',
  },
  servicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  addItemButton: {
    padding: 4,
  },
  itemInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  removeItemButton: {
    marginLeft: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 6,
    marginRight: 10,
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  confirmModal: {
    borderRadius: 12,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  confirmText: {
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreviewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlayText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  imageSelectionModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  imageSelectionContainer: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
  },
  imageSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  imageSelectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageGridItem: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    position: 'relative',
  },
  imageGridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  selectedImage: {
    borderWidth: 3,
    borderColor: '#00B2FF',
  },
});
