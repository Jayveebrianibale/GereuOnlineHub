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

// Responsive dimensions
const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallDevice = height < 700;
const isLargeDevice = height > 900;

// Responsive scaling functions
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
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
  const scrollViewRef = useRef<ScrollView>(null);
  const colors = Colors.light;
  const autoSlideTimer = useRef<NodeJS.Timeout | null>(null);

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
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
    }
  };

  const pauseAutoSlide = () => {
    if (autoSlideTimer.current) {
      clearInterval(autoSlideTimer.current);
      autoSlideTimer.current = null;
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

  const handleSkip = () => {
    router.push('/signin');
  };

  const handleGetStarted = () => {
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
        onTouchEnd={resumeAutoSlide}
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

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? (isSmallDevice ? 40 : 60) : 20,
    right: scale(20),
    zIndex: 10,
    padding: scale(10),
  },
  skipText: {
    fontSize: moderateScale(16),
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isTablet ? scale(60) : scale(40),
    paddingTop: isSmallDevice ? scale(40) : scale(60),
    paddingBottom: isSmallDevice ? scale(20) : scale(40),
  },
  illustration: {
    width: isTablet ? scale(280) : isSmallDevice ? scale(180) : scale(220),
    height: isTablet ? scale(280) : isSmallDevice ? scale(180) : scale(220),
    marginBottom: isSmallDevice ? scale(20) : scale(32),
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: isTablet ? scale(500) : scale(320),
    paddingHorizontal: scale(10),
  },
  title: {
    fontSize: isTablet ? moderateScale(32) : isSmallDevice ? moderateScale(24) : moderateScale(28),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: isSmallDevice ? scale(15) : scale(20),
    lineHeight: isTablet ? moderateScale(40) : isSmallDevice ? moderateScale(30) : moderateScale(36),
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  description: {
    fontSize: isTablet ? moderateScale(18) : isSmallDevice ? moderateScale(14) : moderateScale(16),
    textAlign: 'center',
    lineHeight: isTablet ? moderateScale(28) : isSmallDevice ? moderateScale(20) : moderateScale(24),
    opacity: 0.9,
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.10)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? (isSmallDevice ? scale(30) : scale(50)) : scale(30),
    paddingHorizontal: scale(20),
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: isSmallDevice ? scale(20) : scale(30),
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginHorizontal: scale(4),
  },
  buttonContainer: { 
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: isTablet ? scale(40) : scale(30),
    paddingVertical: isTablet ? scale(18) : scale(15),
    borderRadius: scale(25),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: scale(120),
  },
  nextButtonText: {
    color: 'white',
    fontSize: isTablet ? moderateScale(18) : moderateScale(16),
    fontWeight: '600',
    marginRight: scale(8),
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: isTablet ? scale(50) : scale(40),
    paddingVertical: isTablet ? scale(20) : scale(18),
    borderRadius: scale(30),
    minWidth: scale(150),
  },
  getStartedButtonText: {
    color: '#007BE5',
    fontSize: isTablet ? moderateScale(20) : moderateScale(18),
    fontWeight: 'bold',
    marginRight: scale(8),
  },
});
