// ========================================
// HOME SCREEN - MAIN LANDING PAGE
// ========================================
// Ang file na ito ay naghahandle ng main home screen
// Default Expo template home screen na may welcome message
// Ginagamit sa main tab navigation

// Import ng React Native components at custom components
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';

// ========================================
// HOME SCREEN COMPONENT
// ========================================
// Main component na naghahandle ng home screen
// May parallax scroll view at welcome message
export default function HomeScreen() {
  return (
    <SafeAreaView>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
        headerImage={
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.reactLogo}
            contentFit="contain"
          />
        }>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Welcome to Gereu Online Hub</ThemedText>
        </ThemedView>
        <HelloWave />
        <ThemedText>Explore the app to learn more about its features.</ThemedText>
      </ParallaxScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
