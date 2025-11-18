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
import { get, ref } from 'firebase/database';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { AdminPaymentSettingsModal } from '../components/AdminPaymentSettings';
import { RobustImage } from '../components/RobustImage';
import { getAccessibleModules, getAdminRole, isSuperAdmin } from '../config/adminConfig';
import { useAdminReservation } from '../contexts/AdminReservationContext';
import { useAuthContext } from '../contexts/AuthContext';
import { useReservation } from '../contexts/ReservationContext';
import { db } from '../firebaseConfig';
import { notifyUser } from '../services/notificationService';
import { calculateDownPayment, isPaymentRequired } from '../services/paymentService';
import { getUserReservations, removeReservationCompletely, updateAdminReservationPaymentStatus, updateUserReservationStatus } from '../services/reservationService';
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
  const { adminReservations, updateReservationStatus, removeAdminReservation, loading, error, getReservationsByModule } = useAdminReservation(); // Admin reservation context
  const { updateApartmentStatus, updateLaundryStatus, updateAutoStatus } = useReservation(); // Reservation context
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'declined'>('all'); // Status filter state
  const [filterVisible, setFilterVisible] = useState(false); // Filter modal visibility
  const [paymentSettingsVisible, setPaymentSettingsVisible] = useState(false); // Payment settings modal visibility
  const [searchQuery, setSearchQuery] = useState(''); // Search query state
  const [balanceModalVisible, setBalanceModalVisible] = useState(false); // Balance modal visibility
  const [selectedReservation, setSelectedReservation] = useState<any>(null); // Selected reservation for balance view
  const [paymentData, setPaymentData] = useState<any>(null); // Payment data for selected reservation
  const [paymentDataMap, setPaymentDataMap] = useState<Record<string, any>>({}); // Payment data mapped by reservation ID
  const [paymentDataLoading, setPaymentDataLoading] = useState(true); // Loading state for payment data
  
  // ========================================
  // ROLE-BASED ACCESS CONTROL
  // ========================================
  // Get admin role information for role-based filtering
  const { user } = useAuthContext();
  const adminEmail = user?.email || '';
  const adminRole = getAdminRole(adminEmail);
  const accessibleModules = getAccessibleModules(adminEmail);
  const isSuperAdminUser = isSuperAdmin(adminEmail);
  
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';

  // Fetch payment data for all reservations - Optimized to fetch all at once
  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!adminReservations || adminReservations.length === 0) {
        setPaymentDataMap({});
        setPaymentDataLoading(false);
        return;
      }
      
      try {
        setPaymentDataLoading(true);
        const paymentMap: Record<string, any> = {};
        
        // Optimized: Fetch all payments at once instead of one by one
        const paymentsSnapshot = await get(ref(db, 'payments'));
        
        if (paymentsSnapshot.exists()) {
          const allPayments = Object.values(paymentsSnapshot.val() || {}) as any[];
          
          // Match payments to reservations
          for (const reservation of adminReservations) {
            // Try to find payment by reservation ID first
            let matchingPayments = allPayments.filter(
              (p: any) => p.reservationId === reservation.id
            );
            
            // If not found, try to find by serviceId, userId, and serviceType (fallback)
            if (matchingPayments.length === 0) {
              matchingPayments = allPayments.filter(
                (p: any) => p.serviceId === reservation.serviceId && 
                p.userId === reservation.userId &&
                p.serviceType === reservation.serviceType
              );
            }
            
            // Get the most recent payment
            if (matchingPayments.length > 0) {
              const latestPayment = matchingPayments.sort(
                (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0];
              paymentMap[reservation.id] = latestPayment;
            }
          }
        }
        
        setPaymentDataMap(paymentMap);
        setPaymentDataLoading(false);
      } catch (error) {
        console.error('Error fetching payment data:', error);
        setPaymentDataMap({});
        setPaymentDataLoading(false);
      }
    };

    fetchPaymentData();
  }, [adminReservations]);

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
            getServiceTypeDisplayName(r.serviceType).toLowerCase().includes(query) ||
            // Include bed information in search
            (r.serviceType === 'apartment' && (r as any).bedId && 
              (`bed ${(r as any).bedNumber || ''}`.toLowerCase().includes(query) ||
               `apartment bed ${(r as any).bedNumber || ''}`.toLowerCase().includes(query)))
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

  // Calculate counts for each status
  const statusCounts = useMemo(() => {
    const validReservations = (adminReservations || []).filter(r => isValidDate(r.reservationDate));
    
    return {
      all: validReservations.length,
      pending: validReservations.filter(r => (r.status || 'pending') === 'pending').length,
      confirmed: validReservations.filter(r => (r.status || 'pending') === 'confirmed').length,
      completed: validReservations.filter(r => (r.status || 'pending') === 'completed').length,
      cancelled: validReservations.filter(r => (r.status || 'pending') === 'cancelled').length,
      declined: validReservations.filter(r => (r.status || 'pending') === 'declined').length,
    };
  }, [adminReservations]);

  const handleAcceptReservation = (reservationId: string, serviceType: string, serviceId: string, userId: string, bedId?: string) => {
    const performUpdate = async () => {
      try {
        await updateReservationStatus(reservationId, 'confirmed');
        // Update payment status to 'paid' when accepting reservation
        await updateAdminReservationPaymentStatus(reservationId, 'paid');
        
        // Update corresponding user's reservation regardless of current auth context
        try {
          const userReservations = await getUserReservations(userId);
          
          // If bedId is provided, find the specific bed reservation
          // Otherwise, find the first reservation for that service
          const target = bedId 
            ? userReservations.find(r => r.serviceId === serviceId && r.serviceType === serviceType && (r as any).bedId === bedId)
            : userReservations.find(r => r.serviceId === serviceId && r.serviceType === serviceType);
            
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

  const handleDeclineReservation = (reservationId: string, serviceType: string, serviceId: string, userId: string, bedId?: string) => {
    const performUpdate = async () => {
      try {
        await updateReservationStatus(reservationId, 'declined');
        // Update corresponding user's reservation regardless of current auth context
        try {
          const userReservations = await getUserReservations(userId);
          
          // If bedId is provided, find the specific bed reservation
          // Otherwise, find the first reservation for that service
          const target = bedId 
            ? userReservations.find(r => r.serviceId === serviceId && r.serviceType === serviceType && (r as any).bedId === bedId)
            : userReservations.find(r => r.serviceId === serviceId && r.serviceType === serviceType);
            
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

  const handleDeleteReservation = (reservationId: string, serviceType: string, serviceId: string, userId: string, serviceTitle: string, bedId?: string) => {
    const performDelete = async () => {
      try {
        // Delete both admin and user reservations completely
        await removeReservationCompletely(
          reservationId,
          userId,
          serviceType as 'apartment' | 'laundry' | 'auto',
          serviceId
        );
        console.log('✅ Both admin and user reservations deleted successfully');
        
        // Update service status to pending (available for new reservations)
        // For bed reservations, we need to handle bed-specific cancellation
        try {
          if (serviceType === 'apartment') {
            if (bedId) {
              // If this is a bed reservation, cancel the specific bed
              const { cancelBedReservation } = await import('../services/apartmentService');
              await cancelBedReservation(serviceId, bedId);
              console.log('✅ Bed reservation cancelled successfully');
            } else {
              // For non-bed apartment reservations, update apartment status
              await updateApartmentStatus(serviceId, 'pending');
            }
          } else if (serviceType === 'laundry') {
            await updateLaundryStatus(serviceId, 'pending');
          } else if (serviceType === 'auto') {
            await updateAutoStatus(serviceId, 'pending');
          }
        } catch (e) {
          console.warn('Failed updating service status:', e);
        }
        
        // Notify user about the reservation deletion
        try {
          await notifyUser(
            userId,
            'Reservation Deleted',
            `Your ${serviceTitle} reservation has been deleted by admin.`,
            { serviceType, serviceId, action: 'reservation_deleted' }
          );
        } catch {}
        
        Alert.alert('Delete Success', 'Reservation has been deleted successfully!');
      } catch (error) {
        console.error('Error deleting reservation:', error);
        Alert.alert('Error', 'Failed to delete reservation. Please try again.');
      }
    };

    if (Platform.OS === 'web') {
      performDelete();
      return;
    }

    Alert.alert(
      'Delete Reservation',
      'Are you sure you want to delete?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: performDelete,
          style: 'destructive'
        }
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
                color: textColor, 
                fontSize: subtitleSize 
              }
            ]}>
              {isSuperAdminUser 
                ? 'Manage all customer reservations' 
                : `Manage ${adminRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} reservations`
              }
            </ThemedText>
            {!isSuperAdminUser && (
              <ThemedText type="default" style={[
                styles.roleIndicator, 
                { 
                  color: colorPalette.primary, 
                  fontSize: subtitleSize - 2,
                  marginTop: 4
                }
              ]}>
                Access: {accessibleModules.join(', ').replace(/\b\w/g, l => l.toUpperCase())}
              </ThemedText>
            )}
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


        {/* Reservations List */}
        <View style={styles.reservationsContainer}>
          {/* Filter Modal */}
          <Modal
            visible={filterVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setFilterVisible(false)}
          >
            <TouchableOpacity 
              style={styles.filterModalOverlay}
              activeOpacity={1}
              onPress={() => setFilterVisible(false)}
            >
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                <View style={[styles.filterModal, { backgroundColor: cardBgColor, borderColor }]}> 
                  {/* Header Section */}
                  <View style={styles.filterModalHeader}>
                    <View>
                      <ThemedText type="subtitle" style={[styles.filterTitle, { color: textColor }]}>
                        Filter Reservations
                      </ThemedText>
                      <ThemedText style={[styles.filterSubtitle, { color: subtitleColor }]}>
                        Select status to filter
                      </ThemedText>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setFilterVisible(false)}
                      style={styles.closeButton}
                    >
                      <MaterialIcons name="close" size={24} color={textColor} />
                    </TouchableOpacity>
                  </View>

                  {/* Divider */}
                  <View style={[styles.filterDivider, { backgroundColor: borderColor }]} />

                  {/* Filter Options */}
                  <View style={styles.filterOptionsContainer}>
                    {[
                      { id: 'all', label: 'All Reservations', count: statusCounts.all, icon: 'list' },
                      { id: 'pending', label: 'Pending', count: statusCounts.pending, icon: 'schedule' },
                      { id: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed, icon: 'check-circle' },
                      { id: 'completed', label: 'Completed', count: statusCounts.completed, icon: 'done-all' },
                      { id: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled, icon: 'cancel' },
                      { id: 'declined', label: 'Declined', count: statusCounts.declined, icon: 'block' },
                    ].map((opt: any) => {
                      const active = statusFilter === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.filterOption,
                            { 
                              borderColor: active ? colorPalette.primary : borderColor,
                              backgroundColor: active ? colorPalette.primary + '15' : 'transparent',
                              shadowColor: active ? colorPalette.primary : 'transparent',
                              shadowOpacity: active ? 0.1 : 0,
                            }
                          ]}
                          onPress={() => {
                            setStatusFilter(opt.id);
                            setFilterVisible(false);
                          }}
                        >
                          <View style={styles.filterOptionContent}>
                            <MaterialIcons 
                              name={opt.icon} 
                              size={22} 
                              color={active ? colorPalette.primary : subtitleColor}
                              style={styles.filterOptionIcon}
                            />
                            <View style={styles.filterOptionTextContainer}>
                              <ThemedText style={[
                                styles.filterOptionLabel,
                                { color: active ? colorPalette.primary : textColor }
                              ]}>
                                {opt.label}
                              </ThemedText>
                              <ThemedText style={[
                                styles.filterOptionCountLabel,
                                { color: subtitleColor }
                              ]}>
                                {opt.count} reservation{opt.count !== 1 ? 's' : ''}
                              </ThemedText>
                            </View>
                          </View>
                          {active && (
                            <View style={[styles.activeIndicator, { backgroundColor: colorPalette.primary }]}>
                              <MaterialIcons name="check" size={16} color="#FFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
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
          ) : displayReservations.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="filter-list" size={48} color={subtitleColor} />
              <ThemedText style={[styles.emptyText, { color: subtitleColor }]}>
                No {statusFilter === 'all' ? '' : statusFilter} reservations found
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: subtitleColor }]}>
                {statusFilter === 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : `There are currently no ${statusFilter} reservations. Try selecting a different filter.`
                }
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
                  <View style={styles.imageContainer}>
                    <RobustImage 
                      source={reservation.serviceImage} 
                      style={styles.reservationImage} 
                      resizeMode="cover" 
                    />
                    {/* Status and title overlay for apartment reservations */}
                    {reservation.serviceType === 'apartment' && (
                      <>
                        {/* Apartment Rental Title Overlay */}
                        <View style={[styles.titleOverlay, { 
                          backgroundColor: 'rgba(0, 0, 0, 0.7)' // Semi-transparent black
                        }]}>
                          <MaterialIcons name="apartment" size={16} color="#FFFFFF" />
                          <ThemedText style={[styles.titleOverlayText, { 
                            color: '#FFFFFF',
                            fontWeight: '600'
                          }]}>
                            Apartment Rental
                          </ThemedText>
                        </View>
                        
                        {/* Status Overlay */}
                        <View style={[styles.statusOverlay, { 
                          backgroundColor: getStatusColor(reservation.status) + 'E6' // 90% opacity
                        }]}>
                          <ThemedText style={[styles.statusOverlayText, { 
                            color: '#FFFFFF',
                            fontWeight: '700'
                          }]}>
                            {(reservation.status || 'pending').toUpperCase()}
                          </ThemedText>
                        </View>
                      </>
                    )}
                  </View>
                )}
                
                <View style={styles.reservationContent}>
                  <View style={styles.reservationHeader}>
                    <ThemedText type="subtitle" style={[
                      styles.reservationService, 
                      { color: textColor }
                    ]}>
                      {reservation.serviceTitle}
                      {/* Show bed information in title for apartment reservations */}
                      {reservation.serviceType === 'apartment' && (reservation as any).bedId && (
                        <ThemedText style={[
                          styles.bedTitleText, 
                          { color: colorPalette.primary }
                        ]}>
                          {' '}(Bed {(reservation as any).bedNumber || 'N/A'})
                        </ThemedText>
                      )}
                    </ThemedText>
                    {/* Status badge removed for laundry services */}
                  </View>
                
                <View style={styles.reservationDetails}>
                  {/* Professional Laundry Service Summary */}
                  {reservation.serviceType === 'laundry' && (
                    <View style={[styles.laundrySummaryCard, { 
                      backgroundColor: isDark ? '#1A1A1A' : '#F8FAFC',
                      borderColor: isDark ? '#333' : '#E2E8F0'
                    }]}>
                      {/* Header with Status */}
                      <View style={styles.laundrySummaryHeader}>
                        <View style={styles.laundrySummaryTitleContainer}>
                          <MaterialIcons name="local-laundry-service" size={20} color={textColor} />
                          <ThemedText style={[styles.laundrySummaryTitle, { color: textColor }]}>
                            Laundry Service
                        </ThemedText>
                      </View>
                        <View style={[styles.laundryStatusIndicator, { 
                          backgroundColor: getStatusColor(reservation.status) + '15',
                          borderColor: getStatusColor(reservation.status) + '40'
                        }]}>
                          <ThemedText style={[styles.laundryStatusText, { 
                            color: getStatusColor(reservation.status) 
                          }]}>
                            {(reservation.status || 'pending').toUpperCase()}
                          </ThemedText>
                        </View>
                  </View>
                
                      {/* Professional Information Grid */}
                      <View style={[styles.laundryInfoGrid, { 
                        flexDirection: width < 600 ? 'column' : 'row',
                        gap: width < 400 ? 4 : 6
                      }]}>
                        {/* Service Type */}
                        <View style={[styles.laundryInfoItem, { 
                          minWidth: width < 600 ? '100%' : '45%',
                          backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                          borderColor: isDark ? '#404040' : '#E5E7EB',
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          shadowColor: '#000',
                          shadowOpacity: 0.04,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }]}>
                          <View style={[styles.laundryInfoIcon, { 
                            backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)'
                          }]}>
                            <MaterialIcons name="category" size={18} color={textColor} />
                          </View>
                          <View style={styles.laundryInfoContent}>
                            <ThemedText style={[styles.laundryInfoLabel, { color: subtitleColor }]}>
                              Service Type
                            </ThemedText>
                            <ThemedText style={[styles.laundryInfoValue, { color: textColor }]}>
                        {getServiceTypeDisplayName(reservation.serviceType)}
                      </ThemedText>
                    </View>
                        </View>

                        {/* Service Location */}
                        {reservation.serviceLocation && (
                          <View style={[styles.laundryInfoItem, { 
                            minWidth: width < 600 ? '100%' : '45%',
                            backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                            borderColor: isDark ? '#404040' : '#E5E7EB',
                            borderRadius: 12,
                            padding: 16,
                            borderWidth: 1,
                            shadowColor: '#000',
                            shadowOpacity: 0.04,
                            shadowRadius: 4,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: 2,
                          }]}>
                            <View style={[styles.laundryInfoIcon, { 
                              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                            }]}>
                              <MaterialIcons name="location-on" size={18} color={textColor} />
                            </View>
                            <View style={styles.laundryInfoContent}>
                              <ThemedText style={[styles.laundryInfoLabel, { color: subtitleColor }]}>
                                Service Location
                              </ThemedText>
                              <ThemedText style={[styles.laundryInfoValue, { color: textColor }]}>
                                {reservation.serviceLocation}
                              </ThemedText>
                            </View>
                          </View>
                        )}

                        {/* Customer Information */}
                        <View style={[styles.laundryInfoItem, { 
                          minWidth: width < 600 ? '100%' : '45%',
                          backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                          borderColor: isDark ? '#404040' : '#E5E7EB',
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          shadowColor: '#000',
                          shadowOpacity: 0.04,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }]}>
                          <View style={[styles.laundryInfoIcon, { 
                            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)'
                          }]}>
                            <MaterialIcons name="person" size={18} color={textColor} />
                          </View>
                          <View style={styles.laundryInfoContent}>
                            <ThemedText style={[styles.laundryInfoLabel, { color: subtitleColor }]}>
                              Customer Name
                            </ThemedText>
                            <ThemedText style={[styles.laundryInfoValue, { color: textColor }]}>
                              {reservation.userName || 'N/A'}
                            </ThemedText>
                          </View>
                        </View>

                        {/* Contact Email */}
                        <View style={[styles.laundryInfoItem, { 
                          minWidth: width < 600 ? '100%' : '45%',
                          backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                          borderColor: isDark ? '#404040' : '#E5E7EB',
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          shadowColor: '#000',
                          shadowOpacity: 0.04,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }]}>
                          <View style={[styles.laundryInfoIcon, { 
                            backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)'
                          }]}>
                            <MaterialIcons name="email" size={18} color={textColor} />
                          </View>
                          <View style={styles.laundryInfoContent}>
                            <ThemedText style={[styles.laundryInfoLabel, { color: subtitleColor }]}>
                              Contact Email
                            </ThemedText>
                            <ThemedText style={[styles.laundryInfoValue, { color: textColor }]}>
                              {reservation.userEmail || 'N/A'}
                            </ThemedText>
                          </View>
                        </View>

                        {/* Service Price */}
                        <View style={[styles.laundryInfoItem, { 
                          minWidth: width < 600 ? '100%' : '45%',
                          backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                          borderColor: isDark ? '#404040' : '#E5E7EB',
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          shadowColor: '#000',
                          shadowOpacity: 0.04,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }]}>
                          <View style={[styles.laundryInfoIcon, { 
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'
                          }]}>
                            <MaterialIcons name="attach-money" size={18} color={textColor} />
                          </View>
                          <View style={styles.laundryInfoContent}>
                            <ThemedText style={[styles.laundryInfoLabel, { color: subtitleColor }]}>
                              Service Price
                            </ThemedText>
                            <ThemedText style={[styles.laundryInfoValue, { color: '#10B981' }]}>
                              {formatPHP(reservation.servicePrice)}
                            </ThemedText>
                          </View>
                        </View>

                        {/* Service Location */}
                        {reservation.serviceLocation && (
                          <View style={[styles.laundryInfoItem, { 
                            minWidth: width < 600 ? '100%' : '45%',
                            backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                            borderColor: isDark ? '#404040' : '#E5E7EB',
                            borderRadius: 12,
                            padding: 16,
                            borderWidth: 1,
                            shadowColor: '#000',
                            shadowOpacity: 0.04,
                            shadowRadius: 4,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: 2,
                          }]}>
                            <View style={[styles.laundryInfoIcon, { 
                              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                            }]}>
                              <MaterialIcons name="location-on" size={18} color={textColor} />
                            </View>
                            <View style={styles.laundryInfoContent}>
                              <ThemedText style={[styles.laundryInfoLabel, { color: subtitleColor }]}>
                                Service Location
                              </ThemedText>
                              <ThemedText style={[styles.laundryInfoValue, { color: textColor }]}>
                        {reservation.serviceLocation}
                      </ThemedText>
                            </View>
                    </View>
                  )}
                  
                        {/* Reservation Date */}
                        <View style={[styles.laundryInfoItem, { 
                          minWidth: width < 600 ? '100%' : '45%',
                          backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                          borderColor: isDark ? '#404040' : '#E5E7EB',
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          shadowColor: '#000',
                          shadowOpacity: 0.04,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }]}>
                          <View style={[styles.laundryInfoIcon, { 
                            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)'
                          }]}>
                            <MaterialIcons name="calendar-today" size={18} color={textColor} />
                          </View>
                          <View style={styles.laundryInfoContent}>
                            <ThemedText style={[styles.laundryInfoLabel, { color: subtitleColor }]}>
                              Reservation Date
                            </ThemedText>
                            <ThemedText style={[styles.laundryInfoValue, { color: textColor }]}>
                              {formatDate(reservation.reservationDate)}
                            </ThemedText>
                          </View>
                        </View>

                        {/* Payment Information */}
                        {isPaymentRequired(reservation.serviceType) && (() => {
                          const paymentData = paymentDataMap[reservation.id];
                          // Don't show payment info while loading to avoid showing wrong data
                          if (paymentDataLoading && !paymentData) {
                            return null; // Don't render until payment data is loaded
                          }
                          
                          return (
                            <>
                              <View style={[styles.laundryInfoItem, { 
                              minWidth: width < 600 ? '100%' : '45%',
                              backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                              borderColor: isDark ? '#404040' : '#E5E7EB',
                              borderRadius: 12,
                              padding: 16,
                              borderWidth: 1,
                              shadowColor: '#000',
                              shadowOpacity: 0.04,
                              shadowRadius: 4,
                              shadowOffset: { width: 0, height: 2 },
                              elevation: 2,
                            }]}>
                              <View style={[styles.laundryInfoIcon, { 
                                backgroundColor: (() => {
                                  const paymentData = paymentDataMap[reservation.id];
                                  return paymentData?.paymentAmountType === 'full' 
                                    ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)')
                                    : (isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)');
                                })()
                              }]}>
                                <MaterialIcons 
                                  name={(() => {
                                    const paymentData = paymentDataMap[reservation.id];
                                    return paymentData?.paymentAmountType === 'full' ? 'check-circle' : 'payment';
                                  })()} 
                                  size={18} 
                                  color={(() => {
                                    const paymentData = paymentDataMap[reservation.id];
                                    return paymentData?.paymentAmountType === 'full' ? '#22C55E' : '#8B5CF6';
                                  })()} 
                                />
                              </View>
                              <View style={styles.laundryInfoContent}>
                                <ThemedText style={[styles.laundryInfoLabel, { 
                                  color: (() => {
                                    const paymentData = paymentDataMap[reservation.id];
                                    return paymentData?.paymentAmountType === 'full' ? '#22C55E' : subtitleColor;
                                  })(),
                                  fontWeight: (() => {
                                    const paymentData = paymentDataMap[reservation.id];
                                    return paymentData?.paymentAmountType === 'full' ? '600' : 'normal';
                                  })()
                                }]}>
                                  {(() => {
                                    const paymentData = paymentDataMap[reservation.id];
                                    const isFullPayment = paymentData?.paymentAmountType === 'full';
                                    return isFullPayment ? 'Full Payment' : 'Service Fee';
                                  })()}
                                </ThemedText>
                                <ThemedText style={[styles.laundryInfoValue, { 
                                  color: (() => {
                                    const paymentData = paymentDataMap[reservation.id];
                                    return paymentData?.paymentAmountType === 'full' ? '#22C55E' : textColor;
                                  })(),
                                  fontWeight: (() => {
                                    const paymentData = paymentDataMap[reservation.id];
                                    return paymentData?.paymentAmountType === 'full' ? '700' : 'normal';
                                  })()
                                }]}>
                                  {(() => {
                                    const paymentData = paymentDataMap[reservation.id];
                                    const servicePrice = reservation.servicePrice;
                                    const isFullPayment = paymentData?.paymentAmountType === 'full';
                                    const paymentAmount = paymentData?.amount || (isFullPayment ? servicePrice : calculateDownPayment(servicePrice, reservation.serviceType));
                                    return formatPHP(paymentAmount);
                                  })()}
                                </ThemedText>
                              </View>
                            </View>

                            <View style={[styles.laundryInfoItem, { 
                              minWidth: width < 600 ? '100%' : '45%',
                              backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                              borderColor: isDark ? '#404040' : '#E5E7EB',
                              borderRadius: 12,
                              padding: 16,
                              borderWidth: 1,
                              shadowColor: '#000',
                              shadowOpacity: 0.04,
                              shadowRadius: 4,
                              shadowOffset: { width: 0, height: 2 },
                              elevation: 2,
                            }]}>
                              <View style={[styles.laundryInfoIcon, { 
                                backgroundColor: (reservation as any).paymentStatus === 'paid' 
                                  ? (isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
                                  : (isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)')
                              }]}>
                                <MaterialIcons 
                                  name={(reservation as any).paymentStatus === 'paid' ? 'check-circle' : 'pending'} 
                                  size={18} 
                                  color={(reservation as any).paymentStatus === 'paid' ? '#10B981' : '#F59E0B'} 
                                />
                              </View>
                              <View style={styles.laundryInfoContent}>
                                <ThemedText style={[styles.laundryInfoLabel, { color: subtitleColor }]}>
                                  Payment Status
                                </ThemedText>
                                <ThemedText style={[styles.laundryInfoValue, { 
                                  color: (reservation as any).paymentStatus === 'paid' ? '#10B981' : '#F59E0B' 
                                }]}>
                                  {(reservation as any).paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                </ThemedText>
                              </View>
                            </View>
                            </>
                          );
                        })()}
                      </View>

                      {/* Shipping Information for Laundry Services */}
                      {(reservation as any).shippingInfo && (
                        <View style={[styles.laundryInfoGrid, { 
                          flexDirection: width < 600 ? 'column' : 'row',
                          gap: width < 400 ? 4 : 6,
                          marginTop: 12
                        }]}>
                          {/* Delivery Type */}
                          <View style={[styles.laundryInfoItem, { 
                            minWidth: width < 600 ? '100%' : '45%',
                            backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                            borderColor: isDark ? '#404040' : '#E5E7EB',
                            borderRadius: 12,
                            padding: 16,
                            borderWidth: 1,
                            shadowColor: '#000',
                            shadowOpacity: 0.04,
                            shadowRadius: 4,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: 2,
                          }]}>
                            <View style={[styles.laundryInfoIcon, { 
                              backgroundColor: isDark ? 'rgba(0, 178, 255, 0.15)' : 'rgba(0, 178, 255, 0.1)'
                            }]}>
                        <MaterialIcons 
                          name={(reservation as any).shippingInfo.deliveryType === 'pickup' ? 'local-shipping' : 'home'} 
                                size={18} 
                                color={textColor} 
                              />
                            </View>
                            <View style={styles.laundryInfoContent}>
                              <ThemedText style={[styles.laundryInfoLabel, { color: subtitleColor }]}>
                                Delivery Type
                              </ThemedText>
                              <ThemedText style={[styles.laundryInfoValue, { color: textColor }]}>
                                {(reservation as any).shippingInfo.deliveryType === 'pickup' ? 'Pick Up' : 'Drop Off'}
                        </ThemedText>
                            </View>
                      </View>
                      
                      {/* Drop Off Address */}
                      {(reservation as any).shippingInfo.deliveryType === 'dropoff' && (reservation as any).shippingInfo.address && (
                            <View style={[styles.laundryInfoItem, { 
                              minWidth: width < 600 ? '100%' : '45%',
                              backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                              borderColor: isDark ? '#404040' : '#E5E7EB',
                              borderRadius: 12,
                              padding: 16,
                              borderWidth: 1,
                              shadowColor: '#000',
                              shadowOpacity: 0.04,
                              shadowRadius: 4,
                              shadowOffset: { width: 0, height: 2 },
                              elevation: 2,
                            }]}>
                              <View style={[styles.laundryInfoIcon, { 
                                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                              }]}>
                                <MaterialIcons name="location-on" size={18} color={textColor} />
                              </View>
                              <View style={styles.laundryInfoContent}>
                                <ThemedText style={[styles.laundryInfoLabel, { color: subtitleColor }]}>
                                  Drop Off Address
                                </ThemedText>
                                <ThemedText style={[styles.laundryInfoValue, { color: textColor }]}>
                                  {(reservation as any).shippingInfo.address}
                          </ThemedText>
                              </View>
                        </View>
                      )}
                      
                      {/* Pickup Details */}
                      {(reservation as any).shippingInfo.deliveryType === 'pickup' && (
                            <View style={[styles.laundryInfoItem, { 
                              minWidth: width < 600 ? '100%' : '45%',
                              backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                              borderColor: isDark ? '#404040' : '#E5E7EB',
                              borderRadius: 12,
                              padding: 16,
                              borderWidth: 1,
                              shadowColor: '#000',
                              shadowOpacity: 0.04,
                              shadowRadius: 4,
                              shadowOffset: { width: 0, height: 2 },
                              elevation: 2,
                            }]}>
                              <View style={[styles.laundryInfoIcon, { 
                                backgroundColor: isDark ? 'rgba(0, 178, 255, 0.15)' : 'rgba(0, 178, 255, 0.1)'
                              }]}>
                                <MaterialIcons name="local-shipping" size={18} color={textColor} />
                              </View>
                              <View style={styles.laundryInfoContent}>
                                <ThemedText style={[styles.laundryInfoLabel, { color: subtitleColor }]}>
                              Pickup Details
                            </ThemedText>
                                <ThemedText style={[styles.laundryInfoValue, { color: textColor }]}>
                                  {`${(reservation as any).shippingInfo.pickupDate || 'N/A'} at ${(reservation as any).shippingInfo.pickupTime || 'N/A'}`}
                                  </ThemedText>
                                {(reservation as any).shippingInfo.pickupAddress && (
                                  <ThemedText style={[styles.laundryInfoValue, { color: textColor, marginTop: 4 }]}>
                                    📍 {(reservation as any).shippingInfo.pickupAddress}
                                  </ThemedText>
                                )}
                                {(reservation as any).shippingInfo.pickupContactNumber && (
                                  <ThemedText style={[styles.laundryInfoValue, { color: textColor, marginTop: 4 }]}>
                                    📞 {(reservation as any).shippingInfo.pickupContactNumber}
                                  </ThemedText>
                                )}
                              </View>
                                </View>
                              )}
                            </View>
                      )}

                      {/* Professional Action Summary - Moved to bottom */}
                      <View style={[styles.laundryActionSummary, { 
                        backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                        borderColor: isDark ? '#404040' : '#E5E7EB',
                        marginTop: 16
                      }]}>
                        <ThemedText style={[styles.laundryActionText, { color: subtitleColor }]}>
                          {reservation.status === 'pending' 
                            ? 'Review and process this laundry service request'
                            : reservation.status === 'confirmed'
                            ? 'Monitor service progress and manage customer communication'
                            : reservation.status === 'completed'
                            ? 'Service completed successfully'
                            : 'Service processed - no further action required'
                          }
                                  </ThemedText>
                                </View>
                              </View>
                            )}
                            
                  {/* Professional Auto Service Summary */}
                  {reservation.serviceType === 'auto' && (
                    <View style={[styles.apartmentSummaryCard, { 
                      backgroundColor: isDark ? '#1A1A1A' : '#F8FAFC',
                      borderColor: isDark ? '#333' : '#E2E8F0'
                    }]}>
                      {/* Header with Status */}
                      <View style={styles.apartmentSummaryHeader}>
                        <View style={styles.apartmentSummaryTitleContainer}>
                          <MaterialIcons name="build" size={20} color={textColor} />
                          <ThemedText style={[styles.apartmentSummaryTitle, { color: textColor }]}>
                            Car & Motor Services
                                  </ThemedText>
                        </View>
                        <View style={[styles.apartmentStatusIndicator, { 
                          backgroundColor: getStatusColor(reservation.status) + '15',
                          borderColor: getStatusColor(reservation.status) + '40'
                        }]}>
                          <ThemedText style={[styles.apartmentStatusText, { 
                            color: getStatusColor(reservation.status) 
                          }]}>
                            {(reservation.status || 'pending').toUpperCase()}
                          </ThemedText>
                        </View>
                                </View>
                      
                      {/* Professional Information Grid */}
                      <View style={[styles.apartmentInfoGrid, { 
                        flexDirection: width < 600 ? 'column' : 'row',
                        gap: width < 400 ? 8 : 12
                      }]}>
                        {/* Customer Information */}
                        <View style={[styles.apartmentInfoItem, { 
                          minWidth: width < 600 ? '100%' : '45%',
                          backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                          borderColor: isDark ? '#404040' : '#E5E7EB',
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          shadowColor: '#000',
                          shadowOpacity: 0.04,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }]}>
                          <View style={[styles.apartmentInfoIcon, { 
                            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)'
                          }]}>
                            <MaterialIcons name="person" size={18} color={textColor} />
                          </View>
                          <View style={styles.apartmentInfoContent}>
                            <ThemedText style={[styles.apartmentInfoLabel, { color: subtitleColor }]}>
                              Customer Name
                            </ThemedText>
                            <ThemedText style={[styles.apartmentInfoValue, { color: textColor }]}>
                              {reservation.userName || 'N/A'}
                                  </ThemedText>
                                </View>
                        </View>

                        {/* Contact Email */}
                        <View style={[styles.apartmentInfoItem, { 
                          minWidth: width < 600 ? '100%' : '45%',
                          backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                          borderColor: isDark ? '#404040' : '#E5E7EB',
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          shadowColor: '#000',
                          shadowOpacity: 0.04,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }]}>
                          <View style={[styles.apartmentInfoIcon, { 
                            backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)'
                          }]}>
                            <MaterialIcons name="email" size={18} color={textColor} />
                        </View>
                          <View style={styles.apartmentInfoContent}>
                            <ThemedText style={[styles.apartmentInfoLabel, { color: subtitleColor }]}>
                              Contact Email
                            </ThemedText>
                            <ThemedText style={[styles.apartmentInfoValue, { color: textColor }]}>
                              {reservation.userEmail || 'N/A'}
                        </ThemedText>
                          </View>
                      </View>
                      
                        {/* Service Type */}
                        <View style={[styles.apartmentInfoItem, { 
                          minWidth: width < 600 ? '100%' : '45%',
                          backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                          borderColor: isDark ? '#404040' : '#E5E7EB',
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          shadowColor: '#000',
                          shadowOpacity: 0.04,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }]}>
                          <View style={[styles.apartmentInfoIcon, { 
                            backgroundColor: isDark ? 'rgba(0, 178, 255, 0.15)' : 'rgba(0, 178, 255, 0.1)'
                          }]}>
                            <MaterialIcons name="build" size={18} color={textColor} />
                            </View>
                          <View style={styles.apartmentInfoContent}>
                            <ThemedText style={[styles.apartmentInfoLabel, { color: subtitleColor }]}>
                              Service Type
                              </ThemedText>
                            <ThemedText style={[styles.apartmentInfoValue, { color: textColor }]}>
                              {(() => {
                                if ((reservation as any).homeService) return 'Home Service';
                                if ((reservation as any).shopService) return 'Shop Service';
                                return 'Car & Motor Parts';
                              })()}
                              </ThemedText>
                            </View>
                          </View>

                        {/* Service Price */}
                        <View style={[styles.apartmentInfoItem, { 
                          minWidth: width < 600 ? '100%' : '45%',
                          backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                          borderColor: isDark ? '#404040' : '#E5E7EB',
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          shadowColor: '#000',
                          shadowOpacity: 0.04,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }]}>
                          <View style={[styles.apartmentInfoIcon, { 
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'
                          }]}>
                            <MaterialIcons name="attach-money" size={18} color={textColor} />
                          </View>
                          <View style={styles.apartmentInfoContent}>
                            <ThemedText style={[styles.apartmentInfoLabel, { color: subtitleColor }]}>
                              Service Price
                            </ThemedText>
                            <ThemedText style={[styles.apartmentInfoValue, { color: '#10B981' }]}>
                              {formatPHP(reservation.servicePrice)}
                            </ThemedText>
                          </View>
                        </View>

                        {/* Service Address */}
                        {(reservation as any).address && (
                          <View style={[styles.apartmentInfoItem, { 
                            minWidth: width < 600 ? '100%' : '45%',
                            backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                            borderColor: isDark ? '#404040' : '#E5E7EB',
                            borderRadius: 12,
                            padding: 16,
                            borderWidth: 1,
                            shadowColor: '#000',
                            shadowOpacity: 0.04,
                            shadowRadius: 4,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: 2,
                          }]}>
                            <View style={[styles.apartmentInfoIcon, { 
                              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                            }]}>
                              <MaterialIcons name="location-on" size={18} color={textColor} />
                            </View>
                            <View style={styles.apartmentInfoContent}>
                              <ThemedText style={[styles.apartmentInfoLabel, { color: subtitleColor }]}>
                                {(reservation as any).homeService ? 'Service Address' : 'Location'}
                              </ThemedText>
                              <ThemedText style={[styles.apartmentInfoValue, { color: textColor }]} numberOfLines={2}>
                                {(reservation as any).address}
                              </ThemedText>
                            </View>
                          </View>
                        )}
                        
                        {/* Contact Number */}
                        {(reservation as any).contactNumber && (
                          <View style={[styles.apartmentInfoItem, { 
                            minWidth: width < 600 ? '100%' : '45%',
                            backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                            borderColor: isDark ? '#404040' : '#E5E7EB',
                            borderRadius: 12,
                            padding: 16,
                            borderWidth: 1,
                            shadowColor: '#000',
                            shadowOpacity: 0.04,
                            shadowRadius: 4,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: 2,
                          }]}>
                            <View style={[styles.apartmentInfoIcon, { 
                              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)'
                            }]}>
                              <MaterialIcons name="phone" size={18} color={textColor} />
                            </View>
                            <View style={styles.apartmentInfoContent}>
                              <ThemedText style={[styles.apartmentInfoLabel, { color: subtitleColor }]}>
                                Contact Number
                              </ThemedText>
                              <ThemedText style={[styles.apartmentInfoValue, { color: textColor }]}>
                                {(reservation as any).contactNumber}
                              </ThemedText>
                            </View>
                          </View>
                        )}
                        
                        {/* Preferred Time */}
                        {(reservation as any).preferredTime && (
                          <View style={[styles.apartmentInfoItem, { 
                            minWidth: width < 600 ? '100%' : '45%',
                            backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                            borderColor: isDark ? '#404040' : '#E5E7EB',
                            borderRadius: 12,
                            padding: 16,
                            borderWidth: 1,
                            shadowColor: '#000',
                            shadowOpacity: 0.04,
                            shadowRadius: 4,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: 2,
                          }]}>
                            <View style={[styles.apartmentInfoIcon, { 
                              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)'
                            }]}>
                              <MaterialIcons name="schedule" size={18} color={textColor} />
                            </View>
                            <View style={styles.apartmentInfoContent}>
                              <ThemedText style={[styles.apartmentInfoLabel, { color: subtitleColor }]}>
                                Preferred Time
                              </ThemedText>
                              <ThemedText style={[styles.apartmentInfoValue, { color: textColor }]}>
                                {(reservation as any).preferredTime}
                              </ThemedText>
                            </View>
                          </View>
                        )}
                      </View>

                      {/* Problem Description - Full Width */}
                      {(reservation as any).problemDescription && (
                        <View style={[styles.apartmentInfoItem, { 
                          width: '100%',
                          backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                          borderColor: isDark ? '#404040' : '#E5E7EB',
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          shadowColor: '#000',
                          shadowOpacity: 0.04,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                          marginTop: 12,
                        }]}>
                          <View style={[styles.apartmentInfoIcon, { 
                            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'
                          }]}>
                            <MaterialIcons name="description" size={18} color={textColor} />
                          </View>
                          <View style={styles.apartmentInfoContent}>
                            <ThemedText style={[styles.apartmentInfoLabel, { color: subtitleColor }]}>
                              Problem Description
                            </ThemedText>
                            <ThemedText style={[styles.apartmentInfoValue, { color: textColor }]} numberOfLines={4}>
                              {(reservation as any).problemDescription}
                            </ThemedText>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                  
                  
                  {/* Professional Apartment Rental Summary */}
                  {reservation.serviceType === 'apartment' && (
                    <View style={[styles.apartmentSummaryCard, { 
                      backgroundColor: isDark ? '#1A1A1A' : '#F8FAFC',
                      borderColor: isDark ? '#333' : '#E2E8F0'
                    }]}>
                      {/* Header removed - title and status moved to image overlay */}

                       {/* Professional Information Grid */}
                       <View style={[styles.apartmentInfoGrid, { 
                         flexDirection: width < 600 ? 'column' : 'row',
                         gap: width < 400 ? 8 : 12
                       }]}>
                         {/* Tenant Information */}
                         <View style={[styles.apartmentInfoItem, { 
                           minWidth: width < 600 ? '100%' : '45%',
                           backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                           borderColor: isDark ? '#404040' : '#E5E7EB',
                           borderRadius: 12,
                           padding: 16,
                           borderWidth: 1,
                           shadowColor: '#000',
                           shadowOpacity: 0.04,
                           shadowRadius: 4,
                           shadowOffset: { width: 0, height: 2 },
                           elevation: 2,
                         }]}>
                           <View style={[styles.apartmentInfoIcon, { 
                             backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)'
                           }]}>
                             <MaterialIcons name="person" size={18} color={textColor} />
                           </View>
                           <View style={styles.apartmentInfoContent}>
                             <ThemedText style={[styles.apartmentInfoLabel, { color: subtitleColor }]}>
                               Tenant Name
                             </ThemedText>
                             <ThemedText style={[styles.apartmentInfoValue, { color: textColor }]}>
                               {reservation.userName}
                             </ThemedText>
                           </View>
                         </View>

                         {/* Contact Email */}
                         <View style={[styles.apartmentInfoItem, { 
                           minWidth: width < 600 ? '100%' : '45%',
                           backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                           borderColor: isDark ? '#404040' : '#E5E7EB',
                           borderRadius: 12,
                           padding: 16,
                           borderWidth: 1,
                           shadowColor: '#000',
                           shadowOpacity: 0.04,
                           shadowRadius: 4,
                           shadowOffset: { width: 0, height: 2 },
                           elevation: 2,
                         }]}>
                           <View style={[styles.apartmentInfoIcon, { 
                             backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)'
                           }]}>
                             <MaterialIcons name="email" size={18} color={textColor} />
                           </View>
                           <View style={styles.apartmentInfoContent}>
                             <ThemedText style={[styles.apartmentInfoLabel, { color: subtitleColor }]}>
                               Contact Email
                             </ThemedText>
                             <ThemedText style={[styles.apartmentInfoValue, { color: textColor }]}>
                               {reservation.userEmail}
                             </ThemedText>
                           </View>
                         </View>

                         {/* Bed Assignment */}
                         {(reservation as any).bedId && (
                           <View style={[styles.apartmentInfoItem, { 
                             minWidth: width < 600 ? '100%' : '45%',
                             backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                             borderColor: isDark ? '#404040' : '#E5E7EB',
                             borderRadius: 12,
                             padding: 16,
                             borderWidth: 1,
                             shadowColor: '#000',
                             shadowOpacity: 0.04,
                             shadowRadius: 4,
                             shadowOffset: { width: 0, height: 2 },
                             elevation: 2,
                           }]}>
                             <View style={[styles.apartmentInfoIcon, { 
                               backgroundColor: isDark ? 'rgba(0, 178, 255, 0.15)' : 'rgba(0, 178, 255, 0.1)'
                             }]}>
                                <MaterialIcons name="bed" size={18} color={textColor} />
                             </View>
                             <View style={styles.apartmentInfoContent}>
                               <ThemedText style={[styles.apartmentInfoLabel, { color: subtitleColor }]}>
                                 Bed Assignment
                               </ThemedText>
                               <ThemedText style={[styles.apartmentInfoValue, { color: textColor }]}>
                                 Bed {(reservation as any).bedNumber || 'N/A'}
                               </ThemedText>
                             </View>
                           </View>
                         )}

                         {/* Monthly Rent */}
                         <View style={[styles.apartmentInfoItem, { 
                           minWidth: width < 600 ? '100%' : '45%',
                           backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                           borderColor: isDark ? '#404040' : '#E5E7EB',
                           borderRadius: 12,
                           padding: 16,
                           borderWidth: 1,
                           shadowColor: '#000',
                           shadowOpacity: 0.04,
                           shadowRadius: 4,
                           shadowOffset: { width: 0, height: 2 },
                           elevation: 2,
                         }]}>
                           <View style={[styles.apartmentInfoIcon, { 
                             backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'
                           }]}>
                             <MaterialIcons name="attach-money" size={18} color={textColor} />
                           </View>
                           <View style={styles.apartmentInfoContent}>
                             <ThemedText style={[styles.apartmentInfoLabel, { color: subtitleColor }]}>
                               Monthly Rent
                             </ThemedText>
                             <ThemedText style={[styles.apartmentInfoValue, { color: '#10B981' }]}>
                               {formatPHP(reservation.servicePrice)}
                             </ThemedText>
                           </View>
                         </View>

                         {/* Location */}
                         {reservation.serviceLocation && (
                           <View style={[styles.apartmentInfoItem, { 
                             minWidth: width < 600 ? '100%' : '45%',
                             backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                             borderColor: isDark ? '#404040' : '#E5E7EB',
                             borderRadius: 12,
                             padding: 16,
                             borderWidth: 1,
                             shadowColor: '#000',
                             shadowOpacity: 0.04,
                             shadowRadius: 4,
                             shadowOffset: { width: 0, height: 2 },
                             elevation: 2,
                           }]}>
                             <View style={[styles.apartmentInfoIcon, { 
                               backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                             }]}>
                                <MaterialIcons name="location-on" size={18} color={textColor} />
                             </View>
                             <View style={styles.apartmentInfoContent}>
                               <ThemedText style={[styles.apartmentInfoLabel, { color: subtitleColor }]}>
                                 Location
                               </ThemedText>
                               <ThemedText style={[styles.apartmentInfoValue, { color: textColor }]}>
                                 {reservation.serviceLocation}
                               </ThemedText>
                             </View>
                           </View>
                         )}

                         {/* Application Date */}
                         <View style={[styles.apartmentInfoItem, { 
                           minWidth: width < 600 ? '100%' : '45%',
                           backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                           borderColor: isDark ? '#404040' : '#E5E7EB',
                           borderRadius: 12,
                           padding: 16,
                           borderWidth: 1,
                           shadowColor: '#000',
                           shadowOpacity: 0.04,
                           shadowRadius: 4,
                           shadowOffset: { width: 0, height: 2 },
                           elevation: 2,
                         }]}>
                           <View style={[styles.apartmentInfoIcon, { 
                             backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)'
                           }]}>
                             <MaterialIcons name="calendar-today" size={18} color={textColor} />
                           </View>
                           <View style={styles.apartmentInfoContent}>
                             <ThemedText style={[styles.apartmentInfoLabel, { color: subtitleColor }]}>
                               Application Date
                             </ThemedText>
                             <ThemedText style={[styles.apartmentInfoValue, { color: textColor }]}>
                               {formatDate(reservation.reservationDate)}
                             </ThemedText>
                           </View>
                         </View>

                         {/* Payment Information */}
                         {isPaymentRequired(reservation.serviceType) && (() => {
                           const paymentData = paymentDataMap[reservation.id];
                           // Don't show payment info while loading to avoid showing wrong data
                           if (paymentDataLoading && !paymentData) {
                             return null; // Don't render until payment data is loaded
                           }
                           
                           return (
                             <>
                               <View style={[styles.apartmentInfoItem, { 
                               minWidth: width < 600 ? '100%' : '45%',
                               backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                               borderColor: isDark ? '#404040' : '#E5E7EB',
                               borderRadius: 12,
                               padding: 16,
                               borderWidth: 1,
                               shadowColor: '#000',
                               shadowOpacity: 0.04,
                               shadowRadius: 4,
                               shadowOffset: { width: 0, height: 2 },
                               elevation: 2,
                             }]}>
                               <View style={[styles.apartmentInfoIcon, { 
                                 backgroundColor: (() => {
                                   const paymentData = paymentDataMap[reservation.id];
                                   return paymentData?.paymentAmountType === 'full' 
                                     ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)')
                                     : (isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)');
                                 })()
                               }]}>
                                 <MaterialIcons 
                                   name={(() => {
                                     const paymentData = paymentDataMap[reservation.id];
                                     return paymentData?.paymentAmountType === 'full' ? 'check-circle' : 'payment';
                                   })()} 
                                   size={18} 
                                   color={(() => {
                                     const paymentData = paymentDataMap[reservation.id];
                                     return paymentData?.paymentAmountType === 'full' ? '#22C55E' : '#8B5CF6';
                                   })()} 
                                 />
                               </View>
                              <View style={styles.apartmentInfoContent}>
                                <ThemedText style={[styles.apartmentInfoLabel, { 
                                  color: (() => {
                                    const paymentData = paymentDataMap[reservation.id];
                                    return paymentData?.paymentAmountType === 'full' ? '#22C55E' : subtitleColor;
                                  })(),
                                  fontWeight: (() => {
                                    const paymentData = paymentDataMap[reservation.id];
                                    return paymentData?.paymentAmountType === 'full' ? '600' : 'normal';
                                  })()
                                }]}>
                                  {(() => {
                                    const paymentData = paymentDataMap[reservation.id];
                                    return paymentData?.paymentAmountType === 'full' ? 'Full Payment' : 'Down Payment';
                                  })()}
                                </ThemedText>
                                <ThemedText style={[styles.apartmentInfoValue, { 
                                  color: (() => {
                                    const paymentData = paymentDataMap[reservation.id];
                                    return paymentData?.paymentAmountType === 'full' ? '#22C55E' : textColor;
                                  })(),
                                  fontWeight: (() => {
                                    const paymentData = paymentDataMap[reservation.id];
                                    return paymentData?.paymentAmountType === 'full' ? '700' : 'normal';
                                  })()
                                }]}>
                                  {(() => {
                                    const paymentData = paymentDataMap[reservation.id];
                                    const servicePrice = reservation.servicePrice;
                                    const isFullPayment = paymentData?.paymentAmountType === 'full';
                                    const paymentAmount = paymentData?.amount || (isFullPayment ? servicePrice : calculateDownPayment(servicePrice, reservation.serviceType));
                                    return formatPHP(paymentAmount);
                                  })()}
                                </ThemedText>
                              </View>
                             </View>

                             <View style={[styles.apartmentInfoItem, { 
                               minWidth: width < 600 ? '100%' : '45%',
                               backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                               borderColor: isDark ? '#404040' : '#E5E7EB',
                               borderRadius: 12,
                               padding: 16,
                               borderWidth: 1,
                               shadowColor: '#000',
                               shadowOpacity: 0.04,
                               shadowRadius: 4,
                               shadowOffset: { width: 0, height: 2 },
                               elevation: 2,
                             }]}>
                               <View style={[styles.apartmentInfoIcon, { 
                                 backgroundColor: (reservation as any).paymentStatus === 'paid' 
                                   ? (isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
                                   : (isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)')
                               }]}>
                                 <MaterialIcons 
                                   name={(reservation as any).paymentStatus === 'paid' ? 'check-circle' : 'pending'} 
                                   size={18} 
                                   color={(reservation as any).paymentStatus === 'paid' ? '#10B981' : '#F59E0B'} 
                                 />
                               </View>
                               <View style={styles.apartmentInfoContent}>
                                 <ThemedText style={[styles.apartmentInfoLabel, { color: subtitleColor }]}>
                                   Payment Status
                                 </ThemedText>
                                 <ThemedText style={[styles.apartmentInfoValue, { 
                                   color: (reservation as any).paymentStatus === 'paid' ? '#10B981' : '#F59E0B' 
                                 }]}>
                                   {(reservation as any).paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                 </ThemedText>
                               </View>
                             </View>
                           </>
                         );
                       })()}
                       </View>

                      {/* Professional Action Summary */}
                      <View style={[styles.apartmentActionSummary, { 
                        backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                        borderColor: isDark ? '#404040' : '#E5E7EB'
                      }]}>
                        <ThemedText style={[styles.apartmentActionText, { color: subtitleColor }]}>
                          {reservation.status === 'pending' 
                            ? 'Review and approve this apartment rental application'
                            : reservation.status === 'confirmed'
                            ? 'Monitor tenant progress and manage rental agreement'
                            : reservation.status === 'completed'
                            ? 'Rental period completed successfully'
                            : 'Application processed - no further action required'
                          }
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  {/* Date and Price fields removed - now inside service sections */}
                </View>
                
                  <View style={[
                    styles.reservationActions,
                    {
                      gap: width < 400 ? 6 : 8,
                    }
                  ]}>
                    {(reservation.status || 'pending') === 'pending' && (
                      <>
                        <TouchableOpacity 
                          key="accept-button"
                          style={[
                            styles.actionButton, 
                            (reservation.serviceType === 'apartment' || reservation.serviceType === 'laundry' || reservation.serviceType === 'auto') ? styles.apartmentApproveButton : styles.acceptButton,
                            {
                              paddingHorizontal: width < 400 ? 8 : 12,
                              paddingVertical: width < 400 ? 6 : 8,
                              borderRadius: width < 400 ? 16 : 20,
                              minWidth: width < 400 ? 60 : 70,
                            }
                          ]}
                          onPress={() => handleAcceptReservation(reservation.id, reservation.serviceType, reservation.serviceId, reservation.userId, (reservation as any).bedId)}
                        >
                          <MaterialIcons 
                            name={(reservation.serviceType === 'apartment' || reservation.serviceType === 'laundry' || reservation.serviceType === 'auto') ? 'check-circle' : 'check'} 
                            size={16} 
                            color="#10B981" 
                            style={{ marginRight: 4 }}
                          />
                          <ThemedText style={[
                            styles.actionButtonText, 
                            { 
                              color: '#10B981',
                              fontSize: width < 400 ? 11 : 12,
                            }
                          ]}>
                            {(reservation.serviceType === 'apartment' || reservation.serviceType === 'laundry' || reservation.serviceType === 'auto') ? 'Approve' : 'Accept'}
                          </ThemedText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          key="decline-button"
                          style={[
                            styles.actionButton, 
                            (reservation.serviceType === 'apartment' || reservation.serviceType === 'laundry' || reservation.serviceType === 'auto') ? styles.apartmentRejectButton : styles.declineButton,
                            {
                              paddingHorizontal: width < 400 ? 8 : 12,
                              paddingVertical: width < 400 ? 6 : 8,
                              borderRadius: width < 400 ? 16 : 20,
                              minWidth: width < 400 ? 60 : 70,
                            }
                          ]}
                          onPress={() => handleDeclineReservation(reservation.id, reservation.serviceType, reservation.serviceId, reservation.userId, (reservation as any).bedId)}
                        >
                          <MaterialIcons 
                            name={(reservation.serviceType === 'apartment' || reservation.serviceType === 'laundry' || reservation.serviceType === 'auto') ? 'cancel' : 'close'} 
                            size={16} 
                            color="#EF4444" 
                            style={{ marginRight: 4 }}
                          />
                          <ThemedText style={[
                            styles.actionButtonText, 
                            { 
                              color: '#EF4444',
                              fontSize: width < 400 ? 11 : 12,
                            }
                          ]}>
                            {(reservation.serviceType === 'apartment' || reservation.serviceType === 'laundry' || reservation.serviceType === 'auto') ? 'Reject' : 'Decline'}
                          </ThemedText>
                        </TouchableOpacity>
                      </>
                    )}
                    
                    {(reservation.status || 'pending') === 'confirmed' && (
                      <>
                        {/* View Balance Button - Only for Apartment Reservations */}
                        {reservation.serviceType === 'apartment' && (
                          <TouchableOpacity 
                            key="view-balance-button"
                            style={[
                              styles.actionButton, 
                              styles.apartmentBalanceButton,
                              {
                                paddingHorizontal: width < 400 ? 6 : 10,
                                paddingVertical: width < 400 ? 6 : 8,
                                borderRadius: width < 400 ? 16 : 20,
                                minWidth: width < 400 ? 70 : 85,
                              }
                            ]}
                            onPress={() => {
                              setSelectedReservation(reservation);
                              // Fetch payment data for this reservation
                              const fetchPaymentData = async () => {
                                try {
                                  // Fetch all payments and filter
                                  const paymentsSnapshot = await get(ref(db, 'payments'));
                                  let payments: any[] = [];
                                  
                                  if (paymentsSnapshot.exists()) {
                                    const allPayments = Object.values(paymentsSnapshot.val() || {}) as any[];
                                    
                                    // Try to find payment by reservation ID first
                                    payments = allPayments.filter(
                                      (p: any) => p.reservationId === reservation.id
                                    );
                                    
                                    // If not found, try to find by serviceId, userId, and serviceType (fallback)
                                    if (payments.length === 0) {
                                      payments = allPayments.filter(
                                        (p: any) => p.serviceId === reservation.serviceId && 
                                        p.userId === reservation.userId &&
                                        p.serviceType === reservation.serviceType
                                      );
                                    }
                                    
                                    // Sort by creation date (most recent first)
                                    payments = payments.sort((a: any, b: any) => 
                                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                    );
                                  }
                                  
                                  if (payments && payments.length > 0) {
                                    // Get the most recent payment
                                    const latestPayment = payments[0];
                                    setPaymentData(latestPayment);
                                  } else {
                                    setPaymentData(null);
                                  }
                                } catch (error) {
                                  console.error('Error fetching payment data:', error);
                                  setPaymentData(null);
                                }
                              };
                              fetchPaymentData();
                              setBalanceModalVisible(true);
                            }}
                          >
                            <MaterialIcons name="account-balance-wallet" size={16} color="#F59E0B" style={{ marginRight: 4 }} />
                            <ThemedText style={[
                              styles.actionButtonText, 
                              { 
                                color: '#F59E0B',
                                fontSize: width < 400 ? 10 : 11,
                              }
                            ]}>
                              View Balance
                            </ThemedText>
                          </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity 
                          key="complete-button"
                          style={[
                            styles.actionButton, 
                            (reservation.serviceType === 'apartment' || reservation.serviceType === 'auto') ? styles.apartmentCompleteButton : styles.completeButton,
                            {
                              paddingHorizontal: width < 400 ? 8 : 12,
                              paddingVertical: width < 400 ? 6 : 8,
                              borderRadius: width < 400 ? 16 : 20,
                              minWidth: width < 400 ? 60 : 70,
                            }
                          ]}
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
                              // ========================================
                              // SUCCESS ALERT - ADMIN RESERVATION COMPLETED
                              // ========================================
                              // I-display ang success alert pagkatapos ng successful completion
                              // I-inform ang admin na successful ang completion ng reservation
                              Alert.alert('Success', 'Reservation has been marked as completed!'); // Alert title at message - reservation completed successfully
                            } catch (error) {
                              console.error('Error marking reservation as completed:', error);
                              // ========================================
                              // ERROR ALERT - ADMIN RESERVATION COMPLETION FAILED
                              // ========================================
                              // I-display ang error alert kung nag-fail ang completion
                              // I-inform ang admin na nag-fail ang completion ng reservation
                              Alert.alert('Error', 'Failed to mark reservation as completed. Please try again.'); // Alert title at message - completion failed, try again
                            }
                          }}
                        >
                          <MaterialIcons 
                            name={(reservation.serviceType === 'apartment' || reservation.serviceType === 'auto') ? 'home' : 'check'} 
                            size={16} 
                            color="#3B82F6" 
                            style={{ marginRight: 4 }}
                          />
                          <ThemedText style={[
                            styles.actionButtonText, 
                            { 
                              color: '#3B82F6',
                              fontSize: width < 400 ? 11 : 12,
                            }
                          ]}>
                            {(reservation.serviceType === 'apartment' || reservation.serviceType === 'auto') ? 'Check Out' : 'Complete'}
                          </ThemedText>
                        </TouchableOpacity>
                      </>
                    )}
                    
                    {/* Delete button - always visible */}
                    <TouchableOpacity 
                      key="delete-button"
                      style={[
                        styles.actionButton, 
                        styles.deleteButton,
                        {
                          paddingHorizontal: width < 400 ? 8 : 12,
                          paddingVertical: width < 400 ? 6 : 8,
                          borderRadius: width < 400 ? 16 : 20,
                          minWidth: width < 400 ? 60 : 70,
                        }
                      ]}
                      onPress={() => handleDeleteReservation(reservation.id, reservation.serviceType, reservation.serviceId, reservation.userId, reservation.serviceTitle, (reservation as any).bedId)}
                    >
                      <ThemedText style={[
                        styles.actionButtonText, 
                        { 
                          color: '#DC2626',
                          fontSize: width < 400 ? 11 : 12,
                        }
                      ]}>
                        Delete
                      </ThemedText>
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

      {/* Professional Balance Modal */}
      <Modal
        visible={balanceModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBalanceModalVisible(false)}
      >
        <View style={styles.balanceModalOverlay}>
          <View style={[styles.balanceModalContainer, { backgroundColor: cardBgColor }]}>
            {/* Modal Header */}
            <View style={styles.balanceModalHeader}>
              <View style={styles.balanceModalTitleContainer}>
                <MaterialIcons name="account-balance-wallet" size={24} color="#F59E0B" />
                <ThemedText style={[styles.balanceModalTitle, { color: textColor }]}>
                  Payment Details
                </ThemedText>
              </View>
              <TouchableOpacity
                style={styles.balanceModalCloseButton}
                onPress={() => {
                  setBalanceModalVisible(false);
                  setPaymentData(null); // Clear payment data when closing
                }}
              >
                <MaterialIcons name="close" size={24} color={subtitleColor} />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            {selectedReservation && (
              <View style={styles.balanceModalContent}>
                {/* Reservation Info */}
                <View style={styles.balanceReservationInfo}>
                  <ThemedText style={[styles.balanceReservationTitle, { color: textColor }]}>
                    {selectedReservation.userName}
                  </ThemedText>
                  <ThemedText style={[styles.balanceReservationSubtitle, { color: subtitleColor }]}>
                    {selectedReservation.userEmail}
                  </ThemedText>
                  <View style={[styles.balanceReservationBadge, { 
                    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                    borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'
                  }]}>
                    <ThemedText style={[styles.balanceReservationBadgeText, { color: '#22C55E' }]}>
                      Confirmed
                    </ThemedText>
                  </View>
                </View>

                {/* Payment Breakdown */}
                <View style={styles.balancePaymentSection}>
                  <ThemedText style={[styles.balanceSectionTitle, { color: textColor }]}>
                    Payment Breakdown
                  </ThemedText>
                  
                  <View style={styles.balancePaymentGrid}>
                    {/* Monthly Rent */}
                    <View style={[styles.balancePaymentItem, { 
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'
                    }]}>
                      <View style={styles.balancePaymentItemHeader}>
                        <MaterialIcons name="home" size={20} color={textColor} />
                        <ThemedText style={[styles.balancePaymentItemLabel, { color: textColor }]}>
                          Monthly Rent
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.balancePaymentItemValue, { color: textColor }]}>
                        {formatPHP(selectedReservation.servicePrice)}
                      </ThemedText>
                    </View>

                    {/* Payment Amount (Down Payment or Full Payment) */}
                    <View style={[styles.balancePaymentItem, { 
                      backgroundColor: paymentData?.paymentAmountType === 'full' 
                        ? (isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)')
                        : (isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)'),
                      borderColor: paymentData?.paymentAmountType === 'full'
                        ? (isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)')
                        : (isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)')
                    }]}>
                      <View style={styles.balancePaymentItemHeader}>
                        <MaterialIcons 
                          name={paymentData?.paymentAmountType === 'full' ? 'check-circle' : 'payment'} 
                          size={20} 
                          color={paymentData?.paymentAmountType === 'full' ? '#22C55E' : textColor} 
                        />
                        <ThemedText style={[styles.balancePaymentItemLabel, { color: textColor }]}>
                          {paymentData?.paymentAmountType === 'full' ? 'Full Payment' : 'Down Payment (30%)'}
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.balancePaymentItemValue, { 
                        color: paymentData?.paymentAmountType === 'full' ? '#22C55E' : textColor,
                        fontWeight: paymentData?.paymentAmountType === 'full' ? '700' : '600'
                      }]}>
                        {formatPHP(paymentData?.amount || calculateDownPayment(selectedReservation.servicePrice, selectedReservation.serviceType))}
                      </ThemedText>
                    </View>

                    {/* Remaining Balance - Only show if not full payment */}
                    {paymentData?.paymentAmountType !== 'full' && (
                      <View style={[styles.balancePaymentItem, { 
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                        borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'
                      }]}>
                        <View style={styles.balancePaymentItemHeader}>
                          <MaterialIcons name="account-balance" size={20} color={textColor} />
                          <ThemedText style={[styles.balancePaymentItemLabel, { color: textColor }]}>
                            Remaining Balance
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.balancePaymentItemValue, { color: textColor, fontWeight: '600' }]}>
                          {formatPHP(selectedReservation.servicePrice - (paymentData?.amount || calculateDownPayment(selectedReservation.servicePrice, selectedReservation.serviceType)))}
                        </ThemedText>
                      </View>
                    )}
                    
                    {/* Full Payment Indicator */}
                    {paymentData?.paymentAmountType === 'full' && (
                      <View style={[styles.balancePaymentItem, { 
                        backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                        borderColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)'
                      }]}>
                        <View style={styles.balancePaymentItemHeader}>
                          <MaterialIcons name="check-circle" size={20} color="#22C55E" />
                          <ThemedText style={[styles.balancePaymentItemLabel, { color: '#22C55E', fontWeight: '600' }]}>
                            No Remaining Balance
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.balancePaymentItemValue, { color: '#22C55E', fontWeight: '700' }]}>
                          {formatPHP(0)}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>

                {/* Payment Status */}
                <View style={styles.balancePaymentStatus}>
                  {paymentData?.paymentAmountType === 'full' ? (
                    <View style={[styles.balanceStatusItem, { 
                      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                      borderColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)'
                    }]}>
                      <MaterialIcons name="check-circle" size={20} color="#22C55E" />
                      <ThemedText style={[styles.balanceStatusText, { color: '#22C55E', fontWeight: '600' }]}>
                        Full payment received - No balance due
                      </ThemedText>
                    </View>
                  ) : (
                    <>
                      <View style={[styles.balanceStatusItem, { 
                        backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                        borderColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)'
                      }]}>
                        <MaterialIcons name="check-circle" size={20} color={textColor} />
                        <ThemedText style={[styles.balanceStatusText, { color: textColor }]}>
                          Down payment received
                        </ThemedText>
                      </View>
                      
                      <View style={[styles.balanceStatusItem, { 
                        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
                        borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)'
                      }]}>
                        <MaterialIcons name="schedule" size={20} color={textColor} />
                        <ThemedText style={[styles.balanceStatusText, { color: textColor }]}>
                          Balance due on check-in
                        </ThemedText>
                      </View>
                    </>
                  )}
                </View>
              </View>
            )}

            {/* Modal Footer */}
            <View style={styles.balanceModalFooter}>
              <TouchableOpacity
                style={[styles.balanceModalButton, { 
                  backgroundColor: '#3B82F6',
                  paddingHorizontal: width < 400 ? 20 : 24,
                  paddingVertical: width < 400 ? 10 : 12,
                }]}
                onPress={() => {
                  setBalanceModalVisible(false);
                  setPaymentData(null); // Clear payment data when closing
                }}
              >
                <ThemedText style={[styles.balanceModalButtonText, { color: '#fff' }]}>
                  Close
                </ThemedText>
              </TouchableOpacity>
            </View>
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
  roleIndicator: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filterModal: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    borderWidth: 1,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  filterSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  filterDivider: {
    height: 1,
    width: '100%',
    marginHorizontal: 24,
  },
  filterOptionsContainer: {
    padding: 16,
    gap: 8,
  },
  filterOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.15,
    elevation: 2,
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterOptionIcon: {
    marginRight: 12,
  },
  filterOptionTextContainer: {
    flex: 1,
  },
  filterOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  filterOptionCountLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  activeIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  countBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reservationCard: {
    borderRadius: 0,
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
    borderRadius: 0,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  titleOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  titleOverlayText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statusOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  statusOverlayText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    maxWidth: 90,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
  balanceButton: {
    backgroundColor: '#F59E0B20',
    borderColor: '#F59E0B',
    borderWidth: 1,
  },
  // Professional Apartment Rental Styles
  apartmentSummaryCard: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  apartmentSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  apartmentSummaryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apartmentSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  apartmentStatusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  apartmentStatusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  apartmentInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  apartmentInfoItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  apartmentInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  apartmentInfoContent: {
    flex: 1,
  },
  apartmentInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  apartmentInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  apartmentActionSummary: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  apartmentActionText: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
    fontStyle: 'italic',
  },
  // Apartment-specific button styles
  apartmentApproveButton: {
    backgroundColor: '#10B98120',
    borderColor: '#10B981',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apartmentRejectButton: {
    backgroundColor: '#EF444420',
    borderColor: '#EF4444',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apartmentBalanceButton: {
    backgroundColor: '#F59E0B20',
    borderColor: '#F59E0B',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apartmentCompleteButton: {
    backgroundColor: '#3B82F620',
    borderColor: '#3B82F6',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  // Bed Information Styles
  bedInfoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bedTitleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bedInfoContainer: {
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
  bedInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bedInfoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 178, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bedInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  bedInfoDetails: {
    gap: 12,
  },
  bedInfoDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bedInfoDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  bedInfoDetailContent: {
    flex: 1,
  },
  bedInfoDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bedInfoDetailValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  // Balance Modal Styles
  balanceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  balanceModalContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  balanceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  balanceModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceModalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  balanceModalCloseButton: {
    padding: 4,
  },
  balanceModalContent: {
    padding: 20,
  },
  balanceReservationInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  balanceReservationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceReservationSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  balanceReservationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  balanceReservationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  balancePaymentSection: {
    marginBottom: 24,
  },
  balanceSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  balancePaymentGrid: {
    gap: 12,
  },
  balancePaymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  balancePaymentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  balancePaymentItemLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  balancePaymentItemValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  balancePaymentStatus: {
    gap: 12,
  },
  balanceStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  balanceStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  balanceModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  balanceModalButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  balanceModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  roleInfoCard: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  roleInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  roleInfoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  roleInfoSubtext: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8,
  },

  // Laundry Summary Card Styles
  laundrySummaryCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  laundrySummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  laundrySummaryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  laundrySummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  laundryStatusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  laundryStatusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  laundryInfoGrid: {
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  laundryInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  laundryInfoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  laundryInfoContent: {
    flex: 1,
  },
  laundryInfoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  laundryInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  laundryActionSummary: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  laundryActionText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});