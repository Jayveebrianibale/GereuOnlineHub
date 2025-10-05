import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { push, ref, set } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { CustomAlert } from '../../components/CustomAlert';
import { FullScreenImageViewer } from '../../components/FullScreenImageViewer';
import { RobustImage } from '../../components/RobustImage';
import { AUTO_ADMIN } from '../../config/adminConfig';
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
    cacheMotorParts,
    getCachedAutoServices,
    getCachedMotorParts
} from '../../services/dataCache';
import {
    MotorPart,
    getMotorParts,
} from '../../services/motorPartsService';
import { notifyAdmins } from '../../services/notificationService';
import { formatPHP } from '../../utils/currency';
import { mapServiceToAdminReservation } from '../../utils/reservationUtils';
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

  const [activeTab, setActiveTab] = useState<'services' | 'parts'>('services');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAutoService, setSelectedAutoService] = useState<any>(null);
  const [selectedMotorPart, setSelectedMotorPart] = useState<any>(null);
  const [autoServices, setAutoServices] = useState<AutoService[]>([]);
  const [motorParts, setMotorParts] = useState<MotorPart[]>([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [serviceTypeModalVisible, setServiceTypeModalVisible] = useState(false);
  const [homeServiceModalVisible, setHomeServiceModalVisible] = useState(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<any>(null);
  const [problemDescription, setProblemDescription] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  
  const handleImagePress = (imageSource: string) => {
    setSelectedImage(imageSource);
    setImageViewerVisible(true);
  };

  const handleMessageAdmin = async (service: any) => {
    try {
      if (!user?.email) return;
      const ADMIN_EMAIL = AUTO_ADMIN.email;
      const ADMIN_NAME = AUTO_ADMIN.name;
      const chatId = [user.email, ADMIN_EMAIL].sort().join('_');

      const priceText = typeof service?.price !== 'undefined' ? `Price: ${formatPHP(service.price)}` : '';
      const messageText = `I'm interested in Car and Motor Parts Service: ${service?.title || 'Auto Service'}\n${priceText}\nDuration: ${service?.duration || 'N/A'}`;

      const newMsgRef = push(ref(db, 'messages'));
      await set(newMsgRef, {
        id: newMsgRef.key,
        chatId,
        text: messageText,
        image: service?.image || null,
        imageUrl: service?.image || null, // Add imageUrl for consistency
        category: 'auto',
        serviceId: service?.id || null,
        senderEmail: user.email,
        senderName: user.displayName || 'User',
        recipientEmail: ADMIN_EMAIL,
        recipientName: ADMIN_NAME,
        timestamp: Date.now(),
        time: Date.now(),
        messageType: 'auto_inquiry', // Add message type
        autoTitle: service?.title || 'Car and Motor Parts Service',
        autoPrice: service?.price || 0,
        autoDuration: service?.duration || 'N/A',
      });

      setDetailModalVisible(false);
      router.push(`/chat/${encodeURIComponent(chatId)}?recipientName=${encodeURIComponent(ADMIN_NAME)}&recipientEmail=${encodeURIComponent(ADMIN_EMAIL)}&currentUserEmail=${encodeURIComponent(user.email)}`);
    } catch (e) {
      console.error('Error sending interest message:', e);
    }
  };

  const handleMessageAdminForPart = async (part: any) => {
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
        category: 'auto',
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
  const handleServiceTypeSelection = (service: any) => {
    setSelectedServiceForBooking(service);
    setServiceTypeModalVisible(true);
  };

  const handleServiceTypeChoice = (type: 'home' | 'shop') => {
    setServiceTypeModalVisible(false);
    
    if (type === 'home') {
      setHomeServiceModalVisible(true);
    } else {
      // Direct booking for shop service
      handleDirectBooking(selectedServiceForBooking);
    }
  };

  const handleDirectBooking = async (service: any) => {
    if (!service.available) {
      // ========================================
      // UNAVAILABLE ALERT - AUTO SERVICE
      // ========================================
      // I-display ang unavailable alert kung hindi available ang service
      // I-inform ang user na hindi available ang service
      Alert.alert('🚫 Unavailable', 'This service is currently unavailable.'); // Alert title at message - service unavailable
      return;
    }

    const isReserved = reservedAutoServices.some(s => (s as any).serviceId === service.id);
    if (!isReserved) {
      try {
        // Simple shop service data
        const serviceData = { 
          ...service,
          status: 'pending' as const,
          serviceType: 'auto',
          shopService: true
        };
        
        await reserveAutoService(serviceData);
        
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
        
        // Show custom alert
        setCustomAlertVisible(true);
      } catch (error) {
        // ========================================
        // FAILED ALERT - AUTO SERVICE BOOKING
        // ========================================
        // I-display ang failed alert kung nag-fail ang booking
        // I-inform ang user na nag-fail ang booking at i-try ulit
        Alert.alert('❌ Failed', 'Please try again.'); // Alert title at message - booking failed, try again
      }
    } else {
      // Cancel existing booking
      try {
        await removeAutoReservation(service.id);
        // ========================================
        // CANCELLED ALERT - AUTO SERVICE BOOKING
        // ========================================
        // I-display ang cancelled alert pagkatapos ng successful cancellation
        // I-inform ang user na successful ang cancellation
        Alert.alert('✅ Cancelled', 'Booking cancelled successfully.'); // Alert title at message - booking cancelled successfully
      } catch (error) {
        // ========================================
        // FAILED ALERT - AUTO SERVICE CANCELLATION
        // ========================================
        // I-display ang failed alert kung nag-fail ang cancellation
        // I-inform ang user na hindi na-cancel ang booking
        Alert.alert('❌ Failed', 'Could not cancel booking.'); // Alert title at message - cancellation failed
      }
    }
  };

  const handleHomeServiceBooking = async () => {
    // Simple validation
    const fields = { problemDescription, address, contactNumber, preferredTime };
    const missingFields = Object.entries(fields).filter(([_, value]) => !value.trim());
    
    if (missingFields.length > 0) {
      // ========================================
      // MISSING INFORMATION ALERT - AUTO SERVICE
      // ========================================
      // I-display ang missing information alert kung may kulang na fields
      // I-inform ang user na kailangan niyang i-fill ang lahat ng required fields
      Alert.alert('⚠️ Missing Information', 'Please fill in all required fields.'); // Alert title at message - missing required fields
      return;
    }

    const service = selectedServiceForBooking;
    if (!service?.available) {
      // ========================================
      // SERVICE UNAVAILABLE ALERT - AUTO SERVICE
      // ========================================
      // I-display ang service unavailable alert kung hindi available ang service
      // I-inform ang user na hindi available ang service
      Alert.alert('🚫 Service Unavailable', 'This service is currently unavailable.'); // Alert title at message - service unavailable
      return;
    }

    const isReserved = reservedAutoServices.some(s => (s as any).serviceId === service.id);
    if (!isReserved) {
      try {
        // Simple service data with home service info
        const serviceData = { 
          ...service,
          status: 'pending' as const,
          serviceType: 'auto',
          homeService: true,
          problemDescription: problemDescription.trim(),
          address: address.trim(),
          contactNumber: contactNumber.trim(),
          preferredTime: preferredTime.trim()
        };
        
        await reserveAutoService(serviceData);
        
        // Create admin reservation with home service info
        if (user) {
          const homeServiceData = {
            homeService: true,
            problemDescription: problemDescription.trim(),
            address: address.trim(),
            contactNumber: contactNumber.trim(),
            preferredTime: preferredTime.trim()
          };
          
          const adminReservationData = mapServiceToAdminReservation(
            service,
            'auto',
            user.uid,
            user.displayName || 'Unknown User',
            user.email || 'No email',
            homeServiceData
          );
          console.log('🚀 Saving admin reservation with home service data:', adminReservationData);
          await addAdminReservation(adminReservationData);

          // Notify admins of new home service reservation
          await notifyAdmins(
            'New Home Service Reservation',
            `${user.displayName || 'A user'} reserved ${service.title || 'an auto service'} for home service.`,
            {
              serviceType: 'auto',
              serviceId: service.id,
              userId: user.uid,
              action: 'reserved',
            }
          );
        }
        
        // Reset form and close modals
        setHomeServiceModalVisible(false);
        setDetailModalVisible(false);
        setSelectedAutoService(null);
        setProblemDescription('');
        setAddress('');
        setContactNumber('');
        
        // Show custom alert
        setCustomAlertVisible(true);
      } catch (error) {
        Alert.alert('❌ Failed', 'Please try again.');
      }
    } else {
      // Cancel existing booking
      try {
        await removeAutoReservation(service.id);
        // ========================================
        // CANCELLED ALERT - AUTO SERVICE BOOKING
        // ========================================
        // I-display ang cancelled alert pagkatapos ng successful cancellation
        // I-inform ang user na successful ang cancellation
        Alert.alert('✅ Cancelled', 'Booking cancelled successfully.'); // Alert title at message - booking cancelled successfully
      } catch (error) {
        // ========================================
        // FAILED ALERT - AUTO SERVICE CANCELLATION
        // ========================================
        // I-display ang failed alert kung nag-fail ang cancellation
        // I-inform ang user na hindi na-cancel ang booking
        Alert.alert('❌ Failed', 'Could not cancel booking.'); // Alert title at message - cancellation failed
      }
    }
  };

  const handleAutoReservation = async (service: any) => {
    handleServiceTypeSelection(service);
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

  // Fetch auto services and motor parts from Firebase or cache
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch auto services
        const cachedServices = getCachedAutoServices();
        if (cachedServices) {
          console.log('🚀 Using cached auto services data in auto list');
          setAutoServices(cachedServices);
        } else {
          console.log('📡 Fetching auto services from Firebase in auto list...');
          const autoServicesData = await getAutoServices();
          setAutoServices(autoServicesData);
          cacheAutoServices(autoServicesData);
        }

        // Fetch motor parts
        const cachedParts = getCachedMotorParts();
        if (cachedParts) {
          console.log('🚀 Using cached motor parts data in auto list');
          setMotorParts(cachedParts);
        } else {
          console.log('📡 Fetching motor parts from Firebase in auto list...');
          const motorPartsData = await getMotorParts();
          setMotorParts(motorPartsData);
          cacheMotorParts(motorPartsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
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

  const renderMotorPartItem = ({ item }: { item: any }) => (
    <View
      style={[styles.autoCard, { backgroundColor: cardBgColor, borderColor }]}
    >
      <RobustImage source={item.image} style={styles.autoImage} resizeMode="cover" />
      <View style={styles.autoContent}>
        <View style={styles.autoHeader}>
          <ThemedText type="subtitle" style={[styles.autoTitle, { color: textColor }]}>
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
              setSelectedMotorPart(item);
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

  function getFilteredMotorParts() {
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

  const filteredServices = getFilteredAutoServices();
  const filteredParts = getFilteredMotorParts();

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBgColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colorPalette.primary} />
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.headerTitle, { color: textColor }]}>
          Car & Motor Services
        </ThemedText>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => setSearchVisible(true)}
        >
          <MaterialIcons name="search" size={24} color={colorPalette.primary} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: cardBgColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'services' && styles.tabButtonActive]}
          onPress={() => setActiveTab('services')}
        >
          <ThemedText style={[
            styles.tabText, 
            { color: activeTab === 'services' ? colorPalette.primary : subtitleColor }
          ]}>
            Services
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'parts' && styles.tabButtonActive]}
          onPress={() => setActiveTab('parts')}
        >
          <ThemedText style={[
            styles.tabText, 
            { color: activeTab === 'parts' ? colorPalette.primary : subtitleColor }
          ]}>
            Parts & Accessories
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content List */}
      {activeTab === 'services' ? (
        filteredServices.length === 0 ? (
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
        )
      ) : (
        filteredParts.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <MaterialIcons name="settings" size={64} color={subtitleColor} />
            <ThemedText type="subtitle" style={[styles.noResultsText, { color: textColor }]}>
              No Motor Parts found
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredParts}
            renderItem={renderMotorPartItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )
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
             {(selectedAutoService || selectedMotorPart) && (
               <>
                 <View style={styles.detailHeader}>
                   <ThemedText type="title" style={[styles.detailTitle, { color: textColor }]}>
                     {selectedAutoService?.title || selectedMotorPart?.name}
                   </ThemedText>
                   <TouchableOpacity onPress={() => {
                     setDetailModalVisible(false);
                     setSelectedAutoService(null);
                     setSelectedMotorPart(null);
                   }}>
                     <MaterialIcons name="close" size={24} color={textColor} />
                   </TouchableOpacity>
                 </View>
                 
                 <ScrollView 
                   style={styles.detailScrollView}
                   showsVerticalScrollIndicator={false}
                   contentContainerStyle={styles.detailScrollContent}
                 >
                   <TouchableOpacity 
                    onPress={() => handleImagePress(selectedAutoService?.image || selectedMotorPart?.image)}
                    activeOpacity={0.8}
                  >
                    <RobustImage source={selectedAutoService?.image || selectedMotorPart?.image} style={styles.detailImage} resizeMode="cover" />
                    <View style={styles.imageOverlay}>
                      <MaterialIcons name="zoom-in" size={24} color="#fff" />
                    </View>
                  </TouchableOpacity>
                   
                   <View style={styles.detailContent}>
                     <View style={styles.detailRatingRow}>
                       <ThemedText type="subtitle" style={[styles.detailPrice, { color: colorPalette.primary }]}> 
                         {formatPHP(selectedAutoService?.price || selectedMotorPart?.price)}
                       </ThemedText>
                     </View>
                     
                     <ThemedText style={[styles.detailDescription, { color: subtitleColor }]}>
                       {selectedAutoService?.description || selectedMotorPart?.description}
                     </ThemedText>
                     
                     <View style={styles.detailSpecs}>
                       <View style={styles.detailItem}>
                         <MaterialIcons name="attach-money" size={20} color={subtitleColor} />
                         <ThemedText style={[styles.detailText, { color: textColor }]}> 
                           {formatPHP(selectedAutoService?.price || selectedMotorPart?.price)}
                         </ThemedText>
                       </View>
                       {selectedAutoService && (
                         <>
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
                         </>
                       )}
                       {selectedMotorPart && (
                         <View style={styles.detailItem}>
                           <MaterialIcons name="category" size={20} color={subtitleColor} />
                           <ThemedText style={[styles.detailText, { color: textColor }]}>
                             {selectedMotorPart.category}
                           </ThemedText>
                         </View>
                       )}
                     </View>
                     
                     {selectedAutoService && (
                       <>
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
                       </>
                     )}
                     
                     <View style={styles.detailActions}>
                       <TouchableOpacity 
                         style={[styles.contactButton, { backgroundColor: colorPalette.primary }]} 
                         onPress={() => selectedAutoService ? handleMessageAdmin(selectedAutoService) : handleMessageAdminForPart(selectedMotorPart)}
                       >
                         <MaterialIcons name="message" size={20} color="#fff" />
                         <ThemedText style={styles.contactButtonText}>Message</ThemedText>
                       </TouchableOpacity>
                       
                       {selectedAutoService && (
                         <TouchableOpacity 
                           style={[
                             styles.bookButton,
                             {
                               borderColor: selectedAutoService.available ? colorPalette.primary : '#ccc',
                               backgroundColor: (() => {
                                 if (!selectedAutoService.available) return '#f5f5f5';
                                 const match = reservedAutoServices.find(s => (s as any).serviceId === selectedAutoService.id);
                                 const status = (match as any)?.status;
                                 const active = status === 'pending' || status === 'confirmed';
                                 return active ? colorPalette.primary : 'transparent';
                               })(),
                               opacity: selectedAutoService.available ? 1 : 0.6,
                             }
                           ]}
                           onPress={() => selectedAutoService.available ? handleAutoReservation(selectedAutoService) : null}
                           disabled={!selectedAutoService.available}
                         >
                           {(() => {
                             if (!selectedAutoService.available) {
                               return (
                                 <MaterialIcons
                                   name="cancel"
                                   size={20}
                                   color="#999"
                                 />
                               );
                             }
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
                           {!selectedAutoService.available ? (
                             <View style={styles.unavailableContainer}>
                               <MaterialIcons name="block" size={16} color="#fff" />
                               <ThemedText style={styles.unavailableText}>UNAVAILABLE</ThemedText>
                             </View>
                           ) : (
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
                                 return active ? 'Reserved' : 'Avail';
                               })()}
                             </ThemedText>
                           )}
                         </TouchableOpacity>
                       )}
                     </View>
                   </View>
                 </ScrollView>
               </>
             )}
           </View>
         </View>
        </Modal>
        
        {/* Service Type Selection Modal */}
        <Modal
          visible={serviceTypeModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setServiceTypeModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.serviceTypeModal, { backgroundColor: cardBgColor }]}>
              <View style={styles.serviceTypeHeader}>
                <ThemedText type="title" style={[styles.serviceTypeTitle, { color: textColor }]}>
                  Choose Service Type
                </ThemedText>
                <TouchableOpacity onPress={() => setServiceTypeModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>
              
              <ThemedText style={[styles.serviceTypeSubtitle, { color: subtitleColor }]}>
                How would you like to receive this service?
              </ThemedText>
              
              <View style={styles.serviceTypeOptions}>
                <TouchableOpacity
                  style={[styles.serviceTypeOption, { backgroundColor: cardBgColor, borderColor }]}
                  onPress={() => handleServiceTypeChoice('home')}
                >
                  <MaterialIcons name="home" size={32} color={colorPalette.primary} />
                  <ThemedText type="subtitle" style={[styles.serviceTypeOptionTitle, { color: textColor }]}>
                    Home Service
                  </ThemedText>
                  <ThemedText style={[styles.serviceTypeOptionDesc, { color: subtitleColor }]}>
                    We'll come to your location
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.serviceTypeOption, { backgroundColor: cardBgColor, borderColor }]}
                  onPress={() => handleServiceTypeChoice('shop')}
                >
                  <MaterialIcons name="store" size={32} color={colorPalette.primary} />
                  <ThemedText type="subtitle" style={[styles.serviceTypeOptionTitle, { color: textColor }]}>
                    Shop Service
                  </ThemedText>
                  <ThemedText style={[styles.serviceTypeOptionDesc, { color: subtitleColor }]}>
                    Bring your vehicle to our shop
                  </ThemedText>
                </TouchableOpacity>
              </View>
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
          title="Auto Service Image"
        />
        
        {/* Custom Success Alert */}
        <CustomAlert
          visible={customAlertVisible}
          title="Avail Successfully"
          onClose={() => {
            setCustomAlertVisible(false);
            router.push('/(user-tabs)/bookings');
          }}
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
  unavailableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  unavailableText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: normalize(isTablet ? 14 : 12),
    marginLeft: 6,
    letterSpacing: 0.5,
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
  servicesSection: {
    marginBottom: normalize(24),
  },
  includesSection: {
    marginBottom: normalize(24),
  },
  sectionTitle: {
    fontSize: normalize(isTablet ? 18 : 16),
    fontWeight: '600',
    marginBottom: normalize(12),
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(8),
  },
  includesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(8),
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: isTablet ? '33%' : '50%',
    marginBottom: normalize(8),
    minWidth: isSmallScreen ? wp(45) : wp(40),
  },
  serviceItemText: {
    marginLeft: normalize(8),
    fontSize: normalize(isTablet ? 15 : 14),
    flex: 1,
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: normalize(12),
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: normalize(12),
    paddingVertical: normalize(isTablet ? 14 : 12),
    paddingHorizontal: normalize(isTablet ? 20 : 16),
    minHeight: normalize(isTablet ? 48 : 44),
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: normalize(isTablet ? 16 : 14),
    marginLeft: normalize(8),
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginTop: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#00B2FF',
  },
  // Service Type Modal Styles
  serviceTypeModal: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  serviceTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTypeTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  serviceTypeSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  serviceTypeOptions: {
    gap: 16,
  },
  serviceTypeOption: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  serviceTypeOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  serviceTypeOptionDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Home Service Modal Styles
  homeServiceModal: {
    width: '95%',
    borderRadius: 16,
    maxHeight: '90%',
  },
  homeServiceScrollContent: {
    padding: 20,
  },
  homeServiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  homeServiceTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  homeServiceSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  homeServiceForm: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  homeServiceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});