// app/_layout.tsx

import { Stack, useSegments, useRouter, Redirect } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Buffer } from 'buffer';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { View, ActivityIndicator } from 'react-native';

import { 
  initializeNotificationService,
  handleNotificationResponse,
  setupNotificationCategories,
} from '../services/notificationService';
import { logDose } from '../services/medicationService';
import { profileService } from '../services/profileService';
import { Colors } from '../constants/colors';

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
  const { user } = useAuth();
  const router = useRouter();

  // Initialize local notification service when user logs in
  useEffect(() => {
    if (user?.uid) {
      console.log('🔔 Initializing notifications for user:', user.uid);
      initializeNotificationService(user.uid).catch(error => {
        console.error('Failed to initialize notifications:', error);
      });
    }
  }, [user?.uid]);

  // Request push permissions, get Expo push token, save timezone
  useEffect(() => {
    async function registerPushToken() {
      if (!user?.uid) return;

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
      if (user?.uid) {
        await profileService.updatePushToken(user.uid, tokenData.data);
      }
    });

    return () => subscription.remove();
  }, [user?.uid]);

  // Listen for LOCAL in-app notification actions (medication, snooze, etc.)
  useEffect(() => {
    setupNotificationCategories().catch(error => {
      console.error('Failed to set up notification categories:', error);
    });

    const localSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      if (!user?.uid) return;
      handleNotificationResponse(
        response,
        async (medicationId: string) => {
          try {
            console.log('✅ Logging dose as taken for:', medicationId);
            await logDose(user.uid, medicationId, {
              scheduledTime: new Date().toISOString(),
              taken: true,
              skipped: false,
              notes: 'Taken via notification',
            });
            console.log('✅ Dose logged successfully');
          } catch (error) {
            console.error('❌ Failed to log dose:', error);
          }
        },
        async (medicationId: string) => {
          console.log('⏰ Snoozing medication:', medicationId);
          // Snooze handled in notificationService.ts
        }
      );
    });
    return () => localSubscription.remove();
  }, [user?.uid]);

  // === GLOBAL: Listen for push notification taps (deep linking for ALL types) ===
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (!data) return;

      // --- Weekly AI Report Push Handling ---
      // If notification has type: 'weekly-report', direct to /history
      if (data.type === 'weekly-report') {
        router.push('/(tabs)/history');
      }

      // Add navigation for other notification types here if needed in the future!
    });
    return () => subscription.remove();
  }, [user]);

  return null; // This component does not render UI
}

/**
 * AuthNavigator - Handles authentication-based navigation
 * Redirects users to auth screens if not logged in
 */
function AuthNavigator({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't navigate while checking auth state

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('📍 Navigation check:', {
      user: user?.uid || 'none',
      loading,
      currentSegment: segments[0],
      inAuthGroup,
      inTabsGroup,
    });

    if (!user && !inAuthGroup) {
      // User is not logged in, redirect to auth
      console.log('🔐 No user found, redirecting to auth...');
      router.replace('/(auth)/welcome');
    } else if (user && inAuthGroup) {
      // User is logged in but on auth screens, redirect to tabs
      console.log('✅ User found on auth screen, redirecting to tabs...');
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
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
