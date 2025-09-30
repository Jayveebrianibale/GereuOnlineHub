import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { AdminPaymentSettingsModal } from '../components/AdminPaymentSettings';
import { RobustImage } from '../components/RobustImage';
import { useAdminReservation } from '../contexts/AdminReservationContext';
import { useReservation } from '../contexts/ReservationContext';
import { AdminPaymentSettings as AdminPaymentSettingsType, getAdminPaymentSettings } from '../services/adminPaymentService';
import { notifyUser } from '../services/notificationService';
import { calculateDownPayment, isPaymentRequired } from '../services/paymentService';
import { getUserReservations, updateUserReservationStatus } from '../services/reservationService';
import { formatPHP } from '../utils/currency';

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

// Helper function to get service type display name
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

export default function ReservationsScreen() {
  const { colorScheme } = useColorScheme();
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;
  const { adminReservations, updateReservationStatus, removeAdminReservation, loading, error } = useAdminReservation();
  const { updateApartmentStatus, updateLaundryStatus, updateAutoStatus } = useReservation();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'cancelled' | 'declined'>('all');
  const [filterVisible, setFilterVisible] = useState(false);
  const [paymentSettingsVisible, setPaymentSettingsVisible] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<AdminPaymentSettingsType | null>(null);
  
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';

  // Load payment settings
  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    try {
      const settings = await getAdminPaymentSettings();
      setPaymentSettings(settings);
    } catch (error) {
      console.error('Error loading payment settings:', error);
    }
  };

  // Responsive sizing
  const titleSize = width < 400 ? 20 : 24;
  const subtitleSize = width < 400 ? 12 : 14;

  const getStatusColor = (status: string) => {
    switch (status) {
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
        return textColor;
    }
  };

  // Sort newest first and apply status filter
  const displayReservations = (adminReservations || [])
    .slice()
    .sort((a, b) => {
      const aTime = a?.reservationDate ? new Date(a.reservationDate).getTime() : 0;
      const bTime = b?.reservationDate ? new Date(b.reservationDate).getTime() : 0;
      return bTime - aTime;
    })
    .filter(r => statusFilter === 'all' ? true : (r.status === statusFilter));

  const handleAcceptReservation = (reservationId: string, serviceType: string, serviceId: string, userId: string) => {
    const performUpdate = async () => {
      try {
        await updateReservationStatus(reservationId, 'confirmed');
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
        Alert.alert('Success', 'Reservation has been accepted successfully!');
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
                        {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
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
                  
                  <View style={styles.detailRow}>
                    <MaterialIcons name="calendar-today" size={16} color={subtitleColor} />
                    <ThemedText style={[
                      styles.detailText, 
                      { color: textColor }
                    ]}>
                      {new Date(reservation.reservationDate).toLocaleDateString()}
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
                      <View style={styles.paymentSection}>
                        <ThemedText style={[styles.paymentSectionTitle, { color: textColor }]}>
                          Payment Information
                        </ThemedText>
                        
                        <View style={styles.detailRow}>
                          <MaterialIcons name="payment" size={16} color="#10B981" />
                          <ThemedText style={[styles.detailText, { color: textColor }]}>
                            Down Payment: {formatPHP(calculateDownPayment(reservation.servicePrice, reservation.serviceType))}
                          </ThemedText>
                        </View>
                        
                        {paymentSettings?.gcashNumber && (
                          <View style={styles.detailRow}>
                            <MaterialIcons name="account-balance-wallet" size={16} color="#00B2FF" />
                            <ThemedText style={[styles.detailText, { color: textColor }]}>
                              GCash: {paymentSettings.gcashNumber}
                            </ThemedText>
                          </View>
                        )}
                        
                        <View style={styles.detailRow}>
                          <MaterialIcons name="info" size={16} color="#F59E0B" />
                          <ThemedText style={[styles.detailText, { color: '#F59E0B' }]}>
                            Payment required to confirm reservation
                          </ThemedText>
                        </View>
                      </View>
                    </>
                  )}
                </View>
                
                  <View style={styles.reservationActions}>
                    {reservation.status === 'pending' && (
                      <>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleAcceptReservation(reservation.id, reservation.serviceType, reservation.serviceId, reservation.userId)}
                        >
                          <MaterialIcons name="check" size={20} color="#10B981" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.declineButton]}
                          onPress={() => handleDeclineReservation(reservation.id, reservation.serviceType, reservation.serviceId, reservation.userId)}
                        >
                          <MaterialIcons name="close" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </>
                    )}
                    
                    {reservation.status === 'confirmed' && (
                      <TouchableOpacity 
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
            loadPaymentSettings(); // Reload settings when closing
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
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  reservationContent: {
    padding: 16,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reservationImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 12,
  },
  reservationService: {
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reservationDetails: {
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
  reservationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    gap: 8,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
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
});