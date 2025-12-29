// config/firebaseConfig.ts

/**
 * Firebase Configuration for React Native
 * 
 * React Native Firebase automatically initializes from native config files:
 * - Android: google-services.json
 * - iOS: GoogleService-Info.plist
 * 
 * Native persistence is handled automatically - no additional configuration needed.
 */

import { getApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import appCheck from '@react-native-firebase/app-check';

// ============================================
// FIREBASE APP CHECK INITIALIZATION
// ============================================

const rnfbProvider = appCheck().newReactNativeFirebaseAppCheckProvider();
rnfbProvider.configure({
  android: {
    provider: 'playIntegrity',
  },
});

appCheck().initializeAppCheck({ 
  provider: rnfbProvider, 
  isTokenAutoRefreshEnabled: true 
});

console.log('✅ Firebase App Check initialized with Play Integrity');

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
  console.log('   This is normal on first load.');
}

// ============================================
// FIREBASE SERVICES
// ============================================

console.log('✅ React Native Firebase Auth initialized');
console.log('✅ React Native Firestore initialized');
console.log('📱 Native auth persistence: Automatic (no AsyncStorage needed)');
console.log('✅ Firestore offline persistence enabled (default)');

// ============================================
// EXPORTS
// ============================================

// Export auth and firestore modules
export { auth, firestore };

// Export getApp for accessing the Firebase app instance if needed
export { getApp } from '@react-native-firebase/app';

// Default export
export default auth;

// Type exports for TypeScript consumers
export type { FirebaseAuthTypes } from '@react-native-firebase/auth';
export type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
