import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

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

// Extended apartment data with more details
const apartmentData = [
  {
    id: '1',
    title: 'Luxury Studio Apartment',
    price: 'P1,200/mo',
    location: 'Downtown',
    address: '123 Main Street, Downtown',
    image: require('@/assets/images/apartment1.webp'),
    rating: 4.8,
    reviews: 124,
    amenities: ['WiFi', 'Parking', 'Gym', 'Pool', 'Security'],
    description: 'Modern studio apartment with premium amenities and city views. Perfect for young professionals.',
    size: '45 sqm',
    bedrooms: 1,
    bathrooms: 1,
    available: true,
  },
  {
    id: '2',
    title: 'Modern 1-Bedroom',
    price: 'P1,500/mo',
    location: 'Midtown',
    address: '456 Oak Avenue, Midtown',
    image: require('@/assets/images/apartment2.webp'),
    rating: 4.6,
    reviews: 89,
    amenities: ['Pool', 'Laundry', 'Balcony', 'AC', 'Kitchen'],
    description: 'Spacious 1-bedroom apartment with modern appliances and beautiful balcony views.',
    size: '65 sqm',
    bedrooms: 1,
    bathrooms: 1,
    available: true,
  },
  {
    id: '3',
    title: 'Cozy Studio Loft',
    price: 'P950/mo',
    location: 'Arts District',
    address: '789 Creative Lane, Arts District',
    image: require('@/assets/images/apartment3.avif'),
    rating: 4.7,
    reviews: 156,
    amenities: ['Pet-friendly', 'Workspace', 'AC', 'High Ceilings'],
    description: 'Unique loft-style studio perfect for artists and creatives. High ceilings and natural light.',
    size: '40 sqm',
    bedrooms: 1,
    bathrooms: 1,
    available: true,
  },
  {
    id: '4',
    title: 'Premium 2-Bedroom',
    price: 'P2,200/mo',
    location: 'Uptown',
    address: '321 Luxury Blvd, Uptown',
    image: require('@/assets/images/apartment1.webp'),
    rating: 4.9,
    reviews: 203,
    amenities: ['WiFi', 'Parking', 'Gym', 'Pool', 'Security', 'Doorman'],
    description: 'Luxurious 2-bedroom apartment with premium finishes and concierge service.',
    size: '85 sqm',
    bedrooms: 2,
    bathrooms: 2,
    available: true,
  },
  {
    id: '5',
    title: 'Garden View Studio',
    price: 'P1,100/mo',
    location: 'Green District',
    address: '654 Garden Street, Green District',
    image: require('@/assets/images/apartment2.webp'),
    rating: 4.5,
    reviews: 67,
    amenities: ['Garden Access', 'Balcony', 'AC', 'Quiet Area'],
    description: 'Peaceful studio with garden views, perfect for nature lovers and quiet living.',
    size: '42 sqm',
    bedrooms: 1,
    bathrooms: 1,
    available: true,
  },
  {
    id: '6',
    title: 'Executive 1-Bedroom',
    price: 'P1,800/mo',
    location: 'Business District',
    address: '987 Corporate Plaza, Business District',
    image: require('@/assets/images/apartment3.avif'),
    rating: 4.8,
    reviews: 145,
    amenities: ['Business Center', 'Conference Room', 'Gym', 'Parking', 'Security'],
    description: 'Executive apartment with business amenities, ideal for professionals and entrepreneurs.',
    size: '70 sqm',
    bedrooms: 1,
    bathrooms: 1,
    available: true,
  },
];

export default function ApartmentListScreen() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'studio', label: 'Studio' },
    { id: '1bed', label: '1 Bedroom' },
    { id: '2bed', label: '2 Bedroom' },
    { id: 'luxury', label: 'Luxury' },
  ];

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
    let filteredData = apartmentData;
    
    // Apply category filter
    switch (selectedFilter) {
      case 'studio':
        filteredData = apartmentData.filter(apt => apt.title.toLowerCase().includes('studio'));
        break;
      case '1bed':
        filteredData = apartmentData.filter(apt => apt.title.toLowerCase().includes('1-bedroom') || apt.title.toLowerCase().includes('1 bedroom'));
        break;
      case '2bed':
        filteredData = apartmentData.filter(apt => apt.title.toLowerCase().includes('2-bedroom') || apt.title.toLowerCase().includes('2 bedroom'));
        break;
      case 'luxury':
        filteredData = apartmentData.filter(apt => apt.title.toLowerCase().includes('luxury') || apt.title.toLowerCase().includes('premium') || apt.title.toLowerCase().includes('executive'));
        break;
      default:
        filteredData = apartmentData;
    }
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(apt => 
        apt.title.toLowerCase().includes(query) ||
        apt.location.toLowerCase().includes(query) ||
        apt.description.toLowerCase().includes(query) ||
        apt.amenities.some(amenity => amenity.toLowerCase().includes(query))
      );
    }
    
    return filteredData;
  };

  const renderApartmentItem = ({ item }: { item: any }) => (
    <View
      style={[styles.apartmentCard, { backgroundColor: cardBgColor, borderColor }]}
    >
      <Image source={item.image} style={styles.apartmentImage} resizeMode="cover" />
      <View style={styles.apartmentContent}>
        <View style={styles.apartmentHeader}>
          <ThemedText type="subtitle" style={[styles.apartmentTitle, { color: textColor }]}>
            {item.title}
          </ThemedText>
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <ThemedText style={styles.ratingText}>{item.rating}</ThemedText>
            <ThemedText style={[styles.reviewText, { color: subtitleColor }]}>
              ({item.reviews})
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={16} color={colorPalette.primary} />
          <ThemedText style={[styles.locationText, { color: subtitleColor }]}>
            {item.location}
          </ThemedText>
        </View>
        
        <ThemedText style={[styles.description, { color: subtitleColor }]}>
          {item.description}
        </ThemedText>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <MaterialIcons name="bed" size={16} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}>
              {item.bedrooms} bed
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="bathroom" size={16} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}>
              {item.bathrooms} bath
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="square-foot" size={16} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}>
              {item.size}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.amenitiesContainer}>
          {item.amenities.slice(0, 3).map((amenity: string, index: number) => (
            <View key={index} style={styles.amenityBadge}>
              <ThemedText style={styles.amenityText}>{amenity}</ThemedText>
            </View>
          ))}
          {item.amenities.length > 3 && (
            <ThemedText style={[styles.moreAmenities, { color: subtitleColor }]}>
              +{item.amenities.length - 3} more
            </ThemedText>
          )}
        </View>
        
        <View style={styles.priceRow}>
          <ThemedText type="subtitle" style={[styles.priceText, { color: colorPalette.primary }]}>
            {item.price}
          </ThemedText>
          <TouchableOpacity style={[styles.viewButton, { backgroundColor: colorPalette.primary }]}>
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

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={filters}
          renderItem={renderFilterButton}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Apartments List */}
      <FlatList
        data={getFilteredApartments()}
        renderItem={renderApartmentItem}
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
                placeholder="Search by title, location, amenities..."
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
}); 