// ========================================
// AUTH UTILITIES - PAMAMAHALA NG AUTHENTICATION
// ========================================
// Ang file na ito ay naghahandle ng authentication operations
// May functions para sa sign up, sign in, sign out, at error handling
// Ginagamit sa buong app para sa user authentication

// Import ng Firebase Auth functions
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User,
    UserCredential
} from 'firebase/auth';
import { isAdminEmail } from '../app/config/adminConfig';
import { auth } from '../app/firebaseConfig';
import { logUserLogin, logUserLogout } from '../app/utils/loggingUtils';
import { setUserInactive, storeUserData, updateUserLastActive } from './userUtils';

// ========================================
// INTERFACE DEFINITIONS
// ========================================
// Mga interface para sa type safety sa authentication operations

// Interface para sa authentication errors
export interface AuthError {
  code: string; // Error code mula sa Firebase
  message: string; // Human-readable error message
}

// Interface para sa sign up data
export interface SignUpData {
  email: string; // User email address
  password: string; // User password
  fullName: string; // User's full name
}

// Interface para sa sign in data
export interface SignInData {
  email: string; // User email address
  password: string; // User password
}

// ========================================
// FUNCTION: SIGN UP
// ========================================
// Ang function na ito ay naghahandle ng user registration
// Gumagawa ng bagong user account sa Firebase Auth at Realtime Database
export const signUp = async (data: SignUpData): Promise<User> => {
  try {
    // I-create ang user account sa Firebase Auth
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth, 
      data.email, 
      data.password
    );
    
    // I-update ang user profile gamit ang display name
    await updateProfile(userCredential.user, { 
      displayName: data.fullName 
    });
    
    // I-store ang user data sa Firebase Realtime Database
    await storeUserData(userCredential.user, data.fullName);
    
    return userCredential.user;
  } catch (error: any) {
    // I-throw ang error na may proper formatting
    throw {
      code: error.code || 'unknown',
      message: getErrorMessage(error.code)
    };
  }
};

// Sign in function
export const signIn = async (data: SignInData): Promise<User> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth, 
      data.email, 
      data.password
    );
    
    // Update user's last active time
    await updateUserLastActive(userCredential.user.uid, userCredential.user.email || '', userCredential.user.displayName || undefined);
    
    // Log login activity
    const userRole = getUserRole(userCredential.user);
    await logUserLogin(
      userCredential.user.uid,
      userCredential.user.email || '',
      userRole
    );
    
    return userCredential.user;
  } catch (error: any) {
    throw {
      code: error.code || 'unknown',
      message: getErrorMessage(error.code)
    };
  }
};

// Sign out function
export const signOutUser = async (): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    console.log('=== SIGNOUT DEBUG ===');
    console.log('Current user:', currentUser ? 'Found' : 'Not found');
    
    if (currentUser) {
      console.log('User email:', currentUser.email);
      console.log('User ID:', currentUser.uid);
      
      // Log logout activity before signing out
      const userRole = getUserRole(currentUser);
      console.log('User role:', userRole);
      
      await logUserLogout(
        currentUser.uid,
        currentUser.email || '',
        userRole
      );
      
      // Set user status to inactive before signing out
      await setUserInactive(currentUser.uid);
    }
    
    await signOut(auth);
    console.log('=== SIGNOUT COMPLETE ===');
  } catch (error: any) {
    console.error('Signout error:', error);
    throw {
      code: error.code || 'unknown',
      message: 'Sign out failed. Please try again.'
    };
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Check if user is signed in
export const isUserSignedIn = (): boolean => {
  return !!auth.currentUser;
};

// Determine user role based on email address
export const getUserRole = (user: User): 'admin' | 'user' => {
  if (user.email && isAdminEmail(user.email)) {
    return 'admin';
  }
  return 'user';
};

// Helper function to get user-friendly error messages
const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign in is not enabled.';
    default:
      return 'An error occurred. Please try again.';
  }
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation
export const validateEmail = (email: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email.trim()) {
    errors.push('Email is required');
  } else if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
