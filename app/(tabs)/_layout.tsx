// ========================================
// MAIN TAB LAYOUT - DEFAULT TAB NAVIGATION
// ========================================
// Ang file na ito ay naghahandle ng main tab navigation
// May 2 basic tabs: Home at Explore
// Ginagamit ang default Expo template styling

// Import ng React Native components at custom components
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// ========================================
// MAIN TAB LAYOUT COMPONENT
// ========================================
// Main component na naghahandle ng basic tab navigation
// Ginagamit ang default Expo template configuration
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        // ========================================
        // TAB BAR STYLING
        // ========================================
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint, // Color ng active tab
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault, // Color ng inactive tab
        headerShown: false, // Hide header sa lahat ng tabs
        tabBarLabelStyle: {
          fontSize: 12, // Font size ng tab labels
          fontWeight: '600', // Font weight ng tab labels
        },
        tabBarItemStyle: {
          paddingVertical: 6, // Vertical padding ng tab items
        },
        tabBarButton: HapticTab, // Custom haptic feedback button
        tabBarBackground: TabBarBackground, // Custom tab bar background
        tabBarStyle: Platform.select({
          // ========================================
          // PLATFORM-SPECIFIC STYLING
          // ========================================
          ios: {
            // iOS-specific styling - transparent background para sa blur effect
            position: 'absolute',
            borderTopWidth: 0,
            height: 64,
          },
          default: {
            // Android/default styling
            borderTopWidth: 0,
            elevation: 8, // Shadow elevation para sa Android
            height: 64,
          },
        }),
      }}>
      {/* ========================================
          HOME TAB
          ======================================== */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      
      {/* ========================================
          EXPLORE TAB
          ======================================== */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
