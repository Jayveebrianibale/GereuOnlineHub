import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { off, onValue, ref } from 'firebase/database';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { RobustImage } from './components/RobustImage';
import { useAuthContext } from './contexts/AuthContext';
import { useReservation } from './contexts/ReservationContext';
import { db } from './firebaseConfig';
import {
  cacheApartments,
  cacheAutoServices,
  cacheLaundryServices
} from './services/dataCache';
import { FirebaseUserReservation, getAdminReservations, listenToUserReservations } from './services/reservationService';
import { formatPHP } from './utils/currency';

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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive breakpoints
const isTablet = screenWidth >= 768;
const isLargeScreen = screenWidth >= 1024;
const itemWidth = isLargeScreen ? screenWidth * 0.3 : isTablet ? screenWidth * 0.45 : screenWidth - 40;
const itemSpacing = isLargeScreen ? 16 : 20;
// ...existing code...


export default function UserHome() {
  const [firstName, setFirstName] = useState('');
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [unreadCount, setUnreadCount] = useState(0);
  const { reservedApartments } = useReservation();
  const { user, isLoading } = useAuthContext();

  const [apartments, setApartments] = useState<any[]>([]);
  const [autoServices, setAutoServices] = useState<any[]>([]);
  const [laundryServices, setLaundryServices] = useState<any[]>([]);
  const [globalReservations, setGlobalReservations] = useState<any[]>([]);
  const [laundryServicesLoaded, setLaundryServicesLoaded] = useState(false);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user?.displayName) {
      setFirstName(user.displayName.split(' ')[0]);
    }
  }, []);

  // Notifications badge listener
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    let isActive = true;
    const storageKey = `user:lastSeenReservations:${user.uid}`;

    const init = async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        const lastSeen = raw ? Number(raw) : 0;

        const unsubscribe = listenToUserReservations(user.uid, (reservations: FirebaseUserReservation[]) => {
          if (!isActive) return;
          const latestRelevant = reservations.filter(r => (
            r.status === 'pending' || r.status === 'confirmed' || r.status === 'declined' || r.status === 'cancelled'
          ));
          const count = latestRelevant.filter(r => new Date(r.updatedAt).getTime() > lastSeen).length;
          setUnreadCount(count);
        });

        return unsubscribe;
      } catch (e) {
        setUnreadCount(0);
      }
    };

    let cleanup: any;
    init().then(unsub => { cleanup = unsub; });
    return () => { isActive = false; if (cleanup) cleanup(); };
  }, []);

  const handleNotificationsPress = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      const storageKey = `user:lastSeenReservations:${user.uid}`;
      await AsyncStorage.setItem(storageKey, String(Date.now()));
      setUnreadCount(0);
      // Navigate to notifications screen
      router.push('/notifications');
    } catch {}
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.toLowerCase().trim();
    
    // Search through all services
    const allResults: any[] = [];
    
    // Search apartments
    apartments.forEach(apartment => {
      if (
        apartment.title?.toLowerCase().includes(query) ||
        apartment.location?.toLowerCase().includes(query) ||
        apartment.amenities?.some((amenity: string) => amenity.toLowerCase().includes(query))
      ) {
        allResults.push({ ...apartment, type: 'apartment' });
      }
    });
    
    // Search laundry services
    laundryServices.forEach(service => {
      if (
        service.title?.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.turnaround?.toLowerCase().includes(query)
      ) {
        allResults.push({ ...service, type: 'laundry' });
      }
    });
    
    // Search auto services
    autoServices.forEach(service => {
      if (
        service.title?.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.duration?.toLowerCase().includes(query)
      ) {
        allResults.push({ ...service, type: 'auto' });
      }
    });
    
    setSearchResults(allResults);
  };

  const handleSearchPress = () => {
    handleSearch();
  };

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

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

  // Real-time listener for admin reservations to update apartment availability
  useEffect(() => {
    if (!user || isLoading) return;

    console.log('🔄 Setting up real-time listener for admin reservations...');
    
    const adminReservationsRef = ref(db, 'adminReservations');
    const adminReservationsListener = onValue(adminReservationsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setGlobalReservations([]);
        return;
      }
      
      const data = snapshot.val();
      const reservationsList = Object.values(data) as any[];
      
      // Filter for active reservations (pending, confirmed, declined, cancelled)
      const activeReservations = reservationsList.filter(reservation => 
        reservation && 
        reservation.id && 
        (reservation.status === 'pending' || 
         reservation.status === 'confirmed' || 
         reservation.status === 'declined' || 
         reservation.status === 'cancelled')
      );
      
      console.log('📡 Real-time admin reservations update:', activeReservations.length, 'reservations');
      setGlobalReservations(activeReservations);
    });

    return () => {
      off(adminReservationsRef, 'value', adminReservationsListener);
    };
  }, [user, isLoading]);

  // Real-time listeners for all services
  useEffect(() => {
    // Only set up listeners if user is authenticated and not loading
    if (isLoading) {
      console.log('⏳ Authentication still loading, waiting...');
      return;
    }
    
    if (!user) {
      console.log('⏳ Waiting for user authentication before setting up real-time listeners...');
      return;
    }

    console.log('🔄 Setting up real-time listeners for services...');
    
    // Set up real-time listener for apartments
    const apartmentsRef = ref(db, 'apartments');
    const apartmentsListener = onValue(apartmentsRef, (snapshot) => {
      const apartmentsData: any[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          const apartment = { id: key, ...data[key] };
          apartmentsData.push(apartment);
        });
      }
      console.log('🏠 Real-time apartments update:', apartmentsData.length, 'apartments');
      setApartments(apartmentsData);
      // Update cache with new data
      cacheApartments(apartmentsData);
    });

    // Set up real-time listener for auto services
    const autoServicesRef = ref(db, 'autoServices');
    const autoServicesListener = onValue(autoServicesRef, (snapshot) => {
      const autoServicesData: any[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          autoServicesData.push({ id: key, ...data[key] });
        });
      }
      console.log('🚗 Real-time auto services update:', autoServicesData.length, 'services');
      setAutoServices(autoServicesData);
      // Update cache with new data
      cacheAutoServices(autoServicesData);
    });


    // Cleanup listeners when component unmounts
    return () => {
      console.log('🧹 Cleaning up real-time listeners...');
      off(apartmentsRef, 'value', apartmentsListener);
      off(autoServicesRef, 'value', autoServicesListener);
    };
  }, [user, isLoading]); // Add both user and isLoading as dependencies

  // Function to load laundry services when user interacts with laundry section
  const loadLaundryServices = () => {
    if (laundryServicesLoaded) return;
    
    console.log('🔄 Loading laundry services on demand...');
    setLaundryServicesLoaded(true);
  };

  // Set up laundry listener when laundryServicesLoaded becomes true
  useEffect(() => {
    if (!laundryServicesLoaded || !user || isLoading) return;

    console.log('🧺 Setting up laundry services listener...');
    const laundryServicesRef = ref(db, 'laundryServices');
    const laundryServicesListener = onValue(laundryServicesRef, (snapshot) => {
      const laundryServicesData: any[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          laundryServicesData.push({ id: key, ...data[key] });
        });
      }
      console.log('🧺 Real-time laundry services update:', laundryServicesData.length, 'services');
      setLaundryServices(laundryServicesData);
      // Update cache with new data
      cacheLaundryServices(laundryServicesData);
    });

    return () => {
      off(laundryServicesRef, 'value', laundryServicesListener);
    };
  }, [laundryServicesLoaded, user, isLoading]);

  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';

  const [activeApartmentIndex, setActiveApartmentIndex] = useState(0);
  const [activeLaundryIndex, setActiveLaundryIndex] = useState(0);
  const [activeAutoIndex, setActiveAutoIndex] = useState(0);

  const apartmentScrollX = useRef(new Animated.Value(0)).current;
  const laundryScrollX = useRef(new Animated.Value(0)).current;
  const autoScrollX = useRef(new Animated.Value(0)).current;

  // Refs for FlatList components
  const apartmentFlatListRef = useRef<FlatList>(null);
  const laundryFlatListRef = useRef<FlatList>(null);
  const autoFlatListRef = useRef<FlatList>(null);

  // Touch interaction states
  const [isUserInteracting, setIsUserInteracting] = useState({
    apartments: false,
    laundry: false,
    auto: false,
  });

  // Helper function to check if apartment is reserved by any user
  const isApartmentReserved = (apartmentId: string) => {
    const globalReservation = globalReservations.find(reservation => 
      reservation.serviceType === 'apartment' && 
      reservation.serviceId === apartmentId && 
      (reservation.status === 'pending' || reservation.status === 'confirmed')
    );
    return !!globalReservation;
  };

  // Helper function to check if current user has reserved the apartment
  const isApartmentReservedByCurrentUser = (apartmentId: string) => {
    const userReservation = reservedApartments.find(apartment => 
      (apartment as any).serviceId === apartmentId && 
      (apartment.status === 'pending' || apartment.status === 'confirmed')
    );
    return !!userReservation;
  };

  // Helper function to check if apartment is available for reservation
  const isApartmentAvailable = (apartmentId: string) => {
    const apartment = apartments.find(apt => apt.id === apartmentId);
    if (!apartment) return false;
    
    // For apartments with bed management, only check if there are available beds
    if (apartment.bedManagement) {
      const availableBeds = apartment.availableBeds || 0;
      return availableBeds > 0;
    }
    
    // For regular apartments (without bed management), check if it's reserved by any user
    if (isApartmentReserved(apartmentId)) return false;
    
    // Check if apartment is marked as unavailable (this should be the last check)
    if (!apartment.available) return false;
    
    return true;
  };

  // Helper function to check if user can reserve more beds in a bed spacer apartment
  const canReserveMoreBeds = (apartmentId: string) => {
    const apartment = apartments.find(apt => apt.id === apartmentId);
    if (!apartment || !apartment.bedManagement) return false;
    
    const availableBeds = apartment.availableBeds || 0;
    return availableBeds > 0;
  };

  // Auto-slide functionality
  const slideToNext = (flatListRef: React.RefObject<FlatList>, currentIndex: number, totalItems: number) => {
    if (totalItems <= 1) return;
    
    const nextIndex = (currentIndex + 1) % totalItems;
    flatListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
  };

  // Auto-slide intervals with user interaction detection
  useEffect(() => {
    if (apartments.length <= 1) return;

    const interval = setInterval(() => {
      // Only auto-slide if user is not interacting
      if (!isUserInteracting.apartments) {
        setActiveApartmentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % apartments.length;
          apartmentFlatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }
    }, 4000); // Slide every 4 seconds

    return () => clearInterval(interval);
  }, [apartments.length, isUserInteracting.apartments]);

  useEffect(() => {
    if (laundryServices.length <= 1) return;

    const interval = setInterval(() => {
      // Only auto-slide if user is not interacting
      if (!isUserInteracting.laundry) {
        setActiveLaundryIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % laundryServices.length;
          laundryFlatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }
    }, 4000); // Slide every 4 seconds

    return () => clearInterval(interval);
  }, [laundryServices.length, isUserInteracting.laundry]);

  useEffect(() => {
    if (autoServices.length <= 1) return;

    const interval = setInterval(() => {
      // Only auto-slide if user is not interacting
      if (!isUserInteracting.auto) {
        setActiveAutoIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % autoServices.length;
          autoFlatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }
    }, 4000); // Slide every 4 seconds

    return () => clearInterval(interval);
  }, [autoServices.length, isUserInteracting.auto]);

  const renderApartmentItem = ({ item }: { item: any }) => (
    <View style={[styles.carouselItem, { width: itemWidth, marginRight: itemSpacing }]}> 
      <RobustImage 
        source={item.image} 
        style={[styles.carouselImage, { height: isLargeScreen ? 180 : isTablet ? 160 : 200 }]} 
        resizeMode="cover"
      />
      <View style={styles.itemOverlay}> 
        <View style={[
          styles.availabilityBadge, 
          { 
            backgroundColor: (() => {
              if (isApartmentReservedByCurrentUser(item.id)) return '#3B82F6'; // Blue for reserved by current user
              return isApartmentAvailable(item.id) ? '#10B981' : '#EF4444'; // Green for available, red for unavailable
            })(),
            borderWidth: 1,
            borderColor: (() => {
              if (isApartmentReservedByCurrentUser(item.id)) return '#2563EB'; // Blue border for reserved
              return isApartmentAvailable(item.id) ? '#059669' : '#DC2626'; // Green/red border
            })(),
            shadowColor: (() => {
              if (isApartmentReservedByCurrentUser(item.id)) return '#3B82F6'; // Blue shadow for reserved
              return isApartmentAvailable(item.id) ? '#10B981' : '#EF4444'; // Green/red shadow
            })(),
            shadowOpacity: 0.2,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
          }
        ]}> 
          <MaterialIcons 
            name={(() => {
              if (isApartmentReservedByCurrentUser(item.id)) return "bookmark"; // Bookmark icon for reserved
              return isApartmentAvailable(item.id) ? "check-circle" : "cancel"; // Check for available, X for unavailable
            })()} 
            size={14} 
            color="#fff" 
          />
          <ThemedText style={[
            styles.availabilityText,
            { 
              color: '#fff',
              fontWeight: '600',
            }
          ]}>
            {(() => {
              if (item.bedManagement) {
                const availableBeds = item.availableBeds || 0;
                const totalBeds = item.totalBeds || 0;
                if (availableBeds > 0) {
                  return `${availableBeds}/${totalBeds} beds`;
                } else {
                  return 'All occupied';
                }
              }
              // Check if current user has reserved this apartment
              if (isApartmentReservedByCurrentUser(item.id)) {
                return 'Reserved';
              }
              return isApartmentAvailable(item.id) ? 'Available' : 'Unavailable';
            })()}
          </ThemedText>
        </View>
        <View style={styles.priceTag}> 
          <ThemedText style={styles.priceText}>{formatPHP(item.price)}</ThemedText>
        </View>
      </View>
      <View style={[styles.itemContent, { backgroundColor: cardBgColor }]}> 
        <ThemedText type="subtitle" style={[styles.itemTitle, { color: textColor, fontSize: isLargeScreen ? 16 : 18 }]}> 
          {item.title}
        </ThemedText>

        {/* Description */}
        {item.description && (
          <ThemedText style={[styles.description, { color: isDark ? '#B0B0B0' : '#666' }]} numberOfLines={2}>
            {item.description}
          </ThemedText>
        )}

        {/* Rating and Reviews */}
        {(item.rating > 0 || item.reviews > 0) && (
          <View style={styles.ratingContainer}>
            <View style={styles.ratingRow}>
              <MaterialIcons name="star" size={14} color="#FFD700" />
              <ThemedText style={[styles.ratingText, { color: isDark ? '#B0B0B0' : '#666' }]}>
                {item.rating.toFixed(1)}
              </ThemedText>
              <ThemedText style={[styles.reviewsText, { color: isDark ? '#B0B0B0' : '#666' }]}>
                ({item.reviews} review{item.reviews !== 1 ? 's' : ''})
              </ThemedText>
            </View>
          </View>
        )}

        {/* Location and Address */}
        <View style={styles.locationContainer}>
          <View style={styles.locationRow}> 
            <MaterialIcons name="location-on" size={16} color={colorPalette.primary} />
            <ThemedText style={[styles.locationText, { color: textColor }]}> 
              {item.location}
            </ThemedText>
          </View>
          {item.address && item.address !== item.location && (
            <View style={styles.addressRow}>
              <MaterialIcons name="place" size={12} color={isDark ? '#B0B0B0' : '#666'} />
              <ThemedText style={[styles.addressText, { color: isDark ? '#B0B0B0' : '#666' }]} numberOfLines={1}>
                {item.address}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Apartment Details */}
        <View style={styles.apartmentDetailsContainer}>
          <View style={[styles.detailItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
            <MaterialIcons name="bed" size={14} color={isDark ? '#B0B0B0' : '#666'} />
            <ThemedText style={[styles.detailText, { color: isDark ? '#B0B0B0' : '#666' }]}>
              {item.bedrooms} bed{item.bedrooms !== 1 ? 's' : ''}
            </ThemedText>
          </View>
          <View style={[styles.detailItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
            <MaterialIcons name="bathtub" size={14} color={isDark ? '#B0B0B0' : '#666'} />
            <ThemedText style={[styles.detailText, { color: isDark ? '#B0B0B0' : '#666' }]}>
              {item.bathrooms} bath{item.bathrooms !== 1 ? 's' : ''}
            </ThemedText>
          </View>
          {item.size && (
            <View style={[styles.detailItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
              <MaterialIcons name="straighten" size={14} color={isDark ? '#B0B0B0' : '#666'} />
              <ThemedText style={[styles.detailText, { color: isDark ? '#B0B0B0' : '#666' }]}>
                {item.size}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.amenitiesContainer}> 
          {item.amenities?.slice(0, isLargeScreen ? 2 : isTablet ? 3 : 4).map((amenity: string, index: number) => (
            <View key={index} style={styles.amenityBadge}> 
              <ThemedText style={[styles.amenityText, { color: textColor }]}>{amenity}</ThemedText>
            </View>
          ))}
        </View>
        <TouchableOpacity 
          style={[
            styles.bookButton, 
            { 
              backgroundColor: (() => {
                // For bed spacer apartments, always allow interaction if beds are available
                if (item.bedManagement) {
                  return canReserveMoreBeds(item.id) ? colorPalette.primary : '#9CA3AF';
                }
                // For regular apartments, disable if reserved by current user
                return isApartmentReservedByCurrentUser(item.id) ? '#9CA3AF' : colorPalette.primary;
              })(),
              opacity: (() => {
                if (item.bedManagement) {
                  return canReserveMoreBeds(item.id) ? 1 : 0.6;
                }
                return isApartmentReservedByCurrentUser(item.id) ? 0.6 : 1;
              })()
            }
          ]} 
          onPress={() => {
            // For bed spacer apartments, always allow if beds are available
            if (item.bedManagement) {
              if (canReserveMoreBeds(item.id)) {
                router.push({
                  pathname: '/apartment-list',
                  params: { selectedApartmentId: item.id }
                });
              }
            } else {
              // For regular apartments, only allow if not reserved by current user
              if (!isApartmentReservedByCurrentUser(item.id)) {
                router.push({
                  pathname: '/apartment-list',
                  params: { selectedApartmentId: item.id }
                });
              }
            }
          }}
          disabled={(() => {
            if (item.bedManagement) {
              return !canReserveMoreBeds(item.id);
            }
            return isApartmentReservedByCurrentUser(item.id);
          })()}
        >
          <ThemedText style={styles.bookButtonText}>
            {(() => {
              if (item.bedManagement) {
                return canReserveMoreBeds(item.id) ? 'View Details' : 'All Occupied';
              }
              return isApartmentReservedByCurrentUser(item.id) ? 'Reserved' : 'View Details';
            })()}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderServiceItem = ({ item, serviceType }: { item: any, serviceType: string }) => {
    // Enhanced laundry service display with same appearance as apartment rentals
    if (serviceType === 'laundry') {
      return (
        <View style={[styles.carouselItem, { width: itemWidth, marginRight: itemSpacing }]}> 
          <RobustImage 
            source={item.image} 
            style={[styles.carouselImage, { height: isLargeScreen ? 180 : isTablet ? 160 : 200 }]} 
            resizeMode="cover"
          />
          <View style={styles.itemOverlay}> 
            <View style={[
              styles.availabilityBadge, 
              { 
                backgroundColor: item.available ? '#10B981' : '#EF4444',
                borderWidth: 1,
                borderColor: item.available ? '#059669' : '#DC2626',
                shadowColor: item.available ? '#10B981' : '#EF4444',
                shadowOpacity: 0.2,
                shadowRadius: 2,
                shadowOffset: { width: 0, height: 1 },
                elevation: 2,
              }
            ]}> 
              <MaterialIcons 
                name={item.available ? "check-circle" : "cancel"} 
                size={14} 
                color="#fff" 
              />
              <ThemedText style={[
                styles.availabilityText,
                { 
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: isLargeScreen ? 12 : 14,
                }
              ]}>
                {item.available ? 'Available' : 'Unavailable'}
              </ThemedText>
            </View>
            <View style={styles.priceTag}> 
              <ThemedText style={[styles.priceText, { fontSize: isLargeScreen ? 14 : 16 }]}>{formatPHP(item.price)}</ThemedText>
            </View>
          </View>
          <View style={[styles.itemContent, { backgroundColor: cardBgColor }]}> 
            <ThemedText type="subtitle" style={[styles.itemTitle, { color: textColor, fontSize: isLargeScreen ? 18 : 20 }]}> 
              {item.title}
            </ThemedText>

            {/* Description */}
            {item.description && (
              <ThemedText style={[styles.description, { color: isDark ? '#B0B0B0' : '#666', fontSize: isLargeScreen ? 14 : 16 }]} numberOfLines={2}>
                {item.description}
              </ThemedText>
            )}

            {/* Rating and Reviews */}
            {(item.rating > 0 || item.reviews > 0) && (
              <View style={styles.ratingContainer}>
                <View style={styles.ratingRow}>
                  <MaterialIcons name="star" size={16} color="#FFD700" />
                  <ThemedText style={[styles.ratingText, { color: isDark ? '#B0B0B0' : '#666', fontSize: isLargeScreen ? 14 : 16 }]}>
                    {item.rating.toFixed(1)}
                  </ThemedText>
                  <ThemedText style={[styles.reviewsText, { color: isDark ? '#B0B0B0' : '#666', fontSize: isLargeScreen ? 12 : 14 }]}>
                    ({item.reviews} review{item.reviews !== 1 ? 's' : ''})
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Service Details */}
            <View style={styles.serviceDetailsContainer}>
              <View style={[styles.detailItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                <Ionicons name="time-outline" size={16} color={isDark ? '#B0B0B0' : '#666'} />
                <ThemedText style={[styles.detailText, { color: isDark ? '#B0B0B0' : '#666', fontSize: isLargeScreen ? 13 : 15 }]}>
                  {item.turnaround}
                </ThemedText>
              </View>
              {item.pickup && (
                <View style={[styles.detailItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                  <MaterialIcons name="local-shipping" size={16} color={isDark ? '#B0B0B0' : '#666'} />
                  <ThemedText style={[styles.detailText, { color: isDark ? '#B0B0B0' : '#666', fontSize: isLargeScreen ? 13 : 15 }]}>
                    {item.pickup}
                  </ThemedText>
                </View>
              )}
              {item.delivery && (
                <View style={[styles.detailItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                  <MaterialIcons name="delivery-dining" size={16} color={isDark ? '#B0B0B0' : '#666'} />
                  <ThemedText style={[styles.detailText, { color: isDark ? '#B0B0B0' : '#666', fontSize: isLargeScreen ? 13 : 15 }]}>
                    {item.delivery}
                  </ThemedText>
                </View>
              )}
              {item.minOrder && (
                <View style={[styles.detailItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                  <MaterialIcons name="scale" size={16} color={isDark ? '#B0B0B0' : '#666'} />
                  <ThemedText style={[styles.detailText, { color: isDark ? '#B0B0B0' : '#666', fontSize: isLargeScreen ? 13 : 15 }]}>
                    Min: {item.minOrder}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Services Offered as Amenities */}
            <View style={styles.amenitiesContainer}> 
              {item.services && item.services.length > 0 && item.services.slice(0, isLargeScreen ? 2 : isTablet ? 3 : 4).map((service: string, index: number) => (
                <View key={index} style={styles.amenityBadge}> 
                  <ThemedText style={[styles.amenityText, { color: textColor, fontSize: isLargeScreen ? 12 : 14 }]}>{service}</ThemedText>
                </View>
              ))}
            </View>
            <TouchableOpacity 
              style={[styles.bookButton, { backgroundColor: colorPalette.primary }]} 
              onPress={() => {
                router.push({
                  pathname: '/laundry-list',
                  params: { selectedServiceId: item.id, serviceType: 'laundry' }
                });
              }}
            >
              <ThemedText style={[styles.bookButtonText, { fontSize: isLargeScreen ? 14 : 16 }]}>View Details</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Enhanced auto service display with same appearance as apartment rentals
    return (
      <View style={[styles.carouselItem, { width: itemWidth, marginRight: itemSpacing }]}> 
        <RobustImage 
          source={item.image} 
          style={[styles.carouselImage, { height: isLargeScreen ? 180 : isTablet ? 160 : 200 }]} 
          resizeMode="cover"
        />
        <View style={styles.itemOverlay}> 
          <View style={[
            styles.availabilityBadge, 
            { 
              backgroundColor: item.available ? '#10B981' : '#EF4444',
              borderWidth: 1,
              borderColor: item.available ? '#059669' : '#DC2626',
              shadowColor: item.available ? '#10B981' : '#EF4444',
              shadowOpacity: 0.2,
              shadowRadius: 2,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
            }
          ]}> 
            <MaterialIcons 
              name={item.available ? "check-circle" : "cancel"} 
              size={14} 
              color="#fff" 
            />
            <ThemedText style={[
              styles.availabilityText,
              { 
                color: '#fff',
                fontWeight: '600',
                fontSize: isLargeScreen ? 12 : 14,
              }
            ]}>
              {item.available ? 'Available' : 'Unavailable'}
            </ThemedText>
          </View>
          <View style={styles.priceTag}> 
            <ThemedText style={[styles.priceText, { fontSize: isLargeScreen ? 14 : 16 }]}>{formatPHP(item.price)}</ThemedText>
          </View>
        </View>
        <View style={[styles.itemContent, { backgroundColor: cardBgColor }]}> 
          <ThemedText type="subtitle" style={[styles.itemTitle, { color: textColor, fontSize: isLargeScreen ? 18 : 20 }]}> 
            {item.title}
          </ThemedText>

          {/* Description */}
          {item.description && (
            <ThemedText style={[styles.description, { color: isDark ? '#B0B0B0' : '#666', fontSize: isLargeScreen ? 14 : 16 }]} numberOfLines={2}>
              {item.description}
            </ThemedText>
          )}

          {/* Rating and Reviews */}
          {(item.rating > 0 || item.reviews > 0) && (
            <View style={styles.ratingContainer}>
              <View style={styles.ratingRow}>
                <MaterialIcons name="star" size={16} color="#FFD700" />
                <ThemedText style={[styles.ratingText, { color: isDark ? '#B0B0B0' : '#666', fontSize: isLargeScreen ? 14 : 16 }]}>
                  {item.rating.toFixed(1)}
                </ThemedText>
                <ThemedText style={[styles.reviewsText, { color: isDark ? '#B0B0B0' : '#666', fontSize: isLargeScreen ? 12 : 14 }]}>
                  ({item.reviews} review{item.reviews !== 1 ? 's' : ''})
                </ThemedText>
              </View>
            </View>
          )}

          {/* Service Details */}
          <View style={styles.serviceDetailsContainer}>
            <View style={[styles.detailItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
              <Ionicons name="time-outline" size={16} color={isDark ? '#B0B0B0' : '#666'} />
              <ThemedText style={[styles.detailText, { color: isDark ? '#B0B0B0' : '#666', fontSize: isLargeScreen ? 13 : 15 }]}>
                {item.duration}
              </ThemedText>
            </View>
            {item.location && (
              <View style={[styles.detailItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                <MaterialIcons name="location-on" size={16} color={isDark ? '#B0B0B0' : '#666'} />
                <ThemedText style={[styles.detailText, { color: isDark ? '#B0B0B0' : '#666', fontSize: isLargeScreen ? 13 : 15 }]}>
                  {item.location}
                </ThemedText>
              </View>
            )}
            {item.serviceType && (
              <View style={[styles.detailItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                <MaterialIcons name="build" size={16} color={isDark ? '#B0B0B0' : '#666'} />
                <ThemedText style={[styles.detailText, { color: isDark ? '#B0B0B0' : '#666', fontSize: isLargeScreen ? 13 : 15 }]}>
                  {item.serviceType}
                </ThemedText>
              </View>
            )}
            {item.vehicleType && (
              <View style={[styles.detailItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                <MaterialIcons name="directions-car" size={16} color={isDark ? '#B0B0B0' : '#666'} />
                <ThemedText style={[styles.detailText, { color: isDark ? '#B0B0B0' : '#666', fontSize: isLargeScreen ? 13 : 15 }]}>
                  {item.vehicleType}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Services Offered as Amenities */}
          <View style={styles.amenitiesContainer}> 
            {item.services && item.services.length > 0 && item.services.slice(0, isLargeScreen ? 2 : isTablet ? 3 : 4).map((service: string, index: number) => (
              <View key={index} style={styles.amenityBadge}> 
                <ThemedText style={[styles.amenityText, { color: textColor, fontSize: isLargeScreen ? 12 : 14 }]}>{service}</ThemedText>
              </View>
            ))}
          </View>
          <TouchableOpacity 
            style={[styles.bookButton, { backgroundColor: colorPalette.primary }]} 
            onPress={() => {
              router.push({
                pathname: '/auto-list',
                params: { selectedServiceId: item.id, serviceType: 'auto' }
              });
            }}
          >
            <ThemedText style={[styles.bookButtonText, { fontSize: isLargeScreen ? 14 : 16 }]}>View Details</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}> 
      <ScrollView contentContainerStyle={styles.scrollContainer}> 
        {/* Header */}
        <View style={styles.header}> 
          <View> 
                <ThemedText type="title" style={[styles.title, { color: textColor }]}> 
                  {`Welcome${firstName ? `, ${firstName}` : ''}!`}
                </ThemedText>
                <ThemedText type="default" style={[styles.subtitle, { color: textColor }]}> 
                  Find the best services for your needs
                </ThemedText>
              </View>
              <View style={styles.headerIcons}> 
                <TouchableOpacity style={styles.iconButton} onPress={handleNotificationsPress}> 
                  <View>
                    <MaterialIcons name="notifications-none" size={28} color={colorPalette.primary} />
                    {unreadCount > 0 && (
                      <View style={styles.badge}> 
                        <ThemedText style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</ThemedText>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchBar, { backgroundColor: cardBgColor, borderColor }]}>
              <MaterialIcons name="search" size={24} color={subtitleColor} />
              <TextInput
                style={[styles.searchText, { color: textColor }]}
                placeholder="Search for services..."
                placeholderTextColor={subtitleColor}
                value={searchQuery}
                onChangeText={handleSearchTextChange}
                onSubmitEditing={handleSearchPress}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => {
                  setSearchQuery('');
                  setIsSearching(false);
                  setSearchResults([]);
                }}>
                  <MaterialIcons name="clear" size={24} color={subtitleColor} />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results */}
            {isSearching && (
              <View style={styles.searchResultsContainer}>
                <View style={styles.searchResultsHeader}>
                  <ThemedText type="subtitle" style={[styles.searchResultsTitle, { color: textColor }]}>
                    Search Results ({searchResults.length})
                  </ThemedText>
                  <TouchableOpacity onPress={() => {
                    setIsSearching(false);
                    setSearchResults([]);
                  }}>
                    <MaterialIcons name="close" size={24} color={subtitleColor} />
                  </TouchableOpacity>
                </View>
                
                {searchResults.length > 0 ? (
                  <FlatList
                    data={searchResults}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.searchResultItem, { backgroundColor: cardBgColor, borderColor }]}
                        onPress={() => {
                          if (item.type === 'apartment') {
                            router.push({
                              pathname: '/apartment-list',
                              params: { selectedApartmentId: item.id }
                            });
                          } else if (item.type === 'laundry') {
                            router.push({
                              pathname: '/laundry-list',
                              params: { selectedServiceId: item.id, serviceType: 'laundry' }
                            });
                          } else if (item.type === 'auto') {
                            router.push({
                              pathname: '/auto-list',
                              params: { selectedServiceId: item.id, serviceType: 'auto' }
                            });
                          }
                        }}
                      >
                        <View style={styles.searchResultContent}>
                          <MaterialIcons 
                            name={
                              item.type === 'apartment' ? 'apartment' :
                              item.type === 'laundry' ? 'local-laundry-service' : 'directions-car'
                            } 
                            size={24} 
                            color={colorPalette.primary} 
                          />
                          <View style={styles.searchResultText}>
                            <ThemedText style={[styles.searchResultTitle, { color: textColor }]}>
                              {item.title}
                            </ThemedText>
                            <ThemedText style={[styles.searchResultSubtitle, { color: subtitleColor }]}>
                              {item.type === 'apartment' ? item.location :
                               item.type === 'laundry' ? item.turnaround : item.duration}
                            </ThemedText>
                          </View>
                          <MaterialIcons name="chevron-right" size={24} color={subtitleColor} />
                        </View>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                    nestedScrollEnabled={true}
                  />
                ) : (
                  <View style={styles.noResultsContainer}>
                    <MaterialIcons name="search-off" size={48} color={subtitleColor} />
                    <ThemedText style={[styles.noResultsText, { color: subtitleColor }]}>
                      No results found for "{searchQuery}"
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Apartment Rentals Carousel */}
            <View style={styles.sectionContainer}> 
              <View style={styles.sectionHeader}> 
                <MaterialIcons name="apartment" size={24} color={colorPalette.primary} />
                <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}> 
                  Apartment Rentals
                </ThemedText>
                {apartments.length > 0 && (
                  <TouchableOpacity 
                    style={styles.seeAllButton}
                    onPress={() => router.push('/apartment-list')}
                  >
                    <ThemedText style={[styles.seeAllText, { color: textColor }]}> 
                      See All
                    </ThemedText>
                    <MaterialIcons name="chevron-right" size={20} color={textColor} />
                  </TouchableOpacity>
                )}
              </View>
          
              {apartments.length > 0 ? (
                <FlatList
                  ref={apartmentFlatListRef}
                  data={apartments}
                  renderItem={renderApartmentItem}
                  horizontal
                  pagingEnabled={!isLargeScreen}
                  snapToInterval={itemWidth + itemSpacing}
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: isLargeScreen ? 0 : 0 }}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: apartmentScrollX } } }],
                    { useNativeDriver: false }
                  )}
                  onScrollBeginDrag={() => {
                    setIsUserInteracting(prev => ({ ...prev, apartments: true }));
                  }}
                  onScrollEndDrag={() => {
                    // Resume auto-sliding after 2 seconds of no interaction
                    setTimeout(() => {
                      setIsUserInteracting(prev => ({ ...prev, apartments: false }));
                    }, 2000);
                  }}
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / (itemWidth + itemSpacing));
                    setActiveApartmentIndex(index);
                    // Resume auto-sliding after scrolling ends
                    setTimeout(() => {
                      setIsUserInteracting(prev => ({ ...prev, apartments: false }));
                    }, 2000);
                  }}
                  keyExtractor={(item) => item.id}
                  nestedScrollEnabled={true}
                  onScrollToIndexFailed={(info) => {
                    // Handle scroll to index failure gracefully
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                      apartmentFlatListRef.current?.scrollToIndex({
                        index: info.index,
                        animated: true,
                      });
                    });
                  }}
                />
              ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <MaterialIcons name="apartment" size={48} color={subtitleColor} />
                  <ThemedText style={{ color: subtitleColor, fontSize: 16, marginTop: 16 }}>
                    No apartments found.
                  </ThemedText>
                </View>
              )}
          
              {apartments.length > 0 && (
                <View style={styles.pagination}> 
                  {apartments.map((_, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.paginationDot,
                        { 
                          backgroundColor: index === activeApartmentIndex ? colorPalette.primary : subtitleColor,
                          opacity: index === activeApartmentIndex ? 1 : 0.4,
                        }
                      ]} 
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Laundry Services Carousel */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="local-laundry-service" size={24} color={colorPalette.primary} />
                <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
                  Laundry Services
                </ThemedText>
                {laundryServices.length > 0 && (
                  <TouchableOpacity 
                    style={styles.seeAllButton}
                    onPress={() => router.push('/laundry-list')}
                  >
                    <ThemedText style={[styles.seeAllText, { color: isDark ? '#fff' : '#000' }]}>
                      See All
                    </ThemedText>
                    <MaterialIcons name="chevron-right" size={20} color={isDark ? '#fff' : '#000'} />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Trigger laundry services loading when user scrolls to this section */}
              <View 
                onLayout={() => loadLaundryServices()}
                style={{ height: 1, width: '100%' }}
              />
              
              {!laundryServicesLoaded ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <MaterialIcons name="local-laundry-service" size={48} color={subtitleColor} />
                  <ThemedText style={{ color: subtitleColor, fontSize: 16, marginTop: 16 }}>
                    Scroll down to load laundry services...
                  </ThemedText>
                </View>
              ) : laundryServices.length > 0 ? (
                <>
                  <FlatList
                    ref={laundryFlatListRef}
                    data={laundryServices}
                    renderItem={({ item }) => renderServiceItem({ item, serviceType: 'laundry' })}
                    horizontal
                    pagingEnabled={!isLargeScreen}
                    snapToInterval={itemWidth + itemSpacing}
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: isLargeScreen ? 0 : 0 }}
                    onScroll={Animated.event(
                      [{ nativeEvent: { contentOffset: { x: laundryScrollX } } }],
                      { useNativeDriver: false }
                    )}
                    onScrollBeginDrag={() => {
                      setIsUserInteracting(prev => ({ ...prev, laundry: true }));
                    }}
                    onScrollEndDrag={() => {
                      // Resume auto-sliding after 2 seconds of no interaction
                      setTimeout(() => {
                        setIsUserInteracting(prev => ({ ...prev, laundry: false }));
                      }, 2000);
                    }}
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(e.nativeEvent.contentOffset.x / (itemWidth + itemSpacing));
                      setActiveLaundryIndex(index);
                      // Resume auto-sliding after scrolling ends
                      setTimeout(() => {
                        setIsUserInteracting(prev => ({ ...prev, laundry: false }));
                      }, 2000);
                    }}
                    keyExtractor={(item) => item.id}
                    nestedScrollEnabled={true}
                    onScrollToIndexFailed={(info) => {
                      // Handle scroll to index failure gracefully
                      const wait = new Promise(resolve => setTimeout(resolve, 500));
                      wait.then(() => {
                        laundryFlatListRef.current?.scrollToIndex({
                          index: info.index,
                          animated: true,
                        });
                      });
                    }}
                  />
                  
                  <View style={styles.pagination}>
                    {laundryServices.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.paginationDot,
                          {
                            backgroundColor: index === activeLaundryIndex ? colorPalette.primary : subtitleColor,
                            opacity: index === activeLaundryIndex ? 1 : 0.4,
                          }
                        ]}
                      />
                    ))}
                  </View>
                </>
              ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <MaterialIcons name="local-laundry-service" size={48} color={subtitleColor} />
                  <ThemedText style={{ color: subtitleColor, fontSize: 16, marginTop: 16 }}>
                    No laundry services found.
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Auto Services Carousel */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="directions-car" size={24} color={colorPalette.primary} />
                <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
                  Car and Motor Services
                </ThemedText>
                {autoServices.length > 0 && (
                  <TouchableOpacity 
                    style={styles.seeAllButton}
                    onPress={() => router.push('/auto-list')}
                  >
                    <ThemedText style={[styles.seeAllText, { color: isDark ? '#fff' : '#000' }]}>
                      See All
                    </ThemedText>
                    <MaterialIcons name="chevron-right" size={20} color={isDark ? '#fff' : '#000'} />
                  </TouchableOpacity>
                )}
              </View>
              
              {autoServices.length > 0 ? (
                <>
                  <FlatList
                    ref={autoFlatListRef}
                    data={autoServices}
                    renderItem={({ item }) => renderServiceItem({ item, serviceType: 'auto' })}
                    horizontal
                    pagingEnabled={!isLargeScreen}
                    snapToInterval={itemWidth + itemSpacing}
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: isLargeScreen ? 0 : 0 }}
                    onScroll={Animated.event(
                      [{ nativeEvent: { contentOffset: { x: autoScrollX } } }],
                      { useNativeDriver: false }
                    )}
                    onScrollBeginDrag={() => {
                      setIsUserInteracting(prev => ({ ...prev, auto: true }));
                    }}
                    onScrollEndDrag={() => {
                      // Resume auto-sliding after 2 seconds of no interaction
                      setTimeout(() => {
                        setIsUserInteracting(prev => ({ ...prev, auto: false }));
                      }, 2000);
                    }}
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(e.nativeEvent.contentOffset.x / (itemWidth + itemSpacing));
                      setActiveAutoIndex(index);
                      // Resume auto-sliding after scrolling ends
                      setTimeout(() => {
                        setIsUserInteracting(prev => ({ ...prev, auto: false }));
                      }, 2000);
                    }}
                    keyExtractor={(item) => item.id}
                    nestedScrollEnabled={true}
                    onScrollToIndexFailed={(info) => {
                      // Handle scroll to index failure gracefully
                      const wait = new Promise(resolve => setTimeout(resolve, 500));
                      wait.then(() => {
                        autoFlatListRef.current?.scrollToIndex({
                          index: info.index,
                          animated: true,
                        });
                      });
                    }}
                  />
                  
                  <View style={styles.pagination}>
                    {autoServices.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.paginationDot,
                          {
                            backgroundColor: index === activeAutoIndex ? colorPalette.primary : subtitleColor,
                            opacity: index === activeAutoIndex ? 1 : 0.4,
                          }
                        ]}
                      />
                    ))}
                  </View>
                </>
              ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <MaterialIcons name="directions-car" size={48} color={subtitleColor} />
                  <ThemedText style={{ color: subtitleColor, fontSize: 16, marginTop: 16 }}>
                    No auto services found.
                  </ThemedText>
                </View>
              )}
            </View>
          </ScrollView>
        </ThemedView>
      );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: isLargeScreen ? 24 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  searchText: {
    marginLeft: 12,
    fontSize: 16,
    flex: 1,
  },
  searchResultsContainer: {
    marginBottom: 24,
    maxHeight: 400,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchResultItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    padding: 16,
  },
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultText: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  searchResultSubtitle: {
    fontSize: 14,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: isLargeScreen ? 40 : 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 'auto',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
  },
  carouselItem: {
    borderRadius: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  carouselImage: {
    width: '100%',
    height: 200,
  },
  itemOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 80,
    justifyContent: 'center',
  },
  availabilityText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  priceTag: {
    backgroundColor: colorPalette.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priceText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  itemContent: {
    padding: 16,
  },
  itemTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  ratingContainer: {
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 3,
  },
  reviewsText: {
    fontSize: 10,
    marginLeft: 3,
  },
  locationContainer: {
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  addressText: {
    fontSize: 10,
    marginLeft: 3,
    fontStyle: 'italic',
  },
  apartmentDetailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 4,
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '500',
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
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  bookButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  serviceItem: {
    borderRadius: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  serviceImage: {
    width: '100%',
    height: 200,
  },
  serviceContent: {
    padding: 16,
  },
  serviceTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  serviceDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceButton: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  serviceButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  // Enhanced laundry service styles
  serviceDetailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
});