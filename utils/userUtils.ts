// ========================================
// USER UTILITIES - PAMAMAHALA NG USER DATA
// ========================================
// Ang file na ito ay naghahandle ng user data management utilities
// May functions para sa pag-store, update, delete, at retrieve ng user data
// Ginagamit sa buong app para sa user management

// Import ng Firebase Auth at Database functions
import { User } from 'firebase/auth';
import { DataSnapshot, get, onValue, ref, set } from 'firebase/database';
import { isAdminEmail } from '../app/config/adminConfig';
import { db } from '../app/firebaseConfig';

// ========================================
// INTERFACE DEFINITIONS
// ========================================
// Type definitions para sa user data

// Interface para sa user data structure
export interface UserData {
  id: string; // User ID (Firebase UID)
  name: string; // User's full name
  email: string; // User's email address
  role: 'admin' | 'user'; // User role (admin o user)
  status: 'active' | 'inactive'; // User status
  lastActive: string; // Last active timestamp
  avatar: string; // User avatar (initials o image URL)
  createdAt: string; // Creation timestamp
  updatedAt: string; // Last update timestamp
}

// ========================================
// USER DATA MANAGEMENT FUNCTIONS
// ========================================
// Main functions para sa user data management

// I-store ang user data sa Firebase Realtime Database kapag nag-register
export const storeUserData = async (user: User, fullName: string): Promise<void> => {
  try {
    const userRef = ref(db, `users/${user.uid}`);
    
    const userData: UserData = {
      id: user.uid,
      name: fullName || user.displayName || 'Unknown User',
      email: user.email || '',
      role: isAdminEmail(user.email || '') ? 'admin' : 'user',
      status: 'active',
      lastActive: new Date().toISOString(),
      avatar: getInitials(fullName || user.displayName || 'Unknown User'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await set(userRef, userData);
    console.log('User data stored successfully:', userData);
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
};

// I-update ang user's last active time at i-set ang status to active
export const updateUserLastActive = async (userId: string, email?: string, displayName?: string): Promise<void> => {
  try {
    const userRef = ref(db, `users/${userId}`);
    
    // I-check muna kung may existing user
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      // User exists, only update specific fields to preserve existing data
      const updates = {
        lastActive: new Date().toISOString(),
        status: 'active',
        updatedAt: new Date().toISOString()
      };
      
      // Update only the specific fields, not the entire document
      await Promise.all([
        set(ref(db, `users/${userId}/lastActive`), updates.lastActive),
        set(ref(db, `users/${userId}/status`), updates.status),
        set(ref(db, `users/${userId}/updatedAt`), updates.updatedAt)
      ]);
    } else {
      // User doesn't exist in database, create entry with existing data
      if (email) {
        await ensureUserExists(userId, email, displayName);
      } else {
        console.warn(`User ${userId} not found in database and no email provided.`);
      }
    }
  } catch (error) {
    console.error('Error updating user last active:', error);
  }
};

// Set user status to inactive (for logout)
export const setUserInactive = async (userId: string): Promise<void> => {
  try {
    const userRef = ref(db, `users/${userId}`);
    
    // Check if user exists first
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      // User exists, only update specific fields to preserve existing data
      const updates = {
        status: 'inactive',
        updatedAt: new Date().toISOString()
      };
      
      // Update only the specific fields, not the entire document
      await Promise.all([
        set(ref(db, `users/${userId}/status`), updates.status),
        set(ref(db, `users/${userId}/updatedAt`), updates.updatedAt)
      ]);
    } else {
      console.warn(`User ${userId} not found in database during logout.`);
    }
  } catch (error) {
    console.error('Error setting user inactive:', error);
  }
};

// Handle existing users who might not have database entries yet
export const ensureUserExists = async (userId: string, email: string, displayName?: string): Promise<void> => {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      // User doesn't exist in database, create entry with existing data
      console.log(`Creating database entry for existing user: ${email}`);
      
      const userData: UserData = {
        id: userId,
        name: displayName || email.split('@')[0] || 'Unknown User',
        email: email,
        role: isAdminEmail(email) ? 'admin' : 'user',
        status: 'active',
        lastActive: new Date().toISOString(),
        avatar: getInitials(displayName || email.split('@')[0] || 'Unknown User'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await set(userRef, userData);
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error);
  }
};

// Fetch all users from Firebase Realtime Database
export const fetchAllUsers = async (): Promise<UserData[]> => {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const usersArray: UserData[] = Object.keys(usersData).map(key => ({
        ...usersData[key],
        id: key,
      }));
      
      // Sort by creation date (newest first)
      return usersArray.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Listen to real-time updates of users
export const listenToUsers = (callback: (users: UserData[]) => void): (() => void) => {
  const usersRef = ref(db, 'users');
  
  const unsubscribe = onValue(usersRef, (snapshot: DataSnapshot) => {
    try {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersArray: UserData[] = Object.keys(usersData).map(key => ({
          ...usersData[key],
          id: key,
        }));
        
        // Sort by creation date (newest first)
        const sortedUsers = usersArray.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        callback(sortedUsers);
      } else {
        callback([]);
      }
    } catch (error) {
      console.error('Error processing users data:', error);
      callback([]);
    }
  }, (error) => {
    console.error('Error listening to users:', error);
    callback([]);
  });

  return unsubscribe;
};

// Delete user from database
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const userRef = ref(db, `users/${userId}`);
    await set(userRef, null); // Set to null to delete the user
    console.log(`User ${userId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Helper function to get user initials for avatar
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

// Helper function to format last active time
export const formatLastActive = (lastActive: string): string => {
  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const diffInMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInMinutes < 1440) { // 24 hours
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
};

// Check if user should be considered inactive based on last active time
export const shouldUserBeInactive = (lastActive: string): boolean => {
  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const diffInMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60));
  
  // Consider user inactive if they haven't been active for more than 2 minutes
  return diffInMinutes > 2;
};

// Auto-update user status based on last active time
export const autoUpdateUserStatus = async (userId: string, lastActive: string): Promise<void> => {
  try {
    if (shouldUserBeInactive(lastActive)) {
      // Only update status and updatedAt, preserve other user data
      await Promise.all([
        set(ref(db, `users/${userId}/status`), 'inactive'),
        set(ref(db, `users/${userId}/updatedAt`), new Date().toISOString())
      ]);
    }
  } catch (error) {
    console.error('Error auto-updating user status:', error);
  }
};
