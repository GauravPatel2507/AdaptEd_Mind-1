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
  apiKey: "AIzaSyBBZOarsGyTY34VIayPKRG1ctdtzT-Xq6M",
  authDomain: "adaptedmind-1.firebaseapp.com",
  databaseURL: "https://adaptedmind-1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "adaptedmind-1",
  storageBucket: "adaptedmind-1.firebasestorage.app",
  messagingSenderId: "973534084746",
  appId: "1:973534084746:web:fe63ac531084b4262af773",
  measurementId: "G-3N0H70EP1B"
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
