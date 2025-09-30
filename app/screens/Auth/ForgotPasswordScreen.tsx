import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from '../../../components/Toast';
import { auth } from '../../firebaseConfig';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setToast({ visible: true, message: 'Please enter your email address', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setToast({ 
        visible: true, 
        message: 'Password reset email sent! Check your inbox.', 
        type: 'success' 
      });
      
      // Navigate back to signin after successful reset
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setToast({ visible: true, message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}> 
      <LinearGradient
        colors={['#00B2FF', '#007BE5', '#002F87']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed" size={48} color="white" />
              </View>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>
              <Text style={styles.tagline}>We'll send you a secure link to reset your password</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Ionicons name="key" size={24} color="#00B2FF" />
                <Text style={styles.formTitle}>Password Recovery</Text>
              </View>

              <View style={styles.form}>
                {/* Email Input */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your registered email"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                  <Ionicons name="information-circle" size={20} color="#00B2FF" style={styles.infoIcon} />
                  <Text style={styles.instructionsText}>
                    Enter the email address associated with your account. We'll send you a secure link to reset your password.
                  </Text>
                </View>

                {/* Reset Button */}
                <TouchableOpacity 
                  style={[styles.resetButton, isLoading && styles.disabledButton]} 
                  onPress={handleResetPassword} 
                  activeOpacity={0.9}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#00B2FF', '#007BE5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="mail" size={20} color="white" style={styles.buttonIcon} />
                    <Text style={styles.resetButtonText}>
                      {isLoading ? 'Sending...' : 'Send Reset Email'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={handleBackToSignIn} style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color="#00B2FF" style={styles.backIcon} />
                <Text style={styles.backText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    backgroundColor: '#f8fafc',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  keyboardView: { 
    flex: 1 
  },
  scrollContent: { 
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: { 
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 40,
    paddingTop: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: { 
    width: 80, 
    height: 80, 
    resizeMode: 'contain' 
  },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    marginBottom: 8,
    color: 'white',
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 18, 
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '500',
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 12,
  },
  form: { 
    marginBottom: 8,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: { 
    flex: 1, 
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#00B2FF',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  resetButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#00B2FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    marginRight: 8,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  footer: { 
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 178, 255, 0.1)',
  },
  backIcon: {
    marginRight: 8,
  },
  backText: { 
    fontSize: 16, 
    fontWeight: '600',
    color: '#00B2FF',
  },
});
