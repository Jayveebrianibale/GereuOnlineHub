// ========================================
// USE AUTH HOOK - PAMAMAHALA NG AUTHENTICATION STATE
// ========================================
// Ang file na ito ay naghahandle ng authentication state management
// May real-time monitoring ng authentication status
// I-update ang user status at role automatically
// May persistent authentication support para sa app restart

// Import ng Firebase Auth at React hooks
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { getUserRole } from '../../utils/authUtils';
import {
  clearPersistentUserData,
  getRememberUserPreference,
  isPersistentUserDataValid,
  PersistentUserData,
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
  isTemporaryAuth: boolean; // Boolean na nag-indicate kung temporary authenticated state lang
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
    isTemporaryAuth: false, // Initial temporary auth state
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
        
        // I-create ang temporary user object base sa persistent data
        const temporaryUser = createTemporaryUserFromPersistentData(persistentUserData);
        
        // I-set ang temporary authenticated state para hindi ma-redirect sa login
        setAuthState(prev => ({
          ...prev,
          user: temporaryUser,
          role: persistentUserData.role,
          isAuthenticated: true, // TEMPORARY TRUE - para hindi ma-redirect
          isTemporaryAuth: true, // Mark as temporary
          isRestoringSession: false,
          isLoading: false,
        }));

        // I-attempt ang background Firebase session restoration
        attemptBackgroundFirebaseRestore(persistentUserData);

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
          isTemporaryAuth: false, // Real Firebase auth, not temporary
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
          isTemporaryAuth: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  
  // I-create ang temporary user object mula sa persistent data
  const createTemporaryUserFromPersistentData = (persistentData: PersistentUserData): User => {
    // I-create ang mock user object na compatible sa Firebase User interface
    const mockUser = {
      uid: persistentData.uid,
      email: persistentData.email,
      displayName: persistentData.displayName,
      photoURL: null,
      emailVerified: true, // Assume verified para sa temporary state
      isAnonymous: false,
      phoneNumber: null,
      providerId: 'firebase',
      metadata: {
        creationTime: persistentData.lastLoginTime.toString(),
        lastSignInTime: persistentData.lastLoginTime.toString(),
      },
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => '',
      getIdTokenResult: async () => ({} as any),
      reload: async () => {},
      toJSON: () => ({}),
    } as unknown as User;
    
    return mockUser;
  };

  // I-attempt ang background Firebase session restoration
  const attemptBackgroundFirebaseRestore = async (persistentData: PersistentUserData) => {
    try {
      console.log('Attempting background Firebase session restoration...');
      
      // I-check kung may existing Firebase session
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === persistentData.uid) {
        console.log('Firebase session already exists, no restoration needed');
        return;
      }

      // I-attempt i-restore ang session gamit ang stored data
      // Note: Hindi namin ma-restore ang actual Firebase session without re-authentication
      // Pero pwede namin i-validate kung valid pa ang stored data
      console.log('Firebase session lost, but persistent data is valid');
      console.log('User will remain in temporary authenticated state');
      
      // Optional: I-attempt silent re-authentication dito kung may stored credentials
      // Pero para sa ngayon, i-keep lang namin ang temporary state
      
    } catch (error) {
      console.error('Error in background Firebase restoration:', error);
      // Kung may error, i-clear ang temporary auth state
      setAuthState(prev => ({
        ...prev,
        user: null,
        role: null,
        isAuthenticated: false,
        isTemporaryAuth: false,
      }));
    }
  };

  return authState;
};
