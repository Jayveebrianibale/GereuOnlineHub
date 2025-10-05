// ========================================
// ADMIN RESERVATIONS TAB - PAMAMAHALA NG RESERVATIONS
// ========================================
// Ang file na ito ay naghahandle ng admin reservations management
// May comprehensive features: view, filter, approve/decline, payment management
// Responsive design na nag-a-adapt sa different screen sizes

// Import ng React Native components at custom components
import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { AdminPaymentSettingsModal } from '../components/AdminPaymentSettings';
import { RobustImage } from '../components/RobustImage';
import { useAdminReservation } from '../contexts/AdminReservationContext';
import { useReservation } from '../contexts/ReservationContext';
import { notifyUser } from '../services/notificationService';
import { calculateDownPayment, isPaymentRequired } from '../services/paymentService';
import { getUserReservations, updateAdminReservationPaymentStatus, updateUserReservationStatus } from '../services/reservationService';
import { formatPHP } from '../utils/currency';

// ========================================
// COLOR PALETTE CONFIGURATION
// ========================================
// Defines the app's color scheme for consistent theming
// Used throughout the reservations screen for UI elements
const colorPalette = {
  lightest: '#C3F5FF',
  light: '#7FE6FF',
  primaryLight: '#4AD0FF',
  primary: '#cb044dff',
  primaryDark: '#007BE5',
  dark: '#0051C1',
  darker: '#002F87',
  darkest: '#001A5C',
};

// ========================================
// HELPER FUNCTIONS
// ========================================
// Utility functions para sa reservations management

// Helper function para sa pag-convert ng service type sa display name
const getServiceTypeDisplayName = (serviceType: string) => {
  switch (serviceType) {
    case 'apartment':
      return 'Apartment Rental';
    case 'laundry':
      return 'Laundry Service';
    case 'auto':
      return 'Car & Motor Parts';
    default:
      return serviceType;
  }
};

// ========================================
// ADMIN RESERVATIONS SCREEN COMPONENT
// ========================================
// Main component na naghahandle ng admin reservations management
// May comprehensive features para sa reservation management
export default function ReservationsScreen() {
  // ========================================
  // HOOKS AT STATE
  // ========================================
  const { colorScheme } = useColorScheme(); // Theme management
  const { width, height } = useWindowDimensions(); // Screen dimensions
  const isPortrait = height > width; // Check kung portrait orientation
  const { adminReservations, updateReservationStatus, removeAdminReservation, loading, error } = useAdminReservation(); // Admin reservation context
  const { updateApartmentStatus, updateLaundryStatus, updateAutoStatus } = useReservation(); // Reservation context
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'cancelled' | 'declined'>('all'); // Status filter state
  const [filterVisible, setFilterVisible] = useState(false); // Filter modal visibility
  const [paymentSettingsVisible, setPaymentSettingsVisible] = useState(false); // Payment settings modal visibility
  const [searchQuery, setSearchQuery] = useState(''); // Search query state
  
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';


  // Responsive sizing
  const titleSize = width < 400 ? 20 : 24;
  const subtitleSize = width < 400 ? 12 : 14;

  const getStatusColor = (status: string | null | undefined) => {
    const validStatus = status || 'pending';
    switch (validStatus) {
      case 'confirmed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'completed':
        return '#3B82F6';
      case 'declined':
      case 'cancelled':
        return '#EF4444';
      default:
        return '#F59E0B'; // Default to pending color
    }
  };

  // Helper function to check if a date is valid
  const isValidDate = (dateString: string | undefined): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.getTime() > 0;
  };

  // Helper function to safely format date
  const formatDate = (dateString: string | undefined): string => {
    if (!isValidDate(dateString)) {
      return 'Invalid Date';
    }
    return new Date(dateString!).toLocaleDateString();
  };

  // Calculate simple reservation summary
  const reservationSummary = useMemo(() => {
    const validReservations = (adminReservations || []).filter(r => isValidDate(r.reservationDate));
    return {
      total: validReservations.length,
      pending: validReservations.filter(r => (r.status || 'pending') === 'pending').length,
      confirmed: validReservations.filter(r => r.status === 'confirmed').length,
      completed: validReservations.filter(r => r.status === 'completed').length,
    };
  }, [adminReservations]);

  // Sort newest first and apply status filter and search, filtering out invalid dates
  const displayReservations = useMemo(() => {
    return (adminReservations || [])
      .slice()
      .filter(r => isValidDate(r.reservationDate))
      .filter(r => {
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          return (
            r.userName?.toLowerCase().includes(query) ||
            r.userEmail?.toLowerCase().includes(query) ||
            r.serviceTitle?.toLowerCase().includes(query) ||
            getServiceTypeDisplayName(r.serviceType).toLowerCase().includes(query)
          );
        }
        return true;
      })
      .filter(r => statusFilter === 'all' ? true : ((r.status || 'pending') === statusFilter))
      .sort((a, b) => {
        const aTime = a?.reservationDate ? new Date(a.reservationDate).getTime() : 0;
        const bTime = b?.reservationDate ? new Date(b.reservationDate).getTime() : 0;
        return bTime - aTime;
      });
  }, [adminReservations, searchQuery, statusFilter]);

  const handleAcceptReservation = (reservationId: string, serviceType: string, serviceId: string, userId: string) => {
    const performUpdate = async () => {
      try {
        await updateReservationStatus(reservationId, 'confirmed');
        // Update payment status to 'paid' when accepting reservation
        await updateAdminReservationPaymentStatus(reservationId, 'paid');
        
        // Update corresponding user's reservation regardless of current auth context
        try {
          const userReservations = await getUserReservations(userId);
          const target = userReservations.find(r => r.serviceId === serviceId && r.serviceType === serviceType);
          if (target) {
            await updateUserReservationStatus(userId, target.id, 'confirmed');
          }
        } catch (e) {
          // Non-fatal: log and continue
          console.warn('Failed updating user reservation status:', e);
        }
        // Notification is handled by AdminReservationContext.updateReservationStatus
        Alert.alert('Success', 'Reservation has been accepted and payment status updated to paid!');
      } catch (error) {
        console.error('Error accepting reservation:', error);
        Alert.alert('Error', 'Failed to accept reservation. Please try again.');
      }
    };

    if (Platform.OS === 'web') {
      performUpdate();
      return;
    }

    Alert.alert(
      'Accept Reservation',
      'Are you sure you want to accept this reservation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: performUpdate }
      ]
    );
  };

  const handleDeclineReservation = (reservationId: string, serviceType: string, serviceId: string, userId: string) => {
    const performUpdate = async () => {
      try {
        await updateReservationStatus(reservationId, 'declined');
        // Update corresponding user's reservation regardless of current auth context
        try {
          const userReservations = await getUserReservations(userId);
          const target = userReservations.find(r => r.serviceId === serviceId && r.serviceType === serviceType);
          if (target) {
            await updateUserReservationStatus(userId, target.id, 'declined');
          }
        } catch (e) {
          console.warn('Failed updating user reservation status:', e);
        }
        // Notification is handled by AdminReservationContext.updateReservationStatus
        Alert.alert('Success', 'Reservation has been declined successfully!');
      } catch (error) {
        console.error('Error declining reservation:', error);
        Alert.alert('Error', 'Failed to decline reservation. Please try again.');
      }
    };

    if (Platform.OS === 'web') {
      performUpdate();
      return;
    }

    Alert.alert(
      'Decline Reservation',
      'Are you sure you want to decline this reservation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: performUpdate }
      ]
    );
  };

  const handleDeleteReservation = (reservationId: string, serviceType: string, serviceId: string, userId: string, serviceTitle: string) => {
    const performDelete = async () => {
      try {
        // Only delete admin reservation, leave user reservation intact
        await removeAdminReservation(reservationId);
        console.log('✅ Admin reservation deleted successfully');
        
        // Update service status to pending (available for new reservations)
        try {
          if (serviceType === 'apartment') {
            await updateApartmentStatus(serviceId, 'pending');
          } else if (serviceType === 'laundry') {
            await updateLaundryStatus(serviceId, 'pending');
          } else if (serviceType === 'auto') {
            await updateAutoStatus(serviceId, 'pending');
          }
        } catch (e) {
          console.warn('Failed updating service status:', e);
        }
        
        // Notify user about the admin action (optional)
        try {
          await notifyUser(
            userId,
            'Admin Action Notice',
            `Admin has processed your ${serviceTitle} reservation.`,
            { serviceType, serviceId, action: 'admin_processed' }
          );
        } catch {}
        
        Alert.alert('Success', 'Reservation has been removed from admin panel!');
      } catch (error) {
        console.error('Error deleting admin reservation:', error);
        Alert.alert('Error', 'Failed to delete reservation. Please try again.');
      }
    };

    if (Platform.OS === 'web') {
      performDelete();
      return;
    }

    Alert.alert(
      'Remove from Admin Panel',
      `Are you sure you want to remove this reservation for "${serviceTitle}" from the admin panel? The user's reservation will remain intact.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: performDelete }
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContainer, 
          { padding: isPortrait ? 20 : 15 }
        ]}
      >
        {/* Header */}
        <View style={[
          styles.header, 
          { flexDirection: isPortrait ? 'row' : 'column', alignItems: 'flex-start' }
        ]}>
          <View style={{ marginTop: 20 }}>
            <ThemedText type="title" style={[
              styles.title, 
              { 
                color: textColor, 
                fontSize: titleSize,
                marginBottom: isPortrait ? 0 : 8
              }
            ]}>
              Reservations
            </ThemedText>
            <ThemedText type="default" style={[
              styles.subtitle, 
              { 
                color: subtitleColor, 
                fontSize: subtitleSize 
              }
            ]}>
              Manage all customer reservations
            </ThemedText>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={[
              styles.paymentSettingsButton, 
              { marginTop: isPortrait ? 25 : 12, marginRight: 8 }
            ]} onPress={() => setPaymentSettingsVisible(true)}>
              <ThemedText style={{ color: '#10B981', fontSize: subtitleSize }}>
                Payment
              </ThemedText>
              <MaterialIcons name="payment" size={20} color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity style={[
              styles.dateFilter, 
              { marginTop: isPortrait ? 25 : 12 }
            ]} onPress={() => setFilterVisible(true)}>
              <ThemedText style={{ color: colorPalette.primary, fontSize: subtitleSize }}>
                Filter
              </ThemedText>
              <MaterialIcons name="filter-list" size={20} color={colorPalette.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: cardBgColor, borderColor }]}>
          <MaterialIcons name="search" size={20} color={subtitleColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search reservations..."
            placeholderTextColor={subtitleColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={20} color={subtitleColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Simple Summary Bar */}
        <View style={[styles.summaryBar, { backgroundColor: cardBgColor, borderColor }]}>
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.summaryNumber, { color: textColor }]}>
              {reservationSummary.total}
            </ThemedText>
            <ThemedText style={[styles.summaryLabel, { color: subtitleColor }]}>
              Total
            </ThemedText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.summaryNumber, { color: '#F59E0B' }]}>
              {reservationSummary.pending}
            </ThemedText>
            <ThemedText style={[styles.summaryLabel, { color: subtitleColor }]}>
              Pending
            </ThemedText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.summaryNumber, { color: '#10B981' }]}>
              {reservationSummary.confirmed}
            </ThemedText>
            <ThemedText style={[styles.summaryLabel, { color: subtitleColor }]}>
              Confirmed
            </ThemedText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.summaryNumber, { color: '#3B82F6' }]}>
              {reservationSummary.completed}
            </ThemedText>
            <ThemedText style={[styles.summaryLabel, { color: subtitleColor }]}>
              Completed
            </ThemedText>
          </View>
        </View>

        {/* Reservations List */}
        <View style={styles.reservationsContainer}>
          {/* Filter Modal */}
          <Modal
            visible={filterVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setFilterVisible(false)}
          >
            <View style={styles.filterModalOverlay}>
              <View style={[styles.filterModal, { backgroundColor: cardBgColor, borderColor }]}> 
                <View style={styles.filterModalHeader}>
                  <ThemedText type="subtitle" style={[styles.filterTitle, { color: textColor }]}>Filter by Status</ThemedText>
                  <TouchableOpacity onPress={() => setFilterVisible(false)}>
                    <MaterialIcons name="close" size={22} color={textColor} />
                  </TouchableOpacity>
                </View>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'cancelled', label: 'Cancelled' },
                  { id: 'declined', label: 'Declined' },
                ].map((opt: any) => {
                  const active = statusFilter === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.filterOption,
                        { borderColor, backgroundColor: active ? colorPalette.primary + '20' : 'transparent' }
                      ]}
                      onPress={() => {
                        setStatusFilter(opt.id);
                        setFilterVisible(false);
                      }}
                    >
                      <ThemedText style={{ color: active ? colorPalette.primary : subtitleColor }}>
                        {opt.label}
                      </ThemedText>
                      {active && (
                        <MaterialIcons name="check" size={18} color={colorPalette.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Modal>
          {loading ? (
            <View style={styles.loadingState}>
              <MaterialIcons name="refresh" size={48} color={subtitleColor} />
              <ThemedText style={[styles.loadingText, { color: subtitleColor }]}>
                Loading reservations...
              </ThemedText>
            </View>
          ) : error ? (
            <View style={styles.errorState}>
              <MaterialIcons name="error" size={48} color="#EF4444" />
              <ThemedText style={[styles.errorText, { color: '#EF4444' }]}>
                {error}
              </ThemedText>
            </View>
          ) : adminReservations.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={48} color={subtitleColor} />
              <ThemedText style={[styles.emptyText, { color: subtitleColor }]}>
                No reservations yet
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: subtitleColor }]}>
                Reservations will appear here when users book services
              </ThemedText>
            </View>
          ) : (
            displayReservations.map((reservation) => (
              <View 
                key={reservation.id} 
                style={[
                  styles.reservationCard, 
                  { 
                    backgroundColor: cardBgColor,
                    borderColor: borderColor
                  }
                ]}
              >
                {/* Service Image */}
                {reservation.serviceImage && (
                  <RobustImage 
                    source={reservation.serviceImage} 
                    style={styles.reservationImage} 
                    resizeMode="cover" 
                  />
                )}
                
                <View style={styles.reservationContent}>
                  <View style={styles.reservationHeader}>
                    <ThemedText type="subtitle" style={[
                      styles.reservationService, 
                      { color: textColor }
                    ]}>
                      {reservation.serviceTitle}
                    </ThemedText>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(reservation.status) + '20' }
                    ]}>
                      <ThemedText style={[
                        styles.statusText,
                        { color: getStatusColor(reservation.status) }
                      ]}>
                        {(reservation.status || 'pending').charAt(0).toUpperCase() + (reservation.status || 'pending').slice(1)}
                      </ThemedText>
                    </View>
                  </View>
                
                <View style={styles.reservationDetails}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="person" size={16} color={subtitleColor} />
                    <ThemedText style={[
                      styles.detailText, 
                      { color: textColor }
                    ]}>
                      {reservation.userName}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <MaterialIcons name="email" size={16} color={subtitleColor} />
                    <ThemedText style={[
                      styles.detailText, 
                      { color: textColor }
                    ]}>
                      {reservation.userEmail}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <MaterialIcons name="category" size={16} color={subtitleColor} />
                    <ThemedText style={[
                      styles.detailText, 
                      { color: textColor }
                    ]}>
                      {getServiceTypeDisplayName(reservation.serviceType)}
                    </ThemedText>
                  </View>
                  
                  {reservation.serviceLocation && (
                    <View style={styles.detailRow}>
                      <MaterialIcons name="location-on" size={16} color={subtitleColor} />
                      <ThemedText style={[
                        styles.detailText, 
                        { color: textColor }
                      ]}>
                        {reservation.serviceLocation}
                      </ThemedText>
                    </View>
                  )}
                  
                  {/* Shipping Information for Laundry Services Only */}
                  {reservation.serviceType === 'laundry' && (reservation as any).shippingInfo && (
                    <>
                      <View key="shipping-delivery-type" style={styles.detailRow}>
                        <MaterialIcons 
                          name={(reservation as any).shippingInfo.deliveryType === 'pickup' ? 'local-shipping' : 'home'} 
                          size={16} 
                          color={subtitleColor} 
                        />
                        <ThemedText style={[
                          styles.detailText, 
                          { color: textColor }
                        ]}>
                          Delivery: {(reservation as any).shippingInfo.deliveryType === 'pickup' ? 'Pick Up' : 'Drop Off'}
                        </ThemedText>
                      </View>
                      
                      {/* Drop Off Address */}
                      {(reservation as any).shippingInfo.deliveryType === 'dropoff' && (reservation as any).shippingInfo.address && (
                        <View key="shipping-dropoff-address" style={styles.detailRow}>
                          <MaterialIcons name="location-on" size={16} color={subtitleColor} />
                          <ThemedText style={[
                            styles.detailText, 
                            { color: textColor }
                          ]}>
                            Address: {(reservation as any).shippingInfo.address}
                          </ThemedText>
                        </View>
                      )}
                      
                      {/* Pickup Details */}
                      {(reservation as any).shippingInfo.deliveryType === 'pickup' && (
                        <View key="shipping-pickup-details" style={[
                          styles.pickupDetailsContainer,
                          {
                            backgroundColor: isDark 
                              ? 'rgba(0, 178, 255, 0.12)' 
                              : 'rgba(0, 178, 255, 0.08)',
                            borderColor: isDark 
                              ? 'rgba(0, 178, 255, 0.3)' 
                              : 'rgba(0, 178, 255, 0.2)',
                          }
                        ]}>
                          <View style={styles.pickupDetailsHeader}>
                            <MaterialIcons name="local-shipping" size={18} color={colorPalette.primary} />
                            <ThemedText style={[styles.pickupDetailsTitle, { color: textColor }]}>
                              Pickup Details
                            </ThemedText>
                          </View>
                          
                          <View style={styles.pickupDetailsContent}>
                            {/* Date and Time Row */}
                            <View style={styles.pickupDateTimeRow}>
                              {(reservation as any).shippingInfo.pickupDate && (
                                <View 
                                  key="pickup-date"
                                  style={[
                                    styles.pickupDetailItem,
                                    {
                                      backgroundColor: isDark 
                                        ? 'rgba(0, 178, 255, 0.15)' 
                                        : 'rgba(0, 178, 255, 0.06)',
                                    }
                                  ]}>
                                  <MaterialIcons name="event" size={16} color={colorPalette.primary} />
                                  <ThemedText style={[styles.pickupDetailLabel, { color: subtitleColor }]}>Date</ThemedText>
                                  <ThemedText style={[styles.pickupDetailValue, { color: textColor }]}> 
                                    {(reservation as any).shippingInfo.pickupDate}
                                  </ThemedText>
                                </View>
                              )}
                              {(reservation as any).shippingInfo.pickupTime && (
                                <View 
                                  key="pickup-time"
                                  style={[
                                    styles.pickupDetailItem,
                                    {
                                      backgroundColor: isDark 
                                        ? 'rgba(0, 178, 255, 0.15)' 
                                        : 'rgba(0, 178, 255, 0.06)',
                                    }
                                  ]}>
                                  <MaterialIcons name="schedule" size={16} color={colorPalette.primary} />
                                  <ThemedText style={[styles.pickupDetailLabel, { color: subtitleColor }]}>Time</ThemedText>
                                  <ThemedText style={[styles.pickupDetailValue, { color: textColor }]}> 
                                    {(reservation as any).shippingInfo.pickupTime}
                                  </ThemedText>
                                </View>
                              )}
                            </View>
                            
                            {/* Address */}
                            {(reservation as any).shippingInfo.pickupAddress && (
                              <View 
                                key="pickup-address"
                                style={[
                                  styles.pickupDetailItemFull,
                                  {
                                    backgroundColor: isDark 
                                      ? 'rgba(0, 178, 255, 0.15)' 
                                      : 'rgba(0, 178, 255, 0.06)',
                                  }
                                ]}>
                                <MaterialIcons name="location-on" size={16} color={colorPalette.primary} />
                                <View style={styles.pickupDetailTextContainer}>
                                  <ThemedText style={[styles.pickupDetailLabel, { color: subtitleColor }]}>Pickup Address</ThemedText>
                                  <ThemedText style={[styles.pickupDetailValue, { color: textColor }]}> 
                                    {(reservation as any).shippingInfo.pickupAddress}
                                  </ThemedText>
                                </View>
                              </View>
                            )}
                            
                            {/* Contact */}
                            {(reservation as any).shippingInfo.pickupContactNumber && (
                              <View 
                                key="pickup-contact"
                                style={[
                                  styles.pickupDetailItemFull,
                                  {
                                    backgroundColor: isDark 
                                      ? 'rgba(0, 178, 255, 0.15)' 
                                      : 'rgba(0, 178, 255, 0.06)',
                                  }
                                ]}>
                                <MaterialIcons name="phone" size={16} color={colorPalette.primary} />
                                <View style={styles.pickupDetailTextContainer}>
                                  <ThemedText style={[styles.pickupDetailLabel, { color: subtitleColor }]}>Contact Number</ThemedText>
                                  <ThemedText style={[styles.pickupDetailValue, { color: textColor }]}> 
                                    {(reservation as any).shippingInfo.pickupContactNumber}
                                  </ThemedText>
                                </View>
                              </View>
                            )}
                            
                            {/* Instructions */}
                            {(reservation as any).shippingInfo.pickupInstructions && (reservation as any).shippingInfo.pickupInstructions !== 'No special instructions' && (
                              <View 
                                key="pickup-instructions"
                                style={[
                                  styles.pickupDetailItemFull,
                                  {
                                    backgroundColor: isDark 
                                      ? 'rgba(0, 178, 255, 0.15)' 
                                      : 'rgba(0, 178, 255, 0.06)',
                                  }
                                ]}>
                                <MaterialIcons name="note" size={16} color={colorPalette.primary} />
                                <View style={styles.pickupDetailTextContainer}>
                                  <ThemedText style={[styles.pickupDetailLabel, { color: subtitleColor }]}>Special Instructions</ThemedText>
                                  <ThemedText style={[styles.pickupDetailValue, { color: textColor }]}> 
                                    {(reservation as any).shippingInfo.pickupInstructions}
                                  </ThemedText>
                                </View>
                              </View>
                            )}
                          </View>
                        </View>
                      )}
                    </>
                  )}
                  
                  {/* Home Service Information */}
                  {(reservation as any).homeService && (
                    <View style={[styles.homeServiceContainer, { backgroundColor: cardBgColor, borderColor }]}>
                      <View style={styles.homeServiceHeader}>
                        <View style={styles.homeServiceIconContainer}>
                          <MaterialIcons name="home" size={20} color="#10B981" />
                        </View>
                        <ThemedText style={[styles.homeServiceTitle, { color: '#10B981' }]}>
                          Home Service Request
                        </ThemedText>
                      </View>
                      
                      <View style={styles.homeServiceDetails}>
                        {(reservation as any).problemDescription && (
                          <View style={styles.homeServiceDetailItem}>
                            <View style={[styles.homeServiceDetailIcon, { backgroundColor: '#FEF3C7' }]}>
                              <MaterialIcons name="build" size={16} color="#F59E0B" />
                            </View>
                            <View style={styles.homeServiceDetailContent}>
                              <ThemedText style={[styles.homeServiceDetailLabel, { color: subtitleColor }]}>
                                Problem Description
                              </ThemedText>
                              <ThemedText style={[styles.homeServiceDetailValue, { color: textColor }]}> 
                                {(reservation as any).problemDescription}
                              </ThemedText>
                            </View>
                          </View>
                        )}
                        
                        {(reservation as any).address && (
                          <View style={styles.homeServiceDetailItem}>
                            <View style={[styles.homeServiceDetailIcon, { backgroundColor: '#DBEAFE' }]}>
                              <MaterialIcons name="location-on" size={16} color="#3B82F6" />
                            </View>
                            <View style={styles.homeServiceDetailContent}>
                              <ThemedText style={[styles.homeServiceDetailLabel, { color: subtitleColor }]}>
                                Service Address
                              </ThemedText>
                              <ThemedText style={[styles.homeServiceDetailValue, { color: textColor }]}> 
                                {(reservation as any).address}
                              </ThemedText>
                            </View>
                          </View>
                        )}
                        
                        {(reservation as any).contactNumber && (
                          <View style={styles.homeServiceDetailItem}>
                            <View style={[styles.homeServiceDetailIcon, { backgroundColor: '#D1FAE5' }]}>
                              <MaterialIcons name="phone" size={16} color="#10B981" />
                            </View>
                            <View style={styles.homeServiceDetailContent}>
                              <ThemedText style={[styles.homeServiceDetailLabel, { color: subtitleColor }]}>
                                Contact Number
                              </ThemedText>
                              <ThemedText style={[styles.homeServiceDetailValue, { color: textColor }]}> 
                                {(reservation as any).contactNumber}
                              </ThemedText>
                            </View>
                          </View>
                        )}
                        
                        {(reservation as any).preferredTime && (
                          <View style={styles.homeServiceDetailItem}>
                            <View style={[styles.homeServiceDetailIcon, { backgroundColor: '#F3E8FF' }]}>
                              <MaterialIcons name="schedule" size={16} color="#8B5CF6" />
                            </View>
                            <View style={styles.homeServiceDetailContent}>
                              <ThemedText style={[styles.homeServiceDetailLabel, { color: subtitleColor }]}>
                                Preferred Time
                              </ThemedText>
                              <ThemedText style={[styles.homeServiceDetailValue, { color: textColor }]}> 
                                {(reservation as any).preferredTime}
                              </ThemedText>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.detailRow}>
                    <MaterialIcons name="calendar-today" size={16} color={subtitleColor} />
                    <ThemedText style={[
                      styles.detailText, 
                      { color: textColor }
                    ]}>
                      {formatDate(reservation.reservationDate)}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <MaterialIcons name="attach-money" size={16} color={subtitleColor} />
                    <ThemedText style={[
                      styles.detailText, 
                      { color: textColor }
                    ]}>
                      {formatPHP(reservation.servicePrice)}
                    </ThemedText>
                  </View>

                  {/* Payment Information */}
                  {isPaymentRequired(reservation.serviceType) && (
                    <>
                      <View key="payment-section" style={styles.paymentSection}>
                        <ThemedText style={[styles.paymentSectionTitle, { color: textColor }]}>
                          Payment Information
                        </ThemedText>
                        
                        <View key="payment-down-payment" style={styles.detailRow}>
                          <MaterialIcons name="payment" size={16} color="#10B981" />
                          <ThemedText style={[styles.detailText, { color: textColor }]}>
                            Down Payment: {formatPHP(calculateDownPayment(reservation.servicePrice, reservation.serviceType))}
                          </ThemedText>
                        </View>
                        
                        <View key="payment-status" style={styles.detailRow}>
                          <MaterialIcons 
                            name={(reservation as any).paymentStatus === 'paid' ? 'check-circle' : 'pending'} 
                            size={16} 
                            color={(reservation as any).paymentStatus === 'paid' ? '#10B981' : '#F59E0B'} 
                          />
                          <ThemedText style={[styles.detailText, { 
                            color: (reservation as any).paymentStatus === 'paid' ? '#10B981' : '#F59E0B' 
                          }]}>
                            Payment Status: {(reservation as any).paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                          </ThemedText>
                        </View>
                      </View>
                    </>
                  )}
                </View>
                
                  <View style={styles.reservationActions}>
                    {(reservation.status || 'pending') === 'pending' && (
                      <>
                        <TouchableOpacity 
                          key="accept-button"
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleAcceptReservation(reservation.id, reservation.serviceType, reservation.serviceId, reservation.userId)}
                        >
                          <MaterialIcons name="check" size={20} color="#10B981" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          key="decline-button"
                          style={[styles.actionButton, styles.declineButton]}
                          onPress={() => handleDeclineReservation(reservation.id, reservation.serviceType, reservation.serviceId, reservation.userId)}
                        >
                          <MaterialIcons name="close" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </>
                    )}
                    
                    {(reservation.status || 'pending') === 'confirmed' && (
                      <TouchableOpacity 
                        key="complete-button"
                        style={[styles.actionButton, styles.completeButton]}
                        onPress={async () => {
                          try {
                            await updateReservationStatus(reservation.id, 'completed');
                            if (reservation.serviceType === 'apartment') {
                              await updateApartmentStatus(reservation.serviceId, 'completed');
                            } else if (reservation.serviceType === 'laundry') {
                              await updateLaundryStatus(reservation.serviceId, 'completed');
                            } else if (reservation.serviceType === 'auto') {
                              await updateAutoStatus(reservation.serviceId, 'completed');
                            }
                            try {
                              await notifyUser(
                                reservation.userId,
                                'Reservation Completed',
                                `Your ${getServiceTypeDisplayName(reservation.serviceType)} is marked completed.`,
                                { serviceType: reservation.serviceType, serviceId: reservation.serviceId, action: 'completed' }
                              );
                            } catch {}
                            Alert.alert('Success', 'Reservation has been marked as completed!');
                          } catch (error) {
                            console.error('Error marking reservation as completed:', error);
                            Alert.alert('Error', 'Failed to mark reservation as completed. Please try again.');
                          }
                        }}
                      >
                        <MaterialIcons name="done-all" size={20} color="#3B82F6" />
                      </TouchableOpacity>
                    )}
                    
                    {/* Delete button - always visible */}
                    <TouchableOpacity 
                      key="delete-button"
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteReservation(reservation.id, reservation.serviceType, reservation.serviceId, reservation.userId, reservation.serviceTitle)}
                    >
                      <MaterialIcons name="delete" size={20} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Payment Settings Modal */}
      <Modal
        visible={paymentSettingsVisible}
        animationType="slide"
        onRequestClose={() => setPaymentSettingsVisible(false)}
      >
        <AdminPaymentSettingsModal
          isDark={isDark}
          onClose={() => {
            setPaymentSettingsVisible(false);
          }}
        />
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    opacity: 0.8,
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colorPalette.primary,
  },
  reservationsContainer: {
    marginBottom: 20,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filterModal: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  reservationCard: {
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
  },
  reservationContent: {
    padding: 20,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reservationImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  reservationService: {
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reservationDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  reservationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  acceptButton: {
    backgroundColor: '#10B98120',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  declineButton: {
    backgroundColor: '#EF444420',
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  completeButton: {
    backgroundColor: '#3B82F620',
    borderColor: '#3B82F6',
    borderWidth: 1,
  },
  deleteButton: {
    backgroundColor: '#DC262620',
    borderColor: '#DC2626',
    borderWidth: 1,
  },
  paymentSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  paymentSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#10B981',
  },
  pickupDetailsContainer: {
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: colorPalette.primary,
    shadowColor: colorPalette.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickupDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickupDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pickupDetailsContent: {
    gap: 8,
  },
  pickupDateTimeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pickupDetailItem: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 178, 255, 0.2)',
  },
  pickupDetailItemFull: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 178, 255, 0.2)',
  },
  pickupDetailTextContainer: {
    flex: 1,
  },
  pickupDetailLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  pickupDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 16,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    paddingVertical: 4,
  },
  // Home Service Styles
  homeServiceContainer: {
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  homeServiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  homeServiceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  homeServiceTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  homeServiceDetails: {
    gap: 12,
  },
  homeServiceDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  homeServiceDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  homeServiceDetailContent: {
    flex: 1,
  },
  homeServiceDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  homeServiceDetailValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});