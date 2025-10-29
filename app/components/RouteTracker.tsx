// ========================================
// ROUTE TRACKER COMPONENT
// ========================================
// Ang component na ito ay naghahandle ng route tracking
// I-save ang current route para sa app state persistence
// I-track ang navigation changes para sa session management

import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSession } from '../contexts/SessionContext';

// ========================================
// ROUTE TRACKER COMPONENT
// ========================================
// Component na naghahandle ng route tracking
// I-save ang current route para sa app state persistence
export const RouteTracker: React.FC = () => {
  const pathname = usePathname();
  const { saveAppState, updateActivity } = useSession();
  const lastPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (pathname && pathname !== lastPathnameRef.current) {
      lastPathnameRef.current = pathname;
      saveAppState(pathname);
      updateActivity();
    }
  }, [pathname, saveAppState, updateActivity]);

  // Hindi nagre-render ng visible content
  return null;
};
