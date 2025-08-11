import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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

// Sample favorites data
const favoritesData = [
  {
    id: '1',
    type: 'Apartment',
    name: 'Luxury Studio Apartment',
    price: '$1,200/mo',
    location: 'Downtown',
    rating: 4.8,
    image: require('@/assets/images/apartment1.webp'),
    amenities: ['WiFi', 'Parking', 'Gym'],
  },
  {
    id: '2',
    type: 'Laundry',
    name: 'Premium Wash & Fold',
    price: '$1.50/lb',
    location: 'Home Pickup',
    rating: 4.9,
    image: require('@/assets/images/laundry1.webp'),
    turnaround: '24-hour',
  },
  {
    id: '3',
    type: 'Auto',
    name: 'Oil Change Service',
    price: '$49.99',
    location: 'Auto Center',
    rating: 4.7,
    image: require('@/assets/images/auto1.jpg'),
    duration: '30 min',
  },
  {
    id: '4',
    type: 'Apartment',
    name: 'Modern 1-Bedroom',
    price: '$1,500/mo',
    location: 'Midtown',
    rating: 4.6,
    image: require('@/assets/images/apartment1.webp'),
    amenities: ['Pool', 'Laundry', 'Balcony'],
  },
];

export default function Favorites() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'Apartment':
        return 'apartment';
      case 'Laundry':
        return 'local-laundry-service';
      case 'Auto':
        return 'directions-car';
      default:
        return 'favorite';
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.title, { color: textColor }]}>
            Favorites
          </ThemedText>
          <ThemedText type="default" style={[styles.subtitle, { color: subtitleColor }]}>
            Your saved services and properties
          </ThemedText>
        </View>

        {/* Favorites Grid */}
        <View style={styles.favoritesGrid}>
          {favoritesData.map((item) => (
            <View key={item.id} style={[styles.favoriteCard, { backgroundColor: cardBgColor, borderColor }]}>
              <Image source={item.image} style={styles.favoriteImage} resizeMode="cover" />
              
              <View style={styles.favoriteOverlay}>
                <TouchableOpacity style={styles.favoriteButton}>
                  <MaterialIcons name="favorite" size={20} color="#F44336" />
                </TouchableOpacity>
                <View style={styles.ratingBadge}>
                  <MaterialIcons name="star" size={14} color="#FFD700" />
                  <ThemedText style={styles.ratingText}>{item.rating}</ThemedText>
                </View>
              </View>
              
              <View style={styles.favoriteContent}>
                <View style={styles.serviceTypeRow}>
                  <MaterialIcons 
                    name={getServiceIcon(item.type) as any} 
                    size={16} 
                    color={colorPalette.primary} 
                  />
                  <ThemedText style={[styles.serviceType, { color: subtitleColor }]}>
                    {item.type}
                  </ThemedText>
                </View>
                
                <ThemedText type="subtitle" style={[styles.favoriteName, { color: textColor }]}>
                  {item.name}
                </ThemedText>
                
                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={14} color={subtitleColor} />
                  <ThemedText style={[styles.locationText, { color: subtitleColor }]}>
                    {item.location}
                  </ThemedText>
                </View>
                
                <View style={styles.priceRow}>
                  <ThemedText style={[styles.priceText, { color: colorPalette.primary }]}>
                    {item.price}
                  </ThemedText>
                  {item.amenities && (
                    <View style={styles.amenitiesContainer}>
                      {item.amenities.slice(0, 2).map((amenity, index) => (
                        <View key={index} style={styles.amenityBadge}>
                          <ThemedText style={styles.amenityText}>{amenity}</ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                
                <TouchableOpacity style={[styles.bookButton, { backgroundColor: colorPalette.primary }]}>
                  <ThemedText style={styles.bookButtonText}>Book Now</ThemedText>
                </TouchableOpacity>
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
  favoritesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  favoriteCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  favoriteImage: {
    width: '100%',
    height: 120,
  },
  favoriteOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  favoriteButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {
    color: '#fff',
    marginLeft: 2,
    fontSize: 12,
  },
  favoriteContent: {
    padding: 12,
  },
  serviceTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceType: {
    marginLeft: 4,
    fontSize: 12,
  },
  favoriteName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 4,
    fontSize: 12,
  },
  priceRow: {
    marginBottom: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityBadge: {
    backgroundColor: 'rgba(0, 178, 255, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  amenityText: {
    color: colorPalette.primary,
    fontSize: 10,
  },
  bookButton: {
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
}); 