import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import {
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
import { auth } from '../../firebaseConfig';

const { height, width } = Dimensions.get('window');

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
  formCardMinHeight: isSmallScreen ? 400 : isMediumScreen ? 450 : 500,
  inputSectionMargin: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
  formHeaderMargin: isSmallScreen ? 28 : isMediumScreen ? 32 : 36,
};

export default function SigninScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [generalError, setGeneralError] = useState(false);
  const router = useRouter();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Load saved credentials if they exist
    loadSavedCredentials();
    
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

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('remembered_email');
      const savedPassword = await AsyncStorage.getItem('remembered_password');
      const rememberMeStatus = await AsyncStorage.getItem('remember_me');
      
      if (savedEmail && savedPassword && rememberMeStatus === 'true') {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      console.log('Error loading saved credentials:', error);
    }
  };

  const saveCredentials = async (email: string, password: string) => {
    try {
      await AsyncStorage.setItem('remembered_email', email);
      await AsyncStorage.setItem('remembered_password', password);
      await AsyncStorage.setItem('remember_me', 'true');
    } catch (error) {
      console.log('Error saving credentials:', error);
    }
  };

  const clearSavedCredentials = async () => {
    try {
      await AsyncStorage.removeItem('remembered_email');
      await AsyncStorage.removeItem('remembered_password');
      await AsyncStorage.removeItem('remember_me');
    } catch (error) {
      console.log('Error clearing saved credentials:', error);
    }
  };

  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const clearErrors = () => {
    setEmailError(false);
    setPasswordError(false);
    setGeneralError(false);
  };

  const handleSignIn = async () => {
    // Clear previous errors
    clearErrors();

    if (!email.trim() || !password.trim()) {
      setToast({ visible: true, message: 'Please fill in all fields', type: 'error' });
      // Highlight empty fields
      if (!email.trim()) setEmailError(true);
      if (!password.trim()) setPasswordError(true);
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Handle remember me functionality
      if (rememberMe) {
        await saveCredentials(email, password);
      } else {
        await clearSavedCredentials();
      }

      setToast({ visible: true, message: 'Login successful!', type: 'success' });

      setTimeout(() => {
        if (user.email && (user.email.toLowerCase() === 'alfredosayson@gmail.com' || user.email.toLowerCase() === 'jayveebriani@gmail.com' || user.email.toLowerCase() === 'sayson5@gmail.com')) {
          router.replace('/(admin-tabs)');
        } else {
          router.replace('/(user-tabs)');
        }
      }, 1500);
    } catch (error: any) {
      let errorMessage = 'Sign in failed. Please try again.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
        setEmailError(true);
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
        setPasswordError(true);
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
        setEmailError(true);
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
        setGeneralError(true);
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
        setGeneralError(true);
      } else {
        // Fallback for any other errors
        setGeneralError(true);
      }

      setToast({ visible: true, message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError(false);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(false);
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
              
              <Text style={[styles.title, { fontSize: responsiveValues.titleFontSize }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { fontSize: responsiveValues.subtitleFontSize }]}>Sign in to your Gereu Online Hub account</Text>
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
                <Ionicons name="shield-checkmark" size={24} color="#00B2FF" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.formTitle, { fontSize: responsiveValues.formTitleSize }]}>Secure Sign In</Text>
                <Text style={styles.formSubtitle}>Enter your credentials to continue</Text>
              </View>
            </View>

            <View style={styles.form}>
              <View style={[styles.inputSection, { marginBottom: responsiveValues.inputSectionMargin }]}>
                <Text style={[styles.inputLabel, { fontSize: responsiveValues.inputLabelSize }]}>Email Address</Text>
                <View style={[
                  styles.inputContainer, 
                  { height: responsiveValues.inputHeight },
                  emailError && styles.inputError
                ]}>
                  <View style={[styles.inputIconContainer, emailError && styles.inputIconError]}>
                    <Ionicons name="mail" size={20} color={emailError ? "#EF4444" : "#00B2FF"} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              <View style={[styles.inputSection, { marginBottom: responsiveValues.inputSectionMargin }]}>
                <Text style={[styles.inputLabel, { fontSize: responsiveValues.inputLabelSize }]}>Password</Text>
                <View style={[
                  styles.inputContainer, 
                  { height: responsiveValues.inputHeight },
                  passwordError && styles.inputError
                ]}>
                  <View style={[styles.inputIconContainer, passwordError && styles.inputIconError]}>
                    <Ionicons name="lock-closed" size={20} color={passwordError ? "#EF4444" : "#00B2FF"} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember Me Checkbox */}
              <View style={styles.rememberMeContainer}>
                <TouchableOpacity 
                  style={styles.checkboxContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked
                  ]}>
                    {rememberMe && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <Text style={styles.rememberMeText}>Remember Me</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.signInButton, isLoading && styles.disabledButton]} 
                onPress={handleSignIn} 
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#00B2FF', '#007BE5', '#002F87']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.buttonGradient, { height: responsiveValues.buttonHeight }]}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <View style={styles.loadingSpinner} />
                      <Text style={[styles.signInButtonText, { fontSize: responsiveValues.buttonTextSize }]}>Signing In...</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons 
                        name="arrow-forward" 
                        size={20} 
                        color="white" 
                        style={styles.buttonIcon} 
                      />
                      <Text style={[styles.signInButtonText, { fontSize: responsiveValues.buttonTextSize }]}>Sign In</Text>
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
              <Text style={[styles.footerText, { fontSize: responsiveValues.footerTextSize }]}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp} style={styles.signUpLink}>
                <Text style={styles.signUpText}>Sign Up</Text>
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
    width: 108,
    height: 108,
    borderRadius: 54,
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
    width: 72, 
    height: 72, 
    resizeMode: 'contain' 
  },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    marginBottom: 8,
    color: 'white',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: { 
    fontSize: 16, 
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    lineHeight: 22,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B2FF',
  },
  signInButton: {
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
  signInButtonText: {
    color: 'white',
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
  signUpLink: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  signUpText: { 
    fontSize: 16, 
    fontWeight: '700',
    color: '#00B2FF',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
  },
  inputIconError: {
    backgroundColor: '#FEE2E2',
  },
  rememberMeContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#00B2FF',
    borderColor: '#00B2FF',
  },
  rememberMeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});