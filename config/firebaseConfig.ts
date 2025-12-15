// config/firebaseConfig.ts

// Import React Native Firebase modules using require to avoid ES module issues
const firebaseApp = require('@react-native-firebase/app').default;
const authModule = require('@react-native-firebase/auth').default;
const firestoreModule = require('@react-native-firebase/firestore').default;
const storageModule = require('@react-native-firebase/storage').default;

// Note: React Native Firebase automatically initializes from native config files
// (google-services.json for Android, GoogleService-Info.plist for iOS)

console.log('🔥 React Native Firebase Configuration:');

// Get the default app instance
let app;
try {
  app = firebaseApp.app();
  console.log('✅ Using existing Firebase app instance');
} catch (error) {
  console.log('⚠️ Firebase app will be initialized from native config files');
  // App will auto-initialize on first use
}

// Get Firebase service instances
const auth = authModule();
const db = firestoreModule();
const storage = storageModule();

console.log('✅ React Native Firebase Auth initialized (native)');
console.log('✅ React Native Firestore initialized');
console.log('✅ React Native Firebase Storage initialized');
console.log('📱 Native auth persistence: Automatic via React Native Firebase');

// Log app info if available
if (app) {
  console.log('  Project ID:', app.options?.projectId || 'Will load from native config');
  console.log('  Storage Bucket:', app.options?.storageBucket || 'Will load from native config');
}

// Export Firebase services with consistent naming
export { auth, db, storage };

// Also export with 'rn' prefix for clarity
export { auth as rnAuth, db as rnDb, storage as rnStorage };

// Export the app if needed
export default app;