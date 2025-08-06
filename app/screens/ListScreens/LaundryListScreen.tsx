import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
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

// Extended laundry data with more details
const laundryData = [
  {
    id: '1',
    title: 'Premium Wash & Fold',
    price: 'P250/lb',
    turnaround: '24-hour',
    image: require('@/assets/images/laundry1.webp'),
    rating: 4.8,
    reviews: 156,
    description: 'Professional wash and fold service with premium detergents and fabric softeners.',
    services: ['Wash & Fold', 'Starch', 'Fabric Softener'],
    pickup: 'Free pickup',
    delivery: 'Free delivery',
    minOrder: '5 lbs minimum',
    available: true,
  },
  {
    id: '2',
    title: 'Express Dry Cleaning',
    price: 'From P200',
    turnaround: 'Same day',
    image: require('@/assets/images/laundry2.webp'),
    rating: 4.6,
    reviews: 89,
    description: 'Fast dry cleaning service for suits, dresses, and delicate garments.',
    services: ['Dry Cleaning', 'Pressing', 'Spot Treatment'],
    pickup: 'Same day pickup',
    delivery: 'Same day delivery',
    minOrder: 'No minimum',
    available: true,
  },
  {
    id: '3',
    title: 'Bulk Laundry Service',
    price: 'P100/bag',
    turnaround: '48-hour',
    image: require('@/assets/images/laundry3.webp'),
    rating: 4.7,
    reviews: 203,
    description: 'Economical bulk laundry service perfect for families and businesses.',
    services: ['Bulk Wash', 'Folding', 'Packaging'],
    pickup: 'Scheduled pickup',
    delivery: 'Scheduled delivery',
    minOrder: '10 lbs minimum',
    available: true,
  },
  {
    id: '4',
    title: 'Eco-Friendly Laundry',
    price: 'P300/lb',
    turnaround: '48-hour',
    image: require('@/assets/images/laundry1.webp'),
    rating: 4.9,
    reviews: 67,
    description: 'Environmentally friendly laundry service using organic detergents and energy-efficient machines.',
    services: ['Eco Wash', 'Natural Detergents', 'Energy Efficient'],
    pickup: 'Free pickup',
    delivery: 'Free delivery',
    minOrder: '3 lbs minimum',
    available: true,
  },
  {
    id: '5',
    title: 'Delicate Care Service',
    price: 'P400/lb',
    turnaround: '72-hour',
    image: require('@/assets/images/laundry2.webp'),
    rating: 4.8,
    reviews: 124,
    description: 'Specialized care for delicate fabrics, silk, wool, and designer clothing.',
    services: ['Hand Wash', 'Delicate Care', 'Professional Pressing'],
    pickup: 'Free pickup',
    delivery: 'Free delivery',
    minOrder: '2 lbs minimum',
    available: true,
  },
  {
    id: '6',
    title: 'Commercial Laundry',
    price: 'P80/lb',
    turnaround: '24-hour',
    image: require('@/assets/images/laundry3.webp'),
    rating: 4.5,
    reviews: 45,
    description: 'Commercial laundry service for hotels, restaurants, and businesses.',
    services: ['Commercial Wash', 'Industrial Equipment', 'Bulk Processing'],
    pickup: 'Daily pickup',
    delivery: 'Daily delivery',
    minOrder: '50 lbs minimum',
    available: true,
  },
];

export default function LaundryListScreen() {
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
    { id: 'all', label: 'All Services' },
    { id: 'wash', label: 'Wash & Fold' },
    { id: 'dry-clean', label: 'Dry Cleaning' },
    { id: 'bulk', label: 'Bulk Service' },
    { id: 'eco', label: 'Eco-Friendly' },
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

  // Filter laundry services based on selected filter and search query
  const getFilteredLaundryServices = () => {
    let filteredData = laundryData;
    
    // Apply category filter
    switch (selectedFilter) {
      case 'wash':
        filteredData = laundryData.filter(service => 
          service.title.toLowerCase().includes('wash') || 
          service.title.toLowerCase().includes('fold')
        );
        break;
      case 'dry-clean':
        filteredData = laundryData.filter(service => 
          service.title.toLowerCase().includes('dry cleaning') || 
          service.title.toLowerCase().includes('dry clean')
        );
        break;
      case 'bulk':
        filteredData = laundryData.filter(service => 
          service.title.toLowerCase().includes('bulk')
        );
        break;
      case 'eco':
        filteredData = laundryData.filter(service => 
          service.title.toLowerCase().includes('eco') || 
          service.title.toLowerCase().includes('environmental')
        );
        break;
      default:
        filteredData = laundryData;
    }
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(service => 
        service.title.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.services.some(serviceItem => serviceItem.toLowerCase().includes(query))
      );
    }
    
    return filteredData;
  };

  const renderLaundryItem = ({ item }: { item: any }) => (
    <View
      style={[styles.laundryCard, { backgroundColor: cardBgColor, borderColor }]}
    >
      <Image source={item.image} style={styles.laundryImage} resizeMode="cover" />
      <View style={styles.laundryContent}>
        <View style={styles.laundryHeader}>
          <ThemedText type="subtitle" style={[styles.laundryTitle, { color: textColor }]}>
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
        
        <ThemedText style={[styles.description, { color: subtitleColor }]}>
          {item.description}
        </ThemedText>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <FontAwesome name="money" size={16} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}>
              {item.price}
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
          {item.services.map((service: string, index: number) => (
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
            {item.price}
          </ThemedText>
          <TouchableOpacity style={[styles.scheduleButton, { backgroundColor: colorPalette.primary }]}>
            <ThemedText style={styles.scheduleButtonText}>Schedule Pickup</ThemedText>
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scheduleButtonText: {
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