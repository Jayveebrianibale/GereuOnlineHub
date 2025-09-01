import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { off, onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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

    // Cleanup listeners when component unmounts
    return () => {
      off(apartmentsRef, 'value', apartmentsListener);
      off(autoServicesRef, 'value', autoServicesListener);
      off(laundryServicesRef, 'value', laundryServicesListener);
    };
  }, []);

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
            <TouchableOpacity style={styles.profileButton}>
              <MaterialIcons name="notifications-none" size={32} color={iconColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <ThemedText type="default" style={[styles.statLabel, { color: subtitleColor }]}>
              Total Services
            </ThemedText>
            <ThemedText type="title" style={[styles.statValue, { color: textColor }]}>
              {totalServices}
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <ThemedText type="default" style={[styles.statLabel, { color: subtitleColor }]}>
              Active Reservations
            </ThemedText>
            <ThemedText type="title" style={[styles.statValue, { color: textColor }]}>
              {activeReservations}
            </ThemedText>
          </View>
        </View>

        {/* Main Services */}
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
  statLabel: {
    fontSize: 14,
    marginBottom: 8,
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
});