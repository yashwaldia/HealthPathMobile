// app/_layout.tsx

/**
 * Root Layout - App Entry Point with Navigation & Auth
 * * ✅ PHASE 3: FINAL STABILITY FIX
 * ✅ Fixed "Force Logout" loop preventing Self-Healing
 * ✅ Prevents background services from running during recovery
 * * Critical Fixes:
 * - Removed aggressive logout on profile validation failure
 * - Added checks to stop NotificationService from running on orphaned accounts
 * - Ensures AuthContext has time to "Self-Heal" broken profiles
 */

import { Buffer } from 'buffer';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from '../context/AuthContext';

import { Colors } from '../constants/colors';
import {
  deactivateMedication,
  getMedication,
  logDose
} from '../services/medicationService';
import {
  handleNotificationResponse,
  initializeNotificationService,
  setupNotificationCategories,
} from '../services/notificationService';
import { profileService } from '../services/profileService';

// Make Buffer available globally for BLE operations
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

/**
 * NotificationInitializer component
 * - Initializes notifications
 * - Requests push permissions & registers token
 * - Saves push token and timezone
 * - Listens to notification responses
 */
function NotificationInitializer() {
  const { user, hasOrphanedAuth } = useAuth(); // ✅ FIX: Get orphaned status
  const router = useRouter();

  // Initialize local notification service when user logs in
  useEffect(() => {
    // ✅ FIX: Don't initialize if account is broken/orphaned
    if (user?.uid && !hasOrphanedAuth) {
      console.log('🔔 Initializing notifications for user:', user.uid);
      initializeNotificationService(user.uid).catch(error => {
        console.error('Failed to initialize notifications:', error);
      });
    }
  }, [user?.uid, hasOrphanedAuth]);

  // Request push permissions, get Expo push token, save timezone
  useEffect(() => {
    async function registerPushToken() {
      // ✅ FIX: Skip if orphaned to prevent permission errors
      if (!user?.uid || hasOrphanedAuth) return;

      if (!Device.isDevice) {
        console.warn('Must use physical device for push notifications');
        return;
      }

      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.warn('Failed to get push token permissions');
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync();
        const pushToken = tokenData.data;
        console.log('Expo Push Token:', pushToken);

        // Save push token to Firestore
        await profileService.updatePushToken(user.uid, pushToken);

        // Save timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        await profileService.updateTimezone(user.uid, timezone);

        console.log('Saved push token and timezone for user');
      } catch (error) {
        console.error('Error registering for push notifications:', error);
      }
    }

    registerPushToken();

    // Listen for expo push token refreshes (e.g., after reinstall)
    const subscription = Notifications.addPushTokenListener(async (tokenData) => {
      console.log('Push token refreshed:', tokenData.data);
      if (user?.uid && !hasOrphanedAuth) {
        await profileService.updatePushToken(user.uid, tokenData.data);
      }
    });

    return () => subscription.remove();
  }, [user?.uid, hasOrphanedAuth]);

  // Enhanced "Take Now" handler with auto-completion + navigation
  const handleTakeNow = async (medicationId: string) => {
    if (!user?.uid || hasOrphanedAuth) return;

    try {
      console.log('✅ Logging dose as taken for:', medicationId);
      
      // 1. Log the dose
      await logDose(user.uid, medicationId, {
        scheduledTime: new Date().toISOString(),
        taken: true,
        skipped: false,
        notes: 'Taken via notification',
      });
      console.log('✅ Dose logged successfully');

      // 2. Check if medication course is complete
      const medication = await getMedication(user.uid, medicationId);
      if (medication) {
        const now = new Date();
        const endDate = medication.endDate ? new Date(medication.endDate) : null;
        
        // If endDate passed OR no more duration, deactivate medication
        if (!medication.isActive || (endDate && now > endDate)) {
          console.log(`🎉 Auto-completing medication: ${medication.name}`);
          await deactivateMedication(user.uid, medicationId);
          console.log('✅ Medication automatically deactivated');
        }
      }

      // 3. Navigate to medication screen
      console.log('📱 Navigating to medication screen');
      router.push('/(tabs)/medication-tracker');
      
    } catch (error) {
      console.error('❌ Failed to handle Take Now:', error);
    }
  };

  // Snooze handler
  const handleSnooze = async (medicationId: string) => {
    console.log('⏰ Snoozing medication:', medicationId);
    // Snooze logic handled in notificationService.ts
  };

  // Listen for LOCAL in-app notification actions (medication, snooze, etc.)
  useEffect(() => {
    setupNotificationCategories().catch(error => {
      console.error('Failed to set up notification categories:', error);
    });

    const localSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      if (!user?.uid || hasOrphanedAuth) return;
      
      handleNotificationResponse(response, handleTakeNow, handleSnooze);
    });
    
    return () => localSubscription.remove();
  }, [user?.uid, hasOrphanedAuth]);

  // Listen for push notification taps (deep linking for ALL types)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (!data) return;

      // Weekly AI Report Push Handling
      if (data.type === 'weekly-report') {
        router.push('/(tabs)/history');
      }

      // Medication reminders → medication screen
      if (data.type === 'medication-reminder' || data.type === 'medication-reminder-snooze') {
        router.push('/(tabs)/medication-tracker');
      }
    });
    return () => subscription.remove();
  }, [user]);

  return null;
}

/**
 * ✅ PHASE 2 P1: Enhanced AuthNavigator with profile existence validation
 * ✅ CRITICAL FIX: Infinite redirect loop resolved
 */
function AuthNavigator({ children }: { children: React.ReactNode }) {
  // ✅ ENHANCED: Use new auth context features
  const { 
    user, 
    loading, 
    hasOrphanedAuth, 
    forceLogout,
    isOnline 
  } = useAuth();
  
  const segments = useSegments();
  const router = useRouter();

  // ✅ NEW: Profile validation state (Edge Case 5.1)
  const [validatingProfile, setValidatingProfile] = useState(false);
  const [profileValidated, setProfileValidated] = useState(false);

  /**
   * ✅ NEW: Validate profile exists in Firestore
   */
  const validateProfileExists = async (uid: string): Promise<boolean> => {
    try {
      console.log('🔍 Validating profile existence for:', uid);
      
      // ✅ FIX 7.1: Skip validation if offline
      if (!isOnline) {
        console.log('⚠️ Offline - skipping profile validation');
        return true; 
      }

      const profile = await profileService.getProfile(uid);
      
      if (!profile) {
        console.error('🚨 Profile not found in Firestore - orphaned auth detected');
        return false;
      }

      console.log('✅ Profile validation successful');
      return true;
    } catch (error: any) {
      console.error('❌ Profile validation error:', error);
      
      // ✅ FIX 7.1: Treat network errors as temporary
      if (error?.message?.includes('network') || error?.code === 'unavailable') {
        return true;
      }

      // ✅ FIX 5.1: Treat permission/not-found errors as orphaned auth
      if (error?.code === 'permission-denied' || error?.code === 'not-found') {
        return false;
      }

      return false;
    }
  };

  /**
   * ✅ ENHANCED: Navigation logic with profile validation
   */
  useEffect(() => {
    if (loading) return; 

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('📍 Navigation check:', {
      user: user?.uid || 'none',
      currentSegment: segments[0],
      hasOrphanedAuth
    });

    // ✅ FIX 5.1: Handle orphaned auth - redirect TO auth if not already there
    if (hasOrphanedAuth && !inAuthGroup) {
      console.error('🚨 Orphaned auth detected - redirecting to auth for recovery');
      router.replace('/(auth)/welcome');
      return;
    }

    // ✅ CRITICAL FIX: STAY in auth screens when orphaned auth exists
    if (hasOrphanedAuth && inAuthGroup) {
      console.log('⚠️ Orphaned auth detected - staying in auth for self-healing');
      return; 
    }

    // ✅ FIX 7.1: Offline handling
    if (!isOnline && (inAuthGroup || inTabsGroup)) {
      return;
    }

    if (!user && !inAuthGroup) {
      console.log('🔐 No user found, redirecting to auth...');
      router.replace('/(auth)/welcome');
      return;
    }

    // ✅ UPDATED: Only redirect to tabs if NO orphaned auth
    if (user && inAuthGroup && !hasOrphanedAuth) {
      console.log('✅ User found on auth screen, redirecting to tabs...');
      router.replace('/(tabs)');
      return;
    }

    // ✅ NEW: Profile validation before allowing access to tabs
    if (user && inTabsGroup && !profileValidated && !validatingProfile && !hasOrphanedAuth) {
      console.log('🔍 User in tabs but profile not validated yet');
      
      setValidatingProfile(true);
      
      validateProfileExists(user.uid).then((isValid) => {
        setValidatingProfile(false);
        
        if (!isValid) {
          // 🛑 CRITICAL FIX: REMOVED forceLogout(). 
          // Just redirect to auth so AuthContext can run Self-Healing.
          console.warn('⚠️ Profile missing in tabs - redirecting to auth for self-healing...');
          router.replace('/(auth)/welcome');
        } else {
          setProfileValidated(true);
          console.log('✅ Profile validated - user can access tabs');
        }
      }).catch((error) => {
        console.error('❌ Profile validation error:', error);
        setValidatingProfile(false);
        // Redirect to auth on error, do NOT force logout
        router.replace('/(auth)/welcome');
      });
    }
  }, [user, loading, segments, hasOrphanedAuth, profileValidated, validatingProfile, isOnline]);

  /**
   * ✅ NEW: Reset validation state when user changes
   */
  useEffect(() => {
    if (!user) {
      setProfileValidated(false);
      setValidatingProfile(false);
    }
  }, [user?.uid]);

  /**
   * ✅ NEW: Deep link validation
   */
  useEffect(() => {
    if (user && segments.length > 0 && segments[0] === '(tabs)' && !hasOrphanedAuth) {
      if (profileValidated && !validatingProfile) {
        validateProfileExists(user.uid).then((isValid) => {
          if (!isValid) {
            console.error('🚨 Profile no longer exists - deep link blocked');
            router.replace('/(auth)/welcome'); // Redirect, don't logout
          }
        });
      }
    }
  }, [segments]);

  /**
   * ✅ NEW: Loading screen while validating profile
   */
  if (loading || validatingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>
          {loading ? 'Loading...' : 'Validating profile...'}
        </Text>
        
        {!isOnline && (
          <View style={styles.offlineIndicator}>
            <Ionicons name="cloud-offline" size={20} color="#FF9500" />
            <Text style={styles.offlineText}>Offline Mode</Text>
          </View>
        )}

        {hasOrphanedAuth && (
          <View style={styles.orphanedWarning}>
            <Ionicons name="warning" size={20} color="#FF3B30" />
            <Text style={styles.orphanedText}>Account data issue detected</Text>
          </View>
        )}
      </View>
    );
  }

  /**
   * ✅ NEW: Orphaned auth recovery screen
   * Shows when self-healing is in progress or failed
   */
  if (hasOrphanedAuth && user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="construct" size={80} color={Colors.light.primary} />
        <Text style={styles.errorTitle}>Restoring Profile</Text>
        <Text style={styles.errorMessage}>
          We detected a missing profile and are attempting to restore it. Please wait...
        </Text>
        
        {/* Manual option if automatic healing hangs */}
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={async () => {
            await forceLogout();
            router.replace('/(auth)/welcome');
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.errorButtonText}>Cancel & Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AuthNavigator>
          {/* Initialize Local + Push Notifications */}
          <NotificationInitializer />

          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </AuthNavigator>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FF950020',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF950050',
  },
  offlineText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
  },
  orphanedWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FF3B3020',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B3050',
  },
  orphanedText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 20,
    textAlign: 'center',
  },
});