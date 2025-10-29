// ========================================
// AUTH GUARD COMPONENT - PAMAMAHALA NG AUTHENTICATION ROUTING
// ========================================
// Ang file na ito ay naghahandle ng authentication routing logic
// Walang UI; dito lang desisyon kung saan i-redirect ang user
// Base sa login status at role (admin o user)
// May persistent authentication at route restoration support

// Import ng React hooks at navigation
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  getRememberUserPreference,
  restorePersistentAppState,
  restorePersistentUserData
} from '../../utils/persistentAuthUtils';
import { useAuth } from '../hooks/useAuth';

// ========================================
// AUTH GUARD COMPONENT
// ========================================
// Main component na naghahandle ng authentication routing
// I-redirect ang user sa appropriate screen base sa authentication status
export const AuthGuard: React.FC = () => {
  // ========================================
  // HOOKS AT STATE
  // ========================================
  // Galing sa auth hook: info ng user, role, at kung logged in/loading
  const { user, role, isLoading, isAuthenticated, isRestoringSession, isTemporaryAuth } = useAuth();
  const router = useRouter();
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false);

  // ========================================
  // USEEFFECT: PERSISTENT AUTHENTICATION RESTORATION
  // ========================================
  // I-restore ang user session at app state kapag nag-start ang app
  useEffect(() => {
    const restoreSessionAndRoute = async () => {
      if (hasAttemptedRestore || isLoading || isRestoringSession) return;
      
      try {
        setHasAttemptedRestore(true);
        
        // I-check kung gusto ng user na ma-remember
        const rememberUser = await getRememberUserPreference();
        if (!rememberUser) {
          console.log('User chose not to be remembered, proceeding to normal flow');
          return;
        }

        // I-restore ang persistent user data
        const persistentUserData = await restorePersistentUserData();
        if (!persistentUserData) {
          console.log('No persistent user data found, proceeding to normal flow');
          return;
        }

        console.log('Found persistent user data for:', persistentUserData.email);
        
        // I-restore ang app state (route) kung mayroon
        const appState = await restorePersistentAppState();
        if (appState && appState.userRole === persistentUserData.role) {
          console.log('Restoring app state to route:', appState.currentRoute);
          // I-redirect sa saved route
          router.replace(appState.currentRoute as any);
          return;
        }

        // Kung walang saved route, i-redirect sa appropriate dashboard
        if (persistentUserData.role === 'admin') {
          console.log('Redirecting to admin dashboard');
          router.replace('/(admin-tabs)');
        } else {
          console.log('Redirecting to user dashboard');
          router.replace('/(user-tabs)');
        }

      } catch (error) {
        console.error('Error restoring session and route:', error);
        // Kung may error, proceed sa normal authentication flow
      }
    };

    restoreSessionAndRoute();
  }, [hasAttemptedRestore, isLoading, isRestoringSession, router]);

  // ========================================
  // USEEFFECT: AUTHENTICATION ROUTING LOGIC
  // ========================================
  // I-monitor ang authentication status at i-redirect ang user accordingly
  useEffect(() => {
    // Kapag hindi na loading at hindi na nagre-restore ng session, magdesisyon saan pupunta
    if (!isLoading && !isRestoringSession && hasAttemptedRestore) {
      if (isAuthenticated && user && role) {
        // ========================================
        // AUTHENTICATED USER ROUTING (REAL O TEMPORARY)
        // ========================================
        // Logged in: i-redirect sa tamang dashboard base sa role
        const authType = isTemporaryAuth ? 'temporary' : 'real';
        console.log(`User is ${authType} authenticated, redirecting to:`, role === 'admin' ? 'admin' : 'user', 'dashboard');
        
        if (role === 'admin') {
          router.replace('/(admin-tabs)'); // I-redirect sa admin dashboard
        } else {
          router.replace('/(user-tabs)'); // I-redirect sa user dashboard
        }
      } else if (!isAuthenticated) {
        // ========================================
        // UNAUTHENTICATED USER ROUTING
        // ========================================
        // Hindi pa logged in: i-redirect sa onboarding
        console.log('User is not authenticated, redirecting to onboarding');
        router.replace('/onboarding');
      }
    }
  }, [user, role, isLoading, isAuthenticated, isRestoringSession, isTemporaryAuth, hasAttemptedRestore, router]);

  // ========================================
  // RENDER
  // ========================================
  // Walang nirender na UI; navigation logic lang
  return null;
};
