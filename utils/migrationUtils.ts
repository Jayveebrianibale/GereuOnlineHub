// ========================================
// MIGRATION UTILITIES - PAMAMAHALA NG DATA MIGRATION
// ========================================
// Ang file na ito ay naghahandle ng data migration utilities
// May functions para sa pag-migrate ng existing users sa new system
// Ginagamit para sa initial setup at data migration

// Import ng Firebase Database functions
import { get, ref, set } from 'firebase/database';
import { isAdminEmail } from '../app/config/adminConfig';
import { db } from '../app/firebaseConfig';
import { UserData } from './userUtils';

// ========================================
// HELPER FUNCTIONS
// ========================================
// Utility functions para sa migration process

// Helper function para sa pag-get ng user initials para sa avatar
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

// ========================================
// MIGRATION FUNCTIONS
// ========================================
// Main functions para sa data migration

// Migration function para sa pag-create ng user data para sa existing Firebase Auth users
// Dapat i-run ito once para i-migrate ang existing users sa new system
export const migrateExistingUsers = async (): Promise<void> => {
  try {
    console.log('Starting user migration...');
    
    // I-check kung may existing users na sa database
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      console.log('Users already exist in database. Migration not needed.');
      return;
    }
    
    // I-create ang sample admin users base sa admin config
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


