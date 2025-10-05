// frontend/src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA22HCWpmjkcTwO4v8x8s5HW98oGv46Sac",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "wellspring-4c4c0.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "wellspring-4c4c0",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "wellspring-4c4c0.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "165557430369",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:165557430369:web:df9024423b18e38a5e2220",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SBXKCKR9S9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Exports
export { auth, db };
export default app;

// Auto-login will be handled in App.tsx for better control

