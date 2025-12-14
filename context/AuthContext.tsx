// context/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { getUserProfile, checkProfileCompleteness } from '../services/authService';

// ============================================
// INTERFACES
// ============================================

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isNewUser: boolean;
  isProfileComplete: boolean;
  // Optional convenience flag for routing (new user OR incomplete profile)
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
  // AUTH STATE LISTENER
  // ============================================

  useEffect(() => {
    console.log('👂 Setting up auth state listener...');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser?.uid || 'No user');

      setUser(firebaseUser);

      if (firebaseUser?.uid) {
        await checkUserProfileStatus(firebaseUser.uid);
      } else {
        setIsNewUser(false);
        setIsProfileComplete(false);
      }

      setLoading(false);
    });

    return () => {
      console.log('🔌 Cleaning up auth state listener');
      unsubscribe();
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
