// ========================================
// AUTH GUARD COMPONENT - PAMAMAHALA NG AUTHENTICATION ROUTING
// ========================================
// Ang file na ito ay naghahandle ng authentication routing logic
// Walang UI; dito lang desisyon kung saan i-redirect ang user
// Base sa login status at role (admin o user)

// Import ng React hooks at navigation
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
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
  const { user, role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // ========================================
  // USEEFFECT: AUTHENTICATION ROUTING LOGIC
  // ========================================
  // I-monitor ang authentication status at i-redirect ang user accordingly
  useEffect(() => {
    // Kapag hindi na loading, magdesisyon saan pupunta
    if (!isLoading) {
      if (isAuthenticated && user && role) {
        // ========================================
        // AUTHENTICATED USER ROUTING
        // ========================================
        // Logged in: i-redirect sa tamang dashboard base sa role
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
        router.replace('/onboarding');
      }
    }
  }, [user, role, isLoading, isAuthenticated, router]);

  // ========================================
  // RENDER
  // ========================================
  // Walang nirender na UI; navigation logic lang
  return null;
};
