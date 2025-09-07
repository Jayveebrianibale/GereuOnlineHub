import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { RobustImage } from "../components/RobustImage";
import { useAuthContext } from "../contexts/AuthContext";
import { useReservation } from "../contexts/ReservationContext";
import { getAdminReservations, updateAdminReservationStatus } from "../services/reservationService";
import { formatPHP } from "../utils/currency";


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


export default function Bookings() {
  const { colorScheme } = useColorScheme();
  const { reservedApartments, reservedLaundryServices, reservedAutoServices, updateApartmentStatus, updateLaundryStatus, updateAutoStatus } = useReservation();
  const { user } = useAuthContext();

  const isDark = colorScheme === "dark";
  const bgColor = isDark ? "#121212" : "#fff";
  const cardBgColor = isDark ? "#1E1E1E" : "#fff";
  const textColor = isDark ? "#fff" : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? "#333" : "#eee";

  // No need for local bookings state, use reservedApartments from context

  const getStatusColor = (status: string) => {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'confirmed':
        return '#4CAF50';
      case 'completed':
        return '#2196F3';
      case 'pending':
      case 'in progress':
        return '#FF9800';
      case 'cancelled':
      case 'declined':
        return '#F44336';
      default:
        return colorPalette.primary;
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case "Apartment Rental":
        return "apartment";
      case "Laundry Service":
        return "local-laundry-service";
      case "Auto Service":
        return "directions-car";
      default:
        return "receipt";
    }
  };

  const cancelAdminReservation = async (serviceType: 'apartment' | 'laundry' | 'auto', serviceId: string) => {
    if (!user) return;
    const all = await getAdminReservations();
    const match = all.find(r => r.serviceType === serviceType && r.serviceId === serviceId && r.userId === user.uid);
    if (match) {
      await updateAdminReservationStatus(match.id, 'cancelled');
    }
  };

  const confirmCancel = (onConfirm: () => Promise<void>) => {
    if (Platform.OS === 'web') {
      onConfirm()
        .then(() => Alert.alert('Cancelled', 'Reservation has been cancelled.'))
        .catch(() => Alert.alert('Error', 'Failed to cancel reservation.'));
      return;
    }

    Alert.alert(
      'Cancel Reservation',
      'Are you sure you want to cancel this reservation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await onConfirm();
              Alert.alert('Cancelled', 'Reservation has been cancelled.');
            } catch (e) {
              Alert.alert('Error', 'Failed to cancel reservation.');
            }
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}> 
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.title, { color: textColor }]}> 
            My Reservations
          </ThemedText>
          <ThemedText type="default" style={[styles.subtitle, { color: subtitleColor }]}> 
            Track your service reservations
          </ThemedText>
        </View>

        {/* Booking Cards - Apartments */}
       {reservedApartments.length > 0 && (
         reservedApartments.map((apt) => (
           <View
             key={apt.id}
             style={[styles.bookingCard, { backgroundColor: cardBgColor, borderColor }]}
           >
             <RobustImage source={(apt as any).serviceImage || (apt as any).image} style={styles.coverImage} resizeMode="cover" />
             {/* Booking Header */}
             <View style={styles.bookingHeader}>
               <View style={styles.serviceInfo}>
                 <MaterialIcons
                   name={getServiceIcon('Apartment Rental') as any}
                   size={24}
                   color={colorPalette.primary}
                 />
                 <View style={styles.serviceDetails}>
                   <ThemedText type="subtitle" style={[styles.serviceName, { color: textColor }]}> 
                     {(apt as any).serviceTitle || (apt as any).title}
                   </ThemedText>
                   <ThemedText style={[styles.serviceType, { color: subtitleColor }]}> 
                     Apartment Rental
                   </ThemedText>
                 </View>
               </View>
             </View>

             {/* Booking Details */}
             <View style={styles.bookingDetails}>
               <View style={styles.detailRow}>
                 <MaterialIcons name="event" size={16} color={subtitleColor} />
                 <ThemedText style={[styles.detailText, { color: textColor }]}> 
                   Reserved
                 </ThemedText>
               </View>
               {apt.status && (
                 <View style={styles.detailRow}>
                   <MaterialIcons 
                     name={apt.status === 'confirmed' ? 'check-circle' : 
                           apt.status === 'declined' ? 'cancel' : 
                           apt.status === 'completed' ? 'done-all' : 'schedule'} 
                     size={16} 
                     color={getStatusColor(apt.status)} 
                   />
                   <ThemedText style={[styles.detailText, { color: getStatusColor(apt.status), fontWeight: '600' }]}> 
                     Status: {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                   </ThemedText>
                 </View>
               )}
               <View style={styles.detailRow}>
                 <MaterialIcons name="location-on" size={16} color={subtitleColor} />
                 <ThemedText style={[styles.detailText, { color: textColor }]}> 
                   {(apt as any).serviceLocation || (apt as any).location}
                 </ThemedText>
               </View>
               <View style={styles.detailRow}>
                 <MaterialIcons name="attach-money" size={16} color={subtitleColor} />
                 <ThemedText style={[styles.detailText, { color: textColor }]}> 
                   {formatPHP((apt as any).servicePrice ?? (apt as any).price ?? 0)}
                 </ThemedText>
               </View>
             </View>

             {/* Booking Actions */}
             <View style={styles.bookingActions}>
               {((apt as any).status || 'pending') === 'pending' && (
                 <TouchableOpacity 
                   style={styles.cancelButton}
                   onPress={() => confirmCancel(async () => {
                     const serviceId = (apt as any).serviceId || (apt as any).id;
                     await updateApartmentStatus(serviceId, 'cancelled');
                     await cancelAdminReservation('apartment', serviceId);
                   })}
                 > 
                   <ThemedText style={styles.cancelButtonText}> 
                     Cancel
                   </ThemedText>
                 </TouchableOpacity>
               )}
             </View>
           </View>
         ))
       )}

       {/* Booking Cards - Laundry */}
       {reservedLaundryServices.length > 0 && (
         reservedLaundryServices.map((svc) => (
           <View
             key={svc.id}
             style={[styles.bookingCard, { backgroundColor: cardBgColor, borderColor }]}
           >
             <RobustImage source={(svc as any).serviceImage || (svc as any).image} style={styles.coverImage} resizeMode="cover" />
             {/* Booking Header */}
             <View style={styles.bookingHeader}>
               <View style={styles.serviceInfo}>
                 <MaterialIcons
                   name={getServiceIcon('Laundry Service') as any}
                   size={24}
                   color={colorPalette.primary}
                 />
                 <View style={styles.serviceDetails}>
                   <ThemedText type="subtitle" style={[styles.serviceName, { color: textColor }]}> 
                     {(svc as any).serviceTitle || (svc as any).title}
                   </ThemedText>
                   <ThemedText style={[styles.serviceType, { color: subtitleColor }]}> 
                     Laundry Service
                   </ThemedText>
                 </View>
               </View>
             </View>

             {/* Booking Details */}
             <View style={styles.bookingDetails}>
               <View style={styles.detailRow}>
                 <MaterialIcons name="event" size={16} color={subtitleColor} />
                 <ThemedText style={[styles.detailText, { color: textColor }]}> 
                   Reserved
                 </ThemedText>
               </View>
               {svc.status && (
                 <View style={styles.detailRow}>
                   <MaterialIcons 
                     name={svc.status === 'confirmed' ? 'check-circle' : 
                           svc.status === 'declined' ? 'cancel' : 
                           svc.status === 'completed' ? 'done-all' : 'schedule'} 
                     size={16} 
                     color={getStatusColor(svc.status)} 
                   />
                   <ThemedText style={[styles.detailText, { color: getStatusColor(svc.status), fontWeight: '600' }]}> 
                     Status: {svc.status.charAt(0).toUpperCase() + svc.status.slice(1)}
                   </ThemedText>
                 </View>
               )}
               <View style={styles.detailRow}>
                 <MaterialIcons name="attach-money" size={16} color={subtitleColor} />
                 <ThemedText style={[styles.detailText, { color: textColor }]}> 
                   {formatPHP((svc as any).servicePrice ?? (svc as any).price ?? 0)}
                 </ThemedText>
               </View>
             </View>

             {/* Booking Actions */}
             <View style={styles.bookingActions}>
               {((svc as any).status || 'pending') === 'pending' && (
                 <TouchableOpacity 
                   style={styles.cancelButton}
                   onPress={() => confirmCancel(async () => {
                     const serviceId = (svc as any).serviceId || (svc as any).id;
                     await updateLaundryStatus(serviceId, 'cancelled');
                     await cancelAdminReservation('laundry', serviceId);
                   })}
                 > 
                   <ThemedText style={styles.cancelButtonText}> 
                     Cancel
                   </ThemedText>
                 </TouchableOpacity>
               )}
             </View>
           </View>
         ))
       )}

       {/* Booking Cards - Car & Motor Parts */}
       {reservedAutoServices && reservedAutoServices.length > 0 && (
         reservedAutoServices.map((svc) => (
           <View
             key={svc.id}
             style={[styles.bookingCard, { backgroundColor: cardBgColor, borderColor }]}
           >
             <RobustImage source={(svc as any).serviceImage || (svc as any).image} style={styles.coverImage} resizeMode="cover" />
             {/* Booking Header */}
             <View style={styles.bookingHeader}>
               <View style={styles.serviceInfo}>
                 <MaterialIcons
                   name={getServiceIcon('Auto Service') as any}
                   size={24}
                   color={colorPalette.primary}
                 />
                 <View style={styles.serviceDetails}>
                   <ThemedText type="subtitle" style={[styles.serviceName, { color: textColor }]}> 
                     {(svc as any).serviceTitle || (svc as any).title}
                   </ThemedText>
                   <ThemedText style={[styles.serviceType, { color: subtitleColor }]}> 
                     Car & Motor Parts
                   </ThemedText>
                 </View>
               </View>
             </View>

             {/* Booking Details */}
             <View style={styles.bookingDetails}>
               <View style={styles.detailRow}>
                 <MaterialIcons name="event" size={16} color={subtitleColor} />
                 <ThemedText style={[styles.detailText, { color: textColor }]}> 
                   Reserved
                 </ThemedText>
               </View>
               {svc.status && (
                 <View style={styles.detailRow}>
                   <MaterialIcons 
                     name={svc.status === 'confirmed' ? 'check-circle' : 
                           svc.status === 'declined' ? 'cancel' : 
                           svc.status === 'completed' ? 'done-all' : 'schedule'} 
                     size={16} 
                     color={getStatusColor(svc.status)} 
                   />
                   <ThemedText style={[styles.detailText, { color: getStatusColor(svc.status), fontWeight: '600' }]}> 
                     Status: {svc.status.charAt(0).toUpperCase() + svc.status.slice(1)}
                   </ThemedText>
                 </View>
               )}
               <View style={styles.detailRow}>
                 <MaterialIcons name="attach-money" size={16} color={subtitleColor} />
                 <ThemedText style={[styles.detailText, { color: textColor }]}> 
                   {formatPHP((svc as any).servicePrice ?? (svc as any).price ?? 0)}
                 </ThemedText>
               </View>
             </View>

             {/* Booking Actions */}
             <View style={styles.bookingActions}>
               {((svc as any).status || 'pending') === 'pending' && (
                 <TouchableOpacity 
                   style={styles.cancelButton}
                   onPress={() => confirmCancel(async () => {
                     const serviceId = (svc as any).serviceId || (svc as any).id;
                     await updateAutoStatus(serviceId, 'cancelled');
                     await cancelAdminReservation('auto', serviceId);
                   })}
                 > 
                   <ThemedText style={styles.cancelButtonText}> 
                     Cancel
                   </ThemedText>
                 </TouchableOpacity>
               )}
             </View>
           </View>
         ))
       )}

       {/* Empty state */}
       {reservedApartments.length === 0 && reservedLaundryServices.length === 0 && (!reservedAutoServices || reservedAutoServices.length === 0) && (
         <View style={{ alignItems: 'center', marginTop: 250 }}>
           <ThemedText style={{ color: subtitleColor }}>No reservations yet.</ThemedText>
         </View>
       )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  bookingCard: {
    borderRadius: 16,
    padding: 0,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 160,
  },
  cardBody: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetails: {
    marginBottom: 16,
    paddingHorizontal: 16,
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
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    flex: 0,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cancelButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 