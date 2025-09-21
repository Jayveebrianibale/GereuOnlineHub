import { useColorScheme } from '@/components/ColorSchemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { onValue, orderByChild, query, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';

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

export default function AdminTabLayout() {
  const { colorScheme } = useColorScheme();
  const { user } = useAuthContext();
  const isDark = colorScheme === 'dark';
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for unread messages
  useEffect(() => {
    if (!user?.email) return;

    const messagesRef = query(ref(db, "messages"), orderByChild("timestamp"));
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Count unread messages where admin is the recipient
        const unreadMessages = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter((msg: any) => {
            // Only count messages where admin is recipient (receiving messages)
            const isAdminRecipient = msg.recipientEmail === user.email;
            const isDeletedForAdmin = (msg.deletedFor || []).includes(user.email);
            
            // Check if admin has read this message
            const readBy = msg.readBy || [];
            const isReadByAdmin = readBy.includes(user.email);
            
            const isUnread = isAdminRecipient && !isDeletedForAdmin && !isReadByAdmin;
            
            // Debug logging
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

  // Custom icon component with badge
  const MessagesIcon = ({ color, size }: { color: string; size: number }) => (
    <View style={styles.iconContainer}>
      <MaterialIcons name="message" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: '#FF4444' }]}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? colorPalette.primaryLight : colorPalette.primary,
        tabBarInactiveTintColor: isDark ? colorPalette.lightest : colorPalette.dark,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#000' : '#fff',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#222' : '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="dashboard" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Reservations',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="people" size={size} color={color} />,
        }}
      />
       <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessagesIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="settings" size={size} color={color} />,
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
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
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
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});