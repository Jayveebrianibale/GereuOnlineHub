import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface ProfessionalSplashScreenProps {
  onFinish?: () => void;
}

export default function ProfessionalSplashScreen({ onFinish }: ProfessionalSplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide the default splash screen
    SplashScreen.hideAsync();

    // Start animations
    const animationSequence = Animated.sequence([
      // Logo entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Logo rotation animation
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start();

    // Auto finish after 2.5 seconds
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00B2FF" />
      
      <LinearGradient
        colors={['#00B2FF', '#007BE5', '#002F87']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Background Pattern */}
        <View style={styles.patternOverlay}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.logoWrapper,
                {
                  transform: [{ rotate: logoRotation }],
                },
              ]}
            >
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </Animated.View>
          </Animated.View>

          {/* App Name */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.appName}>Gereu Online Hub</Text>
            <Text style={styles.tagline}>Smart Services Platform</Text>
          </Animated.View>

           {/* Loading Indicator */}
           <Animated.View
             style={[
               styles.loadingContainer,
               {
                 opacity: fadeAnim,
               },
             ]}
           >
             <View style={styles.loadingBar}>
               <Animated.View
                 style={[
                   styles.loadingProgress,
                   {
                     transform: [
                       {
                         scaleX: fadeAnim.interpolate({
                           inputRange: [0, 1],
                           outputRange: [0, 1],
                         }),
                       },
                     ],
                   },
                 ]}
               />
             </View>
           </Animated.View>
        </View>

        {/* Version Info */}
        <Animated.View
          style={[
            styles.versionContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.versionText}>v1.0.0</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: 100,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    top: height * 0.3,
    right: 50,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    width: width * 0.6,
    alignItems: 'center',
  },
  loadingBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    transformOrigin: 'left',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
});
