import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { getApartments } from './services/apartmentService';
import { getAutoServices } from './services/autoService';
import { getLaundryServices } from './services/laundryService';
import { getImageSource } from './utils/imageUtils';

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

const { width: screenWidth } = Dimensions.get('window');
// ...existing code...


export default function UserHome() {
  const [firstName, setFirstName] = useState('');
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const [apartments, setApartments] = useState<any[]>([]);
  const [autoServices, setAutoServices] = useState<any[]>([]);
  const [laundryServices, setLaundryServices] = useState<any[]>([]);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user?.displayName) {
      setFirstName(user.displayName.split(' ')[0]);
    }
  }, []);

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

  const renderApartmentItem = ({ item }: { item: any }) => (
    <View style={[styles.carouselItem, { width: screenWidth - 40 }]}> 
      <Image source={item.image} style={styles.carouselImage} resizeMode="cover" />
      <View style={styles.itemOverlay}> 
        <View style={styles.ratingBadge}> 
          <MaterialIcons name="star" size={16} color="#FFD700" />
          <ThemedText style={styles.ratingText}>{item.rating}</ThemedText>
        </View>
        <View style={styles.priceTag}> 
          <ThemedText style={styles.priceText}>{item.price}</ThemedText>
        </View>
      </View>
      <View style={[styles.itemContent, { backgroundColor: cardBgColor }]}> 
        <ThemedText type="subtitle" style={[styles.itemTitle, { color: textColor }]}> 
          {item.title}
        </ThemedText>
        <View style={styles.locationRow}> 
          <MaterialIcons name="location-on" size={16} color={colorPalette.primary} />
          <ThemedText style={[styles.locationText, { color: subtitleColor }]}> 
            {item.location}
          </ThemedText>
        </View>
        <View style={styles.amenitiesContainer}> 
          {item.amenities?.map((amenity: string, index: number) => (
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
    <View style={[styles.serviceItem, { width: screenWidth - 40, backgroundColor: cardBgColor }]}> 
      <Image source={item.image} style={styles.serviceImage} resizeMode="cover" />
      <View style={styles.serviceContent}> 
        <ThemedText type="subtitle" style={[styles.serviceTitle, { color: textColor }]}> 
          {item.title}
        </ThemedText>
        <View style={styles.serviceDetails}> 
          <View style={styles.detailRow}> 
            <FontAwesome name="money" size={14} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}> 
              {item.price}
            </ThemedText>
          </View>
          <View style={styles.detailRow}> 
            <Ionicons 
              name={serviceType === 'laundry' ? 'time-outline' : 'timer-outline'} 
              size={14} 
              color={subtitleColor} 
            />
            <ThemedText style={[styles.detailText, { color: textColor }]}> 
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
          <ThemedText style={styles.serviceButtonText}> 
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
                <TouchableOpacity style={styles.iconButton}> 
                  <MaterialIcons name="notifications-none" size={28} color={colorPalette.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}> 
                  <MaterialIcons name="account-circle" size={28} color={colorPalette.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Bar */}
            <TouchableOpacity style={[styles.searchBar, { backgroundColor: cardBgColor, borderColor }]}> 
              <MaterialIcons name="search" size={24} color={subtitleColor} />
              <ThemedText style={[styles.searchText, { color: subtitleColor }]}> 
                Search for services...
              </ThemedText>
            </TouchableOpacity>

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
                  data={apartments}
                  renderItem={renderApartmentItem}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: apartmentScrollX } } }],
                    { useNativeDriver: false }
                  )}
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 40));
                    setActiveApartmentIndex(index);
                  }}
                  keyExtractor={(item) => item.id}
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
                    data={laundryServices}
                    renderItem={({ item }) => renderServiceItem({ item, serviceType: 'laundry' })}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={Animated.event(
                      [{ nativeEvent: { contentOffset: { x: laundryScrollX } } }],
                      { useNativeDriver: false }
                    )}
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 40));
                      setActiveLaundryIndex(index);
                    }}
                    keyExtractor={(item) => item.id}
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
                  Auto Services
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
                    data={autoServices}
                    renderItem={({ item }) => renderServiceItem({ item, serviceType: 'auto' })}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={Animated.event(
                      [{ nativeEvent: { contentOffset: { x: autoScrollX } } }],
                      { useNativeDriver: false }
                    )}
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 40));
                      setActiveAutoIndex(index);
                    }}
                    keyExtractor={(item) => item.id}
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
    padding: 20,
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
  },
  sectionContainer: {
    marginBottom: 32,
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
    marginRight: 20,
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
    marginRight: 20,
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