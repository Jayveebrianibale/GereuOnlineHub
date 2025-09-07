/*
  One-time backfill script to copy all Firebase Auth users into Realtime Database.
  Usage:
    - Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path
    - Set FIREBASE_DATABASE_URL env var
    - Run: ts-node scripts/backfill-auth-users.ts
*/

import admin from 'firebase-admin';

const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL,
  });
}

interface UserData {
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

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

const isAdminEmail = (email: string): boolean => {
  const adminEmails = new Set(['jayveebriani@gmail.com', 'pedro1@gmail.com']);
  return adminEmails.has(email.toLowerCase());
};

async function writeUser(user: admin.auth.UserRecord): Promise<void> {
  const displayName = user.displayName || 'Unknown User';
  const email = user.email || '';
  const now = new Date().toISOString();

  const userData: UserData = {
    id: user.uid,
    name: displayName,
    email,
    role: isAdminEmail(email) ? 'admin' : 'user',
    status: 'active',
    lastActive: now,
    avatar: getInitials(displayName),
    createdAt: now,
    updatedAt: now,
  };

  await admin.database().ref(`users/${user.uid}`).set(userData);
  console.log(`Backfilled: ${displayName} (${email})`);
}

async function run(): Promise<void> {
  try {
    let nextPageToken: string | undefined;
    do {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      for (const user of result.users) {
        await writeUser(user);
      }
      nextPageToken = result.pageToken;
    } while (nextPageToken);
    console.log('Backfill complete.');
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  }
}

run();


