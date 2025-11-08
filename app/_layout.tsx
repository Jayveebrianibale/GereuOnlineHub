// ========================================
// ROOT LAYOUT - MAIN APP ENTRY POINT
// ========================================
// Ang file na ito ay ang main entry point ng buong app
// Nagpo-provide ng global providers at navigation setup
// Dito naka-configure ang lahat ng context providers at screen routes

// Import ng React Navigation at Expo components
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

// ========================================
// CUSTOM PROVIDERS AT COMPONENTS
// ========================================
// Import ng custom providers at components na ginagamit sa buong app
import { ColorSchemeProvider, useColorScheme } from '../components/ColorSchemeContext';
import PushRegistrar from './components/PushRegistrar';
import { RouteTracker } from './components/RouteTracker';
import { ToastProvider } from './components/Toast';
import { AdminReservationProvider } from './contexts/AdminReservationContext';
import { AuthProvider } from './contexts/AuthContext';
import { MessageProvider } from './contexts/MessageContext';
import { ReservationProvider } from './contexts/ReservationContext';
import { SessionProvider } from './contexts/SessionContext';
import { useUserHeartbeat } from './hooks/useUserHeartbeat';

// ========================================
// APP CONTENT COMPONENT
// ========================================
// Ang component na ito ay naghahandle ng main app content
// Dito naka-configure ang lahat ng screen routes at navigation
function AppContent() {
  const { colorScheme } = useColorScheme();
  
  // I-initialize ang user heartbeat para sa real-time status tracking
  useUserHeartbeat();

  // Update status bar color - light blue background with light icons
  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    StatusBar.setBackgroundColor('#00B2FF', true);
  }, [colorScheme]);
  
  return (
    <ThemeProvider value={DefaultTheme}>
      <RouteTracker />
      <Stack>
        {/* ========================================
            MAIN SCREENS - AUTHENTICATION
            ======================================== */}
        <Stack.Screen name="index" options={{ headerShown: false }} /> {/* Landing page */}
        <Stack.Screen name="onboarding" options={{ headerShown: false }} /> {/* Onboarding flow */}
        <Stack.Screen name="signin" options={{ headerShown: false }} /> {/* Sign in screen */}
        <Stack.Screen name="signup" options={{ headerShown: false }} /> {/* Sign up screen */}
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} /> {/* Forgot password */}
        
        {/* ========================================
            TAB NAVIGATION SCREENS
            ======================================== */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> {/* Main user tabs */}
        <Stack.Screen name="(user-tabs)" options={{ headerShown: false }} /> {/* User-specific tabs */}
        <Stack.Screen name="(admin-tabs)" options={{ headerShown: false }} /> {/* Admin tabs */}
        
        {/* ========================================
            DASHBOARD SCREENS
            ======================================== */}
        <Stack.Screen name="user-dashboard" options={{ headerShown: false }} /> {/* User dashboard */}
        <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} /> {/* Admin dashboard */}
        <Stack.Screen name="admin-navigation" options={{ headerShown: false }} /> {/* Admin navigation */}
        
        {/* ========================================
            SERVICE LISTING SCREENS
            ======================================== */}
        <Stack.Screen name="apartment-list" options={{ headerShown: false }} /> {/* Apartment listings */}
        <Stack.Screen name="laundry-list" options={{ headerShown: false }} /> {/* Laundry services */}
        <Stack.Screen name="auto-list" options={{ headerShown: false }} /> {/* Auto services */}
        
        {/* ========================================
            ADMIN MANAGEMENT SCREENS
            ======================================== */}
        <Stack.Screen name="admin-apartment" options={{ headerShown: false }} /> {/* Admin apartment management */}
        <Stack.Screen name="admin-laundry" options={{ headerShown: false }} /> {/* Admin laundry management */}
        <Stack.Screen name="admin-auto" options={{ headerShown: false }} /> {/* Admin auto management */}
        
        {/* ========================================
            NOTIFICATION SCREENS
            ======================================== */}
        <Stack.Screen name="notifications" options={{ headerShown: false }} /> {/* User notifications */}
        <Stack.Screen name="admin-notifications" options={{ headerShown: false }} /> {/* Admin notifications */}
        
        {/* ========================================
            CHAT SCREEN (MODAL)
            ======================================== */}
        <Stack.Screen name="chat/[id]" options={{ 
          headerShown: false, 
          presentation: 'modal', // Modal presentation para sa chat
          title: '',
          headerBackVisible: false,
          headerLeft: () => null,
          gestureEnabled: false // Disable swipe to close
        }} />
        
        {/* ========================================
            DETAIL SCREENS
            ======================================== */}
        <Stack.Screen name="reservation-details/[id]" options={{ headerShown: false }} /> {/* Reservation details */}
        
        {/* ========================================
            DEBUG/DEVELOPMENT SCREENS
            ======================================== */}
        <Stack.Screen name="test-admin" options={{ headerShown: false }} /> {/* Admin testing */}
        <Stack.Screen name="debug-tabs" options={{ headerShown: false }} /> {/* Debug tabs */}
        <Stack.Screen name="push-debugger" options={{ headerShown: false }} /> {/* Push notification debugger */}
        <Stack.Screen name="persistent-auth-test" options={{ headerShown: false }} /> {/* Persistent auth testing */}
        
        {/* ========================================
            ERROR SCREEN
            ======================================== */}
        <Stack.Screen name="+not-found" /> {/* 404 Not Found screen */}
      </Stack>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#00B2FF"
        translucent={false}
      />
    </ThemeProvider>
  );
}

// ========================================
// ROOT LAYOUT COMPONENT
// ========================================
// Ang main component na naghahandle ng app initialization
// Dito naka-configure ang lahat ng global providers
// Provider hierarchy: Auth > Message > Reservation > Admin > ColorScheme > Toast
export default function RootLayout() {
  // I-load ang custom fonts
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // I-hide ang native splash screen immediately - super saglit lang dapat
  useEffect(() => {
    // Hide agad ang native splash screen pagkatapos ng minimal initialization
    // Use requestAnimationFrame para mas mabilis
    requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors if splash screen is already hidden
      });
    });
  }, []);

  // I-show ang loading state habang naglo-load ang fonts
  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* ========================================
          PROVIDER HIERARCHY
          ========================================
          Ang order ng providers ay important:
          1. AuthProvider - Authentication state
          2. SessionProvider - Session management
          3. MessageProvider - Chat/messaging state  
          4. ReservationProvider - Reservation state
          5. AdminReservationProvider - Admin reservation management
          6. ColorSchemeProvider - Theme management
          7. ToastProvider - Toast notifications
      */}
      <AuthProvider>
        <SessionProvider>
          <MessageProvider>
            <ReservationProvider>
              <AdminReservationProvider>
                <ColorSchemeProvider>
                  <ToastProvider>
                    <AppContent />
                    <PushRegistrar />
                  </ToastProvider>
                </ColorSchemeProvider>
              </AdminReservationProvider>
            </ReservationProvider>
          </MessageProvider>
        </SessionProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
