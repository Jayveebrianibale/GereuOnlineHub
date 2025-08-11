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

// Sample history data
const historyData = [
  {
    id: '1',
    serviceType: 'Apartment Rental',
    serviceName: 'Luxury Studio Apartment',
    date: '2024-01-12',
    status: 'Completed',
    price: '$1,200',
    location: 'Downtown',
    duration: '6 months',
  },
  {
    id: '2',
    serviceType: 'Laundry Service',
    serviceName: 'Premium Wash & Fold',
    date: '2024-01-10',
    status: 'Completed',
    price: '$15.50',
    location: 'Home Pickup',
    duration: '24 hours',
  },
  {
    id: '3',
    serviceType: 'Auto Service',
    serviceName: 'Oil Change Service',
    date: '2024-01-08',
    status: 'Completed',
    price: '$49.99',
    location: 'Auto Center',
    duration: '30 min',
  },
  {
    id: '4',
    serviceType: 'Laundry Service',
    serviceName: 'Express Dry Cleaning',
    date: '2024-01-05',
    status: 'Completed',
    price: '$12.99',
    location: 'Home Pickup',
    duration: 'Same day',
  },
  {
    id: '5',
    serviceType: 'Auto Service',
    serviceName: 'Tire Rotation',
    date: '2024-01-02',
    status: 'Completed',
    price: '$29.99',
    location: 'Auto Center',
    duration: '45 min',
  },
];

export default function History() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Apartment Rental':
        return 'apartment';
      case 'Laundry Service':
        return 'local-laundry-service';
      case 'Auto Service':
        return 'directions-car';
      default:
        return 'history';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.title, { color: textColor }]}>
            Service History
          </ThemedText>
          <ThemedText type="default" style={[styles.subtitle, { color: subtitleColor }]}>
            Your completed service bookings
          </ThemedText>
        </View>

        {/* History Timeline */}
        <View style={styles.timelineContainer}>
          {historyData.map((item, index) => (
            <View key={item.id} style={styles.timelineItem}>
              {/* Timeline Line */}
              {index < historyData.length - 1 && (
                <View style={[styles.timelineLine, { backgroundColor: borderColor }]} />
              )}
              
              {/* Timeline Dot */}
              <View style={[styles.timelineDot, { backgroundColor: colorPalette.primary }]} />
              
              {/* History Card */}
              <View style={[styles.historyCard, { backgroundColor: cardBgColor, borderColor }]}>
                <View style={styles.historyHeader}>
                  <View style={styles.serviceInfo}>
                    <MaterialIcons 
                      name={getServiceIcon(item.serviceType) as any} 
                      size={20} 
                      color={colorPalette.primary} 
                    />
                    <View style={styles.serviceDetails}>
                      <ThemedText type="subtitle" style={[styles.serviceName, { color: textColor }]}>
                        {item.serviceName}
                      </ThemedText>
                      <ThemedText style={[styles.serviceType, { color: subtitleColor }]}>
                        {item.serviceType}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
                    <ThemedText style={styles.statusText}>{item.status}</ThemedText>
                  </View>
                </View>
                
                <View style={styles.historyDetails}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="event" size={14} color={subtitleColor} />
                    <ThemedText style={[styles.detailText, { color: textColor }]}>
                      {formatDate(item.date)}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="location-on" size={14} color={subtitleColor} />
                    <ThemedText style={[styles.detailText, { color: textColor }]}>
                      {item.location}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="schedule" size={14} color={subtitleColor} />
                    <ThemedText style={[styles.detailText, { color: textColor }]}>
                      {item.duration}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="attach-money" size={14} color={subtitleColor} />
                    <ThemedText style={[styles.detailText, { color: textColor }]}>
                      {item.price}
                    </ThemedText>
                  </View>
                </View>
                
                <View style={styles.historyActions}>
                  <TouchableOpacity style={[styles.actionButton, { borderColor }]}>
                    <ThemedText style={[styles.actionButtonText, { color: colorPalette.primary }]}>
                      View Details
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, { borderColor }]}>
                    <ThemedText style={[styles.actionButtonText, { color: colorPalette.primary }]}>
                      Book Again
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
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
  timelineContainer: {
    position: 'relative',
  },
  timelineItem: {
    position: 'relative',
    marginBottom: 24,
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 40,
    width: 2,
    height: '100%',
    zIndex: 1,
  },
  timelineDot: {
    position: 'absolute',
    left: 8,
    top: 32,
    width: 16,
    height: 16,
    borderRadius: 8,
    zIndex: 2,
  },
  historyCard: {
    marginLeft: 40,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceDetails: {
    marginLeft: 8,
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  serviceType: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  historyDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 12,
  },
  historyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
}); 