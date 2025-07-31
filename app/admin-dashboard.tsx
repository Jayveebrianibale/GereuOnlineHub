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

const modules = [
  {
    key: 'apartment',
    title: 'Apartment Rentals',
    image: require('@/assets/images/onboarding1.png'),
    description: 'Manage room listings, availability, and reservations',
    stats: '24 Active Listings',
    icon: 'apartment',
    color: colorPalette.primaryDark,
  },
  {
    key: 'laundry',
    title: 'Laundry Services',
    image: require('@/assets/images/onboarding2.png'),
    description: 'Track orders and manage laundry status',
    stats: '18 In Progress',
    icon: 'local-laundry-service',
    color: colorPalette.primary,
  },
  {
    key: 'car',
    title: 'Auto Services',
    image: require('@/assets/images/onboarding3.png'),
    description: 'Manage car parts and service requests',
    stats: '7 Bookings Today',
    icon: 'directions-car',
    color: colorPalette.dark,
  },
];

const quickActions = [
  { name: 'Add New', icon: 'add-circle-outline', screen: 'AddListing' },
  { name: 'Analytics', icon: 'analytics', screen: 'Analytics' },
  { name: 'Users', icon: 'people-outline', screen: 'Users' },
  { name: 'Notifications', icon: 'notifications-none', screen: 'Notifications' },
];

export default function AdminDashboard() {
  return (
    <ThemedView style={[styles.container, { backgroundColor: '#fff' }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={[styles.headerTitle, { color: colorPalette.darkest }]}>
              Dashboard
            </ThemedText>
            <ThemedText type="default" style={[styles.headerSubtitle, { color: colorPalette.dark }]}>
              Welcome back, Admin
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <MaterialIcons name="account-circle" size={32} color={colorPalette.dark} />
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#fff' }]}>
            <ThemedText type="default" style={[styles.statLabel, { color: colorPalette.darkest }]}>
              Total Services
            </ThemedText>
            <ThemedText type="title" style={[styles.statValue, { color: colorPalette.darker }]}>
              49
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fff' }]}>
            <ThemedText type="default" style={[styles.statLabel, { color: colorPalette.darkest }]}>
              Active Bookings
            </ThemedText>
            <ThemedText type="title" style={[styles.statValue, { color: colorPalette.darker }]}>
              32
            </ThemedText>
          </View>
        </View>

        {/* Quick Actions */}
        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colorPalette.darker }]}>
          Quick Actions
        </ThemedText>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.quickAction, 
                { 
                  backgroundColor: '#fff',
                }
              ]}
            >
              <MaterialIcons name={action.icon} size={24} color={colorPalette.darkest} />
              <ThemedText type="default" style={[styles.quickActionText, { color: colorPalette.darkest }]}>
                {action.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Services */}
        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colorPalette.darker }]}>
          Manage Services
        </ThemedText>
        <View style={styles.cardGrid}>
          {modules.map((mod) => (
            <TouchableOpacity 
              key={mod.key} 
              style={[
                styles.card, 
                { 
                  backgroundColor: '#ffffff',
                  borderTopColor: mod.color,
                  shadowColor: colorPalette.dark,
                }
              ]}
            >
              <View style={styles.cardHeader}>
                <MaterialIcons name={mod.icon} size={24} color={mod.color} />
                <ThemedText type="subtitle" style={[styles.cardTitle, { color: colorPalette.darker }]}>
                  {mod.title}
                </ThemedText>
              </View>
              <Image source={mod.image} style={styles.cardImage} resizeMode="cover" />
              <ThemedText style={[styles.cardDescription, { color: colorPalette.dark }]}>
                {mod.description}
              </ThemedText>
              <View style={styles.cardFooter}>
                <ThemedText type="default" style={[styles.cardStats, { color: colorPalette.primaryDark }]}>
                  {mod.stats}
                </ThemedText>
                <MaterialIcons name="arrow-forward" size={20} color={colorPalette.dark} />
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
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
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