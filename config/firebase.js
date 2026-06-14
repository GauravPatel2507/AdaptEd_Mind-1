// Firebase configuration for AdaptEd Mind
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoWx_ytqrxYpzrDWuMdPkhRgy9URnNcgI",
  authDomain: "adapted-minds-5b2e3.firebaseapp.com",
  databaseURL: "https://adapted-minds-5b2e3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "adapted-minds-5b2e3",
  storageBucket: "adapted-minds-5b2e3.firebasestorage.app",
  messagingSenderId: "876139996112",
  appId: "1:876139996112:web:dfa2d5a6abe531e0db8fd5",
  measurementId: "G-BC7VBGRJHJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth — use AsyncStorage persistence on native, default on web
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}
export { auth };

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Realtime Database
export const rtdb = getDatabase(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;
