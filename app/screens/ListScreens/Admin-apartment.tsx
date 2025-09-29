import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from '../../../components/Toast';
import { RobustImage } from '../../components/RobustImage';
import {
    createApartment,
    deleteApartment,
    getApartments,
    updateApartment,
    type Apartment
} from '../../services/apartmentService';
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

    // Initial empty apartment template
    const emptyApartment = {
    id: '',
    title: '',
    price: '',
    location: '',
    address: '',
    image: '',
    rating: 0,
    reviews: 0,
    amenities: [],
    description: '',
    size: '',
    bedrooms: 0,
    bathrooms: 0,
    available: true,
    };

    export default function AdminApartmentManagement() {
    const { colorScheme } = useColorScheme();
    const router = useRouter();
    const isDark = colorScheme === 'dark';
    
    const bgColor = isDark ? '#121212' : '#fff';
    const cardBgColor = isDark ? '#1E1E1E' : '#fff';
    const textColor = isDark ? '#fff' : colorPalette.darkest;
    const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
    const borderColor = isDark ? '#333' : '#eee';
    const dangerColor = isDark ? '#FF6B6B' : '#FF3B30';

    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [currentApartment, setCurrentApartment] = useState<any>(emptyApartment);
    const [isNewApartment, setIsNewApartment] = useState(false);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [apartmentToDelete, setApartmentToDelete] = useState<string | null>(null);
    const [imageSelectionVisible, setImageSelectionVisible] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [recentImages, setRecentImages] = useState<string[]>([]);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
        visible: false,
        message: '',
        type: 'success',
    });
    const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
    const [modalToast, setModalToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    // Auto-hide modal toast after 4 seconds
    useEffect(() => {
        if (modalToast.visible) {
            const timer = setTimeout(() => {
                setModalToast({ ...modalToast, visible: false });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [modalToast.visible]);

    useEffect(() => {
        if (imageSelectionVisible) {
            (async () => {
                const recents = await getRecentImages();
                setRecentImages(recents);
            })();
        }
    }, [imageSelectionVisible]);

  const selectAndClose = async (pathOrUri: string) => {
    // Simply store the local URI in form state - will be saved to Realtime DB on save
    console.log('📸 Selecting image:', pathOrUri);
    console.log('📸 Image type:', typeof pathOrUri);
    console.log('📸 Is ImageManipulator cache:', pathOrUri.includes('/cache/ImageManipulator/'));
    
    setCurrentApartment({ ...currentApartment, image: pathOrUri });

    // Optimistically update the list so the image appears immediately
    if (!isNewApartment && currentApartment?.id) {
      setApartments(prev => prev.map(apt =>
        apt.id === currentApartment.id ? { ...apt, image: pathOrUri } : apt
      ));
    }

    await addRecentImage(pathOrUri);
    setImageSelectionVisible(false);
    
    console.log('📸 Updated currentApartment.image to:', currentApartment.image);
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

    // Load apartments from Firebase
    useEffect(() => {
        const fetchApartments = async () => {
            try {
                const apartmentsData = await getApartments();
                setApartments(apartmentsData);
            } catch (error) {
                console.error('Error fetching apartments: ', error);
                Alert.alert('Error', 'Failed to fetch apartments');
            }
        };

        fetchApartments();
    }, []);

    const handleAddNew = () => {
        setCurrentApartment({ ...emptyApartment, id: Date.now().toString() });
        setIsNewApartment(true);
        setEditModalVisible(true);
    };

    const handleEdit = (apartment: any) => {
        setCurrentApartment(apartment);
        setIsNewApartment(false);
        setEditModalVisible(true);
    };

    const validateForm = () => {
        const errors: {[key: string]: string} = {};
        
        // Required field validations
        if (!currentApartment.title || currentApartment.title.trim() === '') {
            errors.title = 'Title is required';
        }
        
        if (!currentApartment.price || currentApartment.price.trim() === '') {
            errors.price = 'Price is required';
        }
        
        if (!currentApartment.location || currentApartment.location.trim() === '') {
            errors.location = 'Location is required';
        }
        
        if (!currentApartment.image || currentApartment.image.trim() === '') {
            errors.image = 'Image is required';
        }
        
        // Additional validations
        if (currentApartment.title && currentApartment.title.trim().length < 3) {
            errors.title = 'Title must be at least 3 characters';
        }
        
        if (currentApartment.price && !currentApartment.price.match(/^[Pp]?[\d,]+[\/\-]?\w*$/)) {
            errors.price = 'Please enter a valid price (e.g., P1,200, 20,000/mo)';
        }
        
        if (currentApartment.bedrooms < 0) {
            errors.bedrooms = 'Bedrooms cannot be negative';
        }
        
        if (currentApartment.bathrooms < 0) {
            errors.bathrooms = 'Bathrooms cannot be negative';
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        // Clear previous errors
        setFieldErrors({});
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        try {
            setIsUploadingImage(true);
            
            // Clean amenities: remove empty/whitespace entries
            const cleanedAmenities = (currentApartment.amenities || [])
                .map((a: string) => (a || '').trim())
                .filter((a: string) => a.length > 0);

            const payload = { ...currentApartment, amenities: cleanedAmenities };
            
            if (isNewApartment) {
                // Remove the id property as it will be generated by Firebase
                const { id, ...apartmentData } = payload;
                const newApartment = await createApartment(apartmentData);
                setApartments([...apartments, newApartment]);
                setToast({ visible: true, message: 'Apartment added successfully', type: 'success' });
            } else {
                // Update existing apartment
                const { id, ...apartmentData } = payload;
                await updateApartment(id, apartmentData);
                setApartments(apartments.map(apt =>
                    apt.id === currentApartment.id ? { ...apt, ...payload, image: payload.image } : apt
                ));
                setToast({ visible: true, message: 'Apartment updated', type: 'success' });
            }
            setEditModalVisible(false);
        } catch (error) {
            console.error('Error saving apartment: ', error);
            
            // Show specific error messages
            if (error instanceof Error) {
                if (error.message.includes('Invalid image format')) {
                    setModalToast({ 
                        visible: true, 
                        message: 'Please select a valid image file', 
                        type: 'error' 
                    });
                } else if (error.message.includes('Failed to upload')) {
                    setModalToast({ 
                        visible: true, 
                        message: 'Failed to upload image. Please try again.', 
                        type: 'error' 
                    });
                } else {
                    setModalToast({ 
                        visible: true, 
                        message: 'Failed to save apartment. Please try again.', 
                        type: 'error' 
                    });
                }
            } else {
                setModalToast({ 
                    visible: true, 
                    message: 'An unexpected error occurred. Please try again.', 
                    type: 'error' 
                });
            }
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleDelete = (id: string) => {
        setApartmentToDelete(id);
        setDeleteConfirmVisible(true);
    };

    const confirmDelete = async () => {
        if (apartmentToDelete) {
            try {
                await deleteApartment(apartmentToDelete);
                setApartments(apartments.filter(apt => apt.id !== apartmentToDelete));
                setDeleteConfirmVisible(false);
                setApartmentToDelete(null);
            } catch (error) {
                console.error('Error deleting apartment: ', error);
                Alert.alert('Error', 'Failed to delete apartment');
            }
        }
    };

    const handleAmenityChange = (text: string, index: number) => {
        const updatedAmenities = [...(currentApartment.amenities || [])];
        updatedAmenities[index] = text;
        setCurrentApartment({ ...currentApartment, amenities: updatedAmenities });
    };

    const addAmenity = () => {
        setCurrentApartment({ 
        ...currentApartment, 
        amenities: [...(currentApartment.amenities || []), ''] 
        });
    };

    const removeAmenity = (index: number) => {
        const updatedAmenities = [...(currentApartment.amenities || [])];
        updatedAmenities.splice(index, 1);
        setCurrentApartment({ ...currentApartment, amenities: updatedAmenities });
    };
    
    const renderApartmentItem = ({ item }: { item: any }) => (
        <View style={[styles.apartmentCard, { backgroundColor: cardBgColor, borderColor }]}>
        <RobustImage source={item.image} style={styles.apartmentImage} resizeMode="cover" />
        <View style={styles.apartmentContent}>
            <ThemedText type="subtitle" style={[styles.apartmentTitle, { color: textColor }]}>
            {item.title}
            </ThemedText>
            <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={16} color={colorPalette.primary} />
            <ThemedText style={[styles.locationText, { color: subtitleColor }]}>
                {item.location}
            </ThemedText>
            </View>
            <ThemedText style={[styles.priceText, { color: colorPalette.primary }]}>
            {item.price}
            </ThemedText>
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
            Apartment Management
            </ThemedText>
            <TouchableOpacity 
                style={styles.headerAddButton}
                onPress={handleAddNew}
            >
                <MaterialIcons name="add" size={24} color={colorPalette.primary} />
            </TouchableOpacity>
        </View>

        {/* Apartments List */}
        {apartments.length > 0 ? (
            <FlatList
            data={apartments}
            renderItem={renderApartmentItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            />
        ) : (
            <ThemedView style={[styles.emptyState, { backgroundColor: bgColor }]}>
            <MaterialIcons name="apartment" size={48} color={subtitleColor} />
            <ThemedText style={[styles.emptyText, { color: subtitleColor }]}>
                No apartments found. Add a new one to get started.
            </ThemedText>
            </ThemedView>
        )}

        {/* Toast - positioned above modals */}
        <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            onHide={() => setToast({ ...toast, visible: false })}
        />

        {/* Edit/Create Modal */}
        <Modal
            visible={editModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setEditModalVisible(false)}
        >
            <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.editModal, { backgroundColor: cardBgColor }]}>
                {/* Modal Toast */}
                {modalToast.visible && (
                    <View style={[styles.modalToast, { 
                        backgroundColor: modalToast.type === 'error' ? '#F44336' : '#4CAF50'
                    }]}>
                        <MaterialIcons 
                            name={modalToast.type === 'error' ? 'error' : 'check-circle'} 
                            size={20} 
                            color="white" 
                        />
                        <ThemedText style={styles.modalToastText}>
                            {modalToast.message}
                        </ThemedText>
                        <TouchableOpacity 
                            onPress={() => setModalToast({ ...modalToast, visible: false })}
                            style={styles.modalToastClose}
                        >
                            <MaterialIcons name="close" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                )}
                <ScrollView contentContainerStyle={styles.editScrollContent}>
                <View style={styles.modalHeader}>
                    <ThemedText type="title" style={[styles.modalTitle, { color: textColor }]}>
                    {isNewApartment ? 'Add New Apartment' : 'Edit Apartment'}
                    </ThemedText>
                    <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                    <MaterialIcons name="close" size={24} color={textColor} />
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <ThemedText style={[styles.label, { color: textColor }]}>Title*</ThemedText>
                    <TextInput
                    style={[
                        styles.input, 
                        { 
                            color: textColor, 
                            borderColor: fieldErrors.title ? dangerColor : borderColor,
                            borderWidth: fieldErrors.title ? 2 : 1
                        }
                    ]}
                    value={currentApartment.title}
                    onChangeText={(text) => {
                        setCurrentApartment({ ...currentApartment, title: text });
                        // Clear error when user starts typing
                        if (fieldErrors.title) {
                            setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.title;
                                return newErrors;
                            });
                        }
                    }}
                    placeholder="Apartment title"
                    placeholderTextColor={subtitleColor}
                    />
                    {fieldErrors.title && (
                        <ThemedText style={[styles.errorText, { color: dangerColor }]}>
                            {fieldErrors.title}
                        </ThemedText>
                    )}
                </View>

                <View style={styles.formGroup}>
                    <ThemedText style={[styles.label, { color: textColor }]}>Price*</ThemedText>
                    <TextInput
                    style={[
                        styles.input, 
                        { 
                            color: textColor, 
                            borderColor: fieldErrors.price ? dangerColor : borderColor,
                            borderWidth: fieldErrors.price ? 2 : 1
                        }
                    ]}
                    value={currentApartment.price}
                    onChangeText={(text) => {
                        setCurrentApartment({ ...currentApartment, price: text });
                        // Clear error when user starts typing
                        if (fieldErrors.price) {
                            setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.price;
                                return newErrors;
                            });
                        }
                    }}
                    placeholder="e.g. P1,200/mo"
                    placeholderTextColor={subtitleColor}
                    keyboardType="default"
                    />
                    {fieldErrors.price && (
                        <ThemedText style={[styles.errorText, { color: dangerColor }]}>
                            {fieldErrors.price}
                        </ThemedText>
                    )}
                </View>

                <View style={styles.formGroup}>
                    <ThemedText style={[styles.label, { color: textColor }]}>Location*</ThemedText>
                    <TextInput
                    style={[
                        styles.input, 
                        { 
                            color: textColor, 
                            borderColor: fieldErrors.location ? dangerColor : borderColor,
                            borderWidth: fieldErrors.location ? 2 : 1
                        }
                    ]}
                    value={currentApartment.location}
                    onChangeText={(text) => {
                        setCurrentApartment({ ...currentApartment, location: text });
                        // Clear error when user starts typing
                        if (fieldErrors.location) {
                            setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.location;
                                return newErrors;
                            });
                        }
                    }}
                    placeholder="e.g. Downtown"
                    placeholderTextColor={subtitleColor}
                    />
                    {fieldErrors.location && (
                        <ThemedText style={[styles.errorText, { color: dangerColor }]}>
                            {fieldErrors.location}
                        </ThemedText>
                    )}
                </View>

                <View style={styles.formGroup}>
                    <ThemedText style={[styles.label, { color: textColor }]}>Address</ThemedText>
                    <TextInput
                    style={[styles.input, { color: textColor, borderColor }]}
                    value={currentApartment.address}
                    onChangeText={(text) => setCurrentApartment({ ...currentApartment, address: text })}
                    placeholder="Full address"
                    placeholderTextColor={subtitleColor}
                    />
                </View>
                
                <View style={styles.formGroup}>
                    <ThemedText style={[styles.label, { color: textColor }]}>Image*</ThemedText>
                    <TouchableOpacity
                        style={[
                            styles.imagePreview, 
                            { 
                                borderColor: fieldErrors.image ? dangerColor : borderColor,
                                borderWidth: fieldErrors.image ? 2 : 1
                            }
                        ]}
                        onPress={() => {
                            setImageSelectionVisible(true);
                            // Clear error when user starts selecting image
                            if (fieldErrors.image) {
                                setFieldErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.image;
                                    return newErrors;
                                });
                            }
                        }}
                    >
                        {isUploadingImage ? (
                            <View style={[styles.imagePlaceholder, { borderColor }]}>
                                <MaterialIcons name="cloud-upload" size={48} color={colorPalette.primary} />
                                <ThemedText style={[styles.placeholderText, { color: colorPalette.primary }]}>
                                    Uploading image...
                                </ThemedText>
                            </View>
                        ) : currentApartment.image ? (
                            <>
                                <RobustImage
                                    source={currentApartment.image}
                                    style={styles.imagePreviewImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.imageOverlay}>
                                    <MaterialIcons name="edit" size={20} color="#fff" />
                                    <ThemedText style={styles.imageOverlayText}>Change Image</ThemedText>
                                </View>
                            </>
                        ) : (
                            <View style={[styles.imagePlaceholder, { borderColor }]}>
                                <MaterialIcons name="add-a-photo" size={48} color={subtitleColor} />
                                <ThemedText style={[styles.placeholderText, { color: subtitleColor }]}>
                                    Tap to upload image
                                </ThemedText>
                            </View>
                        )}
                    </TouchableOpacity>
                    {fieldErrors.image && (
                        <ThemedText style={[styles.errorText, { color: dangerColor }]}>
                            {fieldErrors.image}
                        </ThemedText>
                    )}
                </View>
                
                <View style={styles.formGroup}>
                    <ThemedText style={[styles.label, { color: textColor }]}>Description</ThemedText>
                    <TextInput
                    style={[styles.textarea, { color: textColor, borderColor }]}
                    value={currentApartment.description}
                    onChangeText={(text) => setCurrentApartment({ ...currentApartment, description: text })}
                    placeholder="Detailed description"
                    placeholderTextColor={subtitleColor}
                    multiline
                    numberOfLines={4}
                    />
                </View>

                <View style={styles.rowGroup}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <ThemedText style={[styles.label, { color: textColor }]}>Bedrooms</ThemedText>
                    <TextInput
                        style={[
                            styles.input, 
                            { 
                                color: textColor, 
                                borderColor: fieldErrors.bedrooms ? dangerColor : borderColor,
                                borderWidth: fieldErrors.bedrooms ? 2 : 1
                            }
                        ]}
                        value={currentApartment.bedrooms.toString()}
                        onChangeText={(text) => {
                            const numValue = parseInt(text) || 0;
                            setCurrentApartment({ ...currentApartment, bedrooms: numValue });
                            // Clear error when user starts typing
                            if (fieldErrors.bedrooms) {
                                setFieldErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.bedrooms;
                                    return newErrors;
                                });
                            }
                        }}
                        placeholder="0"
                        placeholderTextColor={subtitleColor}
                        keyboardType="numeric"
                    />
                    {fieldErrors.bedrooms && (
                        <ThemedText style={[styles.errorText, { color: dangerColor }]}>
                            {fieldErrors.bedrooms}
                        </ThemedText>
                    )}
                    </View>

                    <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                    <ThemedText style={[styles.label, { color: textColor }]}>Bathrooms</ThemedText>
                    <TextInput
                        style={[
                            styles.input, 
                            { 
                                color: textColor, 
                                borderColor: fieldErrors.bathrooms ? dangerColor : borderColor,
                                borderWidth: fieldErrors.bathrooms ? 2 : 1
                            }
                        ]}
                        value={currentApartment.bathrooms.toString()}
                        onChangeText={(text) => {
                            const numValue = parseInt(text) || 0;
                            setCurrentApartment({ ...currentApartment, bathrooms: numValue });
                            // Clear error when user starts typing
                            if (fieldErrors.bathrooms) {
                                setFieldErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.bathrooms;
                                    return newErrors;
                                });
                            }
                        }}
                        placeholder="0"
                        placeholderTextColor={subtitleColor}
                        keyboardType="numeric"
                    />
                    {fieldErrors.bathrooms && (
                        <ThemedText style={[styles.errorText, { color: dangerColor }]}>
                            {fieldErrors.bathrooms}
                        </ThemedText>
                    )}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <ThemedText style={[styles.label, { color: textColor }]}>Size</ThemedText>
                    <TextInput
                    style={[styles.input, { color: textColor, borderColor }]}
                    value={currentApartment.size}
                    onChangeText={(text) => setCurrentApartment({ ...currentApartment, size: text })}
                    placeholder="e.g. 45 sqm"
                    placeholderTextColor={subtitleColor}
                    />
                </View>

                <View style={styles.formGroup}>
                    <View style={styles.amenitiesHeader}>
                    <ThemedText style={[styles.label, { color: textColor }]}>Amenities</ThemedText>
                    <TouchableOpacity 
                        style={styles.addAmenityButton}
                        onPress={addAmenity}
                    >
                        <MaterialIcons name="add" size={20} color={colorPalette.primary} />
                    </TouchableOpacity>
                    </View>
                    
                    {currentApartment.amenities?.map((amenity: string, index: number) => (
                        <View key={index} style={styles.amenityInputRow}>
                            <TextInput
                            style={[styles.input, { color: textColor, borderColor, flex: 1 }]}
                            value={amenity}
                            onChangeText={(text) => handleAmenityChange(text, index)}
                            placeholder={`Amenity ${index + 1}`}
                            placeholderTextColor={subtitleColor}
                            />
                            <TouchableOpacity 
                            style={styles.removeAmenityButton}
                            onPress={() => removeAmenity(index)}
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
                        onPress={() => setCurrentApartment({ ...currentApartment, available: true })}
                    >
                        <MaterialIcons
                        name={currentApartment.available ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={20}
                        color={currentApartment.available ? colorPalette.primary : textColor}
                        />
                        <ThemedText style={[styles.radioLabel, { color: textColor, marginLeft: 8 }]}>
                        Available
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.radioButton, { marginLeft: 16 }]}
                        onPress={() => setCurrentApartment({ ...currentApartment, available: false })}
                    >
                        <MaterialIcons
                        name={!currentApartment.available ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={20}
                        color={!currentApartment.available ? dangerColor : textColor}
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
                    disabled={isUploadingImage}
                    >
                    <ThemedText style={styles.saveButtonText}>
                        {isUploadingImage ? 'Uploading...' : (isNewApartment ? 'Add Apartment' : 'Save Changes')}
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
                Are you sure you want to delete this apartment? This action cannot be undone.
                </ThemedText>
                <View style={styles.confirmActions}>
                <TouchableOpacity 
                    style={[styles.confirmButton, { backgroundColor: borderColor }]}
                    onPress={() => setDeleteConfirmVisible(false)}
                >
                    <ThemedText style={[styles.confirmButtonText, { color: textColor }]}>
                    Cancel
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.confirmButton, { backgroundColor: dangerColor }]}
                    onPress={confirmDelete}
                >
                    <ThemedText style={styles.confirmButtonText}>
                    Delete
                    </ThemedText>
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
                                            currentApartment.image === img && styles.selectedImage
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
                            <ThemedText style={{ marginTop: 8, color: textColor }}>
                                Processing image...
                            </ThemedText>
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
        fontWeight: '600',
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
    apartmentCard: {
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    apartmentImage: {
        width: '100%',
        height: 150,
    },
    apartmentContent: {
        padding: 16,
    },
    apartmentTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationText: {
        marginLeft: 4,
        fontSize: 14,
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
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
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    formGroup: {
        marginBottom: 20,
    },
    rowGroup: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textarea: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        height: 100,
        textAlignVertical: 'top',
    },
    amenitiesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    addAmenityButton: {
        padding: 4,
    },
    amenityInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    removeAmenityButton: {
        padding: 12,
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
        fontSize: 16,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    saveButton: {
        flex: 1,
        borderRadius: 8,
        padding: 16,
        marginLeft: 10,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    confirmModal: {
        width: '100%',
        borderRadius: 16,
        padding: 24,
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    confirmText: {
        fontSize: 16,
        marginBottom: 24,
    },
    confirmActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    confirmButton: {
        flex: 1,
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
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
        width: '100%', // Changed to 100% for full width
        height: 120,
        borderRadius: 10,
        position: 'relative', // Added for absolute positioning of delete badge
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
    imagePlaceholder: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    placeholderText: {
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    modalToast: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        zIndex: 1000,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    modalToastText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
        flex: 1,
    },
    modalToastClose: {
        padding: 4,
    },
    });