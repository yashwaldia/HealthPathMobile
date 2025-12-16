// context/AuthContext.tsx

import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import auth from '@react-native-firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { checkProfileCompleteness, getUserProfile } from '../services/authService';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  isNewUser: boolean;
  isProfileComplete: boolean;
  needsProfileSetup: boolean;
  refreshProfileStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isNewUser: false,
  isProfileComplete: false,
  needsProfileSetup: false,
  refreshProfileStatus: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const checkUserProfileStatus = async (uid: string) => {
    try {
      console.log('🔍 Checking profile status for user:', uid);
      const userProfile = await getUserProfile(uid);

      if (userProfile) {
        const newUserStatus = userProfile.isNewUser ?? false;
        const profileCompleteStatus = userProfile.isProfileComplete ?? false;

        setIsNewUser(newUserStatus);
        setIsProfileComplete(profileCompleteStatus);

        console.log('📊 Profile Status:');
        console.log('  - isNewUser:', newUserStatus);
        console.log('  - isProfileComplete:', profileCompleteStatus);

        if (profileCompleteStatus === false) {
          const actuallyComplete = await checkProfileCompleteness(uid);
          setIsProfileComplete(actuallyComplete);
          console.log('  - Verified completeness:', actuallyComplete);
        }
      } else {
        console.log('⚠️ User profile not found in Firestore');
        setIsNewUser(true);
        setIsProfileComplete(false);
      }
    } catch (error) {
      console.error('❌ Error checking profile status:', error);
      setIsNewUser(false);
      setIsProfileComplete(true);
    }
  };

  const refreshProfileStatus = async () => {
    if (user?.uid) {
      console.log('🔄 Manually refreshing profile status...');
      await checkUserProfileStatus(user.uid);
    }
  };

  useEffect(() => {
    let isMounted = true;
    console.log('🚀 Initializing auth state with React Native Firebase...');

    const unsubscribe = auth().onAuthStateChanged(
      async (firebaseUser: FirebaseAuthTypes.User | null) => {
        if (!isMounted) return;

        console.log('🔐 Auth state changed:', firebaseUser?.uid || 'No user');

        if (firebaseUser) {
          console.log('✅ User authenticated:', firebaseUser.uid);
          console.log('📱 Native auth persistence: Automatic');
          setUser(firebaseUser);
          await checkUserProfileStatus(firebaseUser.uid);
        } else {
          console.log('👤 No authenticated user');
          setUser(null);
          setIsNewUser(false);
          setIsProfileComplete(false);
        }

        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      console.log('🔌 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const needsProfileSetup = !!user && (isNewUser || !isProfileComplete);

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
