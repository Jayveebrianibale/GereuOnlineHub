// ========================================
// SIMPLE LOGS SERVICE - LOGIN TRACKING
// ========================================
// Ang file na ito ay naghahandle ng simple login logs
// Focus sa login tracking with date filtering
// Real-time updates at efficient data management

// Import ng Firebase functions at types
import { get, onValue, orderByChild, push, query, ref, remove, set } from 'firebase/database';
import { isAdminEmail as isAdminEmailFromConfig } from '../config/adminConfig';
import { db } from '../firebaseConfig';

// ========================================
// LOG TYPES AT INTERFACES
// ========================================
// Defines the structure ng log entries at filtering options

export interface LogEntry {
  id: string; // Unique log ID
  userId: string; // User ID na gumawa ng action
  userEmail: string; // User email
  userRole: 'admin' | 'user'; // User role
  action: 'login' | 'logout'; // Simple actions
  timestamp: number; // Unix timestamp
  date: string; // Date in YYYY-MM-DD format for easy filtering
  time: string; // Time in HH:MM:SS format
}

export interface LogFilter {
  role?: 'admin' | 'user' | 'all'; // Filter by role
  action?: 'login' | 'logout' | 'all'; // Filter by action
  dateFrom?: string; // Start date filter (YYYY-MM-DD)
  dateTo?: string; // End date filter (YYYY-MM-DD)
  userId?: string; // Filter by specific user
}

export interface LogStats {
  totalLogs: number;
  loginCount: number;
  logoutCount: number;
  adminLogins: number;
  userLogins: number;
  todayLogins: number;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Check if an email is assigned to an admin user
 * @param email - Email to check
 * @returns Promise<boolean> - True if email belongs to admin
 */
const isAdminEmail = async (email: string): Promise<boolean> => {
  try {
    return isAdminEmailFromConfig(email);
  } catch (error) {
    console.error('Error checking admin email:', error);
    return false;
  }
};

// ========================================
// LOG SERVICE FUNCTIONS
// ========================================

/**
 * Gumawa ng bagong login/logout log entry
 * @param logData - Log data na i-save
 * @returns Promise<boolean> - Success status
 */
export const createLog = async (logData: Omit<LogEntry, 'id' | 'timestamp' | 'date' | 'time'>): Promise<boolean> => {
  try {
    const logRef = ref(db, 'logs');
    const newLogRef = push(logRef); // Use push() to generate unique key
    
    const now = new Date();
    // Format time in 12-hour format (e.g., "9:35 PM")
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const logEntry: Omit<LogEntry, 'id'> = {
      ...logData,
      timestamp: now.getTime(),
      date: now.toISOString().split('T')[0], // YYYY-MM-DD format
      time: timeString, // 12-hour format (e.g., "9:35 PM")
    };

    await set(newLogRef, logEntry);
    console.log('Log created successfully');
    return true;
  } catch (error) {
    console.error('Error creating log:', error);
    return false;
  }
};

/**
 * Kumuha ng logs na may filtering
 * @param filter - Filter options
 * @param limit - Maximum number of logs to return
 * @returns Promise<LogEntry[]> - Array ng logs
 */

export const getLogs = async (filter: LogFilter = {}, limit: number = 100): Promise<LogEntry[]> => {
  try {
    // Check if user is authenticated
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    
    if (!auth.currentUser) {
      return [];
    }
    
    const logsRef = ref(db, 'logs');
    const logsQuery = query(logsRef, orderByChild('timestamp'));
    
    const snapshot = await get(logsQuery);
    
    if (!snapshot.exists()) {
      return [];
    }

    const data = snapshot.val();
    
    let logs: LogEntry[] = Object.keys(data)
      .map((key) => ({
        id: key,
        ...data[key],
      }))
      .filter((log) => log.timestamp && log.userEmail && log.action)
      .sort((a, b) => b.timestamp - a.timestamp);

    // Filter for admin emails only
    const adminLogs: LogEntry[] = [];
    
    for (const log of logs) {
      const isAdmin = await isAdminEmail(log.userEmail);
      if (isAdmin) {
        adminLogs.push(log);
      }
    }
    
    logs = adminLogs;

    // Apply filters
    if (filter.role && filter.role !== 'all') {
      logs = logs.filter(log => log.userRole === filter.role);
    }

    if (filter.action && filter.action !== 'all') {
      logs = logs.filter(log => log.action === filter.action);
    }

    if (filter.userId) {
      logs = logs.filter(log => log.userId === filter.userId);
    }

    if (filter.dateFrom) {
      logs = logs.filter(log => log.date >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      logs = logs.filter(log => log.date <= filter.dateTo!);
    }

    // Apply limit
    return logs.slice(0, limit);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
};

/**
 * Kumuha ng logs na may real-time updates
 * @param filter - Filter options
 * @param callback - Callback function para sa updates
 * @returns Unsubscribe function
 */
export const subscribeToLogs = (
  filter: LogFilter = {},
  callback: (logs: LogEntry[]) => void
): (() => void) => {
  // Check authentication before setting up listener
  const { getAuth } = require('firebase/auth');
  const auth = getAuth();
  if (!auth.currentUser) {
    console.log('User not authenticated, cannot subscribe to logs');
    callback([]);
    return () => {}; // Return empty unsubscribe function
  }

  const logsRef = ref(db, 'logs');
  const logsQuery = query(logsRef, orderByChild('timestamp'));
  
  return onValue(logsQuery, async (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const data = snapshot.val();
    let logs: LogEntry[] = Object.keys(data)
      .map((key) => ({
        id: key,
        ...data[key],
      }))
      .filter((log) => log.timestamp && log.userEmail && log.action) // Filter out invalid entries
      .sort((a, b) => b.timestamp - a.timestamp);

    // Filter for admin emails only
    const adminLogs: LogEntry[] = [];
    
    for (const log of logs) {
      const isAdmin = await isAdminEmail(log.userEmail);
      if (isAdmin) {
        adminLogs.push(log);
      }
    }
    
    logs = adminLogs;

    // Apply filters
    if (filter.role && filter.role !== 'all') {
      logs = logs.filter(log => log.userRole === filter.role);
    }

    if (filter.action && filter.action !== 'all') {
      logs = logs.filter(log => log.action === filter.action);
    }

    if (filter.userId) {
      logs = logs.filter(log => log.userId === filter.userId);
    }

    if (filter.dateFrom) {
      logs = logs.filter(log => log.date >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      logs = logs.filter(log => log.date <= filter.dateTo!);
    }

    callback(logs);
  });
};

/**
 * Kumuha ng log statistics
 * @returns Promise<LogStats> - Log statistics
 */
export const getLogStats = async (): Promise<LogStats> => {
  try {
    const logs = await getLogs({}, 1000); // Get more logs for stats
    const today = new Date().toISOString().split('T')[0];
    
    const stats: LogStats = {
      totalLogs: logs.length,
      loginCount: logs.filter(log => log.action === 'login').length,
      logoutCount: logs.filter(log => log.action === 'logout').length,
      adminLogins: logs.filter(log => log.action === 'login' && log.userRole === 'admin').length,
      userLogins: logs.filter(log => log.action === 'login' && log.userRole === 'user').length,
      todayLogins: logs.filter(log => log.action === 'login' && log.date === today).length,
    };

    return stats;
  } catch (error) {
    console.error('Error fetching log stats:', error);
    return {
      totalLogs: 0,
      loginCount: 0,
      logoutCount: 0,
      adminLogins: 0,
      userLogins: 0,
      todayLogins: 0,
    };
  }
};

/**
 * Mag-delete ng specific log entry
 * @param logId - Log ID na i-delete
 * @returns Promise<boolean> - Success status
 */
export const deleteLog = async (logId: string): Promise<boolean> => {
  try {
    const logRef = ref(db, `logs/${logId}`);
    await remove(logRef);
    console.log('Log deleted successfully:', logId);
    return true;
  } catch (error) {
    console.error('Error deleting log:', error);
    return false;
  }
};

/**
 * Mag-clear ng old logs (older than specified days)
 * @param daysOld - Number of days
 * @returns Promise<number> - Number of logs deleted
 */
export const clearOldLogs = async (daysOld: number = 30): Promise<number> => {
  try {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const logs = await getLogs({}, 10000); // Get all logs
    
    const oldLogs = logs.filter(log => log.timestamp < cutoffTime);
    
    // Delete old logs
    const deletePromises = oldLogs.map(log => deleteLog(log.id));
    await Promise.all(deletePromises);
    
    console.log(`Cleared ${oldLogs.length} old logs`);
    return oldLogs.length;
  } catch (error) {
    console.error('Error clearing old logs:', error);
    return 0;
  }
};

// ========================================
// SIMPLE LOG ACTIONS
// ========================================
// Simple log actions para sa login tracking

export const LOG_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
} as const;
