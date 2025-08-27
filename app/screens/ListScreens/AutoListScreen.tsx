import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import {
    AutoService,
    getAutoServices,
} from '../../services/autoService';

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

export default function AutoListScreen() {
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
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAutoService, setSelectedAutoService] = useState<any>(null);
  const [autoServices, setAutoServices] = useState<AutoService[]>([]);
  // Removed unused loading state

  // Handle navigation parameters
  const params = useLocalSearchParams();
  
  useEffect(() => {
    if (params.selectedItem) {
      try {
        const selectedItem = JSON.parse(params.selectedItem as string);
        setSelectedAutoService(selectedItem);
        setDetailModalVisible(true);
      } catch (error) {
        console.error('Error parsing selected item:', error);
      }
    }
  }, [params.selectedItem]);

  // Fetch auto services from Firebase
  useEffect(() => {
    getAutoServices()
      .then(setAutoServices)
      .catch(console.error);
  }, []);

  const filters = [
    { id: 'all', label: 'All Services' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'repair', label: 'Repair' },
    { id: 'detail', label: 'Detailing' },
    { id: 'emergency', label: 'Emergency' },
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

  const renderAutoItem = ({ item }: { item: any }) => (
    <View
      style={[styles.autoCard, { backgroundColor: cardBgColor, borderColor }]}
    >
      <Image source={item.image} style={styles.autoImage} resizeMode="cover" />
      <View style={styles.autoContent}>
        <View style={styles.autoHeader}>
          <ThemedText type="subtitle" style={[styles.autoTitle, { color: textColor }]}>
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
            <MaterialIcons name="attach-money" size={16} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}>
              {item.price}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="timer-outline" size={16} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}>
              {item.duration}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="verified" size={16} color={subtitleColor} />
            <ThemedText style={[styles.detailText, { color: textColor }]}>
              {item.warranty}
            </ThemedText>
          </View>
        </View>
        
       <View style={styles.servicesContainer}>
        {item?.services?.map((service: string, index: number) => (
          <View key={index} style={styles.serviceBadge}>
            <ThemedText style={styles.serviceText}>{service}</ThemedText>
          </View>
        ))}
      </View>

        
        <View style={styles.includesContainer}>
          <ThemedText style={[styles.includesTitle, { color: textColor }]}>
            Includes:
          </ThemedText>
          <View style={styles.includesList}>
            {(item.includes || []).map((include: string, index: number) => (
              <View key={index} style={styles.includeItem}>
                <MaterialIcons name="check-circle" size={14} color={colorPalette.primary} />
                <ThemedText style={[styles.includeText, { color: subtitleColor }]}>
                  {include}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.priceRow}>
          <ThemedText type="subtitle" style={[styles.priceText, { color: colorPalette.primary }]}>
            {item.price}
          </ThemedText>
          <TouchableOpacity 
            style={[styles.viewButton, { backgroundColor: colorPalette.primary }]}
            onPress={() => {
              setSelectedAutoService(item);
              setDetailModalVisible(true);
            }}
          >
            <ThemedText style={styles.viewButtonText}>View Details</ThemedText>
          </TouchableOpacity>
        </View>
              </View>
      </View>
    );

  // Add new auto service
  // Removed unused handleAddService function

  // Update auto service
  // const handleUpdateService = async (id: string, updates: Partial<AutoService>) => {
  //   try {
  //     await updateAutoService(id, updates);
  //     setAutoServices(prev =>
  //       prev.map(s => (s.id === id ? { ...s, ...updates } : s))
  //     );
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // Delete auto service
  // const handleDeleteService = async (id: string) => {
  //   try {
  //     await deleteAutoService(id);
  //     setAutoServices(prev => prev.filter(s => s.id !== id));
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  function getFilteredAutoServices() {
    let filtered = autoServices;
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(service => service.category === selectedFilter);
    }
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        (service.services && service.services.some((s: string) => s.toLowerCase().includes(query)))
      );
    }
    return filtered;
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBgColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colorPalette.primary} />
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.headerTitle, { color: textColor }]}>
          Auto Services
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

      {/* Auto Services List */}
      <FlatList
        data={getFilteredAutoServices()}
        renderItem={renderAutoItem}
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
                Search Auto Services
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
                {getFilteredAutoServices().length} results found
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
             {selectedAutoService && (
               <>
                 <View style={styles.detailHeader}>
                   <ThemedText type="title" style={[styles.detailTitle, { color: textColor }]}>
                     {selectedAutoService.title}
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
                   <Image source={selectedAutoService.image} style={styles.detailImage} resizeMode="cover" />
                   
                   <View style={styles.detailContent}>
                     <View style={styles.detailRatingRow}>
                       <View style={styles.ratingContainer}>
                         <MaterialIcons name="star" size={16} color="#FFD700" />
                         <ThemedText style={styles.ratingText}>{selectedAutoService.rating}</ThemedText>
                         <ThemedText style={[styles.reviewText, { color: subtitleColor }]}>
                           ({selectedAutoService.reviews} reviews)
                         </ThemedText>
                       </View>
                       <ThemedText type="subtitle" style={[styles.detailPrice, { color: colorPalette.primary }]}>
                         {selectedAutoService.price}
                       </ThemedText>
                     </View>
                     
                     <ThemedText style={[styles.detailDescription, { color: subtitleColor }]}>
                       {selectedAutoService.description}
                     </ThemedText>
                     
                     <View style={styles.detailSpecs}>
                       <View style={styles.detailItem}>
                         <MaterialIcons name="attach-money" size={20} color={subtitleColor} />
                         <ThemedText style={[styles.detailText, { color: textColor }]}>
                           {selectedAutoService.price}
                         </ThemedText>
                       </View>
                       <View style={styles.detailItem}>
                         <Ionicons name="timer-outline" size={20} color={subtitleColor} />
                         <ThemedText style={[styles.detailText, { color: textColor }]}>
                           {selectedAutoService.duration}
                         </ThemedText>
                       </View>
                       <View style={styles.detailItem}>
                         <MaterialIcons name="verified" size={20} color={subtitleColor} />
                         <ThemedText style={[styles.detailText, { color: textColor }]}>
                           {selectedAutoService.warranty}
                         </ThemedText>
                       </View>
                     </View>
                     
                     <View style={styles.servicesSection}>
                       <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
                         Services Included
                       </ThemedText>
                       <View style={styles.servicesGrid}>
                        {selectedAutoService?.services?.map((service: string, index: number) => (
                          <View key={index} style={styles.serviceItem}>
                            <MaterialIcons name="check-circle" size={16} color={colorPalette.primary} />
                            <ThemedText style={[styles.serviceItemText, { color: subtitleColor }]}>
                              {service}
                            </ThemedText>
                          </View>
                        ))}
                      </View>

                     </View>
                     
                     <View style={styles.includesSection}>
                       <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
                         What&apos;s Included
                       </ThemedText>
                       <View style={styles.includesGrid}>
                        {selectedAutoService?.includes?.map((include: string, index: number) => (
                          <View key={index} style={styles.includeItem}>
                            <MaterialIcons name="check-circle" size={16} color={colorPalette.primary} />
                            <ThemedText style={[styles.includeText, { color: subtitleColor }]}>
                              {include}
                            </ThemedText>
                          </View>
                        ))}
                      </View>

                     </View>
                     
                     <View style={styles.detailActions}>
                       <TouchableOpacity style={[styles.contactButton, { backgroundColor: colorPalette.primary }]}>
                         <MaterialIcons name="phone" size={20} color="#fff" />
                         <ThemedText style={styles.contactButtonText}>Contact Service</ThemedText>
                       </TouchableOpacity>
                       <TouchableOpacity style={[styles.bookButton, { borderColor: colorPalette.primary }]}>
                         <ThemedText style={[styles.bookButtonText, { color: colorPalette.primary }]}>
                           Book Now
                         </ThemedText>
                       </TouchableOpacity>
                     </View>
                   </View>
                 </ScrollView>
               </>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
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
  autoCard: {
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
  autoImage: {
    width: '100%',
    height: 180,
  },
  autoContent: {
    padding: 16,
  },
  autoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  autoTitle: {
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
  includesContainer: {
    marginBottom: 16,
  },
  includesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  includesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  includeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  includeText: {
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
  bookButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bookButtonText: {
    color: '#fff',
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
    borderRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  detailScrollView: {
    // flex: 1, // Removed to fix modal content visibility
  },
  detailScrollContent: {
    paddingBottom: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  detailImage: {
    width: '100%',
    height: 250,
  },
  detailContent: {
    padding: 20,
  },
  detailRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  detailDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  detailSpecs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  servicesSection: {
    marginBottom: 24,
  },
  includesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  includesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  serviceItemText: {
    marginLeft: 8,
    fontSize: 14,
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
});