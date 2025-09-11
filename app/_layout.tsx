import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

// ✅ Import your custom color scheme provider
import { ColorSchemeProvider, useColorScheme } from '../components/ColorSchemeContext';
import FCMRegistrar from './components/FCMRegistrar';
import PushRegistrar from './components/PushRegistrar';
import { ToastProvider } from './components/Toast';
import { AdminReservationProvider } from './contexts/AdminReservationContext';
import { AuthProvider } from './contexts/AuthContext';
import { ReservationProvider } from './contexts/ReservationContext';

function AppContent() {
  const { colorScheme } = useColorScheme();
  
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="signin" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="admin-navigation" options={{ headerShown: false }} />
        <Stack.Screen name="test-admin" options={{ headerShown: false }} />
        <Stack.Screen name="debug-tabs" options={{ headerShown: false }} />
        <Stack.Screen name="user-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="(user-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="apartment-list" options={{ headerShown: false }} />
        <Stack.Screen name="laundry-list" options={{ headerShown: false }} />
        <Stack.Screen name="auto-list" options={{ headerShown: false }} />
        <Stack.Screen name="reservation-details/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="admin-apartment" options={{ headerShown: false }} />
        <Stack.Screen name="admin-laundry" options={{ headerShown: false }} />
        <Stack.Screen name="admin-auto" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ReservationProvider>
        <AdminReservationProvider>
          <ColorSchemeProvider>
            <ToastProvider>
              <AppContent />
              <PushRegistrar />
              <FCMRegistrar />
            </ToastProvider>
          </ColorSchemeProvider>
        </AdminReservationProvider>
      </ReservationProvider>
    </AuthProvider>
  );
}
