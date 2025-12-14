import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_HEALTHPATH_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_HEALTHPATH_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_HEALTHPATH_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_HEALTHPATH_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_HEALTHPATH_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_HEALTHPATH_FIREBASE_APP_ID,
};

// Log Firebase configuration for debugging
console.log('🔥 Firebase Configuration:');
console.log('  Project ID:', firebaseConfig.projectId);
console.log('  Storage Bucket:', firebaseConfig.storageBucket);
console.log('  Auth Domain:', firebaseConfig.authDomain);

// Validate required config values
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.storageBucket) {
  console.error('❌ Missing required Firebase configuration!');
  console.error('   Make sure your .env file has all EXPO_PUBLIC_FIREBASE_* variables set.');
  throw new Error('Firebase configuration is incomplete');
}

// Validate Storage Bucket format (should be .firebasestorage.app or .appspot.com)
if (firebaseConfig.storageBucket && 
    !firebaseConfig.storageBucket.includes('.firebasestorage.app') && 
    !firebaseConfig.storageBucket.includes('.appspot.com')) {
  console.warn('⚠️ Storage bucket URL format may be incorrect');
  console.warn('   Expected: PROJECT_ID.firebasestorage.app or PROJECT_ID.appspot.com');
  console.warn('   Got:', firebaseConfig.storageBucket);
}

// Initialize Firebase App (avoid duplicate initialization)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase App initialized');
} else {
  app = getApp();
  console.log('✅ Using existing Firebase App instance');
}

// Initialize Firebase Auth with React Native persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
} catch (error: any) {
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
    console.log('✅ Using existing Firebase Auth instance');
  } else {
    console.error('❌ Error initializing Firebase Auth:', error);
    throw error;
  }
}

// Initialize Firestore
const db = getFirestore(app);
console.log('✅ Firestore initialized');

// Initialize Firebase Storage
const storage = getStorage(app);
console.log('✅ Firebase Storage initialized');
console.log('📦 Storage Bucket URL:', firebaseConfig.storageBucket);

// Additional Storage validation
if (!firebaseConfig.storageBucket || firebaseConfig.storageBucket === 'undefined') {
  console.error('❌ Storage Bucket is not configured!');
  console.error('   Add EXPO_PUBLIC_HEALTHPATH_FIREBASE_STORAGE_BUCKET to your .env file');
  console.error('   Example: EXPO_PUBLIC_HEALTHPATH_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app');
} else {
  console.log('✅ Storage bucket format verified');
}

// Export Firebase services
export { auth, db, storage, app };
export default app;
