import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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

// Sample booking data
const bookingsData = [
  {
    id: '1',
    serviceType: 'Apartment Rental',
    serviceName: 'Luxury Studio Apartment',
    date: '2024-01-15',
    status: 'Confirmed',
    price: '$1,200',
    location: 'Downtown',
  },
  {
    id: '2',
    serviceType: 'Laundry Service',
    serviceName: 'Premium Wash & Fold',
    date: '2024-01-12',
    status: 'Completed',
    price: '$15.50',
    location: 'Home Pickup',
  },
  {
    id: '3',
    serviceType: 'Auto Service',
    serviceName: 'Oil Change Service',
    date: '2024-01-10',
    status: 'In Progress',
    price: '$49.99',
    location: 'Auto Center',
  },
  {
    id: '4',
    serviceType: 'Apartment Rental',
    serviceName: 'Modern 1-Bedroom',
    date: '2024-01-08',
    status: 'Cancelled',
    price: '$1,500',
    location: 'Midtown',
  },
];

export default function Bookings() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return '#4CAF50';
      case 'Completed':
        return '#2196F3';
      case 'In Progress':
        return '#FF9800';
      case 'Cancelled':
        return '#F44336';
      default:
        return colorPalette.primary;
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Apartment Rental':
        return 'apartment';
      case 'Laundry Service':
        return 'local-laundry-service';
      case 'Auto Service':
        return 'directions-car';
      default:
        return 'receipt';
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.title, { color: textColor }]}>
            My Bookings
          </ThemedText>
          <ThemedText type="default" style={[styles.subtitle, { color: subtitleColor }]}>
            Track your service bookings
          </ThemedText>
        </View>

        {/* Booking Cards */}
        {bookingsData.map((booking) => (
          <View key={booking.id} style={[styles.bookingCard, { backgroundColor: cardBgColor, borderColor }]}>
            <View style={styles.bookingHeader}>
              <View style={styles.serviceInfo}>
                <MaterialIcons 
                  name={getServiceIcon(booking.serviceType) as any} 
                  size={24} 
                  color={colorPalette.primary} 
                />
                <View style={styles.serviceDetails}>
                  <ThemedText type="subtitle" style={[styles.serviceName, { color: textColor }]}>
                    {booking.serviceName}
                  </ThemedText>
                  <ThemedText style={[styles.serviceType, { color: subtitleColor }]}>
                    {booking.serviceType}
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                <ThemedText style={styles.statusText}>{booking.status}</ThemedText>
              </View>
            </View>
            
            <View style={styles.bookingDetails}>
              <View style={styles.detailRow}>
                <MaterialIcons name="event" size={16} color={subtitleColor} />
                <ThemedText style={[styles.detailText, { color: textColor }]}>
                  {new Date(booking.date).toLocaleDateString()}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="location-on" size={16} color={subtitleColor} />
                <ThemedText style={[styles.detailText, { color: textColor }]}>
                  {booking.location}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="attach-money" size={16} color={subtitleColor} />
                <ThemedText style={[styles.detailText, { color: textColor }]}>
                  {booking.price}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.bookingActions}>
              <TouchableOpacity style={[styles.actionButton, { borderColor }]}>
                <ThemedText style={[styles.actionButtonText, { color: colorPalette.primary }]}>
                  View Details
                </ThemedText>
              </TouchableOpacity>
              {booking.status === 'Confirmed' && (
                <TouchableOpacity style={[styles.actionButton, { borderColor }]}>
                  <ThemedText style={[styles.actionButtonText, { color: '#F44336' }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
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
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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