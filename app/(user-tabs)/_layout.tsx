// ========================================
// USER TAB LAYOUT - BOTTOM TAB NAVIGATION
// ========================================
// Ang file na ito ay naghahandle ng bottom tab navigation para sa user
// May 4 main tabs: Home, Reservations, Messages, Profile
// Responsive design na nag-a-adapt sa different screen sizes

// Import ng React Native components at custom hooks
import { useColorScheme } from '@/components/ColorSchemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useMessageContext } from '../contexts/MessageContext';
import { isSmallScreen, isTablet, responsiveValues } from '../utils/responsiveUtils';

// ========================================
// COLOR PALETTE CONFIGURATION
// ========================================
// Defines the app's color scheme for consistent theming
// Used throughout the tab navigation for active/inactive states
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

// ========================================
// USER TAB LAYOUT COMPONENT
// ========================================
// Main component na naghahandle ng bottom tab navigation
// May 4 main tabs na accessible sa user
export default function UserTabLayout() {
  // ========================================
  // HOOKS AT STATE
  // ========================================
  const { colorScheme } = useColorScheme(); // Theme management
  const { unreadCount } = useMessageContext(); // Unread message count para sa badge
  const isDark = colorScheme === 'dark'; // Check kung dark mode

  return (
    <Tabs
      screenOptions={{
        // ========================================
        // TAB BAR STYLING
        // ========================================
        tabBarActiveTintColor: isDark ? colorPalette.primaryLight : colorPalette.primary, // Color ng active tab
        tabBarInactiveTintColor: isDark ? colorPalette.lightest : colorPalette.dark, // Color ng inactive tab
        headerShown: false, // Hide header sa lahat ng tabs
        tabBarStyle: {
          backgroundColor: isDark ? '#000' : '#fff', // Background color ng tab bar
          borderTopWidth: 1, // Top border
          borderTopColor: isDark ? '#222' : '#e5e7eb', // Border color
          height: responsiveValues.tabBar.height, // Responsive height
          paddingBottom: responsiveValues.tabBar.paddingVertical, // Bottom padding
          paddingTop: responsiveValues.tabBar.paddingVertical, // Top padding
          paddingHorizontal: responsiveValues.tabBar.paddingHorizontal, // Horizontal padding
        },
        tabBarLabelStyle: {
          fontSize: responsiveValues.tabBar.fontSize, // Responsive font size
          fontWeight: '500', // Font weight
          marginTop: isSmallScreen ? 2 : isTablet ? 4 : 3, // Responsive margin
        },
        tabBarIconStyle: {
          marginTop: isSmallScreen ? 2 : isTablet ? 4 : 3, // Responsive icon margin
        },
      }}>
      {/* ========================================
          HOME TAB
          ======================================== */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={responsiveValues.tabBar.iconSize} color={color} />,
        }}
      />
      
      {/* ========================================
          RESERVATIONS TAB
          ======================================== */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Reservations',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt" size={responsiveValues.tabBar.iconSize} color={color} />,
        }}
      />
      
      {/* ========================================
          MESSAGES TAB (WITH BADGE)
          ======================================== */}
      <Tabs.Screen
          name="messages"
          options={{  
              headerShown: false,
              title: 'Messages',
              tabBarIcon: ({ color, size }) => (
                <View style={styles.iconContainer}>
                  <MaterialIcons name="message" size={responsiveValues.tabBar.iconSize} color={color} />
                  {/* I-show ang unread count badge kung may unread messages */}
                  {unreadCount > 0 && (
                    <View style={[styles.badge, { backgroundColor: '#FF4444' }]}>
                      <Text style={[styles.badgeText, { fontSize: responsiveValues.tabBar.badgeFontSize }]}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              ),
            }}
            />
      
      {/* ========================================
          PROFILE TAB
          ======================================== */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={responsiveValues.tabBar.iconSize} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: responsiveValues.tabBar.iconSize + 8,
    height: responsiveValues.tabBar.iconSize + 8,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    borderRadius: responsiveValues.tabBar.badgeSize / 2,
    minWidth: responsiveValues.tabBar.badgeSize,
    height: responsiveValues.tabBar.badgeSize,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: responsiveValues.tabBar.badgeFontSize,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 