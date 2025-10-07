// ========================================
// ADMIN TAB LAYOUT - ADMIN PANEL NAVIGATION
// ========================================
// Ang file na ito ay naghahandle ng admin tab navigation
// May 5 main tabs: Home, Reservations, Users, Messages, Settings
// May real-time badge notifications para sa unread messages at pending reservations
// Responsive design na nag-a-adapt sa different screen sizes

// Import ng React Native components at Firebase
import { useColorScheme } from '@/components/ColorSchemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { onValue, orderByChild, query, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { isSmallScreen, isTablet, responsiveValues } from '../utils/responsiveUtils';

// ========================================
// COLOR PALETTE CONFIGURATION
// ========================================
// Defines the app's color scheme for consistent theming
// Used throughout the admin tab navigation for active/inactive states
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
// ADMIN TAB LAYOUT COMPONENT
// ========================================
// Main component na naghahandle ng admin tab navigation
// May real-time badge notifications para sa unread messages at pending reservations
export default function AdminTabLayout() {
  // ========================================
  // HOOKS AT STATE
  // ========================================
  const { colorScheme } = useColorScheme(); // Theme management
  const { user } = useAuthContext(); // Current authenticated user
  const isDark = colorScheme === 'dark'; // Check kung dark mode
  const [unreadCount, setUnreadCount] = useState(0); // Count ng unread messages
  const [pendingReservationCount, setPendingReservationCount] = useState(0); // Count ng pending reservations

  // ========================================
  // USEEFFECT: LISTEN FOR UNREAD MESSAGES
  // ========================================
  // Real-time listener para sa unread messages
  // I-update ang badge count kapag may bagong unread messages
  useEffect(() => {
    if (!user?.email) return;

    const messagesRef = query(ref(db, "messages"), orderByChild("timestamp"));
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // I-count ang unread messages kung saan ang admin ay recipient
        const unreadMessages = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter((msg: any) => {
            // I-count lang ang messages kung saan ang admin ay recipient (receiving messages)
            const isAdminRecipient = msg.recipientEmail === user.email;
            const isDeletedForAdmin = (msg.deletedFor || []).includes(user.email);
            
            // I-check kung nabasa na ng admin ang message na ito
            const readBy = msg.readBy || [];
            const isReadByAdmin = readBy.includes(user.email);
            
            const isUnread = isAdminRecipient && !isDeletedForAdmin && !isReadByAdmin;
            
            // Debug logging para sa troubleshooting
            if (isAdminRecipient) {
              console.log('Badge Debug - Message:', {
                id: msg.id,
                text: msg.text,
                recipientEmail: msg.recipientEmail,
                adminEmail: user.email,
                isAdminRecipient,
                isDeletedForAdmin,
                readBy,
                isReadByAdmin,
                isUnread
              });
            }
            
            return isUnread;
          });

        console.log('Badge Debug - Total unread messages:', unreadMessages.length);
        setUnreadCount(unreadMessages.length);
      } else {
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, [user?.email]);

  // ========================================
  // USEEFFECT: LISTEN FOR PENDING RESERVATIONS
  // ========================================
  // Real-time listener para sa pending reservations
  // I-update ang badge count kapag may bagong pending reservations
  useEffect(() => {
    if (!user?.email) return;

    const reservationsRef = query(ref(db, "adminReservations"), orderByChild("status"));
    
    const unsubscribe = onValue(reservationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // I-count ang pending reservations
        const pendingReservations = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter((reservation: any) => {
            return reservation.status === 'pending';
          });

        console.log('Badge Debug - Total pending reservations:', pendingReservations.length);
        setPendingReservationCount(pendingReservations.length);
      } else {
        setPendingReservationCount(0);
      }
    });

    return () => unsubscribe();
  }, [user?.email]);

  // ========================================
  // CUSTOM ICON COMPONENTS WITH BADGES
  // ========================================
  // Custom icon components na may badge notifications
  // I-display ang unread count sa tab icons

  // Custom messages icon component na may unread count badge
  const MessagesIcon = ({ color, size }: { color: string; size: number }) => (
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
  );

  // Custom reservations icon component na may pending count badge
  const ReservationsIcon = ({ color, size }: { color: string; size: number }) => (
    <View style={styles.iconContainer}>
      <MaterialIcons name="receipt" size={responsiveValues.tabBar.iconSize} color={color} />
      {/* I-show ang pending count badge kung may pending reservations */}
      {pendingReservationCount > 0 && (
        <View style={[styles.badge, { backgroundColor: '#F59E0B' }]}>
          <Text style={[styles.badgeText, { fontSize: responsiveValues.tabBar.badgeFontSize }]}>
            {pendingReservationCount > 99 ? '99+' : pendingReservationCount}
          </Text>
        </View>
      )}
    </View>
  );

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
          HOME TAB (DASHBOARD)
          ======================================== */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="dashboard" size={responsiveValues.tabBar.iconSize} color={color} />,
        }}
      />
      
      {/* ========================================
          RESERVATIONS TAB (WITH BADGE)
          ======================================== */}
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Reservations',
          tabBarIcon: ({ color, size }) => <ReservationsIcon color={color} size={size} />,
        }}
      />
      
      {/* ========================================
          USERS TAB
          ======================================== */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="people" size={responsiveValues.tabBar.iconSize} color={color} />,
        }}
      />
      
      {/* ========================================
          MESSAGES TAB (WITH BADGE)
          ======================================== */}
       <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessagesIcon color={color} size={size} />,
        }}
      />
      
      {/* ========================================
          LOGS TAB
          ======================================== */}
      <Tabs.Screen
        name="logs"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="history" size={responsiveValues.tabBar.iconSize} color={color} />,
        }}
      />
      
      {/* ========================================
          SETTINGS TAB
          ======================================== */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="settings" size={responsiveValues.tabBar.iconSize} color={color} />,
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
    minWidth: responsiveValues.tabBar.badgeSize,
    height: responsiveValues.tabBar.badgeSize,
    borderRadius: responsiveValues.tabBar.badgeSize / 2,
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
    fontWeight: '700',
    textAlign: 'center',
  },
});