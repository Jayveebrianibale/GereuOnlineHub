// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAm6oDvA83A08lt0TuGSqFsSx5ZbjeUK-I",
  authDomain: "gereuonlinehub.firebaseapp.com",
  databaseURL: "https://gereuonlinehub-default-rtdb.firebaseio.com",
  projectId: "gereuonlinehub",
  storageBucket: "gereuonlinehub.appspot.com",
  messagingSenderId: "985715415023",
  appId: "1:985715415023:web:3083ee60be6a64de81481a",
  measurementId: "G-VZYK3CZGQL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
