import { useEffect, useRef } from 'react';
import { updateUserLastActive } from '../../utils/userUtils';
import { useAuth } from './useAuth';

export const useUserHeartbeat = () => {
  const { user, isAuthenticated } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Update user status immediately when authenticated
      updateUserLastActive(user.uid, user.email || '', user.displayName || undefined);

      // Set up heartbeat to update user status every 2 minutes
      intervalRef.current = setInterval(async () => {
        try {
          await updateUserLastActive(user.uid, user.email || '', user.displayName || undefined);
        } catch (error) {
          console.error('Error updating user heartbeat:', error);
        }
      }, 2 * 60 * 1000); // 2 minutes
    } else {
      // Clear interval when user is not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, isAuthenticated]);

  return null;
};
