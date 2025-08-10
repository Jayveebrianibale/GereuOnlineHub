import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export const AuthGuard: React.FC = () => {
  const { user, role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user && role) {
        // User is authenticated, redirect to appropriate dashboard
        if (role === 'admin') {
          router.replace('/(admin-tabs)');
        } else {
          router.replace('/(user-tabs)');
        }
      } else if (!isAuthenticated) {
        // User is not authenticated, redirect to onboarding
        router.replace('/onboarding');
      }
    }
  }, [user, role, isLoading, isAuthenticated, router]);

  // This component doesn't render anything, it just handles navigation
  return null;
};
