import { router } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
    // Automatically redirect to onboarding
    router.replace('/onboarding');
  }, []);

  // Return null since we're redirecting immediately
  return null;
} 