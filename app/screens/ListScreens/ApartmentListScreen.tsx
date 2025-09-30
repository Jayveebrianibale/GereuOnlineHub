import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { push, ref, set } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { FullScreenImageViewer } from '../../components/FullScreenImageViewer';
import { PaymentModal } from '../../components/PaymentModal';
import { RobustImage } from '../../components/RobustImage';
import { APARTMENT_ADMIN } from '../../config/adminConfig';
import { useAdminReservation } from '../../contexts/AdminReservationContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { useReservation } from '../../contexts/ReservationContext';
import { db } from '../../firebaseConfig';
import { getApartments } from '../../services/apartmentService';
import {
    cacheApartments,
    getCachedApartments
} from '../../services/dataCache';
import { notifyAdminByEmail, notifyAdmins } from '../../services/notificationService';
import { PaymentData, isPaymentRequired } from '../../services/paymentService';
import { formatPHP } from '../../utils/currency';
import { getImageSource } from '../../utils/imageUtils';
import { mapServiceToAdminReservation } from '../../utils/reservationUtils';
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
        const apartmentsData = await getApartments();
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

  const handleImagePress = (imageSource: string) => {
    setSelectedImage(imageSource);
    setImageViewerVisible(true);
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
    // Check if apartment is available
    if (!apartment.available) {
      Alert.alert(
        'Service Unavailable',
        'This apartment is currently unavailable for reservation. Please try again later or contact the admin.',
        [{ text: 'OK' }]
      );
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
      // Process the reservation after successful payment
      await processReservation(pendingReservation);
      
      // Reset payment modal state
      setPaymentModalVisible(false);
      setPendingReservation(null);
      
      Alert.alert(
        'Payment & Reservation Successful!',
        'Your payment has been confirmed and your apartment reservation has been submitted! You can view your reservations in the Bookings tab.',
        [
          {
            text: 'View Bookings',
            onPress: () => router.push('/(user-tabs)/bookings')
          }
        ]
      );
    } catch (error) {
      console.error('Error processing reservation after payment:', error);
      Alert.alert(
        'Reservation Error',
        'Payment was successful but there was an error processing your reservation. Please contact support.',
        [{ text: 'OK' }]
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
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <ThemedText style={styles.ratingText}>{item.rating || '4.5'}</ThemedText>
            <ThemedText style={[styles.reviewText, { color: subtitleColor }]}>
              ({item.reviews || '0'})
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={16} color={colorPalette.primary} />
          <ThemedText style={[styles.locationText, { color: subtitleColor }]}>
            {item.location || 'Location not specified'}
          </ThemedText>
        </View>
        
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
            style={[styles.viewButton, { backgroundColor: colorPalette.primary }]}
            onPress={() => {
              setSelectedApartment(item);
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
                      <View style={styles.ratingContainer}>
                        <MaterialIcons name="star" size={16} color="#FFD700" />
                        <ThemedText style={styles.ratingText}>{selectedApartment.rating || '4.5'}</ThemedText>
                        <ThemedText style={[styles.reviewText, { color: subtitleColor }]}>
                          ({selectedApartment.reviews || '0'} reviews)
                        </ThemedText>
                      </View>
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
                            borderColor: selectedApartment.available ? colorPalette.primary : '#ccc',
                            backgroundColor: (() => {
                              if (!selectedApartment.available) return '#f5f5f5';
                              const match = reservedApartments.find(a => (a as any).serviceId === selectedApartment.id);
                              const status = (match as any)?.status;
                              const active = status === 'pending' || status === 'confirmed';
                              return active ? colorPalette.primary : 'transparent';
                            })(),
                            opacity: selectedApartment.available ? 1 : 0.6,
                          },
                        ]}
                        onPress={() => selectedApartment.available ? handleReservation(selectedApartment) : null}
                        disabled={!selectedApartment.available}
                      >
                         {(() => {
                           if (!selectedApartment.available) {
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
                        {!selectedApartment.available ? (
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
            serviceTitle={pendingReservation.title}
            fullAmount={parseFloat(pendingReservation.price) || 0}
            isDark={isDark}
          />
        )}
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFD700',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 12,
    marginLeft: 4,
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
});