import { User, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { getUserRole } from '../../utils/authUtils';
import { updateUserLastActive } from '../../utils/userUtils';
import { auth } from '../firebaseConfig';

export interface AuthState {
  user: User | null;
  role: 'admin' | 'user' | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = getUserRole(user);
        
        // Update user status to active when they log in
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
        // Note: We don't set user inactive here because the user might be logging out
        // The signOutUser function will handle setting the status to inactive
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
