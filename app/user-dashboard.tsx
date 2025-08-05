import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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

// Sample data for carousels
const apartmentData = [
  {
    id: '1',
    title: 'Luxury Studio Apartment',
    price: 'P1,200/mo',
    location: 'Downtown',
    image: require('@/assets/images/apartment1.webp'),
    rating: 4.8,
    amenities: ['WiFi', 'Parking', 'Gym'],
  },
  {
    id: '2',
    title: 'Modern 1-Bedroom',
    price: 'P1,500/mo',
    location: 'Midtown',
    image: require('@/assets/images/apartment2.webp'),
    rating: 4.6,
    amenities: ['Pool', 'Laundry', 'Balcony'],
  },
  {
    id: '3',
    title: 'Cozy Studio Loft',
    price: 'P950/mo',
    location: 'Arts District',
    image: require('@/assets/images/apartment3.avif'),
    rating: 4.7,
    amenities: ['Pet-friendly', 'Workspace', 'AC'],
  },
];

const laundryData = [
  {
    id: '1',
    title: 'Premium Wash & Fold',
    price: 'P250/lb',
    turnaround: '24-hour',
    image: require('@/assets/images/laundry1.webp'),
  },
  {
    id: '2',
    title: 'Express Dry Cleaning',
    price: 'From P200',
    turnaround: 'Same day',
    image: require('@/assets/images/laundry2.webp'),
  },
  {
    id: '3',
    title: 'Bulk Laundry Service',
    price: 'P100/bag',
    turnaround: '48-hour',
    image: require('@/assets/images/laundry3.webp'),
  },
];

const autoData = [
  {
    id: '1',
    title: 'Oil Change Service',
    price: 'P300',
    duration: '30 min',
    image: require('@/assets/images/auto2.avif'),
  },
  {
    id: '2',
    title: 'Tire Rotation',
    price: 'P500',
    duration: '45 min',
    image: require('@/assets/images/auto3.avif'),
  },
  {
    id: '3',
    title: 'Full Detail Package',
    price: 'P1000',
    duration: '2 hours',
    image: require('@/assets/images/auto1.jpg'),
  },
];

export default function UserHome() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
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
          {item.amenities.map((amenity: string, index: number) => (
            <View key={index} style={styles.amenityBadge}>
              <ThemedText style={styles.amenityText}>{amenity}</ThemedText>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[styles.bookButton, { backgroundColor: colorPalette.primary }]}>
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
        <TouchableOpacity style={[styles.serviceButton, { backgroundColor: colorPalette.primary }]}>
          <ThemedText style={styles.serviceButtonText}>
            {serviceType === 'laundry' ? 'Schedule Pickup' : 'Book Service'}
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
              Welcome Back!
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
            <TouchableOpacity style={styles.seeAllButton}>
              <ThemedText style={[styles.seeAllText, { color: colorPalette.primary }]}>
                See All
              </ThemedText>
              <MaterialIcons name="chevron-right" size={20} color={colorPalette.primary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={apartmentData}
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
          
          <View style={styles.pagination}>
            {apartmentData.map((_, index) => (
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
        </View>

        {/* Laundry Services Carousel */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="local-laundry-service" size={24} color={colorPalette.primary} />
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              Laundry Services
            </ThemedText>
            <TouchableOpacity style={styles.seeAllButton}>
              <ThemedText style={[styles.seeAllText, { color: colorPalette.primary }]}>
                See All
              </ThemedText>
              <MaterialIcons name="chevron-right" size={20} color={colorPalette.primary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={laundryData}
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
            {laundryData.map((_, index) => (
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
        </View>

        {/* Auto Services Carousel */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="directions-car" size={24} color={colorPalette.primary} />
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              Auto Services
            </ThemedText>
            <TouchableOpacity style={styles.seeAllButton}>
              <ThemedText style={[styles.seeAllText, { color: colorPalette.primary }]}>
                See All
              </ThemedText>
              <MaterialIcons name="chevron-right" size={20} color={colorPalette.primary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={autoData}
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
            {autoData.map((_, index) => (
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
    paddingBottom: 40,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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