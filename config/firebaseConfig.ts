// config/firebaseConfig.ts

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

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
if (
  firebaseConfig.storageBucket &&
  !firebaseConfig.storageBucket.includes('.firebasestorage.app') &&
  !firebaseConfig.storageBucket.includes('.appspot.com')
) {
  console.warn('⚠️ Storage bucket URL format may be incorrect');
  console.warn('   Expected: PROJECT_ID.firebasestorage.app or PROJECT_ID.appspot.com');
  console.warn('   Got:', firebaseConfig.storageBucket);
}

// Initialize Firebase App (avoid duplicate initialization)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase App initialized');
} else {
  app = getApp();
  console.log('✅ Using existing Firebase App instance');
}

// Initialize Firebase Auth
// Note: For React Native, auth state persistence is handled by @react-native-firebase/auth
// The web SDK (firebase/auth) is used for email/password and Firestore operations
// Phone authentication uses @react-native-firebase/auth which has native persistence
const auth: Auth = getAuth(app);
console.log('✅ Firebase Auth initialized');

// Initialize Firestore
const db: Firestore = getFirestore(app);
console.log('✅ Firestore initialized');

// Initialize Firebase Storage
const storage: FirebaseStorage = getStorage(app);
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

// Export Firebase services with proper types
export { auth, db, storage, app };
export default app;
