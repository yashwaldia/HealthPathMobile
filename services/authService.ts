// services/authService.ts

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

// ============================================
// INTERFACES & TYPES
// ============================================

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  createdAt: Date;
  photoURL?: string | null;
  phoneNumber?: string;
  isProfileComplete: boolean;
  isNewUser?: boolean;
  hasPassword?: boolean;
}

export interface ProfileSetupData {
  displayName?: string;
  email?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
}

export interface PhoneSignupCredentials {
  email: string;
  password: string;
  displayName: string;
}

// ============================================
// ERROR HANDLING
// ============================================

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

// ============================================
// PROFILE COMPLETENESS HELPERS
// ============================================

export const checkProfileCompleteness = async (uid: string): Promise<boolean> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return false;
    }

    const userData = userDocSnap.data();

    const requiredFields = [
      userData.displayName,
      userData.email || userData.phoneNumber,
    ];

    const isComplete = requiredFields.every((field) => {
      if (typeof field === 'string') {
        return field && field.trim() !== '' && field !== 'User';
      }
      return !!field;
    });

    return isComplete;
  } catch (error: any) {
    console.error('❌ Check profile completeness error:', error);
    return false;
  }
};

export const markProfileAsComplete = async (uid: string): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      isProfileComplete: true,
      isNewUser: false,
    });
  } catch (error: any) {
    console.error('❌ Mark profile complete error:', error);
    throw new Error('Failed to update profile status.');
  }
};

export const completeProfileSetup = async (
  uid: string,
  profileData: ProfileSetupData
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', uid);

    await updateDoc(userDocRef, {
      displayName: profileData.displayName,
      email: profileData.email,
      dateOfBirth: profileData.dateOfBirth ?? null,
      age: profileData.age ?? null,
      gender: profileData.gender ?? null,
      bloodGroup: profileData.bloodGroup ?? null,
      height: profileData.height ?? null,
      weight: profileData.weight ?? null,
      isProfileComplete: true,
      isNewUser: false,
      updatedAt: new Date(),
    });

    if (profileData.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: profileData.displayName,
      });
    }
  } catch (error: any) {
    console.error('❌ Complete profile setup error:', error);
    throw new Error('Failed to complete profile setup.');
  }
};

// ============================================
// EMAIL AUTHENTICATION
// ============================================

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName });

    const userDoc = {
      uid: user.uid,
      email: user.email,
      displayName,
      createdAt: new Date(),
      photoURL: null,
      phoneNumber: null,
      isNewUser: true,
      isProfileComplete: false,
      hasPassword: true,
    };

    await setDoc(doc(db, 'users', user.uid), userDoc);

    return user;
  } catch (error: any) {
    console.error('❌ Email sign up error:', error.code, error.message);
    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const isComplete = await checkProfileCompleteness(user.uid);

    if (isComplete) {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists() && userDocSnap.data().isProfileComplete !== true) {
        await updateDoc(userDocRef, {
          isProfileComplete: true,
          isNewUser: false,
        });
      }
    }

    return user;
  } catch (error: any) {
    console.error('❌ Sign in error:', error.code, error.message);
    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
};

// ============================================
// PHONE AUTHENTICATION - DISABLED IN EXPO GO
// ============================================

// ⚠️ IMPORTANT: Phone authentication requires @react-native-firebase/auth
// which does NOT work with Expo Go. You need a development build to use phone auth.
//
// Options:
// 1. Build with EAS (eas build --profile development)
// 2. Use a third-party SMS service (Twilio, etc.)
// 3. Remove phone authentication features
//
// For now, these functions will throw an error explaining the limitation.

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^\+\d{10,15}$/;
  return phoneRegex.test(phoneNumber);
};

export const sendPhoneOTP = async (phoneNumber: string): Promise<any> => {
  throw new Error(
    'Phone authentication is not available in Expo Go. Please use email/password authentication or build a development build with EAS.'
  );
};

export const verifyPhoneOTPForSignup = async (
  confirmation: any,
  verificationCode: string,
  credentials: PhoneSignupCredentials
): Promise<User> => {
  throw new Error(
    'Phone authentication is not available in Expo Go. Please use email/password authentication or build a development build with EAS.'
  );
};

export const verifyPhoneOTPForLogin = async (
  confirmation: any,
  verificationCode: string
): Promise<User> => {
  throw new Error(
    'Phone authentication is not available in Expo Go. Please use email/password authentication or build a development build with EAS.'
  );
};

export const verifyPhoneOTP = verifyPhoneOTPForSignup;

export const signUpWithPhone = async (phoneNumber: string): Promise<any> => {
  throw new Error(
    'Phone authentication is not available in Expo Go. Please use email/password authentication or build a development build with EAS.'
  );
};

export const linkPhoneToAccount = async (user: User, phoneNumber: string): Promise<any> => {
  throw new Error(
    'Phone authentication is not available in Expo Go. Please use email/password authentication or build a development build with EAS.'
  );
};

// ============================================
// PHONE + PASSWORD LOGIN (NO OTP)
// ============================================

export const signInWithPhoneAndPassword = async (
  phoneNumber: string,
  password: string
): Promise<User> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('No account found with this phone number. Please sign up first.');
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    if (!userData.email) {
      throw new Error('No email linked to this account. Please contact support.');
    }

    if (!userData.hasPassword) {
      throw new Error('No password set for this account. Please use OTP login or contact support.');
    }

    const userCredential = await signInWithEmailAndPassword(auth, userData.email, password);
    const user = userCredential.user;

    const isComplete = await checkProfileCompleteness(user.uid);
    if (isComplete) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        isProfileComplete: true,
        isNewUser: false,
      });
    }

    return user;
  } catch (error: any) {
    console.error('❌ Phone + password login error:', error);

    if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    }
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later.');
    }
    if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid credentials. Please check your password.');
    }

    if (error.message && !error.code) {
      throw error;
    }

    const userMessage = getErrorMessage(error.code || 'default');
    throw new Error(userMessage);
  }
};

// ============================================
// COMMON AUTHENTICATION
// ============================================

export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('❌ Sign out error:', error.message);
    throw new Error('Failed to sign out. Please try again.');
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('❌ Password reset error:', error.code, error.message);
    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error: any) {
    console.error('❌ Get user profile error:', error.message);
    throw new Error('Failed to load user profile.');
  }
};

// ============================================
// EXPORTS
// ============================================

export const authService = {
  signUpWithEmail,
  signInWithEmail,
  sendPhoneOTP,
  verifyPhoneOTP,
  verifyPhoneOTPForSignup,
  verifyPhoneOTPForLogin,
  signUpWithPhone,
  signInWithPhoneAndPassword,
  validatePhoneNumber,
  linkPhoneToAccount,
  checkProfileCompleteness,
  markProfileAsComplete,
  completeProfileSetup,
  logOut,
  resetPassword,
  getUserProfile,
};

export default authService;
