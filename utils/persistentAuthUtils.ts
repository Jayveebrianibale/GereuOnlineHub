// ========================================
// PERSISTENT AUTH UTILITIES - PAMAMAHALA NG PERSISTENT AUTHENTICATION
// ========================================
// Ang file na ito ay naghahandle ng persistent authentication storage
// Ginagamit ang AsyncStorage para sa pag-save at pag-restore ng user session
// Nagpo-provide ng functions para sa pag-manage ng persistent authentication state

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from 'firebase/auth';

// ========================================
// INTERFACE DEFINITIONS
// ========================================
// Mga interface para sa type safety sa persistent authentication

// Interface para sa persistent user data
export interface PersistentUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'user';
  lastLoginTime: number;
  isRemembered: boolean;
}

// Interface para sa persistent app state
export interface PersistentAppState {
  currentRoute: string;
  timestamp: number;
  userRole: 'admin' | 'user';
}

// ========================================
// STORAGE KEYS
// ========================================
// Constants para sa AsyncStorage keys
const PERSISTENT_USER_KEY = 'persistent_user_data';
const PERSISTENT_APP_STATE_KEY = 'persistent_app_state';
const REMEMBER_USER_KEY = 'remember_user_preference';

// ========================================
// PERSISTENT USER MANAGEMENT
// ========================================

// I-save ang user data sa AsyncStorage para sa persistent authentication
export const savePersistentUserData = async (user: User, role: 'admin' | 'user'): Promise<void> => {
  try {
    const userData: PersistentUserData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role,
      lastLoginTime: Date.now(),
      isRemembered: true,
    };

    await AsyncStorage.setItem(PERSISTENT_USER_KEY, JSON.stringify(userData));
    console.log('Persistent user data saved:', user.email);
  } catch (error) {
    console.error('Error saving persistent user data:', error);
    throw error;
  }
};

// I-restore ang user data mula sa AsyncStorage
export const restorePersistentUserData = async (): Promise<PersistentUserData | null> => {
  try {
    const savedData = await AsyncStorage.getItem(PERSISTENT_USER_KEY);
    if (!savedData) return null;

    const userData: PersistentUserData = JSON.parse(savedData);
    
    // I-check kung valid pa ang data (may uid at email)
    if (!userData.uid || !userData.email) {
      await clearPersistentUserData();
      return null;
    }

    console.log('Persistent user data restored:', userData.email);
    return userData;
  } catch (error) {
    console.error('Error restoring persistent user data:', error);
    await clearPersistentUserData(); // Clear corrupted data
    return null;
  }
};

// I-clear ang persistent user data
export const clearPersistentUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PERSISTENT_USER_KEY);
    await AsyncStorage.removeItem(PERSISTENT_APP_STATE_KEY);
    console.log('Persistent user data cleared');
  } catch (error) {
    console.error('Error clearing persistent user data:', error);
  }
};

// I-check kung may saved user data
export const hasPersistentUserData = async (): Promise<boolean> => {
  try {
    const savedData = await AsyncStorage.getItem(PERSISTENT_USER_KEY);
    return !!savedData;
  } catch (error) {
    console.error('Error checking persistent user data:', error);
    return false;
  }
};

// ========================================
// PERSISTENT APP STATE MANAGEMENT
// ========================================

// I-save ang current app state (route, timestamp, etc.)
export const savePersistentAppState = async (
  route: string, 
  userRole: 'admin' | 'user'
): Promise<void> => {
  try {
    const appState: PersistentAppState = {
      currentRoute: route,
      timestamp: Date.now(),
      userRole,
    };

    await AsyncStorage.setItem(PERSISTENT_APP_STATE_KEY, JSON.stringify(appState));
    console.log('Persistent app state saved:', route);
  } catch (error) {
    console.error('Error saving persistent app state:', error);
  }
};

// I-restore ang app state mula sa AsyncStorage
export const restorePersistentAppState = async (): Promise<PersistentAppState | null> => {
  try {
    const savedState = await AsyncStorage.getItem(PERSISTENT_APP_STATE_KEY);
    if (!savedState) return null;

    const appState: PersistentAppState = JSON.parse(savedState);
    
    // I-check kung valid pa ang app state
    if (!appState.currentRoute || !appState.userRole) {
      await AsyncStorage.removeItem(PERSISTENT_APP_STATE_KEY);
      return null;
    }

    console.log('Persistent app state restored:', appState.currentRoute);
    return appState;
  } catch (error) {
    console.error('Error restoring persistent app state:', error);
    await AsyncStorage.removeItem(PERSISTENT_APP_STATE_KEY);
    return null;
  }
};

// I-clear ang persistent app state
export const clearPersistentAppState = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PERSISTENT_APP_STATE_KEY);
    console.log('Persistent app state cleared');
  } catch (error) {
    console.error('Error clearing persistent app state:', error);
  }
};

// ========================================
// REMEMBER USER PREFERENCE
// ========================================

// I-save ang user preference kung gusto niyang ma-remember
export const saveRememberUserPreference = async (remember: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(REMEMBER_USER_KEY, JSON.stringify(remember));
    console.log('Remember user preference saved:', remember);
  } catch (error) {
    console.error('Error saving remember user preference:', error);
  }
};

// I-get ang user preference kung gusto niyang ma-remember
export const getRememberUserPreference = async (): Promise<boolean> => {
  try {
    const preference = await AsyncStorage.getItem(REMEMBER_USER_KEY);
    if (preference === null) return true; // Default to true
    return JSON.parse(preference);
  } catch (error) {
    console.error('Error getting remember user preference:', error);
    return true; // Default to true
  }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

// I-check kung valid pa ang saved user data (within reasonable time)
export const isPersistentUserDataValid = (userData: PersistentUserData): boolean => {
  const now = Date.now();
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  
  return (now - userData.lastLoginTime) <= maxAge;
};

// I-update ang last login time ng persistent user data
export const updatePersistentUserLastLogin = async (): Promise<void> => {
  try {
    const userData = await restorePersistentUserData();
    if (userData) {
      userData.lastLoginTime = Date.now();
      await AsyncStorage.setItem(PERSISTENT_USER_KEY, JSON.stringify(userData));
      console.log('Persistent user last login updated');
    }
  } catch (error) {
    console.error('Error updating persistent user last login:', error);
  }
};

// I-get ang user role mula sa persistent data
export const getPersistentUserRole = async (): Promise<'admin' | 'user' | null> => {
  try {
    const userData = await restorePersistentUserData();
    return userData?.role || null;
  } catch (error) {
    console.error('Error getting persistent user role:', error);
    return null;
  }
};
