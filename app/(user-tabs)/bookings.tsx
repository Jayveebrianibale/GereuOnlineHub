import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { RobustImage } from "../components/RobustImage";
import { useAuthContext } from "../contexts/AuthContext";
import { useReservation } from "../contexts/ReservationContext";
import { getApartments } from "../services/apartmentService";
import { getAutoServices } from "../services/autoService";
import { getLaundryServices } from "../services/laundryService";
import { notifyAdmins } from "../services/notificationService";
import { calculateDownPayment, isPaymentRequired } from "../services/paymentService";
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
  const [activeTab, setActiveTab] = useState<'reservations' | 'bills'>('reservations');
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { reservedApartments, reservedLaundryServices, reservedAutoServices, removeReservation, removeLaundryReservation, removeAutoReservation, updateApartmentStatus, updateLaundryStatus, updateAutoStatus } = useReservation();
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
      try {
        await notifyAdmins(
          'Reservation Cancelled',
          `${user.displayName || 'A user'} cancelled a ${serviceType} reservation.`,
          { serviceType, serviceId, userId: user.uid, action: 'cancelled' }
        );
      } catch {}
    }
  };

  const handleViewDetails = async (item: any, serviceType: 'apartment' | 'laundry' | 'auto') => {
    try {
      let completeServiceData = null;
      
      if (serviceType === 'apartment') {
        const apartments = await getApartments();
        completeServiceData = apartments.find(apt => apt.id === item.serviceId);
        if (completeServiceData) {
          router.push({
            pathname: '/apartment-list',
            params: { selectedItem: JSON.stringify(completeServiceData) }
          });
        }
      } else if (serviceType === 'laundry') {
        const laundryServices = await getLaundryServices();
        completeServiceData = laundryServices.find(service => service.id === item.serviceId);
        if (completeServiceData) {
          router.push({
            pathname: '/laundry-list',
            params: { selectedItem: JSON.stringify(completeServiceData) }
          });
        }
      } else if (serviceType === 'auto') {
        const autoServices = await getAutoServices();
        completeServiceData = autoServices.find(service => service.id === item.serviceId);
        if (completeServiceData) {
          router.push({
            pathname: '/auto-list',
            params: { selectedItem: JSON.stringify(completeServiceData) }
          });
        }
      }
      
      if (!completeServiceData) {
        Alert.alert('Error', 'Service details not found. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
      Alert.alert('Error', 'Failed to load service details. Please try again.');
    }
  };

  const handleDeleteReservation = (item: any, serviceType: 'apartment' | 'laundry' | 'auto') => {
    Alert.alert(
      'Delete Reservation',
      `Are you sure you want to delete this ${serviceType} reservation? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (serviceType === 'apartment') {
                await removeReservation(item.serviceId);
              } else if (serviceType === 'laundry') {
                await removeLaundryReservation(item.serviceId);
              } else if (serviceType === 'auto') {
                await removeAutoReservation(item.serviceId);
              }
              Alert.alert('Success', 'Reservation deleted successfully.');
            } catch (error) {
              console.error('Error deleting reservation:', error);
              Alert.alert('Error', 'Failed to delete reservation. Please try again.');
            }
          },
        },
      ]
    );
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

  // Sort helpers to show newest first
  const sortNewestFirst = (arr: any[]) => {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    
    // Create a copy and sort by timestamp, newest first
    const sorted = [...arr].sort((a, b) => {
      // Try multiple timestamp fields
      const getTimestamp = (item: any) => {
        // Try different timestamp fields in order of preference
        const fields = ['createdAt', 'reservationDate', 'updatedAt'];
        
        for (const field of fields) {
          if (item[field]) {
            const timestamp = new Date(item[field]).getTime();
            if (!isNaN(timestamp) && timestamp > 0) {
              return timestamp;
            }
          }
        }
        
        // Fallback: Use Firebase ID as timestamp (Firebase push IDs are chronologically ordered)
        if (item.id) {
          // Firebase push IDs contain timestamp information
          // Extract timestamp from Firebase ID (first 8 characters are timestamp)
          const firebaseTimestamp = parseInt(item.id.substring(0, 8), 16) * 1000;
          if (!isNaN(firebaseTimestamp) && firebaseTimestamp > 0) {
            return firebaseTimestamp;
          }
        }
        
        // Final fallback to 0
        return 0;
      };
      
      const timestampA = getTimestamp(a);
      const timestampB = getTimestamp(b);
      
      // Sort newest first (higher timestamp first)
      return timestampB - timestampA;
    });
    
    return sorted;
  };

  const apartmentsSorted = sortNewestFirst(reservedApartments as any[]);
  const laundrySorted = sortNewestFirst(reservedLaundryServices as any[]);
  const autoSorted = sortNewestFirst(reservedAutoServices as any[]);
  
  console.log('📱 Bookings screen - Reserved services:');
  console.log('📱 Apartments:', reservedApartments.length, apartmentsSorted.length);
  console.log('📱 Laundry:', reservedLaundryServices.length, laundrySorted.length);
  console.log('📱 Auto:', reservedAutoServices.length, autoSorted.length);
  console.log('📱 Auto services details:', reservedAutoServices.map(a => ({ 
    id: a.id, 
    serviceTitle: a.serviceTitle, 
    serviceType: a.serviceType,
    serviceId: (a as any).serviceId 
  })));

  // Debug: Log the sorting results
  console.log('Original apartments:', reservedApartments.map(r => ({ 
    title: r.serviceTitle, 
    createdAt: r.createdAt,
    id: r.id 
  })));
  console.log('Sorted apartments:', apartmentsSorted.map(r => ({ 
    title: r.serviceTitle, 
    createdAt: r.createdAt,
    id: r.id 
  })));

  // Bills helpers
  const isAccepted = (status: string | undefined) => {
    const s = (status || '').toLowerCase();
    return s === 'confirmed' || s === 'completed';
  };

  const getPrice = (item: any) => {
    const value = item?.servicePrice ?? item?.price ?? 0;
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    
    // For apartments, subtract the down payment to show remaining balance
    if (item?.serviceType === 'apartment' || item?.type === 'Apartment Rental') {
      const downPayment = calculateDownPayment(n, 'apartment');
      return n - downPayment; // Return remaining balance
    }
    
    return n; // For laundry and auto, return full amount
  };

  const accepted = useMemo(() => {
    const apartments = (apartmentsSorted || [])
      .filter((i: any) => isAccepted(i?.status))
      .map((i: any) => ({ 
        id: i.id, 
        title: i.serviceTitle || i.title, 
        amount: getPrice({ ...i, serviceType: 'apartment' }), 
        type: 'Apartment Rental' as const 
      }));
    const laundry = (laundrySorted || [])
      .filter((i: any) => isAccepted(i?.status))
      .map((i: any) => ({ 
        id: i.id, 
        title: i.serviceTitle || i.title, 
        amount: getPrice({ ...i, serviceType: 'laundry' }), 
        type: 'Laundry Service' as const 
      }));
    const auto = (autoSorted || [])
      .filter((i: any) => isAccepted(i?.status))
      .map((i: any) => ({ 
        id: i.id, 
        title: i.serviceTitle || i.title, 
        amount: getPrice({ ...i, serviceType: 'auto' }), 
        type: 'Car & Motor Parts' as const 
      }));
    return { apartments, laundry, auto };
  }, [apartmentsSorted, laundrySorted, autoSorted]);

  const totals = useMemo(() => {
    const sum = (arr: { amount: number }[]) => arr.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const apartments = sum(accepted.apartments);
    const laundry = sum(accepted.laundry);
    const auto = sum(accepted.auto);
    const grand = apartments + laundry + auto;
    return { apartments, laundry, auto, grand };
  }, [accepted]);

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}> 
      <View style={[styles.tabBar, { borderColor }]}>
        <TouchableOpacity onPress={() => setActiveTab('reservations')} style={[styles.tabButton, activeTab === 'reservations' && styles.tabButtonActive]}>
          <ThemedText style={[styles.tabButtonText, { color: activeTab === 'reservations' ? colorPalette.primary : subtitleColor }]}>Reservations</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('bills')} style={[styles.tabButton, activeTab === 'bills' && styles.tabButtonActive]}>
          <ThemedText style={[styles.tabButtonText, { color: activeTab === 'bills' ? colorPalette.primary : subtitleColor }]}>Bills</ThemedText>
        </TouchableOpacity>
      </View>

      {activeTab === 'reservations' ? (
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
       {apartmentsSorted.length > 0 && (
         apartmentsSorted.map((apt) => (
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
                 <ThemedText style={[styles.phpSymbol, { color: subtitleColor }]}>₱</ThemedText>
                 <ThemedText style={[styles.detailText, { color: textColor }]}> 
                   {formatPHP((apt as any).servicePrice ?? (apt as any).price ?? 0)}
                 </ThemedText>
               </View>
               {isPaymentRequired('apartment') && (
                 <View style={styles.detailRow}>
                   <MaterialIcons name="payment" size={16} color={subtitleColor} />
                   <ThemedText style={[styles.detailText, { color: textColor }]}> 
                     Down Payment: {formatPHP(calculateDownPayment((apt as any).servicePrice ?? (apt as any).price ?? 0, 'apartment'))}
                   </ThemedText>
                 </View>
               )}
             </View>

             {/* Booking Actions */}
             <View style={styles.bookingActions}>
               <TouchableOpacity 
                 style={styles.viewDetailsButton}
                 onPress={() => handleViewDetails(apt, 'apartment')}
               >
                 <MaterialIcons name="visibility" size={20} color={colorPalette.primary} />
               </TouchableOpacity>
               <View style={styles.buttonSpacer} />
               <View style={styles.rightActions}>
                 {((apt as any).status || 'pending') === 'pending' && (
                   <TouchableOpacity 
                     style={styles.cancelButton}
                     onPress={() => confirmCancel(async () => {
                       const serviceId = (apt as any).serviceId || (apt as any).id;
                       await updateApartmentStatus(serviceId, 'cancelled');
                       await cancelAdminReservation('apartment', serviceId);
                     })}
                   >
                     <MaterialIcons name="cancel" size={16} color="#F44336" />
                     <ThemedText style={[styles.actionButtonText, { color: '#F44336', marginLeft: 4 }]}>
                       Cancel
                     </ThemedText>
                   </TouchableOpacity>
                 )}
                 <TouchableOpacity 
                   style={styles.deleteButton}
                   onPress={() => handleDeleteReservation(apt, 'apartment')}
                 >
                   <MaterialIcons name="delete" size={16} color="#F44336" />
                   <ThemedText style={[styles.actionButtonText, { color: '#F44336', marginLeft: 4 }]}>
                     Delete
                   </ThemedText>
                 </TouchableOpacity>
               </View>
             </View>
           </View>
         ))
       )}

       {/* Booking Cards - Laundry */}
       {laundrySorted.length > 0 && (
         laundrySorted.map((svc) => (
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
                   Avail
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
                 <ThemedText style={[styles.phpSymbol, { color: subtitleColor }]}>₱</ThemedText>
                 <ThemedText style={[styles.detailText, { color: textColor }]}> 
                   {formatPHP((svc as any).servicePrice ?? (svc as any).price ?? 0)}
                 </ThemedText>
               </View>
               {/* Shipping Information - Only for Laundry Services (Never for Auto Services) */}
               {(svc as any).shippingInfo && (svc as any).serviceType === 'laundry' && !(svc as any).homeService && !(svc as any).shopService && (
                 <>
                   <View style={styles.detailRow}>
                     <MaterialIcons 
                       name={(svc as any).shippingInfo.deliveryType === 'pickup' ? 'local-shipping' : 'home'} 
                       size={16} 
                       color={subtitleColor} 
                     />
                     <ThemedText style={[styles.detailText, { color: textColor }]}> 
                       Delivery: {(svc as any).shippingInfo.deliveryType === 'pickup' ? 'Pick Up' : 'Drop Off'}
                     </ThemedText>
                   </View>
                   
                   {/* Drop Off Address */}
                   {(svc as any).shippingInfo.deliveryType === 'dropoff' && (svc as any).shippingInfo.address && (
                     <View style={styles.detailRow}>
                       <MaterialIcons name="location-on" size={16} color={subtitleColor} />
                       <ThemedText style={[styles.detailText, { color: textColor }]}> 
                         Address: {(svc as any).shippingInfo.address}
                       </ThemedText>
                     </View>
                   )}
                   
                   {/* Pickup Details */}
                   {(svc as any).shippingInfo.deliveryType === 'pickup' && (
                     <View style={[
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
                           {(svc as any).shippingInfo.pickupDate && (
                             <View style={[
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
                                 {(svc as any).shippingInfo.pickupDate}
                               </ThemedText>
                             </View>
                           )}
                           {(svc as any).shippingInfo.pickupTime && (
                             <View style={[
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
                                 {(svc as any).shippingInfo.pickupTime}
                               </ThemedText>
                             </View>
                           )}
                         </View>
                         
                         {/* Address */}
                         {(svc as any).shippingInfo.pickupAddress && (
                           <View style={[
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
                                 {(svc as any).shippingInfo.pickupAddress}
                               </ThemedText>
                             </View>
                           </View>
                         )}
                         
                         {/* Contact */}
                         {(svc as any).shippingInfo.pickupContactNumber && (
                           <View style={[
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
                                 {(svc as any).shippingInfo.pickupContactNumber}
                               </ThemedText>
                             </View>
                           </View>
                         )}
                         
                         {/* Instructions */}
                         {(svc as any).shippingInfo.pickupInstructions && (svc as any).shippingInfo.pickupInstructions !== 'No special instructions' && (
                           <View style={[
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
                                 {(svc as any).shippingInfo.pickupInstructions}
                               </ThemedText>
                             </View>
                           </View>
                         )}
                       </View>
                     </View>
                   )}
                 </>
               )}
             </View>

             {/* Booking Actions */}
             <View style={styles.bookingActions}>
               <TouchableOpacity 
                 style={styles.viewDetailsButton}
                 onPress={() => handleViewDetails(svc, 'laundry')}
               >
                 <MaterialIcons name="visibility" size={20} color={colorPalette.primary} />
               </TouchableOpacity>
               <View style={styles.buttonSpacer} />
               <View style={styles.rightActions}>
                 {((svc as any).status || 'pending') === 'pending' && (
                   <TouchableOpacity 
                     style={styles.cancelButton}
                     onPress={() => confirmCancel(async () => {
                       const serviceId = (svc as any).serviceId || (svc as any).id;
                       await updateLaundryStatus(serviceId, 'cancelled');
                       await cancelAdminReservation('laundry', serviceId);
                     })}
                   >
                     <MaterialIcons name="cancel" size={16} color="#F44336" />
                     <ThemedText style={[styles.actionButtonText, { color: '#F44336', marginLeft: 4 }]}>
                       Cancel
                     </ThemedText>
                   </TouchableOpacity>
                 )}
                 <TouchableOpacity 
                   style={styles.deleteButton}
                   onPress={() => handleDeleteReservation(svc, 'laundry')}
                 >
                   <MaterialIcons name="delete" size={16} color="#F44336" />
                   <ThemedText style={[styles.actionButtonText, { color: '#F44336', marginLeft: 4 }]}>
                     Delete
                   </ThemedText>
                 </TouchableOpacity>
               </View>
             </View>
           </View>
         ))
       )}

       {/* Booking Cards - Car & Motor Parts */}
       {autoSorted && autoSorted.length > 0 && (
         autoSorted.map((svc) => (
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
                   Avail
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
                 <ThemedText style={[styles.phpSymbol, { color: subtitleColor }]}>₱</ThemedText>
                 <ThemedText style={[styles.detailText, { color: textColor }]}> 
                   {formatPHP((svc as any).servicePrice ?? (svc as any).price ?? 0)}
                 </ThemedText>
               </View>
               
               {/* Home Service Information */}
               {(svc as any).homeService && (
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
                     {(svc as any).problemDescription && (
                       <View style={styles.homeServiceDetailItem}>
                         <View style={[styles.homeServiceDetailIcon, { backgroundColor: '#FEF3C7' }]}>
                           <MaterialIcons name="build" size={16} color="#F59E0B" />
                         </View>
                         <View style={styles.homeServiceDetailContent}>
                           <ThemedText style={[styles.homeServiceDetailLabel, { color: subtitleColor }]}>
                             Problem Description
                           </ThemedText>
                           <ThemedText style={[styles.homeServiceDetailValue, { color: textColor }]}> 
                             {(svc as any).problemDescription}
                           </ThemedText>
                         </View>
                       </View>
                     )}
                     
                     {(svc as any).address && (
                       <View style={styles.homeServiceDetailItem}>
                         <View style={[styles.homeServiceDetailIcon, { backgroundColor: '#DBEAFE' }]}>
                           <MaterialIcons name="location-on" size={16} color="#3B82F6" />
                         </View>
                         <View style={styles.homeServiceDetailContent}>
                           <ThemedText style={[styles.homeServiceDetailLabel, { color: subtitleColor }]}>
                             Service Address
                           </ThemedText>
                           <ThemedText style={[styles.homeServiceDetailValue, { color: textColor }]}> 
                             {(svc as any).address}
                           </ThemedText>
                         </View>
                       </View>
                     )}
                     
                     {(svc as any).contactNumber && (
                       <View style={styles.homeServiceDetailItem}>
                         <View style={[styles.homeServiceDetailIcon, { backgroundColor: '#D1FAE5' }]}>
                           <MaterialIcons name="phone" size={16} color="#10B981" />
                         </View>
                         <View style={styles.homeServiceDetailContent}>
                           <ThemedText style={[styles.homeServiceDetailLabel, { color: subtitleColor }]}>
                             Contact Number
                           </ThemedText>
                           <ThemedText style={[styles.homeServiceDetailValue, { color: textColor }]}> 
                             {(svc as any).contactNumber}
                           </ThemedText>
                         </View>
                       </View>
                     )}
                     
                     {(svc as any).preferredTime && (
                       <View style={styles.homeServiceDetailItem}>
                         <View style={[styles.homeServiceDetailIcon, { backgroundColor: '#F3E8FF' }]}>
                           <MaterialIcons name="schedule" size={16} color="#8B5CF6" />
                         </View>
                         <View style={styles.homeServiceDetailContent}>
                           <ThemedText style={[styles.homeServiceDetailLabel, { color: subtitleColor }]}>
                             Preferred Time
                           </ThemedText>
                           <ThemedText style={[styles.homeServiceDetailValue, { color: textColor }]}> 
                             {(svc as any).preferredTime}
                           </ThemedText>
                         </View>
                       </View>
                     )}
                   </View>
                 </View>
               )}
             </View>

             {/* Booking Actions */}
             <View style={styles.bookingActions}>
               <TouchableOpacity 
                 style={styles.viewDetailsButton}
                 onPress={() => handleViewDetails(svc, 'auto')}
               >
                 <MaterialIcons name="visibility" size={20} color={colorPalette.primary} />
               </TouchableOpacity>
               <View style={styles.buttonSpacer} />
               <View style={styles.rightActions}>
                 {((svc as any).status || 'pending') === 'pending' && (
                   <TouchableOpacity 
                     style={styles.cancelButton}
                     onPress={() => confirmCancel(async () => {
                       const serviceId = (svc as any).serviceId || (svc as any).id;
                       await updateAutoStatus(serviceId, 'cancelled');
                       await cancelAdminReservation('auto', serviceId);
                     })}
                   >
                     <MaterialIcons name="cancel" size={16} color="#F44336" />
                     <ThemedText style={[styles.actionButtonText, { color: '#F44336', marginLeft: 4 }]}>
                       Cancel
                     </ThemedText>
                   </TouchableOpacity>
                 )}
                 <TouchableOpacity 
                   style={styles.deleteButton}
                   onPress={() => handleDeleteReservation(svc, 'auto')}
                 >
                   <MaterialIcons name="delete" size={16} color="#F44336" />
                   <ThemedText style={[styles.actionButtonText, { color: '#F44336', marginLeft: 4 }]}>
                     Delete
                   </ThemedText>
                 </TouchableOpacity>
               </View>
             </View>
           </View>
         ))
       )}

       {/* Empty state */}
       {apartmentsSorted.length === 0 && laundrySorted.length === 0 && (!autoSorted || autoSorted.length === 0) && (
         <View style={{ alignItems: 'center', marginTop: 250 }}>
           <ThemedText style={{ color: subtitleColor }}>No reservations yet.</ThemedText>
         </View>
       )}
      </ScrollView>
      ) : (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Professional Bills Header */}
        <View style={styles.professionalHeader}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <MaterialIcons name="receipt-long" size={28} color={colorPalette.primary} />
            </View>
            <View style={styles.headerTextContainer}>
              <ThemedText type="title" style={[styles.professionalTitle, { color: textColor }]}> 
                Billing Summary
              </ThemedText>
              <ThemedText type="default" style={[styles.professionalSubtitle, { color: subtitleColor }]}> 
                Review your accepted services and payment details
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Professional Grand Total Card */}
        <View style={[styles.totalCard, { backgroundColor: cardBgColor, borderColor }]}> 
          <View style={styles.totalCardHeader}>
            <View style={styles.totalIconContainer}>
              <MaterialIcons name="account-balance-wallet" size={24} color="#fff" />
            </View>
            <View style={styles.totalTextContainer}>
              <ThemedText style={[styles.totalLabel, { color: textColor }]}>Total Amount Due</ThemedText>
              <ThemedText style={[styles.totalAmount, { color: colorPalette.primary }]}>
                {formatPHP(totals.grand)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.totalCardFooter}>
            <MaterialIcons name="info-outline" size={16} color={subtitleColor} />
            <ThemedText style={[styles.totalNote, { color: subtitleColor }]}>
              Apartment amounts show remaining balance after down payment
            </ThemedText>
          </View>
        </View>

        {/* Professional Apartments Section */}
        {accepted.apartments.length > 0 && (
          <View style={[styles.serviceCard, { backgroundColor: cardBgColor, borderColor }]}> 
            <View style={styles.serviceCardHeader}>
              <View style={styles.serviceIconContainer}>
                <MaterialIcons name="apartment" size={20} color="#fff" />
              </View>
              <View style={styles.serviceHeaderText}>
                <ThemedText style={[styles.serviceCategoryName, { color: textColor }]}>Apartment Rental</ThemedText>
                <ThemedText style={[styles.serviceItemCount, { color: subtitleColor }]}>
                  {accepted.apartments.length} {accepted.apartments.length === 1 ? 'unit' : 'units'}
                </ThemedText>
              </View>
            </View>
            <View style={styles.serviceCardBody}>
              {accepted.apartments.map((i, index) => (
                <View key={i.id} style={[styles.professionalBillRow, index === accepted.apartments.length - 1 && styles.lastBillRow]}>
                  <View style={styles.billItemInfo}>
                    <ThemedText style={[styles.professionalBillTitle, { color: textColor }]} numberOfLines={1}>
                      {i.title || 'Apartment Unit'}
                    </ThemedText>
                    <ThemedText style={[styles.billItemType, { color: subtitleColor }]}>Remaining balance (after down payment)</ThemedText>
                  </View>
                  <ThemedText style={[styles.professionalBillAmount, { color: colorPalette.primary }]}>
                    {formatPHP(i.amount)}
                  </ThemedText>
                </View>
              ))}
              <View style={styles.professionalBillDivider} />
              <View style={styles.professionalBillRow}>
                <ThemedText style={[styles.billSubtotalLabel, { color: textColor }]}>Subtotal</ThemedText>
                <ThemedText style={[styles.billSubtotalAmount, { color: colorPalette.primary }]}>
                  {formatPHP(totals.apartments)}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Professional Laundry Section */}
        {accepted.laundry.length > 0 && (
          <View style={[styles.serviceCard, { backgroundColor: cardBgColor, borderColor }]}> 
            <View style={styles.serviceCardHeader}>
              <View style={[styles.serviceIconContainer, { backgroundColor: '#4CAF50' }]}>
                <MaterialIcons name="local-laundry-service" size={20} color="#fff" />
              </View>
              <View style={styles.serviceHeaderText}>
                <ThemedText style={[styles.serviceCategoryName, { color: textColor }]}>Laundry Service</ThemedText>
                <ThemedText style={[styles.serviceItemCount, { color: subtitleColor }]}>
                  {accepted.laundry.length} {accepted.laundry.length === 1 ? 'service' : 'services'}
                </ThemedText>
              </View>
            </View>
            <View style={styles.serviceCardBody}>
              {accepted.laundry.map((i, index) => (
                <View key={i.id} style={[styles.professionalBillRow, index === accepted.laundry.length - 1 && styles.lastBillRow]}>
                  <View style={styles.billItemInfo}>
                    <ThemedText style={[styles.professionalBillTitle, { color: textColor }]} numberOfLines={1}>
                      {i.title || 'Laundry Service'}
                    </ThemedText>
                    <ThemedText style={[styles.billItemType, { color: subtitleColor }]}>Wash & fold service</ThemedText>
                  </View>
                  <ThemedText style={[styles.professionalBillAmount, { color: colorPalette.primary }]}>
                    {formatPHP(i.amount)}
                  </ThemedText>
                </View>
              ))}
              <View style={styles.professionalBillDivider} />
              <View style={styles.professionalBillRow}>
                <ThemedText style={[styles.billSubtotalLabel, { color: textColor }]}>Subtotal</ThemedText>
                <ThemedText style={[styles.billSubtotalAmount, { color: colorPalette.primary }]}>
                  {formatPHP(totals.laundry)}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Professional Auto Section */}
        {accepted.auto.length > 0 && (
          <View style={[styles.serviceCard, { backgroundColor: cardBgColor, borderColor }]}> 
            <View style={styles.serviceCardHeader}>
              <View style={[styles.serviceIconContainer, { backgroundColor: '#FF9800' }]}>
                <MaterialIcons name="directions-car" size={20} color="#fff" />
              </View>
              <View style={styles.serviceHeaderText}>
                <ThemedText style={[styles.serviceCategoryName, { color: textColor }]}>Car & Motor Services</ThemedText>
                <ThemedText style={[styles.serviceItemCount, { color: subtitleColor }]}>
                  {accepted.auto.length} {accepted.auto.length === 1 ? 'item' : 'items'}
                </ThemedText>
              </View>
            </View>
            <View style={styles.serviceCardBody}>
              {accepted.auto.map((i, index) => (
                <View key={i.id} style={[styles.professionalBillRow, index === accepted.auto.length - 1 && styles.lastBillRow]}>
                  <View style={styles.billItemInfo}>
                    <ThemedText style={[styles.professionalBillTitle, { color: textColor }]} numberOfLines={1}>
                      {i.title || 'Auto Service'}
                    </ThemedText>
                    <ThemedText style={[styles.billItemType, { color: subtitleColor }]}>Parts & service</ThemedText>
                  </View>
                  <ThemedText style={[styles.professionalBillAmount, { color: colorPalette.primary }]}>
                    {formatPHP(i.amount)}
                  </ThemedText>
                </View>
              ))}
              <View style={styles.professionalBillDivider} />
              <View style={styles.professionalBillRow}>
                <ThemedText style={[styles.billSubtotalLabel, { color: textColor }]}>Subtotal</ThemedText>
                <ThemedText style={[styles.billSubtotalAmount, { color: colorPalette.primary }]}>
                  {formatPHP(totals.auto)}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Professional Empty State */}
        {accepted.apartments.length === 0 && accepted.laundry.length === 0 && accepted.auto.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIconContainer}>
              <MaterialIcons name="receipt-long" size={64} color={subtitleColor} style={{ opacity: 0.5 }} />
            </View>
            <ThemedText style={[styles.emptyStateTitle, { color: textColor }]}>
              No Bills Yet
            </ThemedText>
            <ThemedText style={[styles.emptyStateMessage, { color: subtitleColor }]}>
              Your billing summary will appear here once you have accepted services.
            </ThemedText>
          </View>
        )}
      </ScrollView>
      )}
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  buttonSpacer: {
    flex: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  actionButton: {
    flex: 0,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  viewDetailsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 178, 255, 0.1)',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Tabs
  tabBar: {
    marginTop: 40,
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#00B2FF',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Bills
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billTitle: {
    flex: 1,
    marginRight: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  billSubtitle: {
    fontSize: 14,
  },
  billAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00B2FF',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  // Professional Bills Styles
  professionalHeader: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 178, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  professionalTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  professionalSubtitle: {
    fontSize: 16,
    opacity: 0.8,
    lineHeight: 22,
  },
  totalCard: {
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: 'hidden',
  },
  totalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 178, 255, 0.05)',
  },
  totalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colorPalette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  totalTextContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.8,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '800',
  },
  totalCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 178, 255, 0.02)',
  },
  totalNote: {
    fontSize: 14,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  serviceCard: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
  },
  serviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colorPalette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceHeaderText: {
    flex: 1,
  },
  serviceCategoryName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  serviceItemCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  serviceCardBody: {
    padding: 16,
    paddingTop: 8,
  },
  professionalBillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  lastBillRow: {
    paddingBottom: 8,
  },
  billItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  professionalBillTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  billItemType: {
    fontSize: 13,
    fontWeight: '500',
  },
  professionalBillAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  professionalBillDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: 8,
  },
  billSubtotalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  billSubtotalAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIconContainer: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  phpSymbol: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
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