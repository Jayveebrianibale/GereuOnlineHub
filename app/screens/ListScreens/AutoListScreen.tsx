import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { push, ref, set } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { FullScreenImageViewer } from '../../components/FullScreenImageViewer';
import { RobustImage } from '../../components/RobustImage';
import { useAdminReservation } from '../../contexts/AdminReservationContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { useReservation } from '../../contexts/ReservationContext';
import { db } from '../../firebaseConfig';
import {
    AutoService,
    getAutoServices,
} from '../../services/autoService';
import {
    cacheAutoServices,
    getCachedAutoServices
} from '../../services/dataCache';
import { notifyAdmins } from '../../services/notificationService';
import { formatPHP } from '../../utils/currency';
import { mapServiceToAdminReservation } from '../../utils/reservationUtils';

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
  const params = useLocalSearchParams();
  const isDark = colorScheme === 'dark';
  const { reservedAutoServices, reserveAutoService, removeAutoReservation } = useReservation();
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
  const [selectedAutoService, setSelectedAutoService] = useState<any>(null);
  const [autoServices, setAutoServices] = useState<AutoService[]>([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const handleImagePress = (imageSource: string) => {
    setSelectedImage(imageSource);
    setImageViewerVisible(true);
  };

  const handleMessageAdmin = async (service: any) => {
    try {
      if (!user?.email) return;
      const ADMIN_EMAIL = 'jayveebriani@gmail.com';
      const ADMIN_NAME = 'Jayvee Briani';
      const chatId = [user.email, ADMIN_EMAIL].sort().join('_');

      const priceText = typeof service?.price !== 'undefined' ? `Price: ${formatPHP(service.price)}` : '';
      const messageText = `I'm interested in Auto Service: ${service?.title || 'Auto Service'}\n${priceText}\nDuration: ${service?.duration || 'N/A'}`;

      const newMsgRef = push(ref(db, 'messages'));
      await set(newMsgRef, {
        id: newMsgRef.key,
        chatId,
        text: messageText,
        image: service?.image || null,
        category: 'auto',
        serviceId: service?.id || null,
        senderEmail: user.email,
        senderName: user.displayName || 'User',
        recipientEmail: ADMIN_EMAIL,
        recipientName: ADMIN_NAME,
        timestamp: Date.now(),
        time: Date.now(),
      });

      setDetailModalVisible(false);
      router.push(`/chat/${encodeURIComponent(chatId)}?recipientName=${encodeURIComponent(ADMIN_NAME)}&recipientEmail=${encodeURIComponent(ADMIN_EMAIL)}&currentUserEmail=${encodeURIComponent(user.email)}`);
    } catch (e) {
      console.error('Error sending interest message:', e);
    }
  };
  const handleAutoReservation = async (service: any) => {
    const isReserved = reservedAutoServices.some(s => (s as any).serviceId === service.id);
    if (!isReserved) {
      try {
        // Add to user reservations with pending status
        const serviceWithStatus = { ...service, status: 'pending' as const };
        await reserveAutoService(serviceWithStatus);
        
        // Create admin reservation
        if (user) {
          const adminReservationData = mapServiceToAdminReservation(
            service,
            'auto',
            user.uid,
            user.displayName || 'Unknown User',
            user.email || 'No email'
          );
          await addAdminReservation(adminReservationData);

          // Notify admins of new auto service reservation
          await notifyAdmins(
            'New Auto Reservation',
            `${user.displayName || 'A user'} reserved ${service.title || 'an auto service'}.`,
            {
              serviceType: 'auto',
              serviceId: service.id,
              userId: user.uid,
              action: 'reserved',
            }
          );
        }
        
        setDetailModalVisible(false);
        setSelectedAutoService(null);
        
        // Show success message and redirect to bookings
        Alert.alert(
          'Reservation Successful!',
          `You have successfully reserved ${service.title}. You can view your reservations in the Bookings tab.`,
          [
            {
              text: 'View Bookings',
              onPress: () => router.push('/(user-tabs)/bookings')
            }
          ]
        );
      } catch (error) {
        console.error('Error reserving auto service:', error);
        Alert.alert(
          'Reservation Failed',
          'Sorry, we couldn\'t process your reservation. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } else {
      try {
        await removeAutoReservation(service.id);
        Alert.alert(
          'Reservation Cancelled',
          'Your reservation has been cancelled.',
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('Error removing auto reservation:', error);
        Alert.alert(
          'Error',
          'Failed to cancel reservation. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };
  // Removed unused loading state

  // Handle navigation parameters
  useEffect(() => {
    const selectedServiceId = params.selectedServiceId as string;
    const serviceType = params.serviceType as string;
    
    if (selectedServiceId && serviceType === 'auto') {
      // Check cache first
      const cachedServices = getCachedAutoServices();
      if (cachedServices) {
        const selectedService = cachedServices.find(service => service.id === selectedServiceId);
        if (selectedService) {
          setSelectedAutoService(selectedService);
          setDetailModalVisible(true);
        }
        return;
      }
      
      // If not in cache, wait for data to load
      const checkForService = () => {
        const service = autoServices.find(s => s.id === selectedServiceId);
        if (service) {
          setSelectedAutoService(service);
          setDetailModalVisible(true);
        }
      };
      
      // Check immediately and also after a short delay
      checkForService();
      setTimeout(checkForService, 1000);
    }
  }, [params.selectedServiceId, params.serviceType, autoServices]);

  // Fetch auto services from Firebase or cache
  useEffect(() => {
    const fetchAutoServices = async () => {
      try {
        // Check cache first
        const cachedServices = getCachedAutoServices();
        if (cachedServices) {
          console.log('🚀 Using cached auto services data in auto list');
          setAutoServices(cachedServices);
          return;
        }

        console.log('📡 Fetching auto services from Firebase in auto list...');
        const autoServicesData = await getAutoServices();
        setAutoServices(autoServicesData);
        
        // Cache the data for future use
        cacheAutoServices(autoServicesData);
      } catch (error) {
        console.error('Error fetching auto services:', error);
      }
    };
    fetchAutoServices();
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

  const renderAutoItem = ({ item }: { item: any }) => (
    <View
      style={[styles.autoCard, { backgroundColor: cardBgColor, borderColor }]}
    >
      <RobustImage source={item.image} style={styles.autoImage} resizeMode="cover" />
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
              {formatPHP(item.price)}
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
            {formatPHP(item.price)}
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

  const filteredServices = getFilteredAutoServices();

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBgColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colorPalette.primary} />
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.headerTitle, { color: textColor }]}>
          Car & Motor Parts
        </ThemedText>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => setSearchVisible(true)}
        >
          <MaterialIcons name="search" size={24} color={colorPalette.primary} />
        </TouchableOpacity>
      </View>

      {/* Auto Services List or No Results Message */}
      {filteredServices.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <MaterialIcons name="car-repair" size={64} color={subtitleColor} />
          <ThemedText type="subtitle" style={[styles.noResultsText, { color: textColor }]}>
            No Auto-Services found
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          renderItem={renderAutoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
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
                {filteredServices.length} results found
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
                   <TouchableOpacity 
                    onPress={() => handleImagePress(selectedAutoService.image)}
                    activeOpacity={0.8}
                  >
                    <RobustImage source={selectedAutoService.image} style={styles.detailImage} resizeMode="cover" />
                    <View style={styles.imageOverlay}>
                      <MaterialIcons name="zoom-in" size={24} color="#fff" />
                    </View>
                  </TouchableOpacity>
                   
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
                         {formatPHP(selectedAutoService.price)}
                       </ThemedText>
                     </View>
                     
                     <ThemedText style={[styles.detailDescription, { color: subtitleColor }]}>
                       {selectedAutoService.description}
                     </ThemedText>
                     
                     <View style={styles.detailSpecs}>
                       <View style={styles.detailItem}>
                         <MaterialIcons name="attach-money" size={20} color={subtitleColor} />
                         <ThemedText style={[styles.detailText, { color: textColor }]}> 
                           {formatPHP(selectedAutoService.price)}
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
                       <TouchableOpacity style={[styles.contactButton, { backgroundColor: colorPalette.primary }]} onPress={() => handleMessageAdmin(selectedAutoService)}>
                         <MaterialIcons name="message" size={20} color="#fff" />
                         <ThemedText style={styles.contactButtonText}>Message</ThemedText>
                       </TouchableOpacity>
                       <TouchableOpacity
                         style={[
                           styles.bookButton,
                           {
                             borderColor: colorPalette.primary,
                             backgroundColor: (() => {
                               const match = reservedAutoServices.find(s => (s as any).serviceId === selectedAutoService.id);
                               const status = (match as any)?.status;
                               const active = status === 'pending' || status === 'confirmed';
                               return active ? colorPalette.primary : 'transparent';
                             })(),
                           }
                         ]}
                         onPress={() => handleAutoReservation(selectedAutoService)}
                       >
                         {(() => {
                           const match = reservedAutoServices.find(s => (s as any).serviceId === selectedAutoService.id);
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
                               const match = reservedAutoServices.find(s => (s as any).serviceId === selectedAutoService.id);
                               const status = (match as any)?.status;
                               const active = status === 'pending' || status === 'confirmed';
                               return { color: active ? '#fff' : colorPalette.primary };
                             })()
                           ]}
                         >
                           {(() => {
                             const match = reservedAutoServices.find(s => (s as any).serviceId === selectedAutoService.id);
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
        
        {/* Full Screen Image Viewer */}
        <FullScreenImageViewer
          visible={imageViewerVisible}
          imageSource={selectedImage || ''}
          onClose={() => setImageViewerVisible(false)}
          title="Auto Service Image"
        />
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
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubtext: {
    textAlign: 'center',
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
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
});