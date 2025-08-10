import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export const RoleBasedNavigator: React.FC = () => {
  const { user, role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && role) {
      // Navigate based on user role
      if (role === 'admin') {
        router.replace('/(admin-tabs)');
      } else {
        router.replace('/(user-tabs)');
      }
    }
  }, [user, role, isLoading, isAuthenticated, router]);

  // This component doesn't render anything, it just handles navigation
  return null;
};
