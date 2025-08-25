import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from '../../../components/Toast';
import { Colors } from '../../../constants/Colors';
import { auth } from '../../firebaseConfig';

// Screen: Sign In — nagha-handle ng pag-login gamit ang Firebase Auth
export default function SigninScreen() {
  // Local state para sa input fields at UI state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [isLoading, setIsLoading] = useState(false);
  const colors = Colors.light;
  const router = useRouter();

  // Action: Login flow
  const handleSignIn = async () => {
    // 1) Basic validation — dapat may laman ang email at password
    if (!email.trim() || !password.trim()) {
      setToast({ visible: true, message: 'Please fill in all fields', type: 'error' });
      return;
    }

    // 2) Start loading habang tumatawag sa Firebase
    setIsLoading(true);
    try {
      // 3) Firebase Auth: sign in gamit email + password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 4) Success toast; ang role ay nade-derive sa ibang bahagi ng app (Auth Context)
      setToast({ visible: true, message: 'Login successful!', type: 'success' });
      
      // 5) (Temporary) Manual navigation depende sa email → admin o user tabs
      setTimeout(() => {
        if (user.email && user.email.toLowerCase() === 'jayveebriani@gmail.com','jonjonsaysin@gmail.com') {
          router.replace('/(admin-tabs)');
        } else {
          router.replace('/(user-tabs)');
        }
      }, 1500); // Wait for toast to show
    } catch (error: any) {
      // 6) Error handling — gawing mas malinaw ang error message
      let errorMessage = 'Sign in failed. Please try again.';
       
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setToast({ visible: true, message: errorMessage, type: 'error' });
    } finally {
      // 7) Tapos na ang request — ihinto ang loading
      setIsLoading(false);
    }
  };

  // Navigate papuntang Sign Up screen
  const handleSignUp = () => {
    router.push('/signup' as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      {/* Toast messages para sa success/error feedback */}
      <Toast 
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
            <View style={styles.header}>
            {/* Logo ng app */}
            <View >
              <Image
              source={require('../../../assets/images/logo.png')}
              style={{ width: 120, height: 120, resizeMode: 'contain' }}
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>Sign in to your Gereu Smart Services account</Text>
            </View>

          <View style={styles.form}>
            {/* Email input */}
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

            {/* Password input na may show/hide */}
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

            {/* Forgot Password (placeholder) */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: '#007BE5' }]}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In button — tatawag sa handleSignIn */}
            <TouchableOpacity 
              style={[styles.signInButtonWrapper, isLoading && styles.disabledButton]} 
              onPress={handleSignIn} 
              activeOpacity={0.85}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#00B2FF', '#007BE5', '#002F87']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.signInButton}
              >
                <Text style={styles.signInButtonText}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            {/* Link papuntang Sign Up kung wala pang account */}
            <Text style={[styles.footerText, { color: colors.icon }]}>Don't have an account?{' '}</Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={[styles.signUpText, { color: '#007BE5' }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  signInButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  signInButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
