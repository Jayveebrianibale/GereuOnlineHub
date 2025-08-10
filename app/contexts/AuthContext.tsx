import { User } from 'firebase/auth';
import React, { createContext, ReactNode, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { signIn, SignInData, signOutUser, signUp, SignUpData } from '../../utils/authUtils';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'user' | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (data: SignInData) => Promise<User>;
  signUp: (data: SignUpData) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authState = useAuth();

  const contextValue: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut: signOutUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
