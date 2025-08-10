import { User, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { getUserRole } from '../../utils/authUtils';
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const role = getUserRole(user);
        setAuthState({
          user,
          role,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
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
