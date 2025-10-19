import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import {
  getSafeAreaDimensions,
  isLandscape,
  isSmallScreen,
  isTablet,
  normalize,
  responsiveValues
} from '../../utils/responsiveUtils';

// Get responsive dimensions
const { width, height } = Dimensions.get('window');
const safeArea = getSafeAreaDimensions();
const onboardingData = [
  {
    id: 1,
    title: 'Welcome to Gereu Online Hub',
    description: 'Your one-stop mobile platform for apartment rentals, laundry services, and car and motor parts assistance — all within the Gereu Building.',
    image: require('../../../assets/images/onboarding1.png'),
  },
  {

    id: 2,
    title: 'Everything in One Place',
    description: 'Access available apartment units, laundry options, and car and motor parts services with real-time updates and transparent pricing — all from your phone.',
    image: require('../../../assets/images/onboarding2.png'),
  },
  {
    id: 3,
    title: 'Stay Informed, Stay Connected',
    description: 'Get notified when your laundry is ready, book apartments, or connect with car and motor parts service providers. All without waiting in line.',
    image: require('../../../assets/images/onboarding3.png'),
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [orientation, setOrientation] = useState(isLandscape());
  const scrollViewRef = useRef<ScrollView>(null);
  const colors = Colors.light;
  const autoSlideTimer = useRef<number | null>(null);
  const resumeTimer = useRef<number | null>(null);

  // Handle orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setOrientation(window.width > window.height);
    });
    return () => subscription?.remove();
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    const startAutoSlide = () => {
      autoSlideTimer.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= onboardingData.length) {
            return 0; // Loop back to first slide
          }
          return nextIndex;
        });
      }, 3000); // Auto-slide every 3 seconds
    };

    const stopAutoSlide = () => {
      if (autoSlideTimer.current) {
        clearInterval(autoSlideTimer.current);
        autoSlideTimer.current = null;
      }
    };

    startAutoSlide();

    // Cleanup timer on component unmount
    return () => {
      stopAutoSlide();
      if (resumeTimer.current) {
        clearTimeout(resumeTimer.current);
        resumeTimer.current = null;
      }
    };
  }, []);

  // Update scroll position when currentIndex changes
  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      x: currentIndex * width,
      animated: true,
    });
  }, [currentIndex]);

  const handleNext = () => {
    // Pause auto-swipe when user manually navigates
    pauseAutoSlide();
    
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
    }
    
    // Schedule auto-swipe to resume after 5 seconds
    scheduleResumeAutoSlide();
  };

  const pauseAutoSlide = () => {
    if (autoSlideTimer.current) {
      clearInterval(autoSlideTimer.current);
      autoSlideTimer.current = null;
    }
    // Clear any existing resume timer
    if (resumeTimer.current) {
      clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  };

  const resumeAutoSlide = () => {
    if (!autoSlideTimer.current) {
      autoSlideTimer.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= onboardingData.length) {
            return 0; // Loop back to first slide
          }
          return nextIndex;
        });
      }, 3000);
    }
  };

  const scheduleResumeAutoSlide = () => {
    // Clear any existing resume timer
    if (resumeTimer.current) {
      clearTimeout(resumeTimer.current);
    }
    // Schedule auto-swipe to resume after 5 seconds of inactivity
    resumeTimer.current = setTimeout(() => {
      resumeAutoSlide();
    }, 5000);
  };

  const handleSkip = () => {
    router.push('/signin');
  };

  const handleGetStarted = () => {
    // Pause auto-swipe when user gets started
    pauseAutoSlide();
    router.push('/signin');
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {onboardingData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentIndex ? '#00B2FF' : '#7FE6FF',
              opacity: index === currentIndex ? 1 : 0.3,
            },
          ]}
        />
      ))}
    </View>
  );

  const getResponsiveStyles = () => {
    const contentContainerStyle = {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: isTablet ? normalize(60) : normalize(40),
      paddingTop: isSmallScreen ? normalize(40) : normalize(60),
      paddingBottom: isSmallScreen ? normalize(20) : normalize(40),
      ...(orientation && {
        flexDirection: 'row' as const,
        paddingHorizontal: normalize(40),
        paddingVertical: normalize(20),
      }),
    };

    const illustrationStyle = {
      width: isTablet ? normalize(280) : isSmallScreen ? normalize(180) : normalize(220),
      height: isTablet ? normalize(280) : isSmallScreen ? normalize(180) : normalize(220),
      marginBottom: isSmallScreen ? normalize(20) : normalize(32),
      ...(orientation && {
        width: normalize(200),
        height: normalize(200),
        marginBottom: 0,
        marginRight: normalize(20),
      }),
    };

    const textContainerStyle = {
      alignItems: 'center' as const,
      maxWidth: isTablet ? normalize(500) : normalize(320),
      paddingHorizontal: normalize(10),
      ...(orientation && {
        flex: 1,
        maxWidth: undefined,
        alignItems: 'flex-start' as const,
        justifyContent: 'center' as const,
      }),
    };

    const titleStyle = {
      fontSize: isTablet ? responsiveValues.typography.h1 : isSmallScreen ? responsiveValues.typography.h3 : responsiveValues.typography.h2,
      fontWeight: 'bold' as const,
      textAlign: 'center' as const,
      marginBottom: isSmallScreen ? normalize(15) : normalize(20),
      lineHeight: isTablet ? normalize(40) : isSmallScreen ? normalize(30) : normalize(36),
      color: 'white',
      textShadowColor: 'rgba(0,0,0,0.15)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
      ...(orientation && {
        textAlign: 'left' as const,
        fontSize: responsiveValues.typography.h2,
        lineHeight: normalize(32),
      }),
    };

    const descriptionStyle = {
      fontSize: isTablet ? responsiveValues.typography.body : isSmallScreen ? responsiveValues.typography.caption : responsiveValues.typography.body,
      textAlign: 'center' as const,
      lineHeight: isTablet ? normalize(28) : isSmallScreen ? normalize(20) : normalize(24),
      opacity: 0.9,
      color: 'white',
      textShadowColor: 'rgba(0,0,0,0.10)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
      ...(orientation && {
        textAlign: 'left' as const,
        fontSize: responsiveValues.typography.body,
        lineHeight: normalize(22),
      }),
    };

    const bottomContainerStyle = {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: Platform.OS === 'ios' ? (isSmallScreen ? normalize(30) : normalize(50)) : normalize(30),
      paddingHorizontal: normalize(20),
      ...(orientation && {
        paddingBottom: normalize(20),
        paddingHorizontal: normalize(40),
      }),
    };

    const dotsContainerStyle = {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      marginBottom: isSmallScreen ? normalize(20) : normalize(30),
      ...(orientation && {
        marginBottom: normalize(15),
      }),
    };

    return StyleSheet.create({
      container: { 
        flex: 1,
      },
      skipButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? (isSmallScreen ? normalize(40) : normalize(60)) : normalize(20),
        right: normalize(20),
        zIndex: 10,
        padding: normalize(10),
      },
      skipText: {
        fontSize: responsiveValues.typography.h6,
        fontWeight: '600',
      },
      scrollView: { 
        flex: 1,
      },
      slide: { 
        width, 
        height,
      },
      gradientBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      contentContainer: contentContainerStyle,
      illustration: illustrationStyle,
      textContainer: textContainerStyle,
      title: titleStyle,
      description: descriptionStyle,
      bottomContainer: bottomContainerStyle,
      dotsContainer: dotsContainerStyle,
      dot: {
        width: normalize(8),
        height: normalize(8),
        borderRadius: normalize(4),
        marginHorizontal: normalize(4),
      },
      buttonContainer: { 
        alignItems: 'center',
      },
      nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: isTablet ? normalize(40) : normalize(30),
        paddingVertical: isTablet ? normalize(18) : normalize(15),
        borderRadius: normalize(25),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        minWidth: normalize(120),
      },
      nextButtonText: {
        color: 'white',
        fontSize: isTablet ? responsiveValues.typography.h6 : responsiveValues.typography.body,
        fontWeight: '600',
        textAlign: 'center',
      },
      getStartedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: isTablet ? normalize(50) : normalize(40),
        paddingVertical: isTablet ? normalize(20) : normalize(18),
        borderRadius: normalize(30),
        minWidth: normalize(150),
      },
      getStartedButtonText: {
        color: '#007BE5',
        fontSize: isTablet ? responsiveValues.typography.h5 : responsiveValues.typography.h6,
        fontWeight: 'bold',
        marginRight: normalize(8),
      },
    });
  };

  const styles = getResponsiveStyles();

  const renderOnboardingItem = (
    item: { id: number; title: string; description: string; image: any },
    index: number
  ) => (
    <View key={item.id} style={styles.slide}>
      <LinearGradient
        colors={[
          '#C3F5FF', '#7FE6FF', '#4AD0FF', '#00B2FF',
          '#007BE5', '#0051C1', '#002F87', '#001A5C',
        ]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.contentContainer}>
          <Image source={item.image} style={styles.illustration} resizeMode="contain" />
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00B2FF" translucent />
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: 'white' }]}>Skip</Text>
      </TouchableOpacity>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        onTouchStart={pauseAutoSlide}
        onTouchEnd={scheduleResumeAutoSlide}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => renderOnboardingItem(item, index))}
      </ScrollView>
      <View style={styles.bottomContainer}>
        {renderDots()}
        <View style={styles.buttonContainer}>
          {currentIndex < onboardingData.length - 1 ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
              <Text style={styles.getStartedButtonText}>Get Started</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

