// ========================================
// USE AUTH HOOK - PAMAMAHALA NG AUTHENTICATION STATE
// ========================================
// Ang file na ito ay naghahandle ng authentication state management
// May real-time monitoring ng authentication status
// I-update ang user status at role automatically
// May persistent authentication support para sa app restart

// Import ng Firebase Auth at React hooks
import { User, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { getUserRole } from '../../utils/authUtils';
import {
    clearPersistentUserData,
    getRememberUserPreference,
    isPersistentUserDataValid,
    restorePersistentUserData,
    savePersistentUserData
} from '../../utils/persistentAuthUtils';
import { updateUserLastActive } from '../../utils/userUtils';
import { auth } from '../firebaseConfig';

// ========================================
// INTERFACE DEFINITIONS
// ========================================
// Type definitions para sa authentication state

// Interface para sa authentication state
export interface AuthState {
  user: User | null; // Current authenticated user (null kung hindi pa naka-login)
  role: 'admin' | 'user' | null; // User role (admin o user)
  isLoading: boolean; // Loading state para sa authentication operations
  isAuthenticated: boolean; // Boolean na nag-indicate kung naka-authenticate ang user
  isRestoringSession: boolean; // Loading state para sa session restoration
}

// ========================================
// USE AUTH HOOK
// ========================================
// Custom hook para sa authentication state management
// I-monitor ang authentication status at i-update ang state accordingly
export const useAuth = () => {
  // ========================================
  // STATE VARIABLES
  // ========================================
  const [authState, setAuthState] = useState<AuthState>({
    user: null, // Initial user state
    role: null, // Initial role state
    isLoading: true, // Initial loading state
    isAuthenticated: false, // Initial authentication state
    isRestoringSession: false, // Initial session restoration state
  });

  // ========================================
  // USEEFFECT: PERSISTENT AUTHENTICATION RESTORATION
  // ========================================
  // I-restore ang user session mula sa AsyncStorage kapag nag-start ang app
  useEffect(() => {
    const restoreUserSession = async () => {
      try {
        setAuthState(prev => ({ ...prev, isRestoringSession: true }));
        
        // I-check kung gusto ng user na ma-remember
        const rememberUser = await getRememberUserPreference();
        if (!rememberUser) {
          console.log('User chose not to be remembered, skipping session restoration');
          setAuthState(prev => ({ ...prev, isRestoringSession: false, isLoading: false }));
          return;
        }

        // I-restore ang persistent user data
        const persistentUserData = await restorePersistentUserData();
        if (!persistentUserData) {
          console.log('No persistent user data found');
          setAuthState(prev => ({ ...prev, isRestoringSession: false, isLoading: false }));
          return;
        }

        // I-check kung valid pa ang persistent data
        if (!isPersistentUserDataValid(persistentUserData)) {
          console.log('Persistent user data expired, clearing...');
          await clearPersistentUserData();
          setAuthState(prev => ({ ...prev, isRestoringSession: false, isLoading: false }));
          return;
        }

        console.log('Restoring user session for:', persistentUserData.email);
        
        // I-set ang auth state base sa persistent data
        // Note: Hindi namin i-restore ang actual Firebase user object dito
        // Ang onAuthStateChanged listener ang magha-handle ng actual authentication
        setAuthState(prev => ({
          ...prev,
          isRestoringSession: false,
          isLoading: false,
          // Hindi namin i-set ang user at isAuthenticated dito
          // Dahil kailangan namin i-wait ang Firebase auth state
        }));

      } catch (error) {
        console.error('Error restoring user session:', error);
        setAuthState(prev => ({ ...prev, isRestoringSession: false, isLoading: false }));
      }
    };

    restoreUserSession();
  }, []);

  // ========================================
  // USEEFFECT: AUTHENTICATION STATE MONITORING
  // ========================================
  // I-monitor ang authentication state changes
  // I-update ang user status at role automatically
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ========================================
        // USER LOGGED IN
        // ========================================
        const role = getUserRole(user); // I-get ang user role
        
        // I-update ang user status to active kapag nag-login
        try {
          // Check if user is properly authenticated before updating status
          if (user && user.uid) {
            await updateUserLastActive(user.uid, user.email || '', user.displayName || undefined);
          }
        } catch (error) {
          console.error('Error setting user status:', error);
          // Don't throw the error to prevent app crash, just log it
        }

        // I-save ang user data sa persistent storage
        try {
          await savePersistentUserData(user, role);
        } catch (error) {
          console.error('Error saving persistent user data:', error);
        }
        
        setAuthState({
          user,
          role,
          isLoading: false,
          isAuthenticated: true,
          isRestoringSession: false,
        });
      } else {
        // ========================================
        // USER LOGGED OUT
        // ========================================
        // Note: Hindi namin i-set ang user inactive dito dahil baka nag-logout lang
        // Ang signOutUser function ang magha-handle ng pag-set ng status to inactive
        
        // I-clear ang persistent data kapag nag-logout
        try {
          await clearPersistentUserData();
        } catch (error) {
          console.error('Error clearing persistent user data:', error);
        }

        setAuthState({
          user: null,
          role: null,
          isLoading: false,
          isAuthenticated: false,
          isRestoringSession: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return authState;
};
