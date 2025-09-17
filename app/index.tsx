// Entry screen ng app: splash screen muna, tapos auth check
import { useEffect, useState } from 'react';
import { AuthGuard } from './components/AuthGuard';
import ProfessionalSplashScreen from './components/ProfessionalSplashScreen';
import { useAuth } from './hooks/useAuth';

export default function Index() {
  const { isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Show splash screen first
  if (showSplash) {
    return <ProfessionalSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Kung nagche-check pa ng login, huwag munang mag-render
  if (isLoading) {
    return null;
  }

  // Si AuthGuard ang bahala mag-redirect (admin/user/onboarding)
  return <AuthGuard />;
}