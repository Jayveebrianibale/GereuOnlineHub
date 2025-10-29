// ========================================
// SESSION MANAGER HOOK - PAMAMAHALA NG SESSION
// ========================================
// Ang file na ito ay naghahandle ng session management
// May automatic logout after 15 minutes of inactivity
// May app state persistence para sa quick app restoration
// May persistent authentication support para sa app restart

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { signOutUser } from '../../utils/authUtils';
import {
    clearPersistentAppState,
    savePersistentAppState
} from '../../utils/persistentAuthUtils';
import { useAuth } from './useAuth';

// ========================================
// INTERFACE DEFINITIONS
// ========================================
export interface SessionState {
  isActive: boolean;
  lastActivity: number;
  sessionStartTime: number;
  currentRoute?: string;
}

export interface AppStateData {
  currentRoute: string;
  timestamp: number;
  userRole: 'admin' | 'user' | null;
}

// ========================================
// CONSTANTS
// ========================================
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const QUICK_RESTORE_THRESHOLD = 30 * 1000; // 30 seconds for quick restore
const SESSION_STORAGE_KEY = 'user_session';
const APP_STATE_STORAGE_KEY = 'app_state';

// ========================================
// SESSION MANAGER HOOK
// ========================================
export const useSessionManager = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: false,
    lastActivity: Date.now(),
    sessionStartTime: Date.now(),
  });

  // Refs for timers and app state
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastActivityRef = useRef<number>(Date.now());

  // ========================================
  // SESSION TIMEOUT MANAGEMENT
  // ========================================
  const handleSessionTimeout = useCallback(async () => {
    console.log('Session timeout - logging out user');
    try {
      // Save session end time
      await AsyncStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          isActive: false,
          lastActivity: Date.now(),
          sessionStartTime: Date.now(),
          sessionEndTime: Date.now(),
        })
      );

      // Clear persistent app state
      await clearPersistentAppState();

      // Sign out user
      await signOutUser();
      
      // Navigate to login
      router.replace('/signin');
    } catch (error) {
      console.error('Error during session timeout:', error);
    }
  }, [router]);

  const resetSessionTimeout = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      console.log('Session timeout - logging out user');
      try {
        // Save session end time
        await AsyncStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            isActive: false,
            lastActivity: Date.now(),
            sessionStartTime: Date.now(),
            sessionEndTime: Date.now(),
          })
        );

        // Clear persistent app state
        await clearPersistentAppState();

        // Sign out user
        await signOutUser();
        
        // Navigate to login
        router.replace('/signin');
      } catch (error) {
        console.error('Error during session timeout:', error);
      }
    }, SESSION_TIMEOUT);

    // Update last activity
    const now = Date.now();
    lastActivityRef.current = now;
    setSessionState(prev => ({
      ...prev,
      lastActivity: now,
    }));
  }, [router]);

  // ========================================
  // APP STATE PERSISTENCE
  // ========================================
  const saveAppState = useCallback(async (route: string) => {
    if (!isAuthenticated || !user) return;

    try {
      const userRole = user.email?.includes('admin') ? 'admin' : 'user';
      
      // I-save ang app state sa persistent storage
      await savePersistentAppState(route, userRole);
      
      console.log('App state saved:', route);
    } catch (error) {
      console.error('Error saving app state:', error);
    }
  }, [isAuthenticated, user]);

  const restoreAppState = useCallback(async (): Promise<AppStateData | null> => {
    try {
      // I-restore ang app state mula sa persistent storage
      const appState = await AsyncStorage.getItem(APP_STATE_STORAGE_KEY);
      if (!appState) return null;

      const appStateData: AppStateData = JSON.parse(appState);
      const timeSinceLastSave = Date.now() - appStateData.timestamp;

      // Only restore if it's within the quick restore threshold
      if (timeSinceLastSave <= QUICK_RESTORE_THRESHOLD) {
        return appStateData;
      }

      // Clear old app state if it's too old
      await AsyncStorage.removeItem(APP_STATE_STORAGE_KEY);
      return null;
    } catch (error) {
      console.error('Error restoring app state:', error);
      return null;
    }
  }, []);

  // ========================================
  // SESSION MANAGEMENT FUNCTIONS
  // ========================================
  const startSession = useCallback(() => {
    if (!isAuthenticated || !user) return;

    const now = Date.now();
    setSessionState({
      isActive: true,
      lastActivity: now,
      sessionStartTime: now,
    });

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      console.log('Session timeout - logging out user');
      try {
        // Save session end time
        await AsyncStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            isActive: false,
            lastActivity: Date.now(),
            sessionStartTime: Date.now(),
            sessionEndTime: Date.now(),
          })
        );

        // Clear persistent app state
        await clearPersistentAppState();

        // Sign out user
        await signOutUser();
        
        // Navigate to login
        router.replace('/signin');
      } catch (error) {
        console.error('Error during session timeout:', error);
      }
    }, SESSION_TIMEOUT);
  }, [isAuthenticated, user, router]);

  const updateActivity = useCallback(() => {
    if (!sessionState.isActive) return;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      console.log('Session timeout - logging out user');
      try {
        // Save session end time
        await AsyncStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            isActive: false,
            lastActivity: Date.now(),
            sessionStartTime: Date.now(),
            sessionEndTime: Date.now(),
          })
        );

        // Clear persistent app state
        await clearPersistentAppState();

        // Sign out user
        await signOutUser();
        
        // Navigate to login
        router.replace('/signin');
      } catch (error) {
        console.error('Error during session timeout:', error);
      }
    }, SESSION_TIMEOUT);

    // Update last activity
    const now = Date.now();
    lastActivityRef.current = now;
    setSessionState(prev => ({
      ...prev,
      lastActivity: now,
    }));
  }, [sessionState.isActive, router]);

  const endSession = useCallback(async () => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Clear persistent app state
    await clearPersistentAppState();

    setSessionState({
      isActive: false,
      lastActivity: 0,
      sessionStartTime: 0,
    });
  }, []);

  // ========================================
  // APP STATE CHANGE HANDLING
  // ========================================
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App is coming to foreground
      console.log('App coming to foreground');
      
      if (isAuthenticated && user) {
        // Check if we should restore app state
        restoreAppState().then((appState) => {
          if (appState) {
            console.log('Restoring app state to:', appState.currentRoute);
            router.replace(appState.currentRoute as any);
          }
        });

        // Update activity and reset timeout
        if (sessionState.isActive) {
          // Clear existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          // Set new timeout
          timeoutRef.current = setTimeout(async () => {
            console.log('Session timeout - logging out user');
            try {
              // Save session end time
              await AsyncStorage.setItem(
                SESSION_STORAGE_KEY,
                JSON.stringify({
                  isActive: false,
                  lastActivity: Date.now(),
                  sessionStartTime: Date.now(),
                  sessionEndTime: Date.now(),
                })
              );

              // Clear app state
              await AsyncStorage.removeItem(APP_STATE_STORAGE_KEY);

              // Sign out user
              await signOutUser();
              
              // Navigate to login
              router.replace('/signin');
            } catch (error) {
              console.error('Error during session timeout:', error);
            }
          }, SESSION_TIMEOUT);

          // Update last activity
          const now = Date.now();
          lastActivityRef.current = now;
          setSessionState(prev => ({
            ...prev,
            lastActivity: now,
          }));
        }
      }
    } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
      // App is going to background
      console.log('App going to background');
      
      if (isAuthenticated && user) {
        // Save current route
        const currentRoute = router.canGoBack() ? 'current_route' : '/';
        saveAppState(currentRoute);
      }
    }

    appStateRef.current = nextAppState;
  }, [isAuthenticated, user, restoreAppState, saveAppState, router, sessionState.isActive]);

  // ========================================
  // EFFECTS
  // ========================================
  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      startSession();
    } else {
      endSession();
    }
  }, [isAuthenticated, user]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [handleAppStateChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ========================================
  // RETURN VALUES
  // ========================================
  return {
    sessionState,
    updateActivity,
    endSession,
    saveAppState,
    restoreAppState,
  };
};
