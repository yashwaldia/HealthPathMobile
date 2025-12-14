// context/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebaseConfig';
import { getUserProfile, checkProfileCompleteness } from '../services/authService';

// ============================================
// CONSTANTS
// ============================================

const AUTH_PERSISTENCE_KEY = '@healthpath_auth_user';

// ============================================
// INTERFACES
// ============================================

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isNewUser: boolean;
  isProfileComplete: boolean;
  needsProfileSetup: boolean;
  refreshProfileStatus: () => Promise<void>;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isNewUser: false,
  isProfileComplete: false,
  needsProfileSetup: false,
  refreshProfileStatus: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ============================================
// PROVIDER
// ============================================

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // ============================================
  // ASYNCSTORAGE PERSISTENCE HELPERS
  // ============================================

  // Save user UID to AsyncStorage
  const saveUserToStorage = async (uid: string) => {
    try {
      await AsyncStorage.setItem(AUTH_PERSISTENCE_KEY, uid);
      console.log('💾 User UID saved to AsyncStorage:', uid);
    } catch (error) {
      console.error('❌ Error saving user to AsyncStorage:', error);
    }
  };

  // Remove user from AsyncStorage
  const removeUserFromStorage = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_PERSISTENCE_KEY);
      console.log('🗑️ User removed from AsyncStorage');
    } catch (error) {
      console.error('❌ Error removing user from AsyncStorage:', error);
    }
  };

  // Get stored user UID from AsyncStorage
  const getStoredUserUID = async (): Promise<string | null> => {
    try {
      const uid = await AsyncStorage.getItem(AUTH_PERSISTENCE_KEY);
      console.log('📥 Retrieved stored user UID:', uid || 'None');
      return uid;
    } catch (error) {
      console.error('❌ Error retrieving user from AsyncStorage:', error);
      return null;
    }
  };

  // ============================================
  // PROFILE STATUS CHECKS
  // ============================================

  // Check profile status for a given user
  const checkUserProfileStatus = async (uid: string) => {
    try {
      console.log('🔍 Checking profile status for user:', uid);

      const userProfile = await getUserProfile(uid);

      if (userProfile) {
        const newUserStatus = (userProfile as any).isNewUser ?? false;
        const profileCompleteStatus = (userProfile as any).isProfileComplete ?? false;

        setIsNewUser(newUserStatus);
        setIsProfileComplete(profileCompleteStatus);

        console.log('📊 Profile Status:');
        console.log('  - isNewUser:', newUserStatus);
        console.log('  - isProfileComplete:', profileCompleteStatus);

        // If profileComplete flag is false, run a deeper completeness check
        if (profileCompleteStatus === false) {
          const actuallyComplete = await checkProfileCompleteness(uid);
          setIsProfileComplete(actuallyComplete);
          console.log('  - Verified completeness:', actuallyComplete);
        }
      } else {
        console.log('⚠️ User profile not found in Firestore');
        // Treat as new user with incomplete profile
        setIsNewUser(true);
        setIsProfileComplete(false);
      }
    } catch (error) {
      console.error('❌ Error checking profile status:', error);
      // Fail-safe: do not block app; assume not new and complete
      setIsNewUser(false);
      setIsProfileComplete(true);
    }
  };

  // Manual refresh after saving from /settings screen
  const refreshProfileStatus = async () => {
    if (user?.uid) {
      console.log('🔄 Manually refreshing profile status...');
      await checkUserProfileStatus(user.uid);
    }
  };

  // ============================================
  // AUTH STATE INITIALIZATION
  // ============================================

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      console.log('🚀 Initializing auth state...');

      // Check if we have a stored user UID
      const storedUID = await getStoredUserUID();

      // Set up Firebase auth state listener
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;

        console.log('🔐 Auth state changed:', firebaseUser?.uid || 'No user');

        if (firebaseUser) {
          // User is signed in
          setUser(firebaseUser);
          await saveUserToStorage(firebaseUser.uid);
          await checkUserProfileStatus(firebaseUser.uid);
        } else {
          // User is signed out
          setUser(null);
          await removeUserFromStorage();
          setIsNewUser(false);
          setIsProfileComplete(false);
        }

        setLoading(false);
      });

      // If we have a stored UID but Firebase hasn't detected the user yet,
      // wait a bit for Firebase to restore the session
      if (storedUID && !auth.currentUser) {
        console.log('⏳ Waiting for Firebase to restore session...');
        // Give Firebase 2 seconds to restore the session
        setTimeout(() => {
          if (isMounted && !auth.currentUser) {
            console.log('⚠️ Firebase session not restored, clearing storage');
            removeUserFromStorage();
            setLoading(false);
          }
        }, 2000);
      }

      return unsubscribe;
    };

    let unsubscribe: (() => void) | undefined;

    initializeAuth().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      isMounted = false;
      if (unsubscribe) {
        console.log('🔌 Cleaning up auth state listener');
        unsubscribe();
      }
    };
  }, []);

  // Derived flag: use this in layout to force redirect to /settings
  const needsProfileSetup = !!user && (isNewUser || !isProfileComplete);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const contextValue: AuthContextType = {
    user,
    loading,
    isNewUser,
    isProfileComplete,
    needsProfileSetup,
    refreshProfileStatus,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
