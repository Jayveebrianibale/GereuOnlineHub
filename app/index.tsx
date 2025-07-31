import { router } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
    // Redirect to onboarding screen when the app starts
    router.replace('/onboarding');
  }, []);

  return null; // This component doesn't render anything
} 