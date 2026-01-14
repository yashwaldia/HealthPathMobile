// config/firebaseConfig.ts

import { getApp } from '@react-native-firebase/app';
import appCheck from '@react-native-firebase/app-check';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// ============================================
// FIREBASE APP CHECK INITIALIZATION
// ============================================

// Create the provider instance
const rnfbProvider = appCheck().newReactNativeFirebaseAppCheckProvider();

// Configure the provider based on the environment
rnfbProvider.configure({
  android: {
    // ✅ FIX: Use 'debug' provider in development, 'playIntegrity' in production
    provider: __DEV__ ? 'debug' : 'playIntegrity',
  },
  apple: {
    // ✅ FIX: Use 'debug' provider in development for iOS as well
    provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
  },
});

// Initialize App Check
appCheck().initializeAppCheck({ 
  provider: rnfbProvider, 
  isTokenAutoRefreshEnabled: true 
});

console.log(`✅ Firebase App Check initialized (${__DEV__ ? 'Debug' : 'Production'} Mode)`);

// ============================================
// FIREBASE APP INITIALIZATION CHECK
// ============================================

console.log('🔥 React Native Firebase Configuration:');

try {
  const firebaseApp = getApp();
  console.log('✅ Firebase app initialized successfully');
  console.log('  📱 App Name:', firebaseApp.name);
  console.log('  🆔 Project ID:', firebaseApp.options.projectId);
  console.log('  🗄️ Storage Bucket:', firebaseApp.options.storageBucket);
} catch (error) {
  console.log('⚠️ Firebase app will auto-initialize from native config files');
}

// ============================================
// EXPORTS
// ============================================

export { auth, firestore };
export { getApp } from '@react-native-firebase/app';
export default auth;

export type { FirebaseAuthTypes } from '@react-native-firebase/auth';
export type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';