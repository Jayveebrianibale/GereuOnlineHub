import { User } from 'firebase/auth';
import { DataSnapshot, get, onValue, ref, set } from 'firebase/database';
import { isAdminEmail } from '../app/config/adminConfig';
import { db } from '../app/firebaseConfig';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  lastActive: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

// Store user data in Firebase Realtime Database when they register
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

// Update user's last active time
export const updateUserLastActive = async (userId: string): Promise<void> => {
  try {
    const userRef = ref(db, `users/${userId}/lastActive`);
    await set(userRef, new Date().toISOString());
  } catch (error) {
    console.error('Error updating user last active:', error);
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

// Update user status (active/inactive)
export const updateUserStatus = async (userId: string, status: 'active' | 'inactive'): Promise<void> => {
  try {
    const userRef = ref(db, `users/${userId}/status`);
    await set(userRef, status);
    
    // Also update the updatedAt timestamp
    const updatedAtRef = ref(db, `users/${userId}/updatedAt`);
    await set(updatedAtRef, new Date().toISOString());
  } catch (error) {
    console.error('Error updating user status:', error);
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
