// services/authService.ts

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  RecaptchaVerifier,
  ConfirmationResult,
  signInWithPhoneNumber as firebaseSignInWithPhoneNumber,
  EmailAuthProvider,
  linkWithCredential,
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
    case 'auth/invalid-phone-number':
      return 'Invalid phone number. Please check the format (+[country code][number]).';
    case 'auth/missing-phone-number':
      return 'Please enter a phone number.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded. Please try again later.';
    case 'auth/invalid-verification-code':
      return 'Invalid verification code. Please try again.';
    case 'auth/code-expired':
      return 'Verification code has expired. Please request a new one.';
    case 'auth/session-expired':
      return 'Session expired. Please restart the verification process.';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA verification failed. Please try again.';
    case 'auth/missing-verification-code':
      return 'Please enter the verification code.';
    case 'auth/phone-number-already-exists':
      return 'This phone number is already registered.';
    case 'auth/provider-already-linked':
      return 'This credential is already linked to your account.';
    case 'auth/credential-already-in-use':
      return 'This credential is already associated with a different account.';
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
// PHONE AUTHENTICATION
// ============================================

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^\+\d{10,15}$/;
  return phoneRegex.test(phoneNumber);
};

export const sendPhoneOTP = async (
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  try {
    if (!validatePhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format. Use +[country code][number]');
    }

    const confirmationResult = await firebaseSignInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );

    return confirmationResult;
  } catch (error: any) {
    console.error('❌ Send OTP error:', error.code, error.message);
    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
};

const confirmOTPAndGetUser = async (
  confirmationResult: ConfirmationResult,
  verificationCode: string
): Promise<User> => {
  if (!/^\d{6}$/.test(verificationCode)) {
    throw new Error('Verification code must be 6 digits');
  }

  const userCredential = await confirmationResult.confirm(verificationCode);
  const user = userCredential.user;

  return user;
};

const ensureEmailPasswordLinked = async (
  user: User,
  email: string,
  password: string
): Promise<void> => {
  try {
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(user, credential);
    
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, { 
      hasPassword: true,
      email: email
    });
  } catch (error: any) {
    if (error.code === 'auth/provider-already-linked') {
      return;
    }
    
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered with another account. Please use a different email.');
    }
    
    if (error.code === 'auth/credential-already-in-use') {
      throw new Error('This email is already in use by another account.');
    }
    
    console.error('❌ Linking email/password failed:', error.code, error.message);
    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
};

// ✅ UPDATED: Now uses credentials.displayName
export const verifyPhoneOTPForSignup = async (
  confirmationResult: ConfirmationResult,
  verificationCode: string,
  credentials: PhoneSignupCredentials
): Promise<User> => {
  try {
    const user = await confirmOTPAndGetUser(confirmationResult, verificationCode);

    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      const userDoc: UserProfile = {
        uid: user.uid,
        email: credentials.email,
        displayName: credentials.displayName, // ✅ CHANGE: Use credentials.displayName instead of user.displayName
        phoneNumber: user.phoneNumber || undefined,
        createdAt: new Date(),
        photoURL: user.photoURL || null,
        isNewUser: true,
        isProfileComplete: false,
        hasPassword: false,
      };

      await setDoc(userDocRef, userDoc);
      
      // ✅ CHANGE: Update Firebase Auth displayName with the provided name
      await updateProfile(user, { displayName: credentials.displayName });
    } else {
      await updateDoc(userDocRef, { 
        email: credentials.email,
        displayName: credentials.displayName, // ✅ CHANGE: Update displayName if doc exists
      });
      
      // ✅ CHANGE: Update Firebase Auth displayName
      await updateProfile(user, { displayName: credentials.displayName });
    }

    await ensureEmailPasswordLinked(user, credentials.email, credentials.password);

    return user;
  } catch (error: any) {
    console.error('❌ Verify OTP (signup) error:', error);
    
    if (error.message && !error.code) {
      throw error;
    }
    
    const userMessage = getErrorMessage(error.code || 'default');
    throw new Error(userMessage);
  }
};

export const verifyPhoneOTPForLogin = async (
  confirmationResult: ConfirmationResult,
  verificationCode: string
): Promise<User> => {
  try {
    const user = await confirmOTPAndGetUser(confirmationResult, verificationCode);

    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new Error('No account found for this phone number. Please sign up first.');
    }

    const isComplete = await checkProfileCompleteness(user.uid);

    if (isComplete && userDocSnap.data().isProfileComplete !== true) {
      await updateDoc(userDocRef, {
        isProfileComplete: true,
        isNewUser: false,
      });
    }

    return user;
  } catch (error: any) {
    if (error.code) {
      console.error('❌ Verify OTP (login) error:', error.code, error.message);
      const userMessage = getErrorMessage(error.code);
      throw new Error(userMessage);
    }

    console.error('❌ Verify OTP (login) error:', error.message || error);
    throw new Error(error.message || 'Failed to verify phone number. Please try again.');
  }
};

export const verifyPhoneOTP = verifyPhoneOTPForSignup;

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
// PHONE SIGNUP / LINK HELPERS
// ============================================

export const signUpWithPhone = async (
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  try {
    return await sendPhoneOTP(phoneNumber, recaptchaVerifier);
  } catch (error: any) {
    console.error('❌ Phone sign up error:', error);
    throw error;
  }
};

export const linkPhoneToAccount = async (
  user: User,
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  try {
    if (!validatePhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    const confirmationResult = await firebaseSignInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );

    return confirmationResult;
  } catch (error: any) {
    console.error('❌ Link phone error:', error.code, error.message);
    const userMessage = getErrorMessage(error.code);
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