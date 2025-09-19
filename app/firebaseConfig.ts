// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCaD98fD30lBNQ37UlbHPcy12sx0IYnOy8', // Updated to match google-services.json
  authDomain: 'gereuonlinehub.firebaseapp.com',
  databaseURL: 'https://gereuonlinehub-default-rtdb.firebaseio.com', // 👈 important for RTDB
  projectId: 'gereuonlinehub',
  storageBucket: 'gereuonlinehub.firebasestorage.app', // Updated to match google-services.json
  messagingSenderId: '985715415023',
  appId: '1:985715415023:web:3083ee60be6a64de81481a',
  measurementId: 'G-VZYK3CZGQL'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
