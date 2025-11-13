import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  photoURL?: string;
}

// Helper function to convert Firebase error codes to user-friendly messages
const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please login instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign up is not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    default:
      return 'An error occurred. Please try again.';
  }
};

// Sign Up with Email and Password
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  try {
    console.log('🔐 Starting sign up process...');
    console.log('📧 Email:', email);
    console.log('👤 Display Name:', displayName);

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ User created in Firebase Auth:', user.uid);

    // Update user profile with display name
    await updateProfile(user, { displayName });
    console.log('✅ Profile updated with display name');

    // Create user document in Firestore
    const userDoc = {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      createdAt: new Date(),
      photoURL: null,
    };

    await setDoc(doc(db, 'users', user.uid), userDoc);
    console.log('✅ User document created in Firestore');
    console.log('🎉 Sign up successful!');

    return user;
  } catch (error: any) {
    console.error('❌ Sign up error:', error.code, error.message);
    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
};

// Sign In with Email and Password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    console.log('🔐 Starting sign in process...');
    console.log('📧 Email:', email);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Sign in successful!');
    console.log('👤 User:', userCredential.user.uid);

    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Sign in error:', error.code, error.message);
    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
};

// Sign Out
export const logOut = async (): Promise<void> => {
  try {
    console.log('🔐 Signing out...');
    await signOut(auth);
    console.log('✅ Sign out successful!');
  } catch (error: any) {
    console.error('❌ Sign out error:', error.message);
    throw new Error('Failed to sign out. Please try again.');
  }
};

// Password Reset
export const resetPassword = async (email: string): Promise<void> => {
  try {
    console.log('🔐 Sending password reset email to:', email);
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent!');
  } catch (error: any) {
    console.error('❌ Password reset error:', error.code, error.message);
    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
};

// Get User Profile from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    console.log('📄 Fetching user profile for:', uid);
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log('✅ User profile found');
      return docSnap.data() as UserProfile;
    }
    console.log('⚠️ User profile not found');
    return null;
  } catch (error: any) {
    console.error('❌ Get user profile error:', error.message);
    throw new Error('Failed to load user profile.');
  }
};