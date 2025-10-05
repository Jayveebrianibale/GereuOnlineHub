// ========================================
// AUTH CONTEXT - PAMAMAHALA NG AUTHENTICATION
// ========================================
// Ang file na ito ay naghahandle ng authentication state sa buong app
// Ginagamit ang React Context API para sa global state management
// Nagpo-provide ng authentication functions at user data sa lahat ng components

// Import ng Firebase Auth types at React hooks
import { User } from 'firebase/auth';
import React, { createContext, ReactNode, useContext } from 'react';
import { signIn, SignInData, signOutUser, signUp, SignUpData } from '../../utils/authUtils';
import { useAuth } from '../hooks/useAuth';

// ========================================
// AUTH CONTEXT TYPE DEFINITION
// ========================================
// Interface na nagde-define ng structure ng authentication context
// Naglalaman ng user data, loading states, at authentication functions
interface AuthContextType {
  user: User | null; // Current authenticated user (null kung hindi pa naka-login)
  role: 'admin' | 'user' | null; // User role (admin o user)
  isLoading: boolean; // Loading state para sa authentication operations
  isAuthenticated: boolean; // Boolean na nag-indicate kung naka-authenticate ang user
  signIn: (data: SignInData) => Promise<User>; // Function para sa pag-login
  signUp: (data: SignUpData) => Promise<User>; // Function para sa pag-register
  signOut: () => Promise<void>; // Function para sa pag-logout
}

// ========================================
// CREATE AUTH CONTEXT
// ========================================
// Gumagawa ng React Context para sa authentication
// Undefined ang initial value kasi magse-set tayo ng value sa Provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ========================================
// AUTH PROVIDER PROPS INTERFACE
// ========================================
// Interface para sa props ng AuthProvider component
interface AuthProviderProps {
  children: ReactNode; // React components na i-wrap ng AuthProvider
}

// ========================================
// AUTH PROVIDER COMPONENT
// ========================================
// Main component na nagpo-provide ng authentication context sa buong app
// Dapat i-wrap ang buong app sa component na ito para ma-access ang auth state
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Kunin ang authentication state mula sa useAuth hook
  const authState = useAuth();

  // I-combine ang auth state at authentication functions sa context value
  const contextValue: AuthContextType = {
    ...authState, // Spread ang user, role, isLoading, isAuthenticated
    signIn, // Import na signIn function
    signUp, // Import na signUp function
    signOut: signOutUser, // Import na signOutUser function (renamed to signOut)
  };

  // I-return ang Provider component na may context value
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ========================================
// USE AUTH CONTEXT HOOK
// ========================================
// Custom hook para sa pag-access ng authentication context
// Nag-throw ng error kung ginamit outside ng AuthProvider
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
