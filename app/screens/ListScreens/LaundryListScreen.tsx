import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { RobustImage } from '../../components/RobustImage';
import { LAUNDRY_ADMIN } from '../../config/adminConfig';
import { useAdminReservation } from '../../contexts/AdminReservationContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { useReservation } from '../../contexts/ReservationContext';
import {
    cacheLaundryServices,
    getCachedLaundryServices
} from '../../services/dataCache';
import { getLaundryServices } from '../../services/laundryService';
import { notifyAdmins } from '../../services/notificationService';
import { formatPHP } from '../../utils/currency';
import { mapServiceToAdminReservation } from '../../utils/reservationUtils';
import { isSmallScreen, isTablet, normalize, wp } from '../../utils/responsiveUtils';

import { push, ref, set } from 'firebase/database';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { FullScreenImageViewer } from '../../components/FullScreenImageViewer';
import { db } from '../../firebaseConfig';

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

export default function LaundryListScreen() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isDark = colorScheme === 'dark';
  const { reservedLaundryServices, reserveLaundryService, removeLaundryReservation } = useReservation();
  const { addAdminReservation } = useAdminReservation();
  const { user, isLoading } = useAuthContext();
  
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLaundryService, setSelectedLaundryService] = useState<any>(null);
  const [laundryServices, setLaundryServices] = useState<any[]>([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'dropoff' | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupContactNumber, setPickupContactNumber] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const instructionsInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const handleImagePress = (imageSource: string) => {
    setSelectedImage(imageSource);
    setImageViewerVisible(true);
  };

  const handleInstructionsFocus = () => {
    // Scroll to the instructions input when focused
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleMessageAdmin = async (service: any) => {
    try {
      if (!user?.email) return;
      const ADMIN_EMAIL = LAUNDRY_ADMIN.email;
      const ADMIN_NAME = LAUNDRY_ADMIN.name;
      const chatId = [user.email, ADMIN_EMAIL].sort().join('_');

      const priceText = typeof service?.price !== 'undefined' ? `Price: ${formatPHP(service.price)}` : '';
      const messageText = `I'm interested in Laundry Service: ${service?.title || 'Laundry'}\n${priceText}\nTurnaround: ${service?.turnaround || 'N/A'}`;

      const newMsgRef = push(ref(db, 'messages'));
      await set(newMsgRef, {
        id: newMsgRef.key,
        chatId,
        text: messageText,
        image: service?.image || null,
        imageUrl: service?.image || null, // Add imageUrl for consistency
        category: 'laundry',
        serviceId: service?.id || null,
        senderEmail: user.email,
        senderName: user.displayName || 'User',
        recipientEmail: ADMIN_EMAIL,
        recipientName: ADMIN_NAME,
        timestamp: Date.now(),
        time: Date.now(),
        messageType: 'laundry_inquiry', // Add message type
        laundryTitle: service?.title || 'Laundry Service',
        laundryPrice: service?.price || 0,
        laundryTurnaround: service?.turnaround || 'N/A',
      });

      setDetailModalVisible(false);
      router.push(`/chat/${encodeURIComponent(chatId)}?recipientName=${encodeURIComponent(ADMIN_NAME)}&recipientEmail=${encodeURIComponent(ADMIN_EMAIL)}&currentUserEmail=${encodeURIComponent(user.email)}`);
    } catch (e) {
      console.error('Error sending interest message:', e);
    }
  };
  
  const handleLaundryReservation = async (service: any) => {
    // Check if service is available
    if (!service.available) {
      Alert.alert(
        'Service Unavailable',
        'This laundry service is currently unavailable for avail. Please try again later or contact the admin.',
        [{ text: 'OK' }]
      );
      return;
    }

    const isReserved = reservedLaundryServices.some(s => (s as any).serviceId === service.id);
    if (!isReserved) {
      // Show delivery options modal
      setSelectedLaundryService(service);
      setDeliveryModalVisible(true);
    } else {
      // Show alert asking if user wants to reserve again
      Alert.alert(
        'Already Reserved',
        'You already avail this service. Do you want to avail this again?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Yes, Avail Again', 
            onPress: () => {
              setSelectedLaundryService(service);
              setDeliveryModalVisible(true);
            }
          }
        ]
      );
    }
  };

  const handleDeliverySelection = (type: 'pickup' | 'dropoff') => {
    setDeliveryType(type);
    setIsConfirming(false); // Reset loading state when changing delivery type
    
    // Set default pickup date to tomorrow if pickup is selected
    if (type === 'pickup') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setPickupDate(tomorrow.toISOString().split('T')[0]);
      setPickupTime('09:00');
    }
  };

  const handleConfirmReservation = async () => {
    if (!selectedLaundryService) return;

    // Validate drop-off address if selected
    if (deliveryType === 'dropoff' && !deliveryAddress.trim()) {
      Alert.alert(
        'Address Required',
        'Please enter your delivery address for drop-off service.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate pickup details if selected
    if (deliveryType === 'pickup') {
      if (!pickupDate.trim()) {
        Alert.alert(
          'Pickup Date Required',
          'Please select a pickup date.',
          [{ text: 'OK' }]
        );
        return;
      }
      if (!pickupTime.trim()) {
        Alert.alert(
          'Pickup Time Required',
          'Please select a pickup time.',
          [{ text: 'OK' }]
        );
        return;
      }
      if (!pickupAddress.trim()) {
        Alert.alert(
          'Pickup Address Required',
          'Please enter your pickup address.',
          [{ text: 'OK' }]
        );
        return;
      }
      if (!pickupContactNumber.trim()) {
        Alert.alert(
          'Contact Number Required',
          'Please enter your contact number for pickup coordination.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setIsConfirming(true);
    try {
      // Add to user reservations with pending status and shipping info
      const serviceWithStatus = { 
        ...selectedLaundryService, 
        status: 'pending' as const,
        shippingInfo: {
          deliveryType: deliveryType || 'pickup',
          ...(deliveryType === 'dropoff' && deliveryAddress ? { address: deliveryAddress } : {}),
          ...(deliveryType === 'pickup' ? {
            pickupDate,
            pickupTime,
            pickupAddress,
            pickupContactNumber,
            pickupInstructions: pickupInstructions || 'No special instructions'
          } : {})
        }
      };
      await reserveLaundryService(serviceWithStatus);
      
      // Create admin reservation
      if (user) {
        const adminReservationData = mapServiceToAdminReservation(
          selectedLaundryService,
          'laundry',
          user.uid,
          user.displayName || 'Unknown User',
          user.email || 'No email'
        );
        
        // Add shipping info to admin reservation
        const adminReservationWithShipping = {
          ...adminReservationData,
          shippingInfo: {
            deliveryType: deliveryType || 'pickup',
            ...(deliveryType === 'dropoff' && deliveryAddress ? { address: deliveryAddress } : {}),
            ...(deliveryType === 'pickup' ? {
              pickupDate,
              pickupTime,
              pickupAddress,
              pickupContactNumber,
              pickupInstructions: pickupInstructions || 'No special instructions'
            } : {})
          }
        };
        
        await addAdminReservation(adminReservationWithShipping);

        // Notify admins of new laundry reservation
        await notifyAdmins(
          'New Laundry Reservation',
          `${user.displayName || 'A user'} reserved ${selectedLaundryService.title || 'a laundry service'} (${deliveryType === 'pickup' ? 'Pickup' : 'Drop-off'}).`,
          {
            serviceType: 'laundry',
            serviceId: selectedLaundryService.id,
            userId: user.uid,
            action: 'reserved',
          }
        );
      }
      
      setDetailModalVisible(false);
      setDeliveryModalVisible(false);
      setSelectedLaundryService(null);
      setDeliveryType(null);
      setDeliveryAddress('');
      setPickupDate('');
      setPickupTime('');
      setPickupInstructions('');
      setPickupAddress('');
      setPickupContactNumber('');
      
      // ========================================
      // SUCCESS ALERT - LAUNDRY SERVICE AVAIL
      // ========================================
      // I-display ang success alert pagkatapos ng successful laundry service avail
      // I-inform ang user na successful ang avail ng laundry service
      Alert.alert(
        'Avail Successful!', // Alert title - successful avail
        `You have successfully availed ${selectedLaundryService.title} (${deliveryType === 'pickup' ? 'Pickup' : 'Drop-off'}). You can view your avails in the Bookings tab.`, // Alert message - confirmation ng successful avail with service details
        [
          {
            text: 'View Bookings', // Button text - para sa pag-view ng bookings
            onPress: () => router.push('/(user-tabs)/bookings') // I-navigate sa bookings tab
          }
        ]
      );
    } catch (error) {
      console.error('Error reserving laundry service:', error);
      // ========================================
      // ERROR ALERT - LAUNDRY SERVICE AVAIL FAILED
      // ========================================
      // I-display ang error alert kung nag-fail ang laundry service avail
      // I-inform ang user na hindi na-process ang avail
      Alert.alert(
        'Avail Failed', // Alert title - failed avail
        'Sorry, we couldn\'t process your avail. Please try again.', // Alert message - apology at instruction to try again
        [{ text: 'OK' }] // OK button para sa pag-close ng alert
      );
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle navigation parameters
  useEffect(() => {
    const selectedServiceId = params.selectedServiceId as string;
    const serviceType = params.serviceType as string;
    
    if (selectedServiceId && serviceType === 'laundry') {
      // Check cache first
      const cachedServices = getCachedLaundryServices();
      if (cachedServices) {
        const selectedService = cachedServices.find(service => service.id === selectedServiceId);
        if (selectedService) {
          setSelectedLaundryService(selectedService);
          setDetailModalVisible(true);
        }
        return;
      }
      
      // If not in cache, wait for data to load
      const checkForService = () => {
        const service = laundryServices.find(s => s.id === selectedServiceId);
        if (service) {
          setSelectedLaundryService(service);
          setDetailModalVisible(true);
        }
      };
      
      // Check immediately and also after a short delay
      checkForService();
      setTimeout(checkForService, 1000);
    }
  }, [params.selectedServiceId, params.serviceType, laundryServices]);

  // Fetch laundry services from Firebase or cache
  useEffect(() => {
    const fetchLaundryServices = async () => {
      // Only fetch if user is authenticated and not loading
      if (isLoading) {
        console.log('⏳ Authentication still loading, waiting...');
        return;
      }
      
      if (!user) {
        console.log('⏳ Waiting for user authentication before fetching laundry services...');
        return;
      }

      try {
        // Check cache first
        const cachedServices = getCachedLaundryServices();
        if (cachedServices) {
          console.log('🚀 Using cached laundry services data in laundry list');
          setLaundryServices(cachedServices);
          return;
        }

        console.log('📡 Fetching laundry services from Firebase in laundry list...');
        const laundryServicesData = await getLaundryServices();
        setLaundryServices(laundryServicesData);
        
        // Cache the data for future use
        cacheLaundryServices(laundryServicesData);
      } catch (error) {
        console.error('Error fetching laundry services:', error);
      }
    };
    fetchLaundryServices();
  }, [user, isLoading]); // Add both user and isLoading as dependencies

  const renderFilterButton = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: selectedFilter === item.id ? colorPalette.primary : cardBgColor,
          borderColor: borderColor,
        }
      ]}
      onPress={() => setSelectedFilter(item.id)}
    >
      <ThemedText
        style={[
          styles.filterText,
          { color: selectedFilter === item.id ? '#fff' : textColor }
        ]}
      >
        {item.label}
      </ThemedText>
    </TouchableOpacity>
  );

  // Filter laundry services based on selected filter and search query
  const getFilteredLaundryServices = () => {
    let filteredData = laundryServices;
    
    // Apply category filter
    switch (selectedFilter) {
      case 'wash':
        filteredData = laundryServices.filter(service =>
          service.title.toLowerCase().includes('wash') ||
          service.title.toLowerCase().includes('fold')
        );
        break;
      case 'dry-clean':
        filteredData = laundryServices.filter(service =>
          service.title.toLowerCase().includes('dry cleaning') ||
          service.title.toLowerCase().includes('dry clean')
        );
        break;
      case 'bulk':
        filteredData = laundryServices.filter(service =>
          service.title.toLowerCase().includes('bulk')
        );
        break;
      case 'eco':
        filteredData = laundryServices.filter(service =>
          service.title.toLowerCase().includes('eco') ||
          service.title.toLowerCase().includes('environmental')
        );
        break;
      default:
        filteredData = laundryServices;
    }
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(service =>
        service.title.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.services.some((serviceItem: string) => serviceItem.toLowerCase().includes(query))
      );
    }
    
    return filteredData;
  };

  const renderLaundryItem = ({ item }: { item: any }) => (
    <View
      style={[styles.laundryCard, { backgroundColor: cardBgColor, borderColor }]}
    >
      <RobustImage source={item.image} style={styles.laundryImage} resizeMode="cover" />
      <View style={styles.laundryContent}>
        <View style={styles.laundryHeader}>
          <ThemedText type="subtitle" style={[styles.laundryTitle, { color: textColor }]}>
            {item.title}
          </ThemedText>
        </View>
        
        <ThemedText style={[styles.description, { color: subtitleColor }]}>
          {item.description}
        </ThemedText>
        
        {/* Availability Status */}
        <View style={styles.availabilityRow}>
          <MaterialIcons 
            name={item.available ? "check-circle" : "cancel"} 
            size={16} 
            color={item.available ? "#4CAF50" : "#F44336"} 
          />
          <ThemedText style={[
            styles.availabilityText, 
            { color: item.available ? "#4CAF50" : "#F44336" }
          ]}>
            {item.available ? "Available" : "Unavailable"}
          </ThemedText>
        </View>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <FontAwesome name="money" size={16} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}>
              {formatPHP(item.price)}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="schedule" size={16} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}>
              {item.turnaround}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="local-shipping" size={16} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}>
              {item.pickup}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.servicesContainer}>
          {Array.isArray(item.services) &&
            item.services.map((service: string, index: number) => (
              <View key={index} style={styles.serviceBadge}>
                <ThemedText style={styles.serviceText}>{service}</ThemedText>
              </View>
            ))}
        </View>

        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialIcons name="delivery-dining" size={16} color={subtitleColor} />
            <ThemedText style={[styles.infoText, { color: textColor }]}>
              {item.delivery}
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="scale" size={16} color={subtitleColor} />
            <ThemedText style={[styles.infoText, { color: textColor }]}>
              {item.minOrder}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.priceRow}>
          <ThemedText type="subtitle" style={[styles.priceText, { color: colorPalette.primary }]}>
            {formatPHP(item.price)}
          </ThemedText>
          <TouchableOpacity 
            style={[styles.viewButton, { backgroundColor: colorPalette.primary }]}
            onPress={() => {
              setSelectedLaundryService(item);
              setDetailModalVisible(true);
            }}
          >
            <ThemedText style={styles.viewButtonText}>View Details</ThemedText>
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
          Laundry Services
        </ThemedText>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => setSearchVisible(true)}
        >
          <MaterialIcons name="search" size={24} color={colorPalette.primary} />
        </TouchableOpacity>
      </View>

      {/* Laundry Services List */}
      <FlatList
        data={getFilteredLaundryServices()}
        renderItem={renderLaundryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Search Modal */}
      <Modal
        visible={searchVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSearchVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.searchModal, { backgroundColor: cardBgColor }]}>
            <View style={styles.searchHeader}>
              <ThemedText type="title" style={[styles.searchTitle, { color: textColor }]}>
                Search Laundry Services
              </ThemedText>
              <TouchableOpacity onPress={() => setSearchVisible(false)}>
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.searchInputContainer, { borderColor: borderColor }]}>
              <MaterialIcons name="search" size={20} color={subtitleColor} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Search by service name, description..."
                placeholderTextColor={subtitleColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="clear" size={20} color={subtitleColor} />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.searchResults}>
              <ThemedText style={[styles.resultsText, { color: subtitleColor }]}>
                {getFilteredLaundryServices().length} results found
              </ThemedText>
            </View>
            
            <TouchableOpacity 
              style={[styles.searchButton, { backgroundColor: colorPalette.primary }]}
              onPress={() => setSearchVisible(false)}
            >
              <ThemedText style={styles.searchButtonText}>Done</ThemedText>
            </TouchableOpacity>
          </View>
                 </View>
       </Modal>

       {/* Detail Modal */}
       <Modal
         visible={detailModalVisible}
         animationType="slide"
         transparent={true}
         onRequestClose={() => setDetailModalVisible(false)}
       >
         <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
           <View style={[styles.detailModal, { backgroundColor: cardBgColor }]}>
             {selectedLaundryService && (
               <>
                 <View style={styles.detailHeader}>
                   <ThemedText type="title" style={[styles.detailTitle, { color: textColor }]}>
                     {selectedLaundryService.title}
                   </ThemedText>
                   <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                     <MaterialIcons name="close" size={24} color={textColor} />
                   </TouchableOpacity>
                 </View>
                 
                 <ScrollView 
                   style={styles.detailScrollView}
                   showsVerticalScrollIndicator={false}
                   contentContainerStyle={styles.detailScrollContent}
                 >
                   <TouchableOpacity 
                    onPress={() => handleImagePress(selectedLaundryService.image)}
                    activeOpacity={0.8}
                  >
                    <RobustImage source={selectedLaundryService.image} style={styles.detailImage} resizeMode="cover" />
                    <View style={styles.imageOverlay}>
                      <MaterialIcons name="zoom-in" size={24} color="#fff" />
                    </View>
                  </TouchableOpacity>
                   
                   <View style={styles.detailContent}>
                     <View style={styles.detailRatingRow}>
                       <ThemedText type="subtitle" style={[styles.detailPrice, { color: colorPalette.primary }]}>
                         {formatPHP(selectedLaundryService.price)}
                       </ThemedText>
                     </View>
                     
                     <ThemedText style={[styles.detailDescription, { color: subtitleColor }]}>
                       {selectedLaundryService.description}
                     </ThemedText>
                     
                     <View style={styles.detailSpecs}>
                       <View style={styles.detailItem}>
                         <FontAwesome name="money" size={20} color={subtitleColor} />
                         <ThemedText style={[styles.detailText, { color: textColor }]}>
                           {formatPHP(selectedLaundryService.price)}
                         </ThemedText>
                       </View>
                       <View style={styles.detailItem}>
                         <MaterialIcons name="schedule" size={20} color={subtitleColor} />
                         <ThemedText style={[styles.detailText, { color: textColor }]}>
                           {selectedLaundryService.turnaround}
                         </ThemedText>
                       </View>
                       <View style={styles.detailItem}>
                         <MaterialIcons name="local-shipping" size={20} color={subtitleColor} />
                         <ThemedText style={[styles.detailText, { color: textColor }]}>
                           {selectedLaundryService.pickup}
                         </ThemedText>
                       </View>
                     </View>
                     
                     <View style={styles.servicesSection}>
                       <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
                         Services Included
                       </ThemedText>
                       <View style={styles.servicesGrid}>
                        {selectedLaundryService?.services?.map((service: string, index: number) => (
                          <View key={index} style={styles.serviceItem}>
                            <MaterialIcons name="check-circle" size={16} color={colorPalette.primary} />
                            <ThemedText style={[styles.serviceItemText, { color: subtitleColor }]}>
                              {service}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                     </View>
                     
                     <View style={styles.infoSection}>
                       <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
                         Service Details
                       </ThemedText>
                       <View style={styles.infoGrid}>
                         <View style={styles.infoItem}>
                           <MaterialIcons name="scale" size={16} color={colorPalette.primary} />
                           <ThemedText style={[styles.infoText, { color: subtitleColor }]}>
                             {selectedLaundryService.minOrder}
                           </ThemedText>
                         </View>
                       </View>
                     </View>
                     
                     <View style={styles.detailActions}>
                       <TouchableOpacity
                         style={[styles.contactButton, { backgroundColor: colorPalette.primary }]}
                         onPress={() => handleMessageAdmin(selectedLaundryService)}
                         >
                         <MaterialIcons name="message" size={20} color="#fff" />
                         <ThemedText style={styles.contactButtonText}>Message</ThemedText>
                       </TouchableOpacity>
                        <TouchableOpacity 
                        style={[
                          styles.bookButton,
                          {
                            borderColor: selectedLaundryService.available ? colorPalette.primary : '#ccc',
                            backgroundColor: (() => {
                              if (!selectedLaundryService.available) return '#f5f5f5';
                              const match = reservedLaundryServices.find(s => (s as any).serviceId === selectedLaundryService.id);
                              const status = (match as any)?.status;
                              const active = status === 'pending' || status === 'confirmed';
                              return active ? colorPalette.primary : 'transparent';
                            })(),
                            opacity: selectedLaundryService.available ? 1 : 0.6,
                          },
                        ]}
                        onPress={() => selectedLaundryService.available ? handleLaundryReservation(selectedLaundryService) : null}
                        disabled={!selectedLaundryService.available}
                      >
                        {(() => {
                          if (!selectedLaundryService.available) {
                            return (
                              <MaterialIcons
                                name="cancel"
                                size={20}
                                color="#999"
                              />
                            );
                          }
                          const match = reservedLaundryServices.find(s => (s as any).serviceId === selectedLaundryService.id);
                          const status = (match as any)?.status;
                          const active = status === 'pending' || status === 'confirmed';
                          return (
                            <MaterialIcons
                              name={active ? 'check-circle' : 'bookmark-border'}
                              size={20}
                              color={active ? '#fff' : colorPalette.primary}
                            />
                          );
                        })()}
                        {!selectedLaundryService.available ? (
                          <View style={styles.unavailableContainer}>
                            <MaterialIcons name="block" size={16} color="#fff" />
                            <ThemedText style={styles.unavailableText}>UNAVAILABLE</ThemedText>
                          </View>
                        ) : (
                          <ThemedText
                            style={[
                              styles.bookButtonText,
                              (() => {
                                const match = reservedLaundryServices.find(s => (s as any).serviceId === selectedLaundryService.id);
                                const status = (match as any)?.status;
                                const active = status === 'pending' || status === 'confirmed';
                                return { color: active ? '#fff' : colorPalette.primary };
                              })(),
                            ]}
                          >
                            {(() => {
                              const match = reservedLaundryServices.find(s => (s as any).serviceId === selectedLaundryService.id);
                              const status = (match as any)?.status;
                              const active = status === 'pending' || status === 'confirmed';
                              return active ? 'Availed' : 'Avail';
                            })()}
                          </ThemedText>
                        )}
                       </TouchableOpacity>
                     </View>
                   </View>
                 </ScrollView>
               </>
             )}
           </View>
         </View>
        </Modal>
        
        {/* Delivery Options Modal */}
        <Modal
          visible={deliveryModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => {
            setDeliveryModalVisible(false);
            setIsConfirming(false);
          }}
        >
          <KeyboardAvoidingView 
            style={[styles.deliveryModal, { backgroundColor: cardBgColor }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView 
              ref={scrollViewRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.deliveryHeader}>
                <ThemedText type="title" style={[styles.deliveryTitle, { color: textColor }]}>
                  Choose Delivery Method
                </ThemedText>
                <TouchableOpacity onPress={() => {
                  setDeliveryModalVisible(false);
                  setIsConfirming(false);
                }}>
                  <MaterialIcons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>
              
              <ThemedText style={[styles.deliverySubtitle, { color: subtitleColor }]}>
                How would you like to receive this laundry service?
              </ThemedText>
              
              <View style={{ gap: 16 }}>
                <TouchableOpacity
                  style={[
                    styles.deliveryOption, 
                    { 
                      backgroundColor: deliveryType === 'pickup' ? colorPalette.primary : cardBgColor, 
                      borderColor: deliveryType === 'pickup' ? colorPalette.primary : borderColor,
                      borderWidth: deliveryType === 'pickup' ? 3 : 1
                    }
                  ]}
                  onPress={() => handleDeliverySelection('pickup')}
                >
                  <MaterialIcons name="local-shipping" size={32} color={deliveryType === 'pickup' ? '#fff' : colorPalette.primary} />
                  <ThemedText type="subtitle" style={[styles.deliveryOptionTitle, { color: deliveryType === 'pickup' ? '#fff' : textColor }]}>
                    Pick Up Service
                  </ThemedText>
                  <ThemedText style={[styles.deliveryOptionDesc, { color: deliveryType === 'pickup' ? 'rgba(255,255,255,0.9)' : subtitleColor }]}>
                    We'll collect your laundry from your location at your preferred time
                  </ThemedText>
                  <View style={styles.pickupFeatures}>
                    <View style={styles.featureItem}>
                      <MaterialIcons name="schedule" size={16} color={deliveryType === 'pickup' ? '#fff' : colorPalette.primary} />
                      <ThemedText style={[styles.featureText, { color: deliveryType === 'pickup' ? 'rgba(255,255,255,0.9)' : subtitleColor }]}>
                        Flexible scheduling
                      </ThemedText>
                    </View>
                    <View style={styles.featureItem}>
                      <MaterialIcons name="home" size={16} color={deliveryType === 'pickup' ? '#fff' : colorPalette.primary} />
                      <ThemedText style={[styles.featureText, { color: deliveryType === 'pickup' ? 'rgba(255,255,255,0.9)' : subtitleColor }]}>
                        Door-to-door service
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.deliveryOption, 
                    { 
                      backgroundColor: deliveryType === 'dropoff' ? colorPalette.primary : cardBgColor, 
                      borderColor: deliveryType === 'dropoff' ? colorPalette.primary : borderColor,
                      borderWidth: deliveryType === 'dropoff' ? 3 : 1
                    }
                  ]}
                  onPress={() => handleDeliverySelection('dropoff')}
                >
                  <MaterialIcons name="store" size={32} color={deliveryType === 'dropoff' ? '#fff' : colorPalette.primary} />
                  <ThemedText type="subtitle" style={[styles.deliveryOptionTitle, { color: deliveryType === 'dropoff' ? '#fff' : textColor }]}>
                    Drop Off Service
                  </ThemedText>
                  <ThemedText style={[styles.deliveryOptionDesc, { color: deliveryType === 'dropoff' ? 'rgba(255,255,255,0.9)' : subtitleColor }]}>
                    Bring your laundry to our service location
                  </ThemedText>
                </TouchableOpacity>
              </View>
              
              {/* Address Input for Drop Off */}
              {deliveryType === 'dropoff' && (
                <View style={styles.addressSection}>
                  <ThemedText style={[styles.addressLabel, { color: textColor }]}>
                    Delivery Address *
                  </ThemedText>
                  <TextInput
                    style={[styles.addressInput, { color: textColor, borderColor }]}
                    value={deliveryAddress}
                    onChangeText={setDeliveryAddress}
                    placeholder="Enter your complete address..."
                    placeholderTextColor={subtitleColor}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              )}

              {/* Pickup Scheduling for Pick Up Service */}
              {deliveryType === 'pickup' && (
                <View style={styles.pickupSection}>
                  <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                    Pickup Details
                  </ThemedText>
                  
                  <View style={styles.pickupRow}>
                    <View style={styles.pickupField}>
                      <ThemedText style={[styles.fieldLabel, { color: textColor }]}>
                        Pickup Date *
                      </ThemedText>
                      <TextInput
                        style={[styles.pickupInput, { color: textColor, borderColor }]}
                        value={pickupDate}
                        onChangeText={setPickupDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={subtitleColor}
                      />
                    </View>
                    
                    <View style={styles.pickupField}>
                      <ThemedText style={[styles.fieldLabel, { color: textColor }]}>
                        Pickup Time *
                      </ThemedText>
                      <TextInput
                        style={[styles.pickupInput, { color: textColor, borderColor }]}
                        value={pickupTime}
                        onChangeText={setPickupTime}
                        placeholder="HH:MM"
                        placeholderTextColor={subtitleColor}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.pickupAddressSection}>
                    <ThemedText style={[styles.fieldLabel, { color: textColor }]}>
                      Pickup Address *
                    </ThemedText>
                    <TextInput
                      style={[styles.pickupAddressInput, { color: textColor, borderColor }]}
                      value={pickupAddress}
                      onChangeText={setPickupAddress}
                      placeholder="Enter your complete pickup address..."
                      placeholderTextColor={subtitleColor}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                  
                  <View style={styles.pickupContactSection}>
                    <ThemedText style={[styles.fieldLabel, { color: textColor }]}>
                      Contact Number *
                    </ThemedText>
                    <TextInput
                      style={[styles.pickupInput, { color: textColor, borderColor }]}
                      value={pickupContactNumber}
                      onChangeText={setPickupContactNumber}
                      placeholder="Enter your contact number"
                      placeholderTextColor={subtitleColor}
                      keyboardType="phone-pad"
                    />
                  </View>
                  
                  <View style={styles.instructionsSection}>
                    <ThemedText style={[styles.fieldLabel, { color: textColor }]}>
                      Special Instructions (Optional)
                    </ThemedText>
                    <TextInput
                      ref={instructionsInputRef}
                      style={[styles.instructionsInput, { color: textColor, borderColor }]}
                      value={pickupInstructions}
                      onChangeText={setPickupInstructions}
                      onFocus={handleInstructionsFocus}
                      placeholder="Any special instructions for pickup (e.g., gate code, specific location, contact person)..."
                      placeholderTextColor={subtitleColor}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      returnKeyType="done"
                      blurOnSubmit={true}
                    />
                  </View>
                  
                  <View style={styles.pickupInfo}>
                    <MaterialIcons name="info" size={16} color={colorPalette.primary} />
                    <ThemedText style={[styles.pickupInfoText, { color: subtitleColor }]}>
                      Our team will contact you 30 minutes before pickup to confirm details
                    </ThemedText>
                  </View>
                </View>
              )}
              
              <View style={styles.deliveryActions}>
                <TouchableOpacity 
                  style={[styles.cancelButton, { borderColor }]}
                  onPress={() => {
                    setDeliveryModalVisible(false);
                    setDeliveryType(null);
                    setDeliveryAddress('');
                    setPickupDate('');
                    setPickupTime('');
                    setPickupInstructions('');
                    setPickupAddress('');
                    setPickupContactNumber('');
                    setIsConfirming(false);
                  }}
                >
                  <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.confirmButton, { backgroundColor: colorPalette.primary }]}
                  onPress={handleConfirmReservation}
                  disabled={!deliveryType || isConfirming}
                >
                  <ThemedText style={styles.confirmButtonText}>
                    {isConfirming ? 'Confirming...' : 'Confirm'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

        {/* Full Screen Image Viewer */}
        <FullScreenImageViewer
          visible={imageViewerVisible}
          imageSource={selectedImage || ''}
          onClose={() => setImageViewerVisible(false)}
          title="Laundry Service Image"
        />
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
    justifyContent: 'space-between',
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
  },
  searchButton: {
    padding: 4,
  },
  filtersContainer: {
    paddingVertical: 16,
  },
  filtersList: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
  },
  laundryCard: {
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  laundryImage: {
    width: '100%',
    height: 180,
  },
  laundryContent: {
    padding: 16,
  },
  laundryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  laundryTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  availabilityText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: normalize(16),
    marginBottom: normalize(8),
    flex: isTablet ? 1 : 0,
  },
  detailText: {
    marginLeft: normalize(4),
    fontSize: normalize(isTablet ? 15 : 14),
    flex: 1,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  serviceBadge: {
    backgroundColor: 'rgba(0, 178, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  serviceText: {
    color: colorPalette.primary,
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    marginLeft: 4,
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scheduleButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  viewButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: normalize(8),
    paddingTop: normalize(40),
    paddingBottom: normalize(40),
  },
  searchModal: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  searchResults: {
    marginBottom: 20,
  },
  resultsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  detailModal: {
    width: '100%',
    borderRadius: normalize(isTablet ? 20 : 16),
    maxHeight: '90%',
    overflow: 'hidden',
    maxWidth: isTablet ? wp(80) : wp(95),
  },
  detailScrollView: {
    // flex: 1, // Removed to fix modal content visibility
  },
  detailScrollContent: {
    paddingBottom: normalize(20),
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: normalize(isTablet ? 24 : 20),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailTitle: {
    fontSize: normalize(isTablet ? 20 : 18),
    fontWeight: '600',
    flex: 1,
    marginRight: normalize(12),
  },
  detailImage: {
    width: '100%',
    height: normalize(isTablet ? 300 : 250),
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  detailContent: {
    padding: normalize(isTablet ? 24 : 20),
  },
  detailRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(16),
  },
  detailPrice: {
    fontSize: normalize(isTablet ? 22 : 20),
    fontWeight: 'bold',
  },
  detailDescription: {
    fontSize: normalize(isTablet ? 18 : 16),
    lineHeight: normalize(isTablet ? 28 : 24),
    marginBottom: normalize(20),
  },
  detailSpecs: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: isTablet ? 'space-between' : 'flex-start',
    marginBottom: normalize(24),
    gap: normalize(12),
  },
  servicesSection: {
    marginBottom: normalize(24),
  },
  infoSection: {
    marginBottom: normalize(24),
  },
  sectionTitle: {
    fontSize: normalize(isTablet ? 18 : 16),
    fontWeight: '600',
    marginBottom: normalize(12),
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(8),
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(8),
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: isTablet ? '33%' : '50%',
    marginBottom: normalize(8),
    minWidth: isSmallScreen ? wp(45) : wp(40),
  },
  serviceItemText: {
    marginLeft: normalize(8),
    fontSize: normalize(isTablet ? 15 : 14),
    flex: 1,
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: normalize(12),
    alignItems: 'stretch',
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: normalize(12),
    paddingVertical: normalize(isTablet ? 14 : 12),
    paddingHorizontal: normalize(isTablet ? 20 : 16),
    minHeight: normalize(isTablet ? 48 : 44),
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: normalize(isTablet ? 16 : 14),
    marginLeft: normalize(8),
  },
  bookButton: {
    flex: 1,
    borderRadius: normalize(12),
    paddingVertical: normalize(isTablet ? 14 : 12),
    paddingHorizontal: normalize(isTablet ? 20 : 16),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: normalize(isTablet ? 48 : 44),
  },
  bookButtonText: {
    fontWeight: 'bold',
    fontSize: normalize(isTablet ? 16 : 14),
  },
  unavailableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  unavailableText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: normalize(isTablet ? 14 : 12),
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  deliveryModal: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 0,
    padding: 20,
    paddingTop: 60,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  deliverySubtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
 
  deliveryOption: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 20,
  },
  deliveryOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  deliveryOptionDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
  addressSection: {
    marginTop: 20,
    marginBottom: 32,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  addressInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  deliveryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickupFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 178, 255, 0.2)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  featureText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  pickupSection: {
    marginTop: 20,
    marginBottom: 32,
  },
  pickupRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pickupField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickupInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  instructionsSection: {
    marginBottom: 16,
  },
  instructionsInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  pickupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 178, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colorPalette.primary,
  },
  pickupInfoText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  pickupAddressSection: {
    marginBottom: 16,
  },
  pickupAddressInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  pickupContactSection: {
    marginBottom: 16,
  },
});