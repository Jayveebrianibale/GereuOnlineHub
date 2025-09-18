import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { off, onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '../components/ColorSchemeContext';
import { db } from './firebaseConfig';

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

// Initialize modules with placeholder stats
const initialModules = [
  {
    key: 'apartment',
    title: 'Apartment Rentals',
    image: require('@/assets/images/apartment1.webp'),
    description: 'Manage room listings, availability, and reservations',
    stats: '0 Listings',
    icon: 'apartment',
    color: colorPalette.primaryDark,
  },
  {
    key: 'laundry',
    title: 'Laundry Services',
    image: require('@/assets/images/laundry1.webp'),
    description: 'Manage laundry status',
    stats: '0 Services',
    icon: 'local-laundry-service',
    color: colorPalette.primary,
  },
  {
    key: 'car',
    title: 'Car and Motor Parts',
    image: require('@/assets/images/auto1.jpg'),
    description: 'Manage car parts and service requests',
    stats: '0 Services',
    icon: 'directions-car',
    color: colorPalette.dark,
  },
];

export default function AdminDashboard() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const cardBackground = isDark ? '#181818' : '#fff';
  const pageBackground = isDark ? '#000' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const iconColor = isDark ? colorPalette.primaryLight : colorPalette.primaryDark;

  const [apartments, setApartments] = useState<any[]>([]);
  const [autoServices, setAutoServices] = useState<any[]>([]);
  const [laundryServices, setLaundryServices] = useState<any[]>([]);
  const [modules, setModules] = useState(initialModules);
  const [totalServices, setTotalServices] = useState(0);
  const [activeReservations, setActiveReservations] = useState(0);
  const [reservationsCount, setReservationsCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Real-time listeners for all services
  useEffect(() => {
    // Set up real-time listeners for apartments
    const apartmentsRef = ref(db, 'apartments');
    const apartmentsListener = onValue(apartmentsRef, (snapshot) => {
      const apartmentsData: any[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          const apartment = { id: key, ...data[key] };
          apartmentsData.push(apartment);
        });
      }
      setApartments(apartmentsData);
    });

    // Set up real-time listeners for auto services
    const autoServicesRef = ref(db, 'autoServices');
    const autoServicesListener = onValue(autoServicesRef, (snapshot) => {
      const autoServicesData: any[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          autoServicesData.push({ id: key, ...data[key] });
        });
      }
      setAutoServices(autoServicesData);
    });

    // Set up real-time listeners for laundry services
    const laundryServicesRef = ref(db, 'laundryServices');
    const laundryServicesListener = onValue(laundryServicesRef, (snapshot) => {
      const laundryServicesData: any[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          laundryServicesData.push({ id: key, ...data[key] });
        });
      }
      setLaundryServices(laundryServicesData);
    });

    // Set up real-time listener for admin reservations count
    const adminReservationsRef = ref(db, 'adminReservations');
    const adminReservationsListener = onValue(adminReservationsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setReservationsCount(0);
        return;
      }
      const data = snapshot.val();
      const count = Object.keys(data).length;
      setReservationsCount(count);
    });

    // Cleanup listeners when component unmounts
    return () => {
      off(apartmentsRef, 'value', apartmentsListener);
      off(autoServicesRef, 'value', autoServicesListener);
      off(laundryServicesRef, 'value', laundryServicesListener);
      off(adminReservationsRef, 'value', adminReservationsListener);
    };
  }, []);

  // Admin notifications badge listener (pending + changes since last seen)
  useEffect(() => {
    let isActive = true;
    const storageKey = `admin:lastSeenAdminReservations`;
    const unsubscribe = onValue(ref(db, 'adminReservations'), async (snapshot) => {
      if (!isActive) return;
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        const lastSeen = raw ? Number(raw) : 0;
        if (!snapshot.exists()) {
          setUnreadCount(0);
          return;
        }
        const data = snapshot.val();
        const list = Object.values(data) as any[];
        const relevant = list.filter(r => r.status === 'pending' || r.status === 'confirmed' || r.status === 'declined' || r.status === 'cancelled');
        const count = relevant.filter(r => new Date(r.updatedAt).getTime() > lastSeen).length;
        setUnreadCount(count);
      } catch {
        setUnreadCount(0);
      }
    });
    return () => { isActive = false; unsubscribe(); };
  }, []);

  const handleAdminNotificationsPress = async () => {
    try {
      const storageKey = `admin:lastSeenAdminReservations`;
      await AsyncStorage.setItem(storageKey, String(Date.now()));
      setUnreadCount(0);
      router.push('/notifications');
    } catch {}
  };
  // Update modules and calculate totals whenever any service data changes
  useEffect(() => {
    // Update modules with actual counts
    setModules([
      {
        ...initialModules[0],
        stats: `${apartments.length} ${apartments.length === 1 ? 'Listing' : 'Listings'}`
      },
      {
        ...initialModules[1],
        stats: `${laundryServices.length} ${laundryServices.length === 1 ? 'Service' : 'Services'}`
      },
      {
        ...initialModules[2],
        stats: `${autoServices.length} ${autoServices.length === 1 ? 'Service' : 'Services'}`
      }
    ]);

    // Calculate total services
    const total = apartments.length + autoServices.length + laundryServices.length;
    setTotalServices(total);

    // Calculate active reservations
    const activeReservationsCount = calculateActiveReservations(apartments, autoServices, laundryServices);
    setActiveReservations(activeReservationsCount);
  }, [apartments, autoServices, laundryServices]);

  // Function to calculate active reservations (placeholder implementation)
  const calculateActiveReservations = (apartments: any[], autoServices: any[], laundryServices: any[]) => {
    // This is a simplified example - you'll need to implement your actual reservation logic
    // For now, we'll just return a count based on some assumptions
    
    // Count apartments with status 'active' or 'occupied'
    const activeApartments = apartments.filter(apt => 
      apt.status === 'active' || apt.status === 'occupied' || apt.status === 'booked'
    ).length;

    // Count auto services with status 'active' or 'scheduled'
    const activeAutoServices = autoServices.filter(auto => 
      auto.status === 'active' || auto.status === 'scheduled' || auto.status === 'booked'
    ).length;

    // Count laundry services with status 'active' or 'in-progress'
    const activeLaundryServices = laundryServices.filter(laundry => 
      laundry.status === 'active' || laundry.status === 'in-progress' || laundry.status === 'scheduled'
    ).length;

    return activeApartments + activeAutoServices + activeLaundryServices;
  };

  // Function to get service counts by category
  const getServiceCounts = () => {
    return {
      apartments: apartments.length,
      autoServices: autoServices.length,
      laundryServices: laundryServices.length,
      total: totalServices
    };
  };

  // Function to get active reservations count
  const getActiveReservationsCount = () => {
    return activeReservations;
  };

  const handleModulePress = (moduleKey: string) => {
    switch (moduleKey) {
      case 'apartment':
        router.push('/admin-apartment');
        break;
      case 'laundry':
        router.push('/admin-laundry');
        break;
      case 'car':
        router.push('/admin-auto');
        break;
      default:
        break;
    }
  };

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results: any[] = [];

    // Search in apartments
    apartments.forEach(apartment => {
      if (
        apartment.name?.toLowerCase().includes(query.toLowerCase()) ||
        apartment.description?.toLowerCase().includes(query.toLowerCase()) ||
        apartment.location?.toLowerCase().includes(query.toLowerCase()) ||
        apartment.type?.toLowerCase().includes(query.toLowerCase())
      ) {
        results.push({
          ...apartment,
          type: 'apartment',
          category: 'Apartment Rentals'
        });
      }
    });

    // Search in auto services
    autoServices.forEach(auto => {
      if (
        auto.name?.toLowerCase().includes(query.toLowerCase()) ||
        auto.description?.toLowerCase().includes(query.toLowerCase()) ||
        auto.serviceType?.toLowerCase().includes(query.toLowerCase()) ||
        auto.brand?.toLowerCase().includes(query.toLowerCase()) ||
        auto.model?.toLowerCase().includes(query.toLowerCase())
      ) {
        results.push({
          ...auto,
          type: 'auto',
          category: 'Car and Motor Parts'
        });
      }
    });

    // Search in laundry services
    laundryServices.forEach(laundry => {
      if (
        laundry.name?.toLowerCase().includes(query.toLowerCase()) ||
        laundry.description?.toLowerCase().includes(query.toLowerCase()) ||
        laundry.serviceType?.toLowerCase().includes(query.toLowerCase())
      ) {
        results.push({
          ...laundry,
          type: 'laundry',
          category: 'Laundry Services'
        });
      }
    });

    setSearchResults(results);
  };

  const handleSearchResultPress = (item: any) => {
    switch (item.type) {
      case 'apartment':
        router.push('/admin-apartment');
        break;
      case 'auto':
        router.push('/admin-auto');
        break;
      case 'laundry':
        router.push('/admin-laundry');
        break;
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: pageBackground }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={[styles.headerTitle, { color: textColor }]}>
              Dashboard
            </ThemedText>
            <ThemedText type="default" style={[styles.headerSubtitle, { color: subtitleColor }]}>
              Welcome back, Admin
            </ThemedText>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleColorScheme}>
              {/* <MaterialIcons 
                name={colorScheme === 'dark' ? 'light-mode' : 'dark-mode'} 
                size={24} 
                color={iconColor} 
              /> */}
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={handleAdminNotificationsPress}>
              <View>
                <MaterialIcons name="notifications-none" size={32} color={iconColor} />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <ThemedText style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</ThemedText>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: cardBackground }]}>
          <MaterialIcons name="search" size={20} color={subtitleColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search services..."
            placeholderTextColor={subtitleColor}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialIcons name="clear" size={20} color={subtitleColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <View style={styles.statHeader}>
              <MaterialIcons name="business" size={20} color={colorPalette.primary} />
              <ThemedText type="default" style={[styles.statLabel, { color: subtitleColor }]}>
                Total Services
              </ThemedText>
            </View>
            <ThemedText type="title" style={[styles.statValue, { color: textColor }]}>
              {totalServices}
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <View style={styles.statHeader}>
              <MaterialIcons name="event-note" size={20} color={colorPalette.primaryDark} />
              <ThemedText type="default" style={[styles.statLabel, { color: subtitleColor }]}>
                Reservations
              </ThemedText>
            </View>
            <ThemedText type="title" style={[styles.statValue, { color: textColor }]}>
              {reservationsCount}
            </ThemedText>
          </View>
        </View>

        {/* Search Results */}
        {isSearching && (
          <View style={styles.searchResultsContainer}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              Search Results ({searchResults.length})
            </ThemedText>
            {searchResults.length > 0 ? (
              <View style={styles.searchResultsList}>
                {searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.type}-${item.id}-${index}`}
                    style={[styles.searchResultItem, { backgroundColor: cardBackground }]}
                    onPress={() => handleSearchResultPress(item)}
                  >
                    <View style={styles.searchResultHeader}>
                      <MaterialIcons 
                        name={
                          item.type === 'apartment' ? 'apartment' :
                          item.type === 'auto' ? 'directions-car' :
                          'local-laundry-service'
                        } 
                        size={20} 
                        color={
                          item.type === 'apartment' ? colorPalette.primaryDark :
                          item.type === 'auto' ? colorPalette.dark :
                          colorPalette.primary
                        } 
                      />
                      <ThemedText type="subtitle" style={[styles.searchResultTitle, { color: textColor }]}>
                        {item.name || item.title || 'Untitled'}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.searchResultCategory, { color: subtitleColor }]}>
                      {item.category}
                    </ThemedText>
                    <ThemedText style={[styles.searchResultDescription, { color: subtitleColor }]}>
                      {item.description || 'No description available'}
                    </ThemedText>
                    <MaterialIcons name="arrow-forward" size={16} color={subtitleColor} style={styles.searchResultArrow} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={[styles.noResultsContainer, { backgroundColor: cardBackground }]}>
                <MaterialIcons name="search-off" size={48} color={subtitleColor} />
                <ThemedText style={[styles.noResultsText, { color: textColor }]}>
                  No services found
                </ThemedText>
                <ThemedText style={[styles.noResultsSubtext, { color: subtitleColor }]}>
                  Try searching with different keywords
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Main Services */}
        {!isSearching && (
          <>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              Manage Services
            </ThemedText>
            <View style={styles.cardGrid}>
              {modules.map((mod) => (
                <TouchableOpacity 
                  key={mod.key} 
                  style={[
                    styles.card, 
                    { 
                      backgroundColor: cardBackground,
                      borderTopColor: mod.color,
                      shadowColor: isDark ? '#222' : colorPalette.dark,
                    }
                  ]}
                  onPress={() => handleModulePress(mod.key)}
                >
                  <View style={styles.cardHeader}>
                    <MaterialIcons name={mod.icon as any} size={24} color={mod.color} />
                    <ThemedText type="subtitle" style={[styles.cardTitle, { color: textColor }]}>
                      {mod.title}
                    </ThemedText>
                  </View>
                  <Image source={mod.image} style={styles.cardImage} resizeMode="cover" />
                  <ThemedText style={[styles.cardDescription, { color: subtitleColor }]}>
                    {mod.description}
                  </ThemedText>
                  <View style={styles.cardFooter}>
                    <ThemedText type="default" style={[styles.cardStats, { color: iconColor }]}>
                      {mod.stats}
                    </ThemedText>
                    <MaterialIcons name="arrow-forward" size={20} color={iconColor} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
   statBreakdown: {
    fontSize: 12,
    marginTop: 8,
  },

  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardGrid: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderTopWidth: 4,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStats: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  searchResultsContainer: {
    marginBottom: 24,
  },
  searchResultsList: {
    gap: 12,
  },
  searchResultItem: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    position: 'relative',
  },
  searchResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  searchResultCategory: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchResultDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  searchResultArrow: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  noResultsContainer: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});