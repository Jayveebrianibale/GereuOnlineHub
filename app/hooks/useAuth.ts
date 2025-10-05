// ========================================
// USE AUTH HOOK - PAMAMAHALA NG AUTHENTICATION STATE
// ========================================
// Ang file na ito ay naghahandle ng authentication state management
// May real-time monitoring ng authentication status
// I-update ang user status at role automatically

// Import ng Firebase Auth at React hooks
import { User, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { getUserRole } from '../../utils/authUtils';
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
  });

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
          await updateUserLastActive(user.uid, user.email || '', user.displayName || undefined);
        } catch (error) {
          console.error('Error updating user status on login:', error);
        }
        
        setAuthState({
          user,
          role,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        // ========================================
        // USER LOGGED OUT
        // ========================================
        // Note: Hindi namin i-set ang user inactive dito dahil baka nag-logout lang
        // Ang signOutUser function ang magha-handle ng pag-set ng status to inactive
        setAuthState({
          user: null,
          role: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return authState;
};
