// services/authService.ts

/**
 * Authentication Service
 * Handles Firebase Auth operations (Login, Signup, OTP, Password Reset)
 * * ✅ PHASE 2 P2: Integration with Profile Service
 * - Connects Auth creation with Firestore Profile creation
 * - Uses profileService for safe database writes
 * - Robust error handling for "Orphaned Auth" prevention
 */

import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { profileService } from './profileService'; // ✅ Import profileService

// ============================================
// INTERFACES & TYPES
// ============================================

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  createdAt: string; // Changed to string to match Firestore ISO format
  photoURL?: string | null;
  phoneNumber?: string | null;
  isProfileComplete: boolean;
  isNewUser?: boolean;
  hasPassword?: boolean;
  // Add other profile fields as needed
  profile?: any;
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
    case 'auth/invalid-verification-code':
      return 'Invalid verification code. Please try again.';
    case 'auth/session-expired':
      return 'Verification session expired. Please request a new code.';
    case 'auth/credential-already-in-use':
      return 'This email is already registered. Please use a different email or login instead.';
    default:
      return 'An error occurred. Please try again.';
  }
};

// ============================================
// PROFILE COMPLETENESS HELPERS
// ============================================

export const checkProfileCompleteness = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await firestore().collection('users').doc(uid).get();

    // ✅ FIXED: .exists is a property, not a function
    if (!userDoc.exists) {
      return false;
    }

    const userData = userDoc.data();
    if (!userData) {
      return false;
    }

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
    await firestore().collection('users').doc(uid).update({
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
    // Clean undefined values before update
    const updateData: any = {
      displayName: profileData.displayName,
      email: profileData.email,
      isProfileComplete: true,
      isNewUser: false,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    // Add optional fields only if they exist
    if (profileData.dateOfBirth) updateData.dateOfBirth = profileData.dateOfBirth;
    if (profileData.age) updateData.age = profileData.age;
    if (profileData.gender) updateData.gender = profileData.gender;
    if (profileData.bloodGroup) updateData.bloodGroup = profileData.bloodGroup;
    if (profileData.height) updateData.height = profileData.height;
    if (profileData.weight) updateData.weight = profileData.weight;

    await firestore().collection('users').doc(uid).update(updateData);

    // Update display name in Auth
    if (profileData.displayName) {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.updateProfile({
          displayName: profileData.displayName,
        });
      }
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
): Promise<FirebaseAuthTypes.User> => {
  try {
    // 1. Create Auth User
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // 2. Update Auth Profile
    await user.updateProfile({ displayName });

    // 3. Create Firestore Profile using ProfileService
    // ✅ FIX: Use profileService to handle 'undefined' values safely and ensure consistency
    console.log('📝 Creating Firestore profile for new email user...');
    try {
      await profileService.createProfile(user.uid, {
        email: user.email,
        displayName: displayName,
        photoURL: null,
      });
      console.log('✅ Firestore profile created successfully');
    } catch (profileError) {
      // ⚠️ Critical: If this fails, AuthContext self-healing will catch it later.
      // We do NOT want to throw an error here, because the Auth user IS created.
      console.error('⚠️ Firestore profile creation failed (will attempt self-heal later):', profileError);
    }

    return user;
  } catch (error: any) {
    console.error('❌ Email sign up error:', error.code, error.message);
    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<FirebaseAuthTypes.User> => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Check profile completeness
    const isComplete = await checkProfileCompleteness(user.uid);

    if (isComplete) {
      const userDoc = await firestore().collection('users').doc(user.uid).get();

      if (userDoc.exists && userDoc.data()?.isProfileComplete !== true) {
        await firestore().collection('users').doc(user.uid).update({
          isProfileComplete: true,
          isNewUser: false,
        });
      }
    }

    console.log('✅ Email login successful');
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
  phoneNumber: string
): Promise<FirebaseAuthTypes.ConfirmationResult> => {
  try {
    console.log('📞 Sending OTP to:', phoneNumber);
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    console.log('✅ OTP sent successfully');
    return confirmation;
  } catch (error: any) {
    console.error('❌ Send OTP error:', error);
    throw new Error(error.message || 'Failed to send OTP. Please try again.');
  }
};

export const verifyPhoneOTPForSignup = async (
  confirmation: FirebaseAuthTypes.ConfirmationResult,
  verificationCode: string,
  credentials: PhoneSignupCredentials
): Promise<FirebaseAuthTypes.User> => {
  try {
    console.log('🔐 Verifying OTP for signup...');

    // Step 1: Confirm the OTP
    const phoneUserCredential = await confirmation.confirm(verificationCode);

    if (!phoneUserCredential || !phoneUserCredential.user) {
      throw new Error('Failed to verify OTP. Please try again.');
    }

    const phoneUser = phoneUserCredential.user;
    console.log('✅ Phone verified:', phoneUser.phoneNumber);

    // Step 2: Link email/password to the phone-authenticated user
    const emailCredential = auth.EmailAuthProvider.credential(
      credentials.email,
      credentials.password
    );

    await phoneUser.linkWithCredential(emailCredential);
    console.log('✅ Email/password linked to phone account');

    // Step 3: Update display name
    await phoneUser.updateProfile({ displayName: credentials.displayName });

    // Step 4: Create Firestore Profile
    // ✅ FIX: Use profileService to handle creation safely
    console.log('📝 Creating Firestore profile for new phone user...');
    try {
      await profileService.createProfile(phoneUser.uid, {
        email: credentials.email,
        displayName: credentials.displayName,
        photoURL: null,
      });
      console.log('✅ Firestore profile created successfully');
    } catch (profileError) {
      console.error('⚠️ Firestore profile creation failed (will attempt self-heal later):', profileError);
    }

    return phoneUser;
  } catch (error: any) {
    console.error('❌ Verify OTP for signup error:', error);

    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid verification code. Please try again.');
    }

    if (error.code === 'auth/session-expired') {
      throw new Error('Verification code expired. Please request a new one.');
    }

    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
};

export const verifyPhoneOTPForLogin = async (
  confirmation: FirebaseAuthTypes.ConfirmationResult,
  verificationCode: string
): Promise<FirebaseAuthTypes.User> => {
  try {
    console.log('🔐 Verifying OTP for login...');

    // Confirm the OTP
    const userCredential = await confirmation.confirm(verificationCode);

    if (!userCredential || !userCredential.user) {
      throw new Error('Failed to verify OTP. Please try again.');
    }

    const phoneUser = userCredential.user;
    console.log('✅ Phone verified');

    // Check if user exists in Firestore
    const querySnapshot = await firestore()
      .collection('users')
      .where('phoneNumber', '==', phoneUser.phoneNumber)
      .get();

    if (querySnapshot.empty) {
      // Note: In some flows, this might be a new user via phone who needs profile creation.
      // But for strict "Login" flow, we often expect them to exist.
      // If your app supports auto-signup on login, remove this check.
      // For now, keeping it consistent with your original logic.
      throw new Error('No account found with this phone number. Please sign up first.');
    }

    const userDocData = querySnapshot.docs[0].data();

    // Check profile completeness
    const isComplete = await checkProfileCompleteness(userDocData.uid);
    if (isComplete) {
      await firestore().collection('users').doc(userDocData.uid).update({
        isProfileComplete: true,
        isNewUser: false,
      });
    }

    console.log('✅ Phone login successful');
    return phoneUser;
  } catch (error: any) {
    console.error('❌ Verify OTP for login error:', error);

    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid verification code. Please try again.');
    }

    if (error.code === 'auth/session-expired') {
      throw new Error('Verification code expired. Please request a new one.');
    }

    if (error.message && !error.code) {
      throw error;
    }

    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
};

export const signInWithPhoneAndPassword = async (
  phoneNumber: string,
  password: string
): Promise<FirebaseAuthTypes.User> => {
  try {
    // Find user by phone number in Firestore
    const querySnapshot = await firestore()
      .collection('users')
      .where('phoneNumber', '==', phoneNumber)
      .get();

    if (querySnapshot.empty) {
      throw new Error('No account found with this phone number. Please sign up first.');
    }

    const userData = querySnapshot.docs[0].data();

    if (!userData.email) {
      throw new Error('No email linked to this account. Please contact support.');
    }

    if (!userData.hasPassword) {
      throw new Error('No password set for this account. Please use OTP login or contact support.');
    }

    // Sign in with email and password
    const userCredential = await auth().signInWithEmailAndPassword(userData.email, password);
    const user = userCredential.user;

    // Check profile completeness
    const isComplete = await checkProfileCompleteness(user.uid);
    if (isComplete) {
      await firestore().collection('users').doc(user.uid).update({
        isProfileComplete: true,
        isNewUser: false,
      });
    }

    console.log('✅ Phone + password login successful');
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
    await auth().signOut();
    console.log('✅ User signed out successfully');
  } catch (error: any) {
    console.error('❌ Sign out error:', error.message);
    throw new Error('Failed to sign out. Please try again.');
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await auth().sendPasswordResetEmail(email);
    console.log('✅ Password reset email sent');
  } catch (error: any) {
    console.error('❌ Password reset error:', error.code, error.message);
    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docSnap = await firestore().collection('users').doc(uid).get();

    // ✅ FIXED: .exists is a property, not a function
    if (docSnap.exists) {
      const data = docSnap.data();
      return {
        ...data,
        // Ensure date fields are converted to strings/dates as expected
        createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      } as UserProfile;
    }
    return null;
  } catch (error: any) {
    console.error('❌ Get user profile error:', error.message);
    // Return null instead of throwing so AuthContext doesn't crash entirely
    return null;
  }
};

// ============================================
// EXPORTS
// ============================================

export const authService = {
  signUpWithEmail,
  signInWithEmail,
  sendPhoneOTP,
  verifyPhoneOTPForSignup,
  verifyPhoneOTPForLogin,
  signInWithPhoneAndPassword,
  validatePhoneNumber,
  checkProfileCompleteness,
  markProfileAsComplete,
  completeProfileSetup,
  logOut,
  resetPassword,
  getUserProfile,
};

export default authService;