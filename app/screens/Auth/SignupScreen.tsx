import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from '../../../components/Toast';
import { Colors } from '../../../constants/Colors';
import { auth } from '../../firebaseConfig';

// Screen: Sign Up — gumagawa ng bagong account sa Firebase Auth
export default function SignupScreen() {
  // Local state para sa inputs at UI state
  const [fullName, setFullName] = useState('');  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const colors = Colors.light;
  const router = useRouter();

  // Action: Sign up flow
  const handleSignUp = async () => {
    // 1) Basic validations
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

    // 2) Simulan ang loading habang tumatawag sa Firebase
    setIsLoading(true);
    try {
      // 3) Firebase Auth: gumawa ng account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // 4) I-update ang display name ng user
      await updateProfile(userCredential.user, { displayName: fullName });
      
      // 5) Success toast
      setToast({ visible: true, message: 'Account created successfully!', type: 'success' });
      
      // 6) (Temporary) Manual navigation depende sa email → admin o user tabs
      setTimeout(() => {
        if (email.toLowerCase() === 'jayveebrianibale@gmail.com') {
          router.replace('/(admin-tabs)');
        } else {
          router.replace('/(user-tabs)');
        }
      }, 1500); // Wait for toast to show
    } catch (error: any) {
      // 7) Error handling — gawing mas malinaw ang error message
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
      // 8) Tapos na ang request — ihinto ang loading
      setIsLoading(false);
    }
  };

  // Navigate pabalik sa Sign In screen
  const handleSignIn = () => {
    router.push('/signin');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Image
                source={require('../../../assets/images/logo.png')}
                style={{ width: 120, height: 120, resizeMode: 'contain' }}
              />
              <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
              <Text style={[styles.subtitle, { color: colors.icon }]}>Join Gereu Smart Services today</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
                  placeholder="Full Name"
                  placeholderTextColor={colors.icon}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
                  placeholder="Email"
                  placeholderTextColor={colors.icon}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
                  placeholder="Password"
                  placeholderTextColor={colors.icon}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showPassword ? "eye" : "eye-off"} 
                    size={20} 
                    color={colors.icon} 
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.icon}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color={colors.icon} 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.signUpButtonWrapper, isLoading && styles.disabledButton]} 
                onPress={handleSignUp} 
                activeOpacity={0.85}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#00B2FF', '#007BE5', '#002F87']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.signUpButton}
                >
                  <Text style={styles.signUpButtonText}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.icon }]}>Already have an account? </Text>
              <TouchableOpacity onPress={handleSignIn}>
                <Text style={[styles.signInText, { color: '#007BE5' }]}>Sign In</Text>
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
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingVertical: 20 },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center' },
  form: { marginBottom: 32 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: { flex: 1, fontSize: 16 },
  eyeIcon: { padding: 4 },
  signUpButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  signUpButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14 },
  signInText: { fontSize: 14, fontWeight: '600' },
  disabledButton: {
    opacity: 0.6,
  },
});
