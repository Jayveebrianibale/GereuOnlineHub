import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from '../../../components/Toast';
import { Colors } from '../../../constants/Colors';
import { storeUserData } from '../../../utils/userUtils';
import { auth } from '../../firebaseConfig';

const { width, height } = Dimensions.get('window');

// Responsive dimensions
const isSmallScreen = height < 700;
const isMediumScreen = height >= 700 && height < 800;
const isLargeScreen = height >= 800;

// Responsive values
const responsiveValues = {
  headerHeight: isSmallScreen ? height * 0.35 : height * 0.45,
  logoSize: isSmallScreen ? 80 : isMediumScreen ? 90 : 108,
  logoInnerSize: isSmallScreen ? 80 : isMediumScreen ? 90 : 108,
  titleFontSize: isSmallScreen ? 28 : isMediumScreen ? 30 : 32,
  subtitleFontSize: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
  formPadding: isSmallScreen ? 20 : isMediumScreen ? 24 : 28,
  inputHeight: isSmallScreen ? 50 : isMediumScreen ? 55 : 60,
  buttonHeight: isSmallScreen ? 50 : isMediumScreen ? 55 : 60,
  marginHorizontal: isSmallScreen ? 16 : isMediumScreen ? 20 : 24,
  formTitleSize: isSmallScreen ? 20 : isMediumScreen ? 21 : 22,
  inputLabelSize: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
  buttonTextSize: isSmallScreen ? 16 : isMediumScreen ? 17 : 18,
  footerTextSize: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
  headerPaddingTop: isSmallScreen ? 30 : isMediumScreen ? 35 : 40,
  formMarginBottom: isSmallScreen ? 20 : isMediumScreen ? 22 : 24,
  formCardMinHeight: isSmallScreen ? 500 : isMediumScreen ? 550 : 600,
  inputSectionMargin: isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
  formHeaderMargin: isSmallScreen ? 28 : isMediumScreen ? 32 : 36,
};

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const colors = Colors.light;
  const router = useRouter();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations
    const animationSequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start();
  }, []);

  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setToast({ visible: true, message: 'Please fill in all fields', type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setToast({ visible: true, message: 'Passwords do not match', type: 'error' });
      return;
    }
    if (password.length < 6) {
      setToast({ visible: true, message: 'Password must be at least 6 characters long', type: 'error' });
      return;
    }
    if (!acceptedTerms) {
      setToast({ visible: true, message: 'Please accept the Terms and Conditions', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
      // Create user profile in Realtime Database
      await storeUserData(userCredential.user, fullName);
      
      setToast({ visible: true, message: 'Account created successfully!', type: 'success' });
      
      // Manual navigation based on user role
      setTimeout(() => {
        if (email.toLowerCase() === 'alfredosayson@gmail.com' || email.toLowerCase() === 'jayveebriani@gmail.com') {
          router.replace('/(admin-tabs)');
        } else {
          router.replace('/(user-tabs)');
        }
      }, 1500); // Wait for toast to show
    } catch (error: any) {
      let errorMessage = 'Account creation failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setToast({ visible: true, message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push('/signin');
  };

  const showTermsAndConditions = () => {
    Alert.alert(
      'Terms and Conditions',
      'By using Gereu Smart Services, you agree to:\n\n' +
      '• Provide accurate and complete information\n' +
      '• Maintain the security of your account\n' +
      '• Use the service for lawful purposes only\n' +
      '• Respect other users and their privacy\n' +
      '• Not share your account credentials\n\n' +
      'We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of any changes.\n\n' +
      'For the complete terms, please contact our support team.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00B2FF" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <LinearGradient
            colors={['#00B2FF', '#007BE5', '#002F87']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.backgroundGradient, { height: responsiveValues.headerHeight }]}
          >
            {/* Background Pattern */}
            <View style={styles.patternOverlay}>
              <View style={[styles.circle, styles.circle1]} />
              <View style={[styles.circle, styles.circle2]} />
              <View style={[styles.circle, styles.circle3]} />
            </View>

            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    transform: [{ rotate: logoRotation }],
                  },
                ]}
              >
                <View style={styles.logoRing}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.logoRingGradient}
                  >
                    <View style={[styles.logoInner, { 
                      width: responsiveValues.logoInnerSize, 
                      height: responsiveValues.logoInnerSize,
                      borderRadius: responsiveValues.logoInnerSize / 2,
                    }]}>
                      <Image
                        source={require('../../../assets/images/logo.png')}
                        style={[styles.logo, { 
                          width: responsiveValues.logoSize * 0.67, 
                          height: responsiveValues.logoSize * 0.67 
                        }]}
                      />
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>
              
              <Text style={[styles.title, { fontSize: responsiveValues.titleFontSize }]}>Create Account</Text>
              <Text style={[styles.subtitle, { fontSize: responsiveValues.subtitleFontSize }]}>Join Gereu Online Hub today</Text>
              <Text style={styles.tagline}>Your one-stop solution for smart living</Text>
            </Animated.View>
          </LinearGradient>

          <Animated.View 
            style={[
              styles.formCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                padding: responsiveValues.formPadding,
                marginHorizontal: responsiveValues.marginHorizontal,
                minHeight: responsiveValues.formCardMinHeight,
              },
            ]}
          >
            <View style={[styles.formHeader, { marginBottom: responsiveValues.formHeaderMargin }]}>
              <View style={styles.iconContainer}>
                <Ionicons name="person-add" size={24} color="#00B2FF" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.formTitle, { fontSize: responsiveValues.formTitleSize }]}>Personal Information</Text>
                <Text style={styles.formSubtitle}>Create your account to get started</Text>
              </View>
            </View>

              <View style={styles.form}>
                {/* Full Name Input */}
                <View style={[styles.inputSection, { marginBottom: responsiveValues.inputSectionMargin }]}>
                  <Text style={[styles.inputLabel, { fontSize: responsiveValues.inputLabelSize }]}>Full Name</Text>
                  <View style={[styles.inputContainer, { height: responsiveValues.inputHeight }]}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="person" size={20} color="#00B2FF" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="#9CA3AF"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                      autoComplete="name"
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={[styles.inputSection, { marginBottom: responsiveValues.inputSectionMargin }]}>
                  <Text style={[styles.inputLabel, { fontSize: responsiveValues.inputLabelSize }]}>Email Address</Text>
                  <View style={[styles.inputContainer, { height: responsiveValues.inputHeight }]}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="mail" size={20} color="#00B2FF" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={[styles.inputSection, { marginBottom: responsiveValues.inputSectionMargin }]}>
                  <Text style={[styles.inputLabel, { fontSize: responsiveValues.inputLabelSize }]}>Password</Text>
                  <View style={[styles.inputContainer, { height: responsiveValues.inputHeight }]}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="lock-closed" size={20} color="#00B2FF" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Create a password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={showPassword ? "eye" : "eye-off"} 
                        size={20} 
                        color="#6B7280" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={[styles.inputSection, { marginBottom: responsiveValues.inputSectionMargin }]}>
                  <Text style={[styles.inputLabel, { fontSize: responsiveValues.inputLabelSize }]}>Confirm Password</Text>
                  <View style={[styles.inputContainer, { height: responsiveValues.inputHeight }]}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="shield-checkmark" size={20} color="#00B2FF" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm your password"
                      placeholderTextColor="#9CA3AF"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoComplete="password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={showConfirmPassword ? "eye" : "eye-off"} 
                        size={20} 
                        color="#6B7280" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Terms and Conditions */}
                <View style={styles.termsSection}>
                  <TouchableOpacity
                    style={styles.termsContainer}
                    onPress={() => setAcceptedTerms(!acceptedTerms)}
                  >
                    <View style={[
                      styles.checkbox, 
                      { 
                        backgroundColor: acceptedTerms ? '#00B2FF' : 'transparent',
                        borderColor: acceptedTerms ? '#00B2FF' : '#ddd'
                      }
                    ]}>
                      {acceptedTerms && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                    <Text style={styles.termsText}>
                      I agree to the{' '}
                      <Text 
                        style={styles.termsLink}
                        onPress={showTermsAndConditions}
                      >
                        Terms and Conditions
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity 
                  style={[
                    styles.signUpButton, 
                    (!acceptedTerms || isLoading) && styles.disabledButton
                  ]} 
                  onPress={handleSignUp} 
                  activeOpacity={0.9}
                  disabled={!acceptedTerms || isLoading}
                >
                  <LinearGradient
                    colors={acceptedTerms ? ['#00B2FF', '#007BE5', '#002F87'] : ['#ccc', '#999']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.buttonGradient, { height: responsiveValues.buttonHeight }]}
                  >
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <View style={styles.loadingSpinner} />
                        <Text style={[styles.signUpButtonText, { 
                          fontSize: responsiveValues.buttonTextSize,
                          color: acceptedTerms ? 'white' : '#666' 
                        }]}>Creating Account...</Text>
                      </View>
                    ) : (
                      <>
                        <Ionicons 
                          name="arrow-forward" 
                          size={20} 
                          color={acceptedTerms ? "white" : "#666"} 
                          style={styles.buttonIcon} 
                        />
                        <Text style={[
                          styles.signUpButtonText,
                          { 
                            fontSize: responsiveValues.buttonTextSize,
                            color: acceptedTerms ? 'white' : '#666' 
                          }
                        ]}>
                          Create Account
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>

          <Animated.View 
            style={[
              styles.footer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.footerContent}>
              <Text style={[styles.footerText, { fontSize: responsiveValues.footerTextSize }]}>Already have an account? </Text>
              <TouchableOpacity onPress={handleSignIn} style={styles.signInButton}>
                <Text style={styles.signInText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <Toast 
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backgroundGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
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
    width: 120,
    height: 120,
    top: 20,
    right: -30,
  },
  circle2: {
    width: 80,
    height: 80,
    bottom: 40,
    left: -20,
  },
  circle3: {
    width: 60,
    height: 60,
    top: height * 0.15,
    right: 40,
  },
  keyboardView: { 
    flex: 1,
  },
  scrollContent: { 
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: { 
    alignItems: 'center', 
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoRing: {
    borderRadius: 60,
    padding: 3,
  },
  logoRingGradient: {
    borderRadius: 60,
    padding: 4,
  },
  logoInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  logo: { 
    resizeMode: 'contain' 
  },
  title: { 
    fontWeight: '800', 
    marginBottom: 8,
    color: 'white',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: { 
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '500',
    lineHeight: 22,
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    marginTop: -20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  formTitle: {
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  form: { 
    marginBottom: 8,
  },
  inputSection: {
    // marginBottom is now handled by responsive values
  },
  inputLabel: {
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  inputIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  input: { 
    flex: 1, 
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  eyeIcon: { 
    padding: 8,
    marginLeft: 8,
  },
  termsSection: {
    marginBottom: 24,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    flex: 1,
    color: '#6b7280',
    lineHeight: 20,
  },
  termsLink: {
    color: '#00B2FF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  signUpButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#00B2FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    marginRight: 8,
  },
  signUpButtonText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  footer: { 
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginHorizontal: 16,
  },
  footerContent: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  footerText: { 
    color: '#6B7280',
    fontWeight: '500',
  },
  signInButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  signInText: { 
    fontSize: 16, 
    fontWeight: '700',
    color: '#00B2FF',
  },
});