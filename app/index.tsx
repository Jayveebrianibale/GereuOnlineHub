import { router } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
    // Delay navigation to ensure layout is mounted
    const timeout = setTimeout(() => {
      router.replace('/onboarding');
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  // Return null since we're redirecting immediately
  return null;
}