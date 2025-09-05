import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useReservation } from "../contexts/ReservationContext";
import { formatPHP } from "../utils/currency";
import { getImageSource } from "../utils/imageUtils";


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
  const params = useLocalSearchParams();
  const router = useRouter();
  const { reservedApartments, reservedLaundryServices, reservedAutoServices } = useReservation();

  const isDark = colorScheme === "dark";
  const bgColor = isDark ? "#121212" : "#fff";
  const cardBgColor = isDark ? "#1E1E1E" : "#fff";
  const textColor = isDark ? "#fff" : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? "#333" : "#eee";

  // No need for local bookings state, use reservedApartments from context

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "#4CAF50";
      case "Completed":
        return "#2196F3";
      case "In Progress":
        return "#FF9800";
      case "Cancelled":
        return "#F44336";
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
             <Image source={getImageSource((apt as any).image)} style={styles.coverImage} resizeMode="cover" />
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
                     {apt.title}
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
                   {/* No booking date, show placeholder or add date if needed */}
                   Reserved
                 </ThemedText>
               </View>
               <View style={styles.detailRow}>
                 <MaterialIcons name="location-on" size={16} color={subtitleColor} />
                 <ThemedText style={[styles.detailText, { color: textColor }]}> 
                   {apt.location}
                 </ThemedText>
               </View>
               <View style={styles.detailRow}>
                 <MaterialIcons name="attach-money" size={16} color={subtitleColor} />
                 <ThemedText style={[styles.detailText, { color: textColor }]}> 
                   {formatPHP(apt.price)}
                 </ThemedText>
               </View>
             </View>

             {/* Booking Actions (only "View Details") */}
             <View style={styles.bookingActions}>
               <TouchableOpacity 
                 style={[styles.actionButton, { borderColor }]}
                 onPress={() => router.push({
                   pathname: "/reservation-details/[id]",
                   params: { id: apt.id }
                 })}
               > 
                 <ThemedText style={[styles.actionButtonText, { color: colorPalette.primary }]}> 
                   View Details
                 </ThemedText>
               </TouchableOpacity>
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
             <Image source={getImageSource((svc as any).image)} style={styles.coverImage} resizeMode="cover" />
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
                     {svc.title}
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
               <View style={styles.detailRow}>
                 <MaterialIcons name="attach-money" size={16} color={subtitleColor} />
                 <ThemedText style={[styles.detailText, { color: textColor }]}> 
                   {formatPHP(svc.price)}
                 </ThemedText>
               </View>
             </View>

             {/* Booking Actions */}
             <View style={styles.bookingActions}>
               <TouchableOpacity 
                 style={[styles.actionButton, { borderColor }]}
                 onPress={() => router.push({ pathname: '/reservation-details/[id]', params: { id: svc.id, type: 'laundry' } })}
               > 
                 <ThemedText style={[styles.actionButtonText, { color: colorPalette.primary }]}> 
                   View Details
                 </ThemedText>
               </TouchableOpacity>
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
             <Image source={getImageSource((svc as any).image)} style={styles.coverImage} resizeMode="cover" />
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
                     {svc.title}
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
               <View style={styles.detailRow}>
                 <MaterialIcons name="attach-money" size={16} color={subtitleColor} />
                 <ThemedText style={[styles.detailText, { color: textColor }]}> 
                   {formatPHP(svc.price)}
                 </ThemedText>
               </View>
             </View>

             {/* Booking Actions */}
             <View style={styles.bookingActions}>
               <TouchableOpacity 
                 style={[styles.actionButton, { borderColor }]}
                 onPress={() => router.push({ pathname: '/reservation-details/[id]', params: { id: svc.id, type: 'auto' } })}
               > 
                 <ThemedText style={[styles.actionButtonText, { color: colorPalette.primary }]}> 
                   View Details
                 </ThemedText>
               </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 