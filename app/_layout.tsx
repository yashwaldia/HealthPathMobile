// app/_layout.tsx

import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Buffer } from 'buffer';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { 
  initializeNotificationService,
  handleNotificationResponse,
  setupNotificationCategories,
} from '../services/notificationService';
import { logDose } from '../services/medicationService';
import { profileService } from '../services/profileService';
import { useAuth } from '../context/AuthContext';
// --- Added ---
import { useRouter } from 'expo-router';

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
  const router = useRouter(); // <--- Added

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
      // (or `/weekly-report/${reportId}` if you want direct deep-link)
      if (data.type === 'weekly-report') {
        // Option A: Jump to History for latest list
        router.push('/(tabs)/history');

        // Option B (optional): Deep link to specific report
        // if (data.reportId) {
        //   router.push(`/weekly-report/${data.reportId}`);
        // }
      }

      // Add navigation for other notification types here if needed in the future!
    });
    return () => subscription.remove();
  }, [user]);

  return null; // This component does not render UI
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        {/* Initialize Local + Push Notifications */}
        <NotificationInitializer />

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
