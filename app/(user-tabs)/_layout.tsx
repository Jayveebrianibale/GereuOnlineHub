import { useColorScheme } from '@/components/ColorSchemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useMessageContext } from '../contexts/MessageContext';
import { isSmallScreen, isTablet, responsiveValues } from '../utils/responsiveUtils';

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

export default function UserTabLayout() {
  const { colorScheme } = useColorScheme();
  const { unreadCount } = useMessageContext();
  const isDark = colorScheme === 'dark';

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
          height: responsiveValues.tabBar.height,
          paddingBottom: responsiveValues.tabBar.paddingVertical,
          paddingTop: responsiveValues.tabBar.paddingVertical,
          paddingHorizontal: responsiveValues.tabBar.paddingHorizontal,
        },
        tabBarLabelStyle: {
          fontSize: responsiveValues.tabBar.fontSize,
          fontWeight: '500',
          marginTop: isSmallScreen ? 2 : isTablet ? 4 : 3,
        },
        tabBarIconStyle: {
          marginTop: isSmallScreen ? 2 : isTablet ? 4 : 3,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={responsiveValues.tabBar.iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Reservations',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt" size={responsiveValues.tabBar.iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
          name="messages"
          options={{  
              headerShown: false,
              title: 'Messages',
              tabBarIcon: ({ color, size }) => (
                <View style={styles.iconContainer}>
                  <MaterialIcons name="message" size={responsiveValues.tabBar.iconSize} color={color} />
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