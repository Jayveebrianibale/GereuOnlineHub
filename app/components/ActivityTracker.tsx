// ========================================
// ACTIVITY TRACKER COMPONENT
// ========================================
// Ang component na ito ay naghahandle ng user activity tracking
// I-track ang user interactions para sa session management
// I-update ang session activity kapag may user interaction

import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSession } from '../contexts/SessionContext';

// ========================================
// ACTIVITY TRACKER COMPONENT
// ========================================
// Component na naghahandle ng activity tracking
// I-track ang user interactions at i-update ang session accordingly
export const ActivityTracker: React.FC = () => {
  const { updateActivity } = useSession();

  useEffect(() => {
    // I-track ang app state changes para sa activity
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App is active, update activity
        updateActivity();
      }
    };

    // I-listen sa app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup function
    return () => {
      subscription?.remove();
    };
  }, [updateActivity]);

  // Hindi nagre-render ng visible content
  // Activity tracking ay handled sa app state changes at navigation events
  return null;
};
