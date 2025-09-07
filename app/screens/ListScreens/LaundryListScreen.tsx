import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { RobustImage } from '../../components/RobustImage';
import { useAdminReservation } from '../../contexts/AdminReservationContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { useReservation } from '../../contexts/ReservationContext';
import { getLaundryServices } from '../../services/laundryService';
import { formatPHP } from '../../utils/currency';
import { mapServiceToAdminReservation } from '../../utils/reservationUtils';

import { FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

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
  const isDark = colorScheme === 'dark';
  const { reservedLaundryServices, reserveLaundryService, removeLaundryReservation } = useReservation();
  const { addAdminReservation } = useAdminReservation();
  const { user } = useAuthContext();
  
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
  
  const handleLaundryReservation = async (service: any) => {
    const isReserved = reservedLaundryServices.some(s => (s as any).serviceId === service.id);
    if (!isReserved) {
      try {
        // Add to user reservations with pending status
        const serviceWithStatus = { ...service, status: 'pending' as const };
        await reserveLaundryService(serviceWithStatus);
        
        // Create admin reservation
        if (user) {
          const adminReservationData = mapServiceToAdminReservation(
            service,
            'laundry',
            user.uid,
            user.displayName || 'Unknown User',
            user.email || 'No email'
          );
          await addAdminReservation(adminReservationData);
        }
        
        setDetailModalVisible(false);
        setSelectedLaundryService(null);
        router.push('/(user-tabs)/bookings');
      } catch (error) {
        console.error('Error reserving laundry service:', error);
      }
    } else {
      try {
        await removeLaundryReservation(service.id);
      } catch (error) {
        console.error('Error removing laundry reservation:', error);
      }
    }
  };

  // Handle navigation parameters
  const params = useLocalSearchParams();
  
  useEffect(() => {
    if (params.selectedItem) {
      try {
        const selectedItem = JSON.parse(params.selectedItem as string);
        setSelectedLaundryService(selectedItem);
        setDetailModalVisible(true);
      } catch (error) {
        console.error('Error parsing selected item:', error);
      }
    }
  }, [params.selectedItem]);

  // Fetch laundry services from Firebase
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
                   <RobustImage source={selectedLaundryService.image} style={styles.detailImage} resizeMode="cover" />
                   
                   <View style={styles.detailContent}>
                     <View style={styles.detailRatingRow}>
                       <View style={styles.ratingContainer}>
                         <MaterialIcons name="star" size={16} color="#FFD700" />
                         <ThemedText style={styles.ratingText}>{selectedLaundryService.rating}</ThemedText>
                         <ThemedText style={[styles.reviewText, { color: subtitleColor }]}>
                           ({selectedLaundryService.reviews} reviews)
                         </ThemedText>
                       </View>
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
                           <MaterialIcons name="delivery-dining" size={16} color={colorPalette.primary} />
                           <ThemedText style={[styles.infoText, { color: subtitleColor }]}>
                             {selectedLaundryService.delivery}
                           </ThemedText>
                         </View>
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
                         onPress={() => router.push('/(user-tabs)/messages')}
                         >
                         <MaterialIcons name="message" size={20} color="#fff" />
                         <ThemedText style={styles.contactButtonText}>Message</ThemedText>
                       </TouchableOpacity>
                       <TouchableOpacity
                         style={[
                           styles.bookButton,
                           {
                             borderColor: colorPalette.primary,
                             backgroundColor: (() => {
                               const match = reservedLaundryServices.find(s => (s as any).serviceId === selectedLaundryService.id);
                               const status = (match as any)?.status;
                               const active = status === 'pending' || status === 'confirmed';
                               return active ? colorPalette.primary : 'transparent';
                             })(),
                           },
                         ]}
                         onPress={() => handleLaundryReservation(selectedLaundryService)}
                       >
                         {(() => {
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
                             return active ? 'Reserved' : 'Reserve';
                           })()}
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
  infoSection: {
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
  infoGrid: {
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
    alignItems: 'stretch',
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  bookButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});