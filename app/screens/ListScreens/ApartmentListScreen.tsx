import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { push, ref, set } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { FullScreenImageViewer } from '../../components/FullScreenImageViewer';
import { PaymentModal } from '../../components/PaymentModal';
import { RobustImage } from '../../components/RobustImage';
import { APARTMENT_ADMIN } from '../../config/adminConfig';
import { useAdminReservation } from '../../contexts/AdminReservationContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { useReservation } from '../../contexts/ReservationContext';
import { db } from '../../firebaseConfig';
import { getApartmentsWithBedStats, reserveBedInApartment, type Bed } from '../../services/apartmentService';
import {
    cacheApartments,
    getCachedApartments
} from '../../services/dataCache';
import { notifyAdminByEmail, notifyAdmins } from '../../services/notificationService';
import { PaymentData, isPaymentRequired } from '../../services/paymentService';
import { getAdminReservations } from '../../services/reservationService';
import { formatPHP } from '../../utils/currency';
import { getImageSource } from '../../utils/imageUtils';
import { mapServiceToAdminReservation, parsePrice } from '../../utils/reservationUtils';
import { isSmallScreen, isTablet, normalize, wp } from '../../utils/responsiveUtils';
const placeholderImage = require("../../../assets/images/apartment1.webp");


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

export default function ApartmentListScreen() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isDark = colorScheme === 'dark';
  
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<any>(null);
  const [apartments, setApartments] = useState<any[]>([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [pendingReservation, setPendingReservation] = useState<any>(null);
  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'dropoff' | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [globalReservations, setGlobalReservations] = useState<any[]>([]);
  const [apartmentBeds, setApartmentBeds] = useState<Bed[]>([]);
  const [bedSelectionVisible, setBedSelectionVisible] = useState(false);
  const [selectedApartmentForBed, setSelectedApartmentForBed] = useState<any>(null);
  const [dateSelectionVisible, setDateSelectionVisible] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { reservedApartments, reserveApartment, removeReservation } = useReservation();
  const { addAdminReservation } = useAdminReservation();
  const { user } = useAuthContext();

  // Fetch apartments from Firebase or cache
  useEffect(() => {
    const fetchApartments = async () => {
      try {
        // Check cache first
        const cachedApartments = getCachedApartments();
        if (cachedApartments) {
          console.log('🚀 Using cached apartments data in apartment list');
          setApartments(cachedApartments);
          
          // Check if we need to show a specific apartment
          const selectedApartmentId = params.selectedApartmentId as string;
          if (selectedApartmentId) {
            const selectedApartment = cachedApartments.find(apt => apt.id === selectedApartmentId);
            if (selectedApartment) {
              setSelectedApartment(selectedApartment);
              setDetailModalVisible(true);
            }
          }
          return;
        }

        console.log('📡 Fetching apartments from Firebase in apartment list...');
        const apartmentsData = await getApartmentsWithBedStats();
        setApartments(apartmentsData);
        
        // Cache the data for future use
        cacheApartments(apartmentsData);
        
        // Check if we need to show a specific apartment
        const selectedApartmentId = params.selectedApartmentId as string;
        if (selectedApartmentId) {
          const selectedApartment = apartmentsData.find(apt => apt.id === selectedApartmentId);
          if (selectedApartment) {
            setSelectedApartment(selectedApartment);
            setDetailModalVisible(true);
          }
        }
      } catch (error) {
        console.error('Error fetching apartments:', error);
      }
    };
    fetchApartments();
  }, []);

  // Load global reservations to check apartment availability
  useEffect(() => {
    const loadGlobalReservations = async () => {
      try {
        const adminReservations = await getAdminReservations();
        setGlobalReservations(adminReservations);
      } catch (error) {
        console.error('Error loading global reservations:', error);
      }
    };
    
    if (apartments.length > 0) {
      loadGlobalReservations();
    }
  }, [apartments]);

  const handleImagePress = (imageSource: string) => {
    setSelectedImage(imageSource);
    setImageViewerVisible(true);
  };

  // Helper function to check if apartment is reserved by another user
  const isApartmentReservedByOtherUser = (apartmentId: string) => {
    const globalReservation = globalReservations.find(reservation => 
      reservation.serviceType === 'apartment' && 
      reservation.serviceId === apartmentId && 
      (reservation.status === 'pending' || reservation.status === 'confirmed')
    );
    
    // Check if it's reserved by someone other than current user
    return globalReservation && globalReservation.userId !== user?.uid;
  };

  // Helper function to check if apartment is available for reservation
  const isApartmentAvailable = (apartmentId: string) => {
    // Check if apartment is marked as unavailable
    const apartment = apartments.find(apt => apt.id === apartmentId);
    if (!apartment?.available) return false;
    
    // Check if it's reserved by another user
    if (isApartmentReservedByOtherUser(apartmentId)) return false;
    
    // For apartments with bed management, check if there are available beds
    if (apartment.bedManagement) {
      const availableBeds = apartment.availableBeds || 0;
      return availableBeds > 0;
    }
    
    return true;
  };

  const handleMessageAdmin = async (apartment: any) => {
    try {
      if (!user?.email) return;
      const ADMIN_EMAIL = APARTMENT_ADMIN.email;
      const ADMIN_NAME = APARTMENT_ADMIN.name;
      const chatId = [user.email, ADMIN_EMAIL].sort().join('_');

      const priceText = typeof apartment?.price !== 'undefined' ? `Price: ${formatPHP(apartment.price)}` : '';
      const messageText = `I'm interested in Apartment: ${apartment?.title || 'Apartment'}\n${priceText}\nLocation: ${apartment?.location || 'N/A'}`;

      const newMsgRef = push(ref(db, 'messages'));
      await set(newMsgRef, {
        id: newMsgRef.key,
        chatId,
        text: messageText,
        image: apartment?.image || null,
        imageUrl: apartment?.image || null, // Add imageUrl for consistency
        category: 'apartment',
        serviceId: apartment?.id || null,
        senderEmail: user.email,
        senderName: user.displayName || 'User',
        recipientEmail: ADMIN_EMAIL,
        recipientName: ADMIN_NAME,
        timestamp: Date.now(),
        time: Date.now(),
        messageType: 'apartment_inquiry', // Add message type
        apartmentTitle: apartment?.title || 'Apartment',
        apartmentPrice: apartment?.price || 0,
        apartmentLocation: apartment?.location || 'N/A',
      });

      // Send push notification to admin
      try {
        await notifyAdminByEmail(
          ADMIN_EMAIL,
          'New apartment inquiry',
          `User interested in: ${apartment?.title || 'Apartment'}`,
          {
            type: 'apartment_inquiry',
            chatId: chatId,
            senderEmail: user.email,
            senderName: user.displayName || 'User',
            serviceId: apartment?.id || null,
            apartmentTitle: apartment?.title || 'Apartment',
            apartmentImage: apartment?.image || null,
            apartmentPrice: apartment?.price || 0,
            apartmentLocation: apartment?.location || 'N/A'
          }
        );
      } catch (notificationError) {
        console.warn('Failed to send push notification for apartment inquiry:', notificationError);
        // Don't fail the message send if notification fails
      }

      setDetailModalVisible(false);
      router.push(`/chat/${encodeURIComponent(chatId)}?recipientName=${encodeURIComponent(ADMIN_NAME)}&recipientEmail=${encodeURIComponent(ADMIN_EMAIL)}&currentUserEmail=${encodeURIComponent(user.email)}`);
    } catch (e) {
      console.error('Error sending interest message:', e);
    }
  };

  const handleReservation = async (apartment: any) => {
    // Check if apartment uses bed management
    if (apartment.bedManagement) {
      // Load available beds for this apartment from embedded beds
      try {
        const availableBeds = apartment.beds ? apartment.beds.filter((bed: Bed) => bed.status === 'available') : [];
        if (availableBeds.length === 0) {
          Alert.alert(
            'No Available Beds',
            'This apartment has no available beds. Please choose another apartment or check back later.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Show bed selection modal
        setSelectedApartmentForBed(apartment);
        setApartmentBeds(availableBeds);
        setBedSelectionVisible(true);
        setDetailModalVisible(false);
        setSelectedApartment(null);
      } catch (error) {
        console.error('Error loading beds:', error);
        Alert.alert('Error', 'Failed to load bed information. Please try again.');
      }
      return;
    }

    // Check if apartment is available for reservation (non-bed management)
    if (!isApartmentAvailable(apartment.id)) {
      if (isApartmentReservedByOtherUser(apartment.id)) {
        Alert.alert(
          'Apartment Already Reserved',
          'This apartment has been reserved by someone else. Please choose another apartment or check back later.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Service Unavailable',
          'This apartment is currently unavailable for reservation. Please try again later or contact the admin.',
          [{ text: 'OK' }]
        );
      }
      return;
    }

    const isReserved = reservedApartments.some(a => (a as any).serviceId === apartment.id);
    if (!isReserved) {
      // Check if payment is required for apartment reservations
      if (isPaymentRequired('apartment')) {
        // Store the apartment data for payment flow
        setPendingReservation(apartment);
        setPaymentModalVisible(true);
        setDetailModalVisible(false);
        setSelectedApartment(null);
      } else {
        // Proceed with regular reservation flow
        await processReservation(apartment);
      }
    } else {
      try {
        await removeReservation(apartment.id);
        Alert.alert(
          'Reservation Cancelled',
          'Your reservation has been cancelled.',
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('Error removing reservation:', error);
        Alert.alert(
          'Error',
          'Failed to cancel reservation. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // Handle bed selection (shows date picker)
  const handleBedSelection = (bed: Bed) => {
    setSelectedBed(bed);
    setSelectedDate(new Date());
    setBedSelectionVisible(false);
    setDateSelectionVisible(true);
  };

  // Handle date selection
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  // Handle bed reservation with date
  const handleBedReservation = async (bed: Bed, reservationDate: Date) => {
    if (!user || !selectedApartmentForBed) return;

    // Check if payment is required for apartment reservations
    if (isPaymentRequired('apartment')) {
      // Store the bed and apartment data for payment flow
      const bedReservationData = {
        ...selectedApartmentForBed,
        bedId: bed.id,
        bedNumber: bed.bedNumber,
        reservationDate: reservationDate.toISOString(),
        bedPrice: bed.price || selectedApartmentForBed.price
      };
      setPendingReservation(bedReservationData);
      setPaymentModalVisible(true);
      setDateSelectionVisible(false);
      setSelectedApartmentForBed(null);
      setApartmentBeds([]);
      setSelectedBed(null);
      return;
    }

    // Proceed with direct reservation if payment not required
    await processBedReservation(bed, reservationDate);
  };

  // Process bed reservation (used for both payment and non-payment flows)
  const processBedReservation = async (bed: Bed, reservationDate: Date) => {
    if (!user || !selectedApartmentForBed) return;

    try {
      // Reserve the bed using apartment service
      await reserveBedInApartment(selectedApartmentForBed.id, bed.id, user.uid);
      
      // Create admin reservation for the bed
      const adminReservationData = mapServiceToAdminReservation(
        { ...selectedApartmentForBed, bedId: bed.id, bedNumber: bed.bedNumber, reservationDate: reservationDate.toISOString() },
        'apartment',
        user.uid,
        user.displayName || 'Unknown User',
        user.email || 'No email'
      );
      await addAdminReservation(adminReservationData);

      // Notify admins of new bed reservation
      await notifyAdmins(
        'New Bed Reservation',
        `${user.displayName || 'A user'} reserved Bed ${bed.bedNumber} in ${selectedApartmentForBed.title}.`,
        {
          serviceType: 'apartment',
          serviceId: selectedApartmentForBed.id,
          bedId: bed.id,
          userId: user.uid,
          action: 'reserved',
        }
      );

      setBedSelectionVisible(false);
      setDateSelectionVisible(false);
      setSelectedApartmentForBed(null);
      setApartmentBeds([]);
      setSelectedBed(null);

      // Show success message
      const formattedDate = reservationDate.toLocaleDateString();
      Alert.alert(
        'Bed Reservation Successful!',
        `You have successfully reserved Bed ${bed.bedNumber} in ${selectedApartmentForBed.title} for ${formattedDate}. You can view your reservations in the Bookings tab.`,
        [
          {
            text: 'View Bookings',
            onPress: () => router.push('/(user-tabs)/bookings')
          }
        ]
      );
    } catch (error) {
      console.error('Error reserving bed:', error);
      Alert.alert(
        'Reservation Failed',
        'Sorry, we couldn\'t process your bed reservation. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const processReservation = async (apartment: any) => {
    try {
      // Add to user reservations with pending status
      const apartmentWithStatus = { ...apartment, status: 'pending' as const };
      await reserveApartment(apartmentWithStatus);
      
      // Create admin reservation
      if (user) {
        const adminReservationData = mapServiceToAdminReservation(
          apartment,
          'apartment',
          user.uid,
          user.displayName || 'Unknown User',
          user.email || 'No email'
        );
        await addAdminReservation(adminReservationData);

        // Notify admins of new reservation
        await notifyAdmins(
          'New Apartment Reservation',
          `${user.displayName || 'A user'} reserved ${apartment.title || 'an apartment'}.`,
          {
            serviceType: 'apartment',
            serviceId: apartment.id,
            userId: user.uid,
            action: 'reserved',
          }
        );
      }
      
      // Show success message and redirect to bookings
      Alert.alert(
        'Reservation Successful!',
        `You have successfully reserved ${apartment.title}. You can view your reservations in the Bookings tab.`,
        [
          {
            text: 'View Bookings',
            onPress: () => router.push('/(user-tabs)/bookings')
          }
        ]
      );
    } catch (error) {
      console.error('Error reserving apartment:', error);
      Alert.alert(
        'Reservation Failed',
        'Sorry, we couldn\'t process your reservation. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePaymentSuccess = async (payment: PaymentData) => {
    if (!pendingReservation || !user) return;

    try {
      // Check if this is a bed reservation or regular apartment reservation
      if (pendingReservation.bedId) {
        // Process bed reservation after successful payment
        await processBedReservation(
          {
            id: pendingReservation.bedId,
            bedNumber: pendingReservation.bedNumber,
            price: pendingReservation.bedPrice,
            status: 'available',
            image: '',
            description: '',
            amenities: []
          },
          new Date(pendingReservation.reservationDate)
        );
      } else {
        // Process regular apartment reservation after successful payment
        await processReservation(pendingReservation);
      }
      
      // Reset payment modal state
      setPaymentModalVisible(false);
      setPendingReservation(null);
      
      // ========================================
      // SUCCESS ALERT - RESERVATION
      // ========================================
      // I-display ang success alert pagkatapos ng successful payment at reservation
      // I-inform ang user na successful ang payment at reservation
      const isBedReservation = pendingReservation.bedId;
      const reservationType = isBedReservation ? 'bed' : 'apartment';
      const bedInfo = isBedReservation ? ` Bed ${pendingReservation.bedNumber}` : '';
      
      Alert.alert(
        'Payment & Reservation Successful!', // Alert title - successful payment at reservation
        `Your payment has been confirmed and your${bedInfo} reservation has been submitted! You can view your reservations in the Bookings tab.`, // Alert message - confirmation ng payment at reservation
        [
          {
            text: 'View Bookings', // Button text - para sa pag-view ng bookings
            onPress: () => router.push('/(user-tabs)/bookings') // I-navigate sa bookings tab
          }
        ]
      );
    } catch (error) {
      console.error('Error processing reservation after payment:', error);
      // ========================================
      // ERROR ALERT - APARTMENT RESERVATION ERROR
      // ========================================
      // I-display ang error alert kung may error sa reservation processing
      // I-inform ang user na may error sa reservation pero successful ang payment
      Alert.alert(
        'Reservation Error', // Alert title - reservation error
        'Payment was successful but there was an error processing your reservation. Please contact support.', // Alert message - payment successful pero may error sa reservation
        [{ text: 'OK' }] // OK button para sa pag-close ng alert
      );
    }
  };

  const handlePaymentClose = () => {
    setPaymentModalVisible(false);
    setPendingReservation(null);
  };

  // Handle navigation parameters - removed duplicate params declaration

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

  // Filter apartments based on selected filter and search query
  const getFilteredApartments = () => {
    let filteredData = apartments;
    
    // Apply category filter
    switch (selectedFilter) {
      case 'studio':
        filteredData = apartments.filter(apt => 
          apt.title?.toLowerCase().includes('studio') ||
          apt.type?.toLowerCase().includes('studio')
        );
        break;
      case '1bed':
        filteredData = apartments.filter(apt => 
          apt.title?.toLowerCase().includes('1-bedroom') || 
          apt.title?.toLowerCase().includes('1 bedroom') ||
          apt.bedrooms === 1
        );
        break;
      case '2bed':
        filteredData = apartments.filter(apt => 
          apt.title?.toLowerCase().includes('2-bedroom') || 
          apt.title?.toLowerCase().includes('2 bedroom') ||
          apt.bedrooms === 2
        );
        break;
      case 'luxury':
        filteredData = apartments.filter(apt => 
          apt.title?.toLowerCase().includes('luxury') || 
          apt.title?.toLowerCase().includes('premium') || 
          apt.title?.toLowerCase().includes('executive') ||
          apt.amenities?.some((a: string) => a.toLowerCase().includes('luxury'))
        );
        break;
      default:
        filteredData = apartments;
    }
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(apt => 
        apt.title?.toLowerCase().includes(query) ||
        apt.description?.toLowerCase().includes(query) ||
        apt.location?.toLowerCase().includes(query) ||
        apt.amenities?.some((a: string) => a.toLowerCase().includes(query))
      );
    }
    
    return filteredData;
  };

  // Function to get image source from Firebase data
  const getApartmentImageSource = (apartment: any) => {
    return getImageSource(apartment.image);
  };

  const renderApartmentItem = ({ item }: { item: any }) => (
    <View
      style={[styles.apartmentCard, { backgroundColor: cardBgColor, borderColor }]}
    >
      <RobustImage source={item.image} style={styles.apartmentImage} resizeMode="cover" />
      <View style={styles.apartmentContent}>
        <View style={styles.apartmentHeader}>
          <ThemedText type="subtitle" style={[styles.apartmentTitle, { color: textColor }]}>
            {item.title || 'Apartment'}
          </ThemedText>
        </View>
        
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={16} color={colorPalette.primary} />
          <ThemedText style={[styles.locationText, { color: subtitleColor }]}>
            {item.location || 'Location not specified'}
          </ThemedText>
        </View>
        
        {/* Availability Status */}
        <View style={styles.availabilityRow}>
          {(() => {
            // Check if apartment uses bed management
            if (item.bedManagement) {
              const availableBeds = item.availableBeds || 0;
              const totalBeds = item.totalBeds || 0;
              const occupiedBeds = item.occupiedBeds || 0;
              
              if (availableBeds > 0) {
                return (
                  <>
                    <MaterialIcons 
                      name="bed" 
                      size={16} 
                      color="#4CAF50" 
                    />
                    <ThemedText style={[
                      styles.availabilityText, 
                      { color: "#4CAF50" }
                    ]}>
                      {availableBeds} of {totalBeds} beds available
                    </ThemedText>
                  </>
                );
              } else {
                return (
                  <>
                    <MaterialIcons 
                      name="bed" 
                      size={16} 
                      color="#F44336" 
                    />
                    <ThemedText style={[
                      styles.availabilityText, 
                      { color: "#F44336" }
                    ]}>
                      All beds occupied
                    </ThemedText>
                  </>
                );
              }
            } else {
              // Regular apartment availability check
              const isReservedByOther = isApartmentReservedByOtherUser(item.id);
              const isAvailable = isApartmentAvailable(item.id);
              
              if (isReservedByOther) {
                return (
                  <>
                    <MaterialIcons 
                      name="person-pin" 
                      size={16} 
                      color="#FF9800" 
                    />
                    <ThemedText style={[
                      styles.availabilityText, 
                      { color: "#FF9800" }
                    ]}>
                      Reserved
                    </ThemedText>
                  </>
                );
              } else if (isAvailable) {
                return (
                  <>
                    <MaterialIcons 
                      name="check-circle" 
                      size={16} 
                      color="#4CAF50" 
                    />
                    <ThemedText style={[
                      styles.availabilityText, 
                      { color: "#4CAF50" }
                    ]}>
                      Available
                    </ThemedText>
                  </>
                );
              } else {
                return (
                  <>
                    <MaterialIcons 
                      name="cancel" 
                      size={16} 
                      color="#F44336" 
                    />
                    <ThemedText style={[
                      styles.availabilityText, 
                      { color: "#F44336" }
                    ]}>
                      Unavailable
                    </ThemedText>
                  </>
                );
              }
            }
          })()}
        </View>
        
        <ThemedText style={[styles.description, { color: subtitleColor }]}>
          {item.description || 'No description available'}
        </ThemedText>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <MaterialIcons name="bed" size={16} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}>
              {item.bedrooms || 'N/A'} bed
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="bathtub" size={16} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}>
              {item.bathrooms || 'N/A'} bath
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="square-foot" size={16} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}>
              {item.size || 'N/A'} sqft
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.amenitiesContainer}>
          {item.amenities?.slice(0, 3).map((amenity: string, index: number) => (
            <View key={index} style={styles.amenityBadge}>
              <ThemedText style={styles.amenityText}>{amenity}</ThemedText>
            </View>
          ))}
          {item.amenities && item.amenities.length > 3 && (
            <ThemedText style={[styles.moreAmenities, { color: subtitleColor }]}>
              +{item.amenities.length - 3} more
            </ThemedText>
          )}
        </View>
        
        <View style={styles.priceRow}>
          <ThemedText type="subtitle" style={[styles.priceText, { color: colorPalette.primary }]}>
            {formatPHP(item.price || '0')}
          </ThemedText>
          <TouchableOpacity 
            style={[
              styles.viewButton, 
              { 
                backgroundColor: (() => {
                  if (isApartmentReservedByOtherUser(item.id)) return '#FF9800';
                  if (item.bedManagement && (item.availableBeds || 0) === 0) return '#F44336';
                  return colorPalette.primary;
                })(),
                opacity: (item.bedManagement && (item.availableBeds || 0) === 0) ? 0.7 : 1
              }
            ]}
            onPress={() => {
              setSelectedApartment(item);
              setDetailModalVisible(true);
            }}
          >
            <ThemedText style={styles.viewButtonText}>
              {(() => {
                if (isApartmentReservedByOtherUser(item.id)) return 'View Info';
                if (item.bedManagement && (item.availableBeds || 0) === 0) return 'Fully Occupied';
                return 'View Details';
              })()}
            </ThemedText>
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
          Apartment Rentals 
        </ThemedText> 
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => setSearchVisible(true)}
        > 
          <MaterialIcons name="search" size={24} color={colorPalette.primary} /> 
        </TouchableOpacity> 
      </View>

      {/* Apartments List */}
      {getFilteredApartments().length > 0 ? (
        <FlatList 
          data={getFilteredApartments()} 
          renderItem={renderApartmentItem} 
          keyExtractor={(item) => item.id || Math.random().toString()} 
          contentContainerStyle={styles.listContainer} 
          showsVerticalScrollIndicator={false} 
        /> 
      ) : (
        <View style={[styles.listContainer, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}> 
          <MaterialIcons name="apartment" size={48} color={subtitleColor} /> 
          <ThemedText style={[styles.emptyText, { color: subtitleColor }]}> 
            No apartments found. 
          </ThemedText> 
        </View> 
      )}

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
                Search Apartments
              </ThemedText>
              <TouchableOpacity onPress={() => setSearchVisible(false)}>
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.searchInputContainer, { borderColor: borderColor }]}>
              <MaterialIcons name="search" size={20} color={subtitleColor} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Search by location, amenities..."
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
                {getFilteredApartments().length} results found
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
            {selectedApartment && (
              <>
                <View style={styles.detailHeader}>
                  <ThemedText type="title" style={[styles.detailTitle, { color: textColor }]}>
                    {selectedApartment.title || 'Apartment'}
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
                    onPress={() => handleImagePress(selectedApartment.image)}
                    activeOpacity={0.8}
                  >
                    <RobustImage source={selectedApartment.image} style={styles.detailImage} resizeMode="cover" />
                    <View style={styles.imageOverlay}>
                      <MaterialIcons name="zoom-in" size={24} color="#fff" />
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.detailContent}>
                    <View style={styles.detailRatingRow}>
                      <ThemedText type="subtitle" style={[styles.detailPrice, { color: colorPalette.primary }]}>
                        {formatPHP(selectedApartment.price || '0')}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.locationRow}>
                      <MaterialIcons name="location-on" size={20} color={colorPalette.primary} />
                      <ThemedText style={[styles.locationText, { color: subtitleColor }]}>
                        {selectedApartment.location || 'Location not specified'}
                      </ThemedText>
                    </View>
                    
                    <ThemedText style={[styles.detailDescription, { color: subtitleColor }]}>
                      {selectedApartment.description || 'No description available'}
                    </ThemedText>
                    
                    <View style={styles.detailSpecs}>
                      <View style={styles.specItem}>
                        <MaterialIcons name="bed" size={20} color={subtitleColor} />
                        <ThemedText style={[styles.specText, { color: textColor }]}>
                          {selectedApartment.bedrooms || 'N/A'} Bedrooms
                        </ThemedText>
                      </View>
                      <View style={styles.specItem}>
                        <MaterialIcons name="bathtub" size={20} color={subtitleColor} />
                        <ThemedText style={[styles.specText, { color: textColor }]}>
                          {selectedApartment.bathrooms || 'N/A'} Bathrooms
                        </ThemedText>
                      </View>
                      <View style={styles.specItem}>
                        <MaterialIcons name="square-foot" size={20} color={subtitleColor} />
                        <ThemedText style={[styles.specText, { color: textColor }]}>
                          {selectedApartment.size || 'N/A'} sqft
                        </ThemedText>
                      </View>
                    </View>
                    
                    <View style={styles.amenitiesSection}>
                      <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
                        Amenities
                      </ThemedText>
                      <View style={styles.amenitiesGrid}>
                        {selectedApartment.amenities?.map((amenity: string, index: number) => (
                          <View key={index} style={styles.amenityItem}>
                            <MaterialIcons name="check-circle" size={16} color={colorPalette.primary} />
                            <ThemedText style={[styles.amenityItemText, { color: subtitleColor }]}>
                              {amenity}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    </View>
                    
                    <View style={styles.detailActions}>
                      {(() => {
                        const isReservedByOther = isApartmentReservedByOtherUser(selectedApartment.id);
                        const isAvailable = isApartmentAvailable(selectedApartment.id);
                        
                        if (isReservedByOther) {
                          return (
                            <View style={styles.reservedByOtherContainer}>
                              <MaterialIcons name="person-pin" size={24} color="#FF9800" />
                              <ThemedText style={[styles.reservedByOtherText, { color: textColor }]}>
                                This apartment has been reserved by someone else.
                              </ThemedText>
                              <ThemedText style={[styles.reservedByOtherSubtext, { color: subtitleColor }]}>
                                Please choose another apartment or check back later
                              </ThemedText>
                            </View>
                          );
                        } else if (selectedApartment.bedManagement && (selectedApartment.availableBeds || 0) === 0) {
                          return (
                            <View style={styles.reservedByOtherContainer}>
                              <MaterialIcons name="bed" size={24} color="#F44336" />
                              <ThemedText style={[styles.reservedByOtherText, { color: textColor }]}>
                                All beds in this apartment are currently occupied.
                              </ThemedText>
                              <ThemedText style={[styles.reservedByOtherSubtext, { color: subtitleColor }]}>
                                Please choose another apartment or check back later
                              </ThemedText>
                            </View>
                          );
                        } else {
                          return (
                            <>
                              <TouchableOpacity 
                                style={[styles.contactButton, { backgroundColor: colorPalette.primary }]}
                                onPress={() => handleMessageAdmin(selectedApartment)}
                              >
                                <MaterialIcons name="message" size={20} color="#fff" />
                                <ThemedText style={styles.contactButtonText}>Message</ThemedText>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={[
                                  styles.bookButton,
                                  {
                                    borderColor: isAvailable ? colorPalette.primary : '#ccc',
                                    backgroundColor: (() => {
                                      if (!isAvailable) return '#f5f5f5';
                                      const match = reservedApartments.find(a => (a as any).serviceId === selectedApartment.id);
                                      const status = (match as any)?.status;
                                      const active = status === 'pending' || status === 'confirmed';
                                      return active ? colorPalette.primary : 'transparent';
                                    })(),
                                    opacity: isAvailable ? 1 : 0.6,
                                  },
                                ]}
                                onPress={() => isAvailable ? handleReservation(selectedApartment) : null}
                                disabled={!isAvailable}
                              >
                                {(() => {
                                  if (!isAvailable) {
                                    return (
                                      <MaterialIcons
                                        name="cancel"
                                        size={20}
                                        color="#999"
                                      />
                                    );
                                  }
                                  const match = reservedApartments.find(a => (a as any).serviceId === selectedApartment.id);
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
                                {!isAvailable ? (
                                  <View style={styles.unavailableContainer}>
                                    <MaterialIcons name="block" size={16} color="#fff" />
                                    <ThemedText style={styles.unavailableText}>UNAVAILABLE</ThemedText>
                                  </View>
                                ) : (
                                  <ThemedText
                                    style={[
                                      styles.bookButtonText,
                                      (() => {
                                        const match = reservedApartments.find(a => (a as any).serviceId === selectedApartment.id);
                                        const status = (match as any)?.status;
                                        const active = status === 'pending' || status === 'confirmed';
                                        return { color: active ? '#fff' : colorPalette.primary };
                                      })(),
                                    ]}
                                  >
                                    {(() => {
                                      const match = reservedApartments.find(a => (a as any).serviceId === selectedApartment.id);
                                      const status = (match as any)?.status;
                                      const active = status === 'pending' || status === 'confirmed';
                                      return active ? 'Reserved' : 'Reserve';
                                    })()}
                                  </ThemedText>
                                )}
                              </TouchableOpacity>
                            </>
                          );
                        }
                      })()}
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
        </Modal>
        
        {/* Full Screen Image Viewer */}
        <FullScreenImageViewer
          visible={imageViewerVisible}
          imageSource={selectedImage || ''}
          onClose={() => setImageViewerVisible(false)}
          title="Apartment Image"
        />

        {/* Payment Modal */}
        {pendingReservation && user && (
          <PaymentModal
            visible={paymentModalVisible}
            onClose={handlePaymentClose}
            onPaymentSuccess={handlePaymentSuccess}
            userId={user.uid}
            reservationId={`reservation_${Date.now()}`}
            serviceType="apartment"
            serviceId={pendingReservation.id}
            serviceTitle={pendingReservation.bedId ? 
              `${pendingReservation.title} - Bed ${pendingReservation.bedNumber}` : 
              pendingReservation.title
            }
            fullAmount={parsePrice(pendingReservation.bedPrice || pendingReservation.price)}
            isDark={isDark}
          />
        )}

        {/* Bed Selection Modal */}
        <Modal
          visible={bedSelectionVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setBedSelectionVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.bedSelectionModal, { backgroundColor: cardBgColor }]}>
              <View style={styles.bedSelectionHeader}>
                <ThemedText type="title" style={[styles.bedSelectionTitle, { color: textColor }]}>
                  Select a Bed
                </ThemedText>
                <TouchableOpacity onPress={() => setBedSelectionVisible(false)}>
                  <MaterialIcons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>
              
              <ThemedText style={[styles.bedSelectionSubtitle, { color: subtitleColor }]}>
                {selectedApartmentForBed?.title} - Choose an available bed
              </ThemedText>
              
              <ScrollView style={styles.bedSelectionList}>
                {apartmentBeds.map((bed) => (
                  <TouchableOpacity
                    key={bed.id}
                    style={[styles.bedSelectionCard, { backgroundColor: cardBgColor, borderColor }]}
                    onPress={() => handleBedSelection(bed)}
                  >
                    <RobustImage source={bed.image} style={styles.bedSelectionImage} resizeMode="cover" />
                    <View style={styles.bedSelectionContent}>
                      <ThemedText type="subtitle" style={[styles.bedSelectionTitle, { color: textColor }]}>
                        Bed {bed.bedNumber}
                      </ThemedText>
                      {bed.description && (
                        <ThemedText style={[styles.bedSelectionDescription, { color: subtitleColor }]}>
                          {bed.description}
                        </ThemedText>
                      )}
                      {bed.price && (
                        <ThemedText style={[styles.bedSelectionPrice, { color: colorPalette.primary }]}>
                          {formatPHP(bed.price)}
                        </ThemedText>
                      )}
                      <View style={styles.bedSelectionStatus}>
                        <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                        <ThemedText style={[styles.bedSelectionStatusText, { color: "#4CAF50" }]}>
                          Available
                        </ThemedText>
                      </View>
                    </View>
                    <MaterialIcons name="arrow-forward-ios" size={20} color={subtitleColor} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Date Selection Modal */}
        <Modal
          visible={dateSelectionVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setDateSelectionVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.dateSelectionModal, { backgroundColor: cardBgColor }]}>
              <View style={styles.dateSelectionHeader}>
                <ThemedText type="title" style={[styles.dateSelectionTitle, { color: textColor }]}>
                  Select Reservation Date
                </ThemedText>
                <TouchableOpacity onPress={() => setDateSelectionVisible(false)}>
                  <MaterialIcons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>
              
              <ThemedText style={[styles.dateSelectionSubtitle, { color: subtitleColor }]}>
                {selectedBed && `Bed ${selectedBed.bedNumber} - ${selectedApartmentForBed?.title}`}
              </ThemedText>

              <View style={styles.dateSelectionContent}>
                <View style={styles.selectedDateContainer}>
                  <MaterialIcons name="calendar-today" size={24} color={colorPalette.primary} />
                  <ThemedText style={[styles.selectedDateText, { color: textColor }]}>
                    {selectedDate.toLocaleDateString()}
                  </ThemedText>
                </View>

                <View style={styles.dateInputContainer}>
                  <ThemedText style={[styles.dateInputLabel, { color: textColor }]}>
                    Select Date:
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.dateInput, { borderColor }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <ThemedText style={[styles.dateInputText, { color: textColor }]}>
                      {selectedDate.toLocaleDateString()}
                    </ThemedText>
                    <MaterialIcons name="calendar-today" size={20} color={subtitleColor} />
                  </TouchableOpacity>
                  
                  {showDatePicker && (
                    <View style={styles.datePickerContainer}>
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                        style={styles.datePicker}
                      />
                      {Platform.OS === 'ios' && (
                        <TouchableOpacity
                          style={[styles.datePickerDoneButton, { backgroundColor: colorPalette.primary }]}
                          onPress={() => setShowDatePicker(false)}
                        >
                          <ThemedText style={styles.datePickerDoneButtonText}>Done</ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.dateSelectionActions}>
                  <TouchableOpacity
                    style={[styles.cancelDateButton, { borderColor: borderColor }]}
                    onPress={() => {
                      setDateSelectionVisible(false);
                      setBedSelectionVisible(true);
                    }}
                  >
                    <ThemedText style={[styles.cancelDateButtonText, { color: textColor }]}>
                      Back
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmDateButton, { backgroundColor: colorPalette.primary }]}
                    onPress={() => {
                      if (selectedBed) {
                        handleBedReservation(selectedBed, selectedDate);
                      }
                    }}
                  >
                    <ThemedText style={styles.confirmDateButtonText}>
                      Confirm Reservation
                    </ThemedText>
                  </TouchableOpacity>
                </View>
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
  apartmentCard: {
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
  apartmentImage: {
    width: '100%',
    height: 200,
  },
  apartmentContent: {
    padding: 16,
  },
  apartmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  apartmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
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
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
  },
  amenityBadge: {
    backgroundColor: 'rgba(0, 178, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    color: colorPalette.primary,
    fontSize: 12,
  },
  moreAmenities: {
    fontSize: 12,
    fontStyle: 'italic',
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
    padding: 20,
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
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  specText: {
    marginLeft: normalize(8),
    fontSize: normalize(isTablet ? 15 : 14),
    fontWeight: '500',
  },
  amenitiesSection: {
    marginBottom: normalize(24),
  },
  sectionTitle: {
    fontSize: normalize(isTablet ? 18 : 16),
    fontWeight: '600',
    marginBottom: normalize(12),
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(8),
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: isTablet ? '33%' : '50%',
    marginBottom: normalize(8),
    minWidth: isSmallScreen ? wp(45) : wp(40),
  },
  amenityItemText: {
    marginLeft: normalize(8),
    fontSize: normalize(isTablet ? 15 : 14),
    flex: 1,
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: normalize(12),
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
  },
  reservedByOtherContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 152, 0, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.2)',
  },
  reservedByOtherText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  reservedByOtherSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  // Bed selection modal styles
  bedSelectionModal: {
    width: '100%',
    borderRadius: 16,
    maxHeight: '80%',
    padding: 20,
  },
  bedSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bedSelectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  bedSelectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  bedSelectionList: {
    maxHeight: 400,
  },
  bedSelectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  bedSelectionImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  bedSelectionContent: {
    flex: 1,
  },
  bedSelectionDescription: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  bedSelectionPrice: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  bedSelectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bedSelectionStatusText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  // Date selection modal styles
  dateSelectionModal: {
    width: '100%',
    borderRadius: 16,
    maxHeight: '70%',
    padding: 20,
  },
  dateSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateSelectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dateSelectionSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  dateSelectionContent: {
    alignItems: 'center',
  },
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 178, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 178, 255, 0.3)',
  },
  selectedDateText: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  dateInputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  dateInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputText: {
    fontSize: 16,
  },
  datePickerContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  datePicker: {
    alignSelf: 'center',
  },
  datePickerDoneButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  datePickerDoneButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  dateSelectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  cancelDateButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelDateButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  confirmDateButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmDateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});