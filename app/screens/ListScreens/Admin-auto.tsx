import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

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
  image: require('@/assets/images/auto2.avif'),
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

  const [autoServices, setAutoServices] = useState<any[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentService, setCurrentService] = useState<any>(emptyAutoService);
  const [isNewService, setIsNewService] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  // Load initial data (in a real app, this would come from an API)
  useEffect(() => {
    // Simulate loading data
    const initialData = [
      {
        id: '1',
        title: 'Oil Change Service',
        price: 'P300',
        duration: '30 min',
        image: require('@/assets/images/auto2.avif'),
        rating: 4.8,
        reviews: 234,
        description: 'Complete oil change service with premium synthetic oil and filter replacement.',
        services: ['Oil Change', 'Filter Replacement', 'Multi-point Inspection'],
        includes: ['Synthetic Oil', 'Oil Filter', 'Labor'],
        warranty: '6 months warranty',
        available: true,
      },
      {
        id: '2',
        title: 'Tire Rotation & Balance',
        price: 'P500',
        duration: '45 min',
        image: require('@/assets/images/auto3.avif'),
        rating: 4.6,
        reviews: 156,
        description: 'Professional tire rotation and balancing service for optimal tire performance.',
        services: ['Tire Rotation', 'Wheel Balancing', 'Tire Inspection'],
        includes: ['Rotation', 'Balancing', 'Inspection'],
        warranty: '3 months warranty',
        available: true,
      }
    ];
    setAutoServices(initialData);
  }, []);

  const handleAddNew = () => {
    setCurrentService({ ...emptyAutoService, id: Date.now().toString() });
    setIsNewService(true);
    setEditModalVisible(true);
  };

  const handleEdit = (service: any) => {
    setCurrentService(service);
    setIsNewService(false);
    setEditModalVisible(true);
  };

  const handleSave = () => {
    if (!currentService.title || !currentService.price || !currentService.duration) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (isNewService) {
      setAutoServices([...autoServices, currentService]);
    } else {
      setAutoServices(autoServices.map(svc => 
        svc.id === currentService.id ? currentService : svc
      ));
    }
    setEditModalVisible(false);
  };

  const handleDelete = (id: string) => {
    setServiceToDelete(id);
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = () => {
    setAutoServices(autoServices.filter(svc => svc.id !== serviceToDelete));
    setDeleteConfirmVisible(false);
    setServiceToDelete(null);
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
      <Image source={item.image} style={styles.serviceImage} resizeMode="cover" />
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
      </View>

      {/* Add New Button */}
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: colorPalette.primary }]}
        onPress={handleAddNew}
      >
        <MaterialIcons name="add" size={24} color="#fff" />
        <ThemedText style={styles.addButtonText}>Add New Service</ThemedText>
      </TouchableOpacity>

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
        <ThemedView style={styles.emptyState}>
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
                  <ThemedText style={[styles.label, { color: textColor }]}>What's Included*</ThemedText>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  serviceImage: {
    width: 100,
    height: 100,
  },
  serviceContent: {
    flex: 1,
    padding: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
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
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  editModal: {
    borderRadius: 12,
    padding: 16,
    maxHeight: '90%',
  },
  editScrollContent: {
    paddingBottom: 24,
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
});
