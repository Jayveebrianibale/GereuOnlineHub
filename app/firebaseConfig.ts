// ========================================
// FIREBASE CONFIGURATION - PAG-SETUP NG FIREBASE
// ========================================
// Ang file na ito ay naghahandle ng Firebase configuration para sa buong app
// Nagpo-provide ng access sa Firebase services: Auth, Realtime Database, at Storage
// IMPORTANT: Huwag i-share ang configuration keys sa public repositories

// Import ng Firebase modules
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// ========================================
// FIREBASE CONFIGURATION OBJECT
// ========================================
// Configuration object na naglalaman ng Firebase project settings
// Kinukuha ang values na ito mula sa Firebase Console
const firebaseConfig = {
  apiKey: 'AIzaSyCaD98fD30lBNQ37UlbHPcy12sx0IYnOy8', // API key para sa Firebase services
  authDomain: 'gereuonlinehub.firebaseapp.com', // Domain para sa authentication
  databaseURL: 'https://gereuonlinehub-default-rtdb.firebaseio.com', // URL ng Realtime Database
  projectId: 'gereuonlinehub', // Project ID ng Firebase project
  storageBucket: 'gereuonlinehub.firebasestorage.app', // Storage bucket para sa files
  messagingSenderId: '985715415023', // Sender ID para sa push notifications
  appId: '1:985715415023:web:3083ee60be6a64de81481a', // App ID ng web app
  measurementId: 'G-VZYK3CZGQL' // Measurement ID para sa Analytics
};

// ========================================
// FIREBASE INITIALIZATION
// ========================================
// I-initialize ang Firebase app gamit ang configuration
const app = initializeApp(firebaseConfig);

// ========================================
// FIREBASE SERVICES EXPORTS
// ========================================
// I-export ang Firebase services para magamit sa buong app
export const db = getDatabase(app); // Realtime Database instance
export const auth = getAuth(app); // Authentication instance
export const storage = getStorage(app); // Storage instance para sa file uploads
