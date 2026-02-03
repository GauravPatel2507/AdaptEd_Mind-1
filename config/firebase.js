// Firebase configuration for AdaptEd Mind
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIqVX4J_UvhPj_EEBHkBMn4kHujfz-M44",
  authDomain: "adaptedmind-6473a.firebaseapp.com",
  databaseURL: "https://adaptedmind-6473a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "adaptedmind-6473a",
  storageBucket: "adaptedmind-6473a.firebasestorage.app",
  messagingSenderId: "228455416778",
  appId: "1:228455416778:web:0b1be6682edf409acf8533",
  measurementId: "G-FE116GZDE4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage for persistence in React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Realtime Database
export const rtdb = getDatabase(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;
