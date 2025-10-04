import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { push, ref, set } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { CustomAlert } from '../../components/CustomAlert';
import { FullScreenImageViewer } from '../../components/FullScreenImageViewer';
import { RobustImage } from '../../components/RobustImage';
import { AUTO_ADMIN } from '../../config/adminConfig';
import { useAuthContext } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import {
    cacheMotorParts,
    getCachedMotorParts
} from '../../services/dataCache';
import {
    MotorPart,
    getMotorParts
} from '../../services/motorPartsService';
import { formatPHP } from '../../utils/currency';
import { isSmallScreen, isTablet, normalize, wp } from '../../utils/responsiveUtils';

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

const categories = [
  { id: 'all', label: 'All Parts', icon: 'settings' },
  { id: 'engine', label: 'Engine', icon: 'build' },
  { id: 'brake', label: 'Brake', icon: 'stop' },
  { id: 'electrical', label: 'Electrical', icon: 'electrical-services' },
  { id: 'body', label: 'Body', icon: 'directions-car' },
  { id: 'accessories', label: 'Accessories', icon: 'star' },
];

export default function MotorPartsListScreen() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isDark = colorScheme === 'dark';
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
  const [selectedPart, setSelectedPart] = useState<MotorPart | null>(null);
  const [motorParts, setMotorParts] = useState<MotorPart[]>([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [homeServiceModalVisible, setHomeServiceModalVisible] = useState(false);
  const [selectedPartForBooking, setSelectedPartForBooking] = useState<MotorPart | null>(null);
  const [problemDescription, setProblemDescription] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  
  const handleImagePress = (imageSource: string) => {
    setSelectedImage(imageSource);
    setImageViewerVisible(true);
  };

  const handleMessageAdmin = async (part: MotorPart) => {
    try {
      if (!user?.email) return;
      const ADMIN_EMAIL = AUTO_ADMIN.email;
      const ADMIN_NAME = AUTO_ADMIN.name;
      const chatId = [user.email, ADMIN_EMAIL].sort().join('_');

       const priceText = typeof part?.price !== 'undefined' ? `Price: ${formatPHP(part.price)}` : '';
       const messageText = `I'm interested in Motor Part: ${part?.name || 'Motor Part'}\n${priceText}\nCategory: ${part?.category || 'N/A'}`;

      const newMsgRef = push(ref(db, 'messages'));
      await set(newMsgRef, {
        id: newMsgRef.key,
        chatId,
        text: messageText,
        image: part?.image || null,
        imageUrl: part?.image || null,
        category: 'motor_parts',
        serviceId: part?.id || null,
        senderEmail: user.email,
        senderName: user.displayName || 'User',
        recipientEmail: ADMIN_EMAIL,
        recipientName: ADMIN_NAME,
        timestamp: Date.now(),
        time: Date.now(),
         messageType: 'motor_parts_inquiry',
         partName: part?.name || 'Motor Part',
         partPrice: part?.price || 0,
         partCategory: part?.category || 'N/A',
      });

      setDetailModalVisible(false);
      router.push(`/chat/${encodeURIComponent(chatId)}?recipientName=${encodeURIComponent(ADMIN_NAME)}&recipientEmail=${encodeURIComponent(ADMIN_EMAIL)}&currentUserEmail=${encodeURIComponent(user.email)}`);
    } catch (e) {
      console.error('Error sending interest message:', e);
    }
  };

  const handleHomeServiceBooking = async () => {
    // Simple validation
    const fields = { problemDescription, address, contactNumber, preferredTime };
    const missingFields = Object.entries(fields).filter(([_, value]) => !value.trim());
    
    if (missingFields.length > 0) {
      Alert.alert('⚠️ Missing Information', 'Please fill in all required fields.');
      return;
    }

    const part = selectedPartForBooking;
    if (!part) return;

    try {
      // Simple home service data
      const homeServiceData = {
        partId: part.id,
        partName: part.name,
        partPrice: part.price,
        partCategory: part.category,
        homeService: true,
        problemDescription: problemDescription.trim(),
        address: address.trim(),
        contactNumber: contactNumber.trim(),
        preferredTime: preferredTime.trim(),
        status: 'pending',
        userId: user?.uid,
        userEmail: user?.email,
        userName: user?.displayName,
        timestamp: new Date().toISOString()
      };

      // Save to database
      const bookingRef = push(ref(db, 'homeServiceBookings'));
      await set(bookingRef, homeServiceData);

      // Reset form
      setProblemDescription('');
      setAddress('');
      setContactNumber('');
      setPreferredTime('');
      setHomeServiceModalVisible(false);
      setSelectedPartForBooking(null);

      // Show custom alert
      setCustomAlertVisible(true);
    } catch (error) {
      Alert.alert('❌ Failed', 'Please try again.');
    }
  };

  const handleHomeServicePress = (part: MotorPart) => {
    setSelectedPartForBooking(part);
    setHomeServiceModalVisible(true);
  };

  // Handle navigation parameters
  useEffect(() => {
    const selectedPartId = params.selectedPartId as string;
    const partType = params.partType as string;
    
    if (selectedPartId && partType === 'motor_parts') {
      // Check cache first
      const cachedParts = getCachedMotorParts();
      if (cachedParts) {
        const selectedPart = cachedParts.find(part => part.id === selectedPartId);
        if (selectedPart) {
          setSelectedPart(selectedPart);
          setDetailModalVisible(true);
        }
        return;
      }
      
      // If not in cache, wait for data to load
      const checkForPart = () => {
        const part = motorParts.find(p => p.id === selectedPartId);
        if (part) {
          setSelectedPart(part);
          setDetailModalVisible(true);
        }
      };
      
      // Check immediately and also after a short delay
      checkForPart();
      setTimeout(checkForPart, 1000);
    }
  }, [params.selectedPartId, params.partType, motorParts]);

  // Fetch motor parts from Firebase or cache
  useEffect(() => {
    const fetchMotorParts = async () => {
      try {
        // Check cache first
        const cachedParts = getCachedMotorParts();
        if (cachedParts) {
          console.log('🚀 Using cached motor parts data');
          setMotorParts(cachedParts);
          return;
        }

        console.log('📡 Fetching motor parts from Firebase...');
        const partsData = await getMotorParts();
        setMotorParts(partsData);
        
        // Cache the data for future use
        cacheMotorParts(partsData);
      } catch (error) {
        console.error('Error fetching motor parts:', error);
      }
    };
    fetchMotorParts();
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
      <MaterialIcons 
        name={item.icon} 
        size={16} 
        color={selectedFilter === item.id ? '#fff' : textColor} 
        style={{ marginRight: 4 }}
      />
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

  const renderPartItem = ({ item }: { item: MotorPart }) => (
    <View
      style={[styles.partCard, { backgroundColor: cardBgColor, borderColor }]}
    >
      <RobustImage source={item.image} style={styles.partImage} resizeMode="cover" />
      <View style={styles.partContent}>
        <View style={styles.partHeader}>
          <ThemedText type="subtitle" style={[styles.partName, { color: textColor }]}>
            {item.name}
          </ThemedText>
        </View>
        
        <ThemedText style={[styles.description, { color: subtitleColor }]}>
          {item.description}
        </ThemedText>
        
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
        
         <View style={styles.detailsRow}>
           <View style={styles.detailItem}>
             <MaterialIcons name="attach-money" size={16} color={subtitleColor} />
             <ThemedText style={[styles.detailText, { color: textColor }]}> 
               {formatPHP(item.price)}
             </ThemedText>
           </View>
           <View style={styles.detailItem}>
             <MaterialIcons name="category" size={16} color={subtitleColor} />
             <ThemedText style={[styles.detailText, { color: textColor }]}>
               {item.category}
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
              setSelectedPart(item);
              setDetailModalVisible(true);
            }}
          >
            <ThemedText style={styles.viewButtonText}>View Details</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  function getFilteredParts() {
    let filtered = motorParts;
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(part => part.category === selectedFilter);
    }
     if (searchQuery.trim().length > 0) {
       const query = searchQuery.trim().toLowerCase();
       filtered = filtered.filter(part =>
         part.name.toLowerCase().includes(query) ||
         part.description.toLowerCase().includes(query) ||
         part.category.toLowerCase().includes(query)
       );
     }
    return filtered;
  }

  const filteredParts = getFilteredParts();

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBgColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colorPalette.primary} />
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.headerTitle, { color: textColor }]}>
          Motor Parts & Accessories
        </ThemedText>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => setSearchVisible(true)}
        >
          <MaterialIcons name="search" size={24} color={colorPalette.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={categories}
          renderItem={renderFilterButton}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Motor Parts List or No Results Message */}
      {filteredParts.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <MaterialIcons name="settings" size={64} color={subtitleColor} />
          <ThemedText type="subtitle" style={[styles.noResultsText, { color: textColor }]}>
            No Motor Parts found
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredParts}
          renderItem={renderPartItem}
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
                Search Motor Parts
              </ThemedText>
              <TouchableOpacity onPress={() => setSearchVisible(false)}>
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.searchInputContainer, { borderColor: borderColor }]}>
              <MaterialIcons name="search" size={20} color={subtitleColor} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Search by part name, brand, category..."
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
                {filteredParts.length} results found
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
            {selectedPart && (
              <>
                <View style={styles.detailHeader}>
                  <ThemedText type="title" style={[styles.detailTitle, { color: textColor }]}>
                    {selectedPart.name}
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
                    onPress={() => handleImagePress(selectedPart.image)}
                    activeOpacity={0.8}
                  >
                    <RobustImage source={selectedPart.image} style={styles.detailImage} resizeMode="cover" />
                    <View style={styles.imageOverlay}>
                      <MaterialIcons name="zoom-in" size={24} color="#fff" />
                    </View>
                  </TouchableOpacity>
                   
                  <View style={styles.detailContent}>
                    <View style={styles.detailRatingRow}>
                      <ThemedText type="subtitle" style={[styles.detailPrice, { color: colorPalette.primary }]}> 
                        {formatPHP(selectedPart.price)}
                      </ThemedText>
                    </View>
                    
                    <ThemedText style={[styles.detailDescription, { color: subtitleColor }]}>
                      {selectedPart.description}
                    </ThemedText>
                    
                     <View style={styles.detailSpecs}>
                       <View style={styles.detailItem}>
                         <MaterialIcons name="attach-money" size={20} color={subtitleColor} />
                         <ThemedText style={[styles.detailText, { color: textColor }]}> 
                           {formatPHP(selectedPart.price)}
                         </ThemedText>
                       </View>
                       <View style={styles.detailItem}>
                         <MaterialIcons name="category" size={20} color={subtitleColor} />
                         <ThemedText style={[styles.detailText, { color: textColor }]}>
                           {selectedPart.category}
                         </ThemedText>
                       </View>
                     </View>
                    
                    
                    <View style={styles.detailActions}>
                      <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: colorPalette.primary }]} 
                        onPress={() => handleMessageAdmin(selectedPart)}
                      >
                        <MaterialIcons name="message" size={20} color="#fff" />
                        <ThemedText style={styles.actionButtonText}>Message</ThemedText>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: colorPalette.primaryDark }]} 
                        onPress={() => handleHomeServicePress(selectedPart)}
                      >
                        <MaterialIcons name="home" size={20} color="#fff" />
                        <ThemedText style={styles.actionButtonText}>Home Service</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Home Service Details Modal */}
      <Modal
        visible={homeServiceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHomeServiceModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.homeServiceModal, { backgroundColor: cardBgColor }]}>
            <ScrollView contentContainerStyle={styles.homeServiceScrollContent}>
              <View style={styles.homeServiceHeader}>
                <ThemedText type="title" style={[styles.homeServiceTitle, { color: textColor }]}>
                  Home Service Details
                </ThemedText>
                <TouchableOpacity onPress={() => setHomeServiceModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>
              
              <ThemedText style={[styles.homeServiceSubtitle, { color: subtitleColor }]}>
                Please provide the following information for home service:
              </ThemedText>
              
              <View style={styles.homeServiceForm}>
                <View style={styles.formGroup}>
                  <ThemedText style={[styles.label, { color: textColor }]}>
                    What is the problem? *
                  </ThemedText>
                  <TextInput
                    style={[styles.textArea, { color: textColor, borderColor }]}
                    value={problemDescription}
                    onChangeText={setProblemDescription}
                    placeholder="Describe the issue with your vehicle..."
                    placeholderTextColor={subtitleColor}
                    multiline
                    numberOfLines={4}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <ThemedText style={[styles.label, { color: textColor }]}>
                    Preferred Time *
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { color: textColor, borderColor }]}
                    value={preferredTime}
                    onChangeText={setPreferredTime}
                    placeholder="e.g., 2:00 PM, 9:30 AM, 6:15 PM"
                    placeholderTextColor={subtitleColor}
                  />
                  <ThemedText style={[styles.helperText, { color: subtitleColor }]}>
                    Please specify the exact time you want the service (e.g., 2:00 PM)
                  </ThemedText>
                </View>
                
                <View style={styles.formGroup}>
                  <ThemedText style={[styles.label, { color: textColor }]}>
                    Address *
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { color: textColor, borderColor }]}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter your complete address..."
                    placeholderTextColor={subtitleColor}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <ThemedText style={[styles.label, { color: textColor }]}>
                    Contact Number *
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { color: textColor, borderColor }]}
                    value={contactNumber}
                    onChangeText={setContactNumber}
                    placeholder="Enter your contact number..."
                    placeholderTextColor={subtitleColor}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              
              <View style={styles.homeServiceActions}>
                <TouchableOpacity 
                  style={[styles.cancelButton, { borderColor }]}
                  onPress={() => setHomeServiceModalVisible(false)}
                >
                  <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.confirmButton, { backgroundColor: colorPalette.primary }]}
                  onPress={handleHomeServiceBooking}
                >
                  <ThemedText style={styles.confirmButtonText}>
                    Confirm
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
        
      {/* Full Screen Image Viewer */}
      <FullScreenImageViewer
        visible={imageViewerVisible}
        imageSource={selectedImage || ''}
        onClose={() => setImageViewerVisible(false)}
        title="Motor Part Image"
      />
      
      {/* Custom Success Alert */}
      <CustomAlert
        visible={customAlertVisible}
        title="Avail Successfully"
        onClose={() => setCustomAlertVisible(false)}
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
    flexDirection: 'row',
    alignItems: 'center',
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
  partCard: {
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
  partImage: {
    width: '100%',
    height: 180,
  },
  partContent: {
    padding: 16,
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  partName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
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
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: normalize(16),
    marginBottom: normalize(8),
    flex: isTablet ? 1 : 0,
  },
  detailText: {
    marginLeft: normalize(4),
    fontSize: normalize(isTablet ? 15 : 14),
    flex: 1,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandText: {
    marginLeft: 4,
    fontSize: 14,
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
  brandSection: {
    marginBottom: normalize(24),
  },
  brandInfo: {
    marginTop: normalize(8),
  },
  brandInfoText: {
    fontSize: normalize(isTablet ? 16 : 14),
    marginBottom: normalize(4),
  },
  specificationsSection: {
    marginBottom: normalize(24),
  },
  compatibilitySection: {
    marginBottom: normalize(24),
  },
  sectionTitle: {
    fontSize: normalize(isTablet ? 18 : 16),
    fontWeight: '600',
    marginBottom: normalize(12),
  },
  specificationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(8),
  },
  compatibilityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(8),
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: isTablet ? '33%' : '50%',
    marginBottom: normalize(8),
    minWidth: isSmallScreen ? wp(45) : wp(40),
  },
  compItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: isTablet ? '33%' : '50%',
    marginBottom: normalize(8),
    minWidth: isSmallScreen ? wp(45) : wp(40),
  },
  specText: {
    marginLeft: normalize(8),
    fontSize: normalize(isTablet ? 15 : 14),
    flex: 1,
  },
  compText: {
    marginLeft: normalize(8),
    fontSize: normalize(isTablet ? 15 : 14),
    flex: 1,
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: normalize(12),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: normalize(12),
    paddingVertical: normalize(isTablet ? 14 : 12),
    paddingHorizontal: normalize(isTablet ? 20 : 16),
    minHeight: normalize(isTablet ? 48 : 44),
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: normalize(isTablet ? 16 : 14),
    marginLeft: normalize(8),
  },
  homeServiceModal: {
    width: '100%',
    borderRadius: normalize(isTablet ? 20 : 16),
    maxHeight: '90%',
    overflow: 'hidden',
    maxWidth: isTablet ? wp(80) : wp(95),
  },
  homeServiceScrollContent: {
    paddingBottom: normalize(20),
  },
  homeServiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: normalize(isTablet ? 24 : 20),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  homeServiceTitle: {
    fontSize: normalize(isTablet ? 20 : 18),
    fontWeight: '600',
    flex: 1,
    marginRight: normalize(12),
  },
  homeServiceSubtitle: {
    fontSize: normalize(isTablet ? 16 : 14),
    marginBottom: normalize(24),
    textAlign: 'center',
    paddingHorizontal: normalize(20),
  },
  homeServiceForm: {
    marginBottom: normalize(24),
    paddingHorizontal: normalize(20),
  },
  formGroup: {
    marginBottom: normalize(20),
  },
  label: {
    fontSize: normalize(isTablet ? 16 : 14),
    fontWeight: '600',
    marginBottom: normalize(8),
  },
  input: {
    borderWidth: 1,
    borderRadius: normalize(8),
    padding: normalize(12),
    fontSize: normalize(isTablet ? 16 : 14),
  },
  textArea: {
    borderWidth: 1,
    borderRadius: normalize(8),
    padding: normalize(12),
    fontSize: normalize(isTablet ? 16 : 14),
    height: normalize(100),
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: normalize(12),
    marginTop: normalize(4),
    fontStyle: 'italic',
  },
  homeServiceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: normalize(12),
    paddingHorizontal: normalize(20),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(8),
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: normalize(isTablet ? 16 : 14),
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(8),
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: normalize(isTablet ? 16 : 14),
    fontWeight: '600',
  },
});
