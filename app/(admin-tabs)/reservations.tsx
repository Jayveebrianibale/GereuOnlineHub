import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useAdminReservation } from '../contexts/AdminReservationContext';
import { useReservation } from '../contexts/ReservationContext';
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
  const { adminReservations, updateReservationStatus, loading, error } = useAdminReservation();
  const { updateApartmentStatus, updateLaundryStatus, updateAutoStatus } = useReservation();
  
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';

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

  const handleAcceptReservation = (reservationId: string, serviceType: string, serviceId: string) => {
    Alert.alert(
      'Accept Reservation',
      'Are you sure you want to accept this reservation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await updateReservationStatus(reservationId, 'confirmed');
              // Update the corresponding service status in user context
              if (serviceType === 'apartment') {
                await updateApartmentStatus(serviceId, 'confirmed');
              } else if (serviceType === 'laundry') {
                await updateLaundryStatus(serviceId, 'confirmed');
              } else if (serviceType === 'auto') {
                await updateAutoStatus(serviceId, 'confirmed');
              }
              // Show success message
              Alert.alert('Success', 'Reservation has been accepted successfully!');
            } catch (error) {
              console.error('Error accepting reservation:', error);
              Alert.alert('Error', 'Failed to accept reservation. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeclineReservation = (reservationId: string, serviceType: string, serviceId: string) => {
    Alert.alert(
      'Decline Reservation',
      'Are you sure you want to decline this reservation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateReservationStatus(reservationId, 'declined');
              // Update the corresponding service status in user context
              if (serviceType === 'apartment') {
                await updateApartmentStatus(serviceId, 'declined');
              } else if (serviceType === 'laundry') {
                await updateLaundryStatus(serviceId, 'declined');
              } else if (serviceType === 'auto') {
                await updateAutoStatus(serviceId, 'declined');
              }
              // Show success message
              Alert.alert('Success', 'Reservation has been declined successfully!');
            } catch (error) {
              console.error('Error declining reservation:', error);
              Alert.alert('Error', 'Failed to decline reservation. Please try again.');
            }
          }
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
                color: subtitleColor, 
                fontSize: subtitleSize 
              }
            ]}>
              Manage all customer reservations
            </ThemedText>
          </View>
          <TouchableOpacity style={[
            styles.dateFilter, 
            { marginTop: isPortrait ? 25 : 12 }
          ]}>
            <ThemedText style={{ color: colorPalette.primary, fontSize: subtitleSize }}>
              Filter
            </ThemedText>
            <MaterialIcons name="filter-list" size={20} color={colorPalette.primary} />
          </TouchableOpacity>
        </View>

        {/* Reservations List */}
        <View style={styles.reservationsContainer}>
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
            adminReservations.map((reservation) => (
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
                </View>
                
                <View style={styles.reservationActions}>
                  {reservation.status === 'pending' && (
                    <>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleAcceptReservation(reservation.id, reservation.serviceType, reservation.serviceId)}
                      >
                        <MaterialIcons name="check" size={18} color="#10B981" />
                        <ThemedText style={[
                          styles.actionText, 
                          { color: '#10B981' }
                        ]}>
                          Accept
                        </ThemedText>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.declineButton]}
                        onPress={() => handleDeclineReservation(reservation.id, reservation.serviceType, reservation.serviceId)}
                      >
                        <MaterialIcons name="close" size={18} color="#EF4444" />
                        <ThemedText style={[
                          styles.actionText, 
                          { color: '#EF4444' }
                        ]}>
                          Decline
                        </ThemedText>
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
                          Alert.alert('Success', 'Reservation has been marked as completed!');
                        } catch (error) {
                          console.error('Error marking reservation as completed:', error);
                          Alert.alert('Error', 'Failed to mark reservation as completed. Please try again.');
                        }
                      }}
                    >
                      <MaterialIcons name="done-all" size={18} color="#3B82F6" />
                      <ThemedText style={[
                        styles.actionText, 
                        { color: '#3B82F6' }
                      ]}>
                        Mark Complete
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  reservationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  declineButton: {
    backgroundColor: '#EF444420',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButton: {
    backgroundColor: '#3B82F620',
    borderColor: '#3B82F6',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});