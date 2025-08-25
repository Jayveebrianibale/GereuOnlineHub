// AuthGuard: walang UI; dito lang desisyon kung saan i-redirect ang user
// base sa login status at role (admin o user)
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export const AuthGuard: React.FC = () => {
  // Galing sa auth hook: info ng user, role, at kung logged in/ loading
  const { user, role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Kapag hindi na loading, magdesisyon saan pupunta
    if (!isLoading) {
      if (isAuthenticated && user && role) {
        // Logged in: i-redirect sa tamang dashboard
        if (role === 'admin') {
          router.replace('/(admin-tabs)');
        } else {
          router.replace('/(user-tabs)');
        }
      } else if (!isAuthenticated) {
        // Hindi pa logged in: i-redirect sa onboarding
        router.replace('/onboarding');
      }
    }
  }, [user, role, isLoading, isAuthenticated, router]);

  // Walang nirender na UI; navigation logic lang
  return null;
};
