import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

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

// Sample user data
const userData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: require('@/assets/images/logo.png'), // Using logo as placeholder avatar
};

const profileMenuItems = [
  {
    id: '1',
    title: 'Personal Information',
    subtitle: 'Update your profile details',
    icon: 'person',
    action: 'edit',
  },
  {
    id: '2',
    title: 'Payment Methods',
    subtitle: 'Manage your payment options',
    icon: 'credit-card',
    action: 'view',
  },
  {
    id: '3',
    title: 'Notifications',
    subtitle: 'Configure notification settings',
    icon: 'notifications',
    action: 'settings',
  },
  {
    id: '4',
    title: 'Privacy & Security',
    subtitle: 'Manage your privacy settings',
    icon: 'security',
    action: 'settings',
  },
  {
    id: '5',
    title: 'Help & Support',
    subtitle: 'Get help and contact support',
    icon: 'help',
    action: 'support',
  },
  {
    id: '6',
    title: 'About',
    subtitle: 'App version and information',
    icon: 'info',
    action: 'info',
  },
];

export default function Profile() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

   const [userData, setUserData] = useState({
    name: "",
    email: "",
    avatar: null,
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserData({
          name: user.displayName || "No Name",
          email: user.email || "No Email",
          avatar: require('@/assets/images/logo.png'),
        });
      }
    });

    return unsubscribe; // cleanup
  }, []);
  
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';

  const handleLogout = () => {
    console.log('Logout button pressed');
    
    // Navigate back to signin screen
    console.log('Navigating to signin');
    try {
      router.replace('/signin' as any);
    } catch (error) {
      console.error('Navigation error:', error);
      router.push('/signin' as any);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.title, { color: textColor }]}>
            Profile
          </ThemedText>
          <ThemedText type="default" style={[styles.subtitle, { color: subtitleColor }]}>
            Manage your account settings
          </ThemedText>
        </View>

        {/* User Info Card */}
        <View style={[styles.userCard, { backgroundColor: cardBgColor, borderColor }]}>
          <View style={styles.userHeader}>
            <Image source={userData.avatar as any} style={styles.avatar} />
            <View style={styles.userInfo}>
              <ThemedText type="subtitle" style={[styles.userName, { color: textColor }]}>
                {userData.name}
              </ThemedText>
              <ThemedText style={[styles.userEmail, { color: subtitleColor }]}>
                {userData.email}
              </ThemedText>
             
            </View>
            <TouchableOpacity style={styles.editButton}>
              <MaterialIcons name="edit" size={20} color={colorPalette.primary} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Theme Toggle */}
        <View style={[styles.themeCard, { backgroundColor: cardBgColor, borderColor }]}>
          <View style={styles.themeHeader}>
            <MaterialIcons name="palette" size={20} color={colorPalette.primary} />
            <View style={styles.themeInfo}>
              <ThemedText type="subtitle" style={[styles.themeTitle, { color: textColor }]}>
                Dark Mode
              </ThemedText>
              <ThemedText style={[styles.themeSubtitle, { color: subtitleColor }]}>
                Switch between light and dark themes
              </ThemedText>
            </View>
            <TouchableOpacity 
              style={[styles.themeToggle, { backgroundColor: isDark ? colorPalette.primary : '#ccc' }]}
              onPress={toggleColorScheme}
            >
              <MaterialIcons 
                name={isDark ? 'light-mode' : 'dark-mode'} 
                size={16} 
                color={isDark ? '#fff' : '#666'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Menu */}
        <View style={styles.menuSection}>
          <ThemedText type="subtitle" style={[styles.menuTitle, { color: textColor }]}>
            Account Settings
          </ThemedText>
          
          {profileMenuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.menuItem, { backgroundColor: cardBgColor, borderColor }]}
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name={item.icon as any} size={20} color={colorPalette.primary} />
                <View style={styles.menuItemInfo}>
                  <ThemedText type="subtitle" style={[styles.menuItemTitle, { color: textColor }]}>
                    {item.title}
                  </ThemedText>
                  <ThemedText style={[styles.menuItemSubtitle, { color: subtitleColor }]}>
                    {item.subtitle}
                  </ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={subtitleColor} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: '#F44336' }]}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={20} color="#fff" />
          <ThemedText style={styles.logoutText}>Sign Out</ThemedText>
        </TouchableOpacity>
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
  userCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  userEmail: {
    fontSize: 14,
  },
  userPhone: {
    fontSize: 14,
  },
  editButton: {
    padding: 8,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',

  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 10,
  },
  themeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeSubtitle: {
    fontSize: 12,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuSection: {
    marginBottom: 24,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  menuItem: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 