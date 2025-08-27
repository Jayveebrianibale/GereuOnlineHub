import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';

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

// Sample reservation data
const reservations = [
  {
    id: '1',
    user: 'John Doe',
    service: 'Apartment Cleaning',
    date: '2023-06-15',
    time: '10:00 AM',
    status: 'Confirmed',
    price: '$50'
    
  },
  {
    id: '2',
    user: 'Jane Smith',
    service: 'Laundry Service',
    date: '2023-06-16',
    time: '2:30 PM',
    status: 'Pending',
    price: '$35'
  },
  {
    id: '3',
    user: 'Robert Johnson',
    service: 'Motor Parts Delivery',
    date: '2023-06-17',
    time: '9:00 AM',
    status: 'Completed',
    price: '$120'
  },
  {
    id: '4',
    user: 'Emily Davis',
    service: 'Apartment Cleaning',
    date: '2023-06-18',
    time: '11:00 AM',
    status: 'Confirmed',
    price: '$50'
  },
  {
    id: '5',
    user: 'Michael Wilson',
    service: 'Laundry Service',
    date: '2023-06-19',
    time: '3:00 PM',
    status: 'Cancelled',
    price: '$35'
  },
];

export default function ReservationsScreen() {
  const { colorScheme } = useColorScheme();
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;
  
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
      case 'Confirmed':
        return '#10B981';
      case 'Pending':
        return '#F59E0B';
      case 'Completed':
        return '#3B82F6';
      case 'Cancelled':
        return '#EF4444';
      default:
        return textColor;
    }
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
          {reservations.map((reservation) => (
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
                  {reservation.service}
                </ThemedText>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(reservation.status) + '20' }
                ]}>
                  <ThemedText style={[
                    styles.statusText,
                    { color: getStatusColor(reservation.status) }
                  ]}>
                    {reservation.status}
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
                    {reservation.user}
                  </ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <MaterialIcons name="calendar-today" size={16} color={subtitleColor} />
                  <ThemedText style={[
                    styles.detailText, 
                    { color: textColor }
                  ]}>
                    {reservation.date} at {reservation.time}
                  </ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <MaterialIcons name="attach-money" size={16} color={subtitleColor} />
                  <ThemedText style={[
                    styles.detailText, 
                    { color: textColor }
                  ]}>
                    {reservation.price}
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.reservationActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="visibility" size={18} color={colorPalette.primary} />
                  <ThemedText style={[
                    styles.actionText, 
                    { color: colorPalette.primary }
                  ]}>
                    View
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="edit" size={18} color={colorPalette.primaryDark} />
                  <ThemedText style={[
                    styles.actionText, 
                    { color: colorPalette.primaryDark }
                  ]}>
                    Edit
                  </ThemedText>
                </TouchableOpacity>
                
                {reservation.status !== 'Cancelled' && (
                  <TouchableOpacity style={styles.actionButton}>
                    <MaterialIcons name="cancel" size={18} color="#EF4444" />
                    <ThemedText style={[
                      styles.actionText, 
                      { color: '#EF4444' }
                    ]}>
                      Cancel
                    </ThemedText>
                  </TouchableOpacity>
                )}
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
});