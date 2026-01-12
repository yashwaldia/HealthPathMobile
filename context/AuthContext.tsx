// context/AuthContext.tsx

/**
 * Auth Context - Firebase Authentication State Management
 * 
 * ✅ PHASE 1 P0: Enhanced authentication state management
 * Fixed Edge Cases: 1.1, 1.2, 1.3, 1.5, 5.1, 7.1
 * 
 * New Features:
 * - Orphaned auth detection (auth exists but no Firestore profile)
 * - Network connectivity monitoring
 * - Stale session detection
 * - Auto-logout recovery mechanism
 */

import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import auth from '@react-native-firebase/auth';
import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { checkProfileCompleteness, getUserProfile } from '../services/authService';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  isNewUser: boolean;
  isProfileComplete: boolean;
  needsProfileSetup: boolean;
  refreshProfileStatus: () => Promise<void>;
  
  // ✅ NEW: Orphaned auth detection (Edge Case 1.1, 1.3, 1.5, 5.1)
  hasOrphanedAuth: boolean;
  forceLogout: () => Promise<void>;
  
  // ✅ NEW: Network state monitoring (Edge Case 7.1)
  isOnline: boolean;
  
  // ✅ NEW: Session validation (Edge Case 1.2)
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
  
  // ✅ NEW: Orphaned auth state (Edge Case 1.1, 1.3, 1.5, 5.1)
  const [hasOrphanedAuth, setHasOrphanedAuth] = useState(false);
  
  // ✅ NEW: Network connectivity state (Edge Case 7.1)
  const [isOnline, setIsOnline] = useState(true);
  
  // ✅ NEW: Session staleness state (Edge Case 1.2)
  const [isSessionStale, setIsSessionStale] = useState(false);

  /**
   * ✅ PHASE 1 P0: Enhanced profile status checking
   * 
   * CRITICAL FIXES:
   * - Edge Case 1.1: Detects orphaned auth (auth exists, no profile)
   * - Edge Case 1.5: Validates cached auth state
   * - Edge Case 5.1: Prevents navigation to broken profile state
   * - Edge Case 7.1: Handles offline scenarios gracefully
   */
  const checkUserProfileStatus = async (uid: string) => {
    try {
      console.log('🔍 Checking profile status for user:', uid);
      
      // ✅ FIX 7.1: Check network connectivity first
      if (!isOnline) {
        console.log('⚠️ Offline - skipping profile check');
        // Don't mark as orphaned when offline
        setHasOrphanedAuth(false);
        return;
      }

      const userProfile = await getUserProfile(uid);

      // ✅ FIX 1.1, 1.3, 1.5, 5.1: Detect orphaned auth
      if (!userProfile) {
        console.error('🚨 ORPHANED AUTH DETECTED: Auth exists but Firestore profile missing!');
        console.error('   User ID:', uid);
        console.error('   This can happen if:');
        console.error('   - Profile was deleted but auth still active');
        console.error('   - Account deletion was interrupted');
        console.error('   - User re-logged in after deletion');
        
        setHasOrphanedAuth(true);
        setIsNewUser(true);
        setIsProfileComplete(false);
        
        // Give user a chance to recover or logout
        console.log('💡 User should logout and re-authenticate');
        return;
      }

      // ✅ Profile exists - clear orphaned state
      setHasOrphanedAuth(false);

      const newUserStatus = userProfile.isNewUser ?? false;
      const profileCompleteStatus = userProfile.isProfileComplete ?? false;

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
      
      // ✅ FIX 7.1: Handle network errors specifically
      if (error?.message?.includes('network') || error?.code === 'unavailable') {
        console.log('⚠️ Network error during profile check - not marking as orphaned');
        setHasOrphanedAuth(false);
      } else {
        // ✅ FIX 1.1: If error is permission-denied or not-found, likely orphaned
        if (error?.code === 'permission-denied' || error?.code === 'not-found') {
          console.error('🚨 Profile access error - possible orphaned auth');
          setHasOrphanedAuth(true);
        }
        
        // Safe fallback
        setIsNewUser(false);
        setIsProfileComplete(true);
      }
    }
  };

  /**
   * ✅ NEW: Session validation to detect stale tokens
   * Edge Case 1.2: Auth token expired/stale detection
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
      
      // ✅ FIX 1.2: Session is stale if older than 1 hour
      const sessionAgeMinutes = (now.getTime() - authTime.getTime()) / (1000 * 60);
      const isStale = sessionAgeMinutes > 60;
      
      setIsSessionStale(isStale);
      
      if (isStale) {
        console.warn('⚠️ Session is stale (>1 hour old). Some operations may require re-authentication.');
        console.log(`   Session age: ${Math.floor(sessionAgeMinutes)} minutes`);
      } else {
        console.log('✅ Session is fresh');
      }
    } catch (error) {
      console.error('❌ Error validating session:', error);
      setIsSessionStale(true); // Assume stale on error
    }
  }, [user]);

  /**
   * ✅ NEW: Force logout for recovery from orphaned auth state
   * Edge Cases 1.1, 1.3, 1.5, 5.1: Emergency escape hatch
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
   * ✅ NEW: Network state monitoring
   * Edge Case 7.1: Track online/offline status
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
   * ✅ ENHANCED: Auth state listener with orphaned auth detection
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
          console.log('📱 Native auth persistence: Automatic');
          
          setUser(firebaseUser);
          
          // ✅ FIX 1.1, 1.2, 1.3, 1.5, 5.1: Check profile AND session
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
  }, [revalidateSession]); // Add revalidateSession as dependency

  /**
   * ✅ NEW: Periodic session validation
   * Edge Case 1.2: Check for stale sessions every 5 minutes
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
   * ✅ ENHANCED: Needs profile setup detection
   * Now includes orphaned auth check
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
