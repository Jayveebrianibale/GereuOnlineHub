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
import { setUserInactive, storeUserData, updateUserLastActive } from './userUtils';

export interface AuthError {
  code: string;
  message: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Sign up function
export const signUp = async (data: SignUpData): Promise<User> => {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth, 
      data.email, 
      data.password
    );
    
    // Update user profile with display name
    await updateProfile(userCredential.user, { 
      displayName: data.fullName 
    });
    
    // Store user data in Firebase Realtime Database
    await storeUserData(userCredential.user, data.fullName);
    
    return userCredential.user;
  } catch (error: any) {
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
    if (currentUser) {
      // Set user status to inactive before signing out
      await setUserInactive(currentUser.uid);
    }
    await signOut(auth);
  } catch (error: any) {
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
