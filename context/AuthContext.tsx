// context/AuthContext.tsx

/**
 * Auth Context - Firebase Authentication State Management
 * * ✅ PHASE 2 P0 FIX: Added Self-Healing Mechanism
 * Fixed Edge Cases: 1.1, 1.2, 1.3, 1.5, 5.1, 7.1
 * * New Features:
 * - Self-Healing Auth (Auto-recreates missing profiles)
 * - Network connectivity monitoring
 * - Stale session detection
 * - Auto-logout recovery mechanism
 */

import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import auth from '@react-native-firebase/auth';
import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { checkProfileCompleteness, getUserProfile } from '../services/authService';
import { profileService } from '../services/profileService'; // ✅ Added Import

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  isNewUser: boolean;
  isProfileComplete: boolean;
  needsProfileSetup: boolean;
  refreshProfileStatus: () => Promise<void>;
  
  // Orphaned auth detection
  hasOrphanedAuth: boolean;
  forceLogout: () => Promise<void>;
  
  // Network state monitoring
  isOnline: boolean;
  
  // Session validation
  isSessionStale: boolean;
  revalidateSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isNewUser: false,
  isProfileComplete: false,
  needsProfileSetup: false,
  refreshProfileStatus: async () => {},
  hasOrphanedAuth: false,
  forceLogout: async () => {},
  isOnline: true,
  isSessionStale: false,
  revalidateSession: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  
  // Orphaned auth state
  const [hasOrphanedAuth, setHasOrphanedAuth] = useState(false);
  
  // Network connectivity state
  const [isOnline, setIsOnline] = useState(true);
  
  // Session staleness state
  const [isSessionStale, setIsSessionStale] = useState(false);

  /**
   * ✅ PHASE 2 P0: Self-Healing Profile Check
   * * CRITICAL FIXES:
   * - Edge Case 1.1: If Profile is missing, RECREATE it instead of logging out.
   * - Edge Case 7.1: Handles offline scenarios gracefully.
   */
  const checkUserProfileStatus = async (uid: string) => {
    try {
      console.log('🔍 Checking profile status for user:', uid);
      
      // ✅ Check network connectivity first
      if (!isOnline) {
        console.log('⚠️ Offline - skipping profile check');
        setHasOrphanedAuth(false);
        return;
      }

      let userProfile = await getUserProfile(uid);

      // ============================================================
      // ✅ SELF-HEALING MECHANISM (Fix for your error)
      // ============================================================
      if (!userProfile) {
        console.warn('⚠️ ORPHANED AUTH DETECTED: Auth exists but Profile missing.');
        console.log('🛠️ Attempting to self-heal profile...');

        try {
          // Get current auth details to repopulate profile
          const currentUser = auth().currentUser;
          
          if (currentUser) {
            // Attempt to recreate the profile immediately
            // Note: profileService.createProfile handles 'undefined' checks internally
            await profileService.createProfile(uid, {
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL
            });
            
            console.log('✅ Profile successfully self-healed! Re-fetching...');
            
            // Re-fetch the profile after creation
            userProfile = await getUserProfile(uid);
          } else {
             throw new Error('No current user found for self-healing');
          }
        } catch (healError) {
          console.error('❌ Self-healing failed:', healError);
          // Only trigger the "Orphaned" state if self-healing fails
          setHasOrphanedAuth(true);
          setIsNewUser(true);
          setIsProfileComplete(false);
          
          console.log('💡 Self-healing failed. User must re-authenticate.');
          return;
        }
      }

      // ✅ Profile exists (either originally or healed) - clear orphaned state
      setHasOrphanedAuth(false);

      // Use Optional Chaining in case self-healing returned a partial object
      const newUserStatus = userProfile?.isNewUser ?? false;
      const profileCompleteStatus = userProfile?.isProfileComplete ?? false;

      setIsNewUser(newUserStatus);
      setIsProfileComplete(profileCompleteStatus);

      console.log('📊 Profile Status:');
      console.log('  - isNewUser:', newUserStatus);
      console.log('  - isProfileComplete:', profileCompleteStatus);
      console.log('  - hasOrphanedAuth:', false);

      // Verify completeness if marked as incomplete
      if (profileCompleteStatus === false) {
        const actuallyComplete = await checkProfileCompleteness(uid);
        setIsProfileComplete(actuallyComplete);
        console.log('  - Verified completeness:', actuallyComplete);
      }
    } catch (error: any) {
      console.error('❌ Error checking profile status:', error);
      
      // ✅ Handle network errors specifically
      if (error?.message?.includes('network') || error?.code === 'unavailable') {
        console.log('⚠️ Network error during profile check - not marking as orphaned');
        setHasOrphanedAuth(false);
      } else if (error?.code === 'permission-denied') {
        // Permission denied usually means the doc doesn't exist AND we can't create it
        // Check Firestore Rules if this persists
        console.error('🚨 Profile access error - possible orphaned auth');
        setHasOrphanedAuth(true);
      } else {
        // Safe fallback for other errors
        setIsNewUser(false);
        setIsProfileComplete(true);
      }
    }
  };

  /**
   * ✅ Session validation to detect stale tokens
   */
  const revalidateSession = useCallback(async () => {
    if (!user) {
      setIsSessionStale(false);
      return;
    }

    try {
      console.log('🔍 Validating session freshness...');
      
      // Get current token and check its creation time
      const tokenResult = await user.getIdTokenResult();
      const authTime = new Date(tokenResult.authTime);
      const now = new Date();
      
      // Session is stale if older than 1 hour
      const sessionAgeMinutes = (now.getTime() - authTime.getTime()) / (1000 * 60);
      const isStale = sessionAgeMinutes > 60;
      
      setIsSessionStale(isStale);
      
      if (isStale) {
        console.warn('⚠️ Session is stale (>1 hour old).');
      } else {
        console.log('✅ Session is fresh');
      }
    } catch (error) {
      console.error('❌ Error validating session:', error);
      setIsSessionStale(true); // Assume stale on error
    }
  }, [user]);

  /**
   * ✅ Force logout for recovery
   */
  const forceLogout = useCallback(async () => {
    try {
      console.log('🚪 Force logout initiated...');
      
      // Clear all local state first
      setUser(null);
      setIsNewUser(false);
      setIsProfileComplete(false);
      setHasOrphanedAuth(false);
      setIsSessionStale(false);
      
      // Sign out from Firebase
      await auth().signOut();
      
      console.log('✅ Force logout successful');
    } catch (error) {
      console.error('❌ Error during force logout:', error);
      
      // Even if signOut fails, clear local state
      setUser(null);
      setIsNewUser(false);
      setIsProfileComplete(false);
      setHasOrphanedAuth(false);
      setIsSessionStale(false);
    }
  }, []);

  /**
   * Refresh profile status manually
   */
  const refreshProfileStatus = async () => {
    if (user?.uid) {
      console.log('🔄 Manually refreshing profile status...');
      await checkUserProfileStatus(user.uid);
      await revalidateSession();
    }
  };

  /**
   * ✅ Network state monitoring
   */
  useEffect(() => {
    console.log('🌐 Setting up network monitoring...');
    
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? true;
      setIsOnline(online);
      
      if (online) {
        console.log('✅ Network online');
      } else {
        console.warn('⚠️ Network offline');
      }
    });

    return () => {
      console.log('🔌 Cleaning up network monitoring');
      unsubscribe();
    };
  }, []);

  /**
   * ✅ Auth state listener
   */
  useEffect(() => {
    let isMounted = true;
    console.log('🚀 Initializing auth state with React Native Firebase...');

    const unsubscribe = auth().onAuthStateChanged(
      async (firebaseUser: FirebaseAuthTypes.User | null) => {
        if (!isMounted) return;

        console.log('🔐 Auth state changed:', firebaseUser?.uid || 'No user');

        if (firebaseUser) {
          console.log('✅ User authenticated:', firebaseUser.uid);
          
          setUser(firebaseUser);
          
          // Check profile AND session with the new self-healing logic
          await checkUserProfileStatus(firebaseUser.uid);
          await revalidateSession();
        } else {
          console.log('👤 No authenticated user');
          setUser(null);
          setIsNewUser(false);
          setIsProfileComplete(false);
          setHasOrphanedAuth(false);
          setIsSessionStale(false);
        }

        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      console.log('🔌 Cleaning up auth state listener');
      unsubscribe();
    };
  }, [revalidateSession]);

  /**
   * ✅ Periodic session validation
   */
  useEffect(() => {
    if (!user) return;

    console.log('⏰ Starting periodic session validation...');
    
    // Check immediately
    revalidateSession();
    
    // Then check every 5 minutes
    const interval = setInterval(() => {
      console.log('⏰ Periodic session check...');
      revalidateSession();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      console.log('🔌 Cleaning up session validation timer');
      clearInterval(interval);
    };
  }, [user, revalidateSession]);

  /**
   * Needs profile setup detection
   */
  const needsProfileSetup = !!user && (isNewUser || !isProfileComplete || hasOrphanedAuth);

  const contextValue: AuthContextType = {
    user,
    loading,
    isNewUser,
    isProfileComplete,
    needsProfileSetup,
    refreshProfileStatus,
    hasOrphanedAuth,
    forceLogout,
    isOnline,
    isSessionStale,
    revalidateSession,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};