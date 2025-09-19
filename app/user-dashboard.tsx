import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { RobustImage } from './components/RobustImage';
import { getApartments } from './services/apartmentService';
import { getAutoServices } from './services/autoService';
import { getLaundryServices } from './services/laundryService';
import { FirebaseUserReservation, listenToUserReservations } from './services/reservationService';
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

  const [apartments, setApartments] = useState<any[]>([]);
  const [autoServices, setAutoServices] = useState<any[]>([]);
  const [laundryServices, setLaundryServices] = useState<any[]>([]);
  
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

  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const apartmentsData = await getApartments();
        setApartments(apartmentsData);
      } catch (error) {
        console.error('Error fetching apartments:', error);
      }
    };
    fetchApartments();
  }, []);

  useEffect(() => {
    const fetchAutoServices = async () => {
      try {
        const autoServicesData = await getAutoServices();
        setAutoServices(autoServicesData);
      } catch (error) {
        console.error('Error fetching auto services:', error);
      }
    };
    fetchAutoServices();
  }, []);

  useEffect(() => {
    const fetchLaundryServices = async () => {
      try {
        const laundryServicesData = await getLaundryServices();
        setLaundryServices(laundryServicesData);
      } catch (error) {
        console.error('Error fetching laundry services:', error);
      }
    };
    fetchLaundryServices();
  }, []);

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
        <View style={styles.ratingBadge}> 
          <MaterialIcons name="star" size={16} color="#FFD700" />
          <ThemedText style={styles.ratingText}>{item.rating}</ThemedText>
        </View>
        <View style={styles.priceTag}> 
          <ThemedText style={styles.priceText}>{formatPHP(item.price)}</ThemedText>
        </View>
      </View>
      <View style={[styles.itemContent, { backgroundColor: cardBgColor }]}> 
        <ThemedText type="subtitle" style={[styles.itemTitle, { color: textColor, fontSize: isLargeScreen ? 16 : 18 }]}> 
          {item.title}
        </ThemedText>
        <View style={styles.locationRow}> 
          <MaterialIcons name="location-on" size={16} color={colorPalette.primary} />
          <ThemedText style={[styles.locationText, { color: subtitleColor }]}> 
            {item.location}
          </ThemedText>
        </View>
        <View style={styles.amenitiesContainer}> 
          {item.amenities?.slice(0, isLargeScreen ? 2 : isTablet ? 3 : 4).map((amenity: string, index: number) => (
            <View key={index} style={styles.amenityBadge}> 
              <ThemedText style={styles.amenityText}>{amenity}</ThemedText>
            </View>
          ))}
        </View>
        <TouchableOpacity 
          style={[styles.bookButton, { backgroundColor: colorPalette.primary }]} 
          onPress={() => router.push({
            pathname: '/apartment-list',
            params: { selectedItem: JSON.stringify(item) }
          })}
        >
          <ThemedText style={styles.bookButtonText}>View Details</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderServiceItem = ({ item, serviceType }: { item: any, serviceType: string }) => (
    <View style={[styles.serviceItem, { width: itemWidth, marginRight: itemSpacing, backgroundColor: cardBgColor }]}> 
      <RobustImage 
        source={item.image} 
        style={[styles.serviceImage, { height: isLargeScreen ? 100 : isTablet ? 110 : 120 }]} 
        resizeMode="cover"
      />
      <View style={styles.serviceContent}> 
        <ThemedText type="subtitle" style={[styles.serviceTitle, { color: textColor, fontSize: isLargeScreen ? 14 : 16 }]}> 
          {item.title}
        </ThemedText>
        <View style={styles.serviceDetails}> 
          <View style={styles.detailRow}> 
            <FontAwesome name="money" size={14} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor, fontSize: isLargeScreen ? 12 : 14 }]}> 
              {formatPHP(item.price)}
            </ThemedText>
          </View>
          <View style={styles.detailRow}> 
            <Ionicons 
              name={serviceType === 'laundry' ? 'time-outline' : 'timer-outline'} 
              size={14} 
              color={subtitleColor} 
            />
            <ThemedText style={[styles.detailText, { color: textColor, fontSize: isLargeScreen ? 12 : 14 }]}> 
              {serviceType === 'laundry' ? item.turnaround : item.duration}
            </ThemedText>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.serviceButton, { backgroundColor: colorPalette.primary }]} 
          onPress={() => {
            if (serviceType === 'laundry') {
              router.push({
                pathname: '/laundry-list',
                params: { selectedItem: JSON.stringify(item) }
              });
            } else {
              router.push({
                pathname: '/auto-list',
                params: { selectedItem: JSON.stringify(item) }
              });
            }
          }}
        >
          <ThemedText style={[styles.serviceButtonText, { fontSize: isLargeScreen ? 12 : 14 }]}> 
            View Details
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}> 
      <ScrollView contentContainerStyle={styles.scrollContainer}> 
        {/* Header */}
        <View style={styles.header}> 
          <View> 
                <ThemedText type="title" style={[styles.title, { color: textColor }]}> 
                  {`Welcome${firstName ? `, ${firstName}` : ''}!`}
                </ThemedText>
                <ThemedText type="default" style={[styles.subtitle, { color: subtitleColor }]}> 
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
                              params: { selectedItem: JSON.stringify(item) }
                            });
                          } else if (item.type === 'laundry') {
                            router.push({
                              pathname: '/laundry-list',
                              params: { selectedItem: JSON.stringify(item) }
                            });
                          } else if (item.type === 'auto') {
                            router.push({
                              pathname: '/auto-list',
                              params: { selectedItem: JSON.stringify(item) }
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
                    <ThemedText style={[styles.seeAllText, { color: colorPalette.primary }]}> 
                      See All
                    </ThemedText>
                    <MaterialIcons name="chevron-right" size={20} color={colorPalette.primary} />
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
                    <ThemedText style={[styles.seeAllText, { color: colorPalette.primary }]}>
                      See All
                    </ThemedText>
                    <MaterialIcons name="chevron-right" size={20} color={colorPalette.primary} />
                  </TouchableOpacity>
                )}
              </View>
              
              {laundryServices.length > 0 ? (
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
                  Car and Motor Parts
                </ThemedText>
                {autoServices.length > 0 && (
                  <TouchableOpacity 
                    style={styles.seeAllButton}
                    onPress={() => router.push('/auto-list')}
                  >
                    <ThemedText style={[styles.seeAllText, { color: colorPalette.primary }]}>
                      See All
                    </ThemedText>
                    <MaterialIcons name="chevron-right" size={20} color={colorPalette.primary} />
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
    borderRadius: 16,
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
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ratingText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  serviceImage: {
    width: '100%',
    height: 120,
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
  detailText: {
    marginLeft: 8,
    fontSize: 14,
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
});