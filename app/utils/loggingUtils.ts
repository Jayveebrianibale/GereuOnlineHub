// ========================================
// LOGGING UTILITIES - AUTOMATIC LOG TRACKING
// ========================================
// Ang file na ito ay naghahandle ng automatic logging
// Para sa login/logout activities sa buong app
// Simple at efficient logging system

import { createLog, LOG_ACTIONS } from '../services/logsService';

// ========================================
// LOGGING FUNCTIONS
// ========================================

/**
 * Log user login activity
 * @param userId - User ID
 * @param userEmail - User email
 * @param userRole - User role (admin or user)
 */
export const logUserLogin = async (
  userId: string,
  userEmail: string,
  userRole: 'admin' | 'user'
): Promise<void> => {
  try {
    const success = await createLog({
      userId,
      userEmail,
      userRole,
      action: LOG_ACTIONS.LOGIN,
    });
    
    if (!success) {
      console.error('Failed to log login');
    }
  } catch (error) {
    console.error('Error logging login:', error);
  }
};

/**
 * Log user logout activity
 * @param userId - User ID
 * @param userEmail - User email
 * @param userRole - User role (admin or user)
 */
export const logUserLogout = async (
  userId: string,
  userEmail: string,
  userRole: 'admin' | 'user'
): Promise<void> => {
  try {
    console.log('=== LOGGING LOGOUT ===');
    console.log('User ID:', userId);
    console.log('User Email:', userEmail);
    console.log('User Role:', userRole);
    
    const success = await createLog({
      userId,
      userEmail,
      userRole,
      action: LOG_ACTIONS.LOGOUT,
    });
    
    if (success) {
      console.log('Logout logged successfully');
    } else {
      console.error('Failed to log logout');
    }
    console.log('=== LOGOUT LOGGING COMPLETE ===');
  } catch (error) {
    console.error('Error logging logout:', error);
  }
};

/**
 * Log activity with error handling
 * @param action - Action to log
 * @param userId - User ID
 * @param userEmail - User email
 * @param userRole - User role
 */
export const logActivity = async (
  action: 'login' | 'logout',
  userId: string,
  userEmail: string,
  userRole: 'admin' | 'user'
): Promise<void> => {
  try {
    if (action === 'login') {
      await logUserLogin(userId, userEmail, userRole);
    } else if (action === 'logout') {
      await logUserLogout(userId, userEmail, userRole);
    }
  } catch (error) {
    console.error(`Error logging ${action}:`, error);
  }
};
