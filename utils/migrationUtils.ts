import { get, ref, set } from 'firebase/database';
import { isAdminEmail } from '../app/config/adminConfig';
import { db } from '../app/firebaseConfig';
import { UserData } from './userUtils';

// Helper function to get user initials for avatar
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

// Migration function to create user data for existing Firebase Auth users
// This should be run once to migrate existing users to the new system
export const migrateExistingUsers = async (): Promise<void> => {
  try {
    console.log('Starting user migration...');
    
    // Check if users already exist in the database
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      console.log('Users already exist in database. Migration not needed.');
      return;
    }
    
    // Create sample admin users based on the admin config
    const adminEmails = [
      'jayveebriani@gmail.com',
      'pedro1@gmail.com'
    ];
    
    const sampleUsers: UserData[] = [
      {
        id: 'admin-1',
        name: 'Jayvee Briani',
        email: 'jayveebriani@gmail.com',
        role: 'admin',
        status: 'active',
        lastActive: new Date().toISOString(),
        avatar: 'JB',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'admin-2',
        name: 'Pedro Admin',
        email: 'pedro1@gmail.com',
        role: 'admin',
        status: 'active',
        lastActive: new Date().toISOString(),
        avatar: 'PA',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user-1',
        name: 'Sample User',
        email: 'user@example.com',
        role: 'user',
        status: 'active',
        lastActive: new Date().toISOString(),
        avatar: 'SU',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    
    // Store sample users in the database
    for (const user of sampleUsers) {
      const userRef = ref(db, `users/${user.id}`);
      await set(userRef, user);
      console.log(`Migrated user: ${user.name} (${user.email})`);
    }
    
    console.log('User migration completed successfully!');
  } catch (error) {
    console.error('Error during user migration:', error);
    throw error;
  }
};

// Function to create a user data entry for a new user
export const createUserDataEntry = async (userId: string, email: string, displayName?: string): Promise<void> => {
  try {
    const userRef = ref(db, `users/${userId}`);
    
    const userData: UserData = {
      id: userId,
      name: displayName || 'Unknown User',
      email: email,
      role: isAdminEmail(email) ? 'admin' : 'user',
      status: 'active',
      lastActive: new Date().toISOString(),
      avatar: getInitials(displayName || 'Unknown User'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await set(userRef, userData);
    console.log('User data entry created:', userData);
  } catch (error) {
    console.error('Error creating user data entry:', error);
    throw error;
  }
};

// Function to check if migration is needed
export const isMigrationNeeded = async (): Promise<boolean> => {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    return !snapshot.exists();
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
};


