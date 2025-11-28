// services/notificationService.ts

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication } from '../types/medication';
import { getActiveMedications } from './medicationService';

// ============================================
// NOTIFICATION CONFIGURATION
// ============================================

/**
 * Configure how notifications behave when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // ✅ FIXED: Added missing property
    shouldShowList: true,   // ✅ FIXED: Added missing property
  }),
});

// ============================================
// TYPES & INTERFACES
// ============================================

export interface MedicationReminderData {
  medicationId: string;
  medicationName: string;
  strength: string; // ✅ FIXED: Changed from 'dosage' to 'strength'
  mealRelation: string;
  instructions?: string;
  type: string; // ✅ FIXED: Added for type checking
  [key: string]: unknown; // ✅ FIXED: Index signature for expo-notifications
}

export interface ScheduledNotification {
  identifier: string;
  medicationId: string;
  scheduledTime: Date;
}

// ============================================
// PERMISSION MANAGEMENT
// ============================================

/**
 * Request notification permissions from the user
 * Must be called before scheduling any notifications
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If permission not granted, request it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Notification permission denied');
      return false;
    }

    console.log('✅ Notification permission granted');

    // For Android: Configure notification channel
    if (Platform.OS === 'android') {
      await configureAndroidNotificationChannel();
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Check if notification permissions are granted
 */
export const checkNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
};

/**
 * Configure Android notification channel
 * Required for Android 8.0+ (API level 26+)
 */
const configureAndroidNotificationChannel = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medication-reminders', {
      name: 'Medication Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      lightColor: '#007AFF',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      description: 'Reminders for your scheduled medications',
    });

    console.log('✅ Android notification channel configured');
  }
};

// ============================================
// MEDICATION REMINDER SCHEDULING
// ============================================

/**
 * Parse medication frequency into time slots
 * Example: "Twice a day" → [9, 21] (9 AM and 9 PM)
 */
const getTimeSlots = (frequency: string): number[] => {
  const frequencyMap: { [key: string]: number[] } = {
    'Once a day': [9],           // 9 AM
    'Twice a day': [9, 21],      // 9 AM, 9 PM
    'Thrice a day': [9, 14, 21], // 9 AM, 2 PM, 9 PM
    'Four times a day': [8, 12, 16, 20], // 8 AM, 12 PM, 4 PM, 8 PM
    'Every 4 hours': [8, 12, 16, 20, 0, 4], // Every 4 hours
    'Every 6 hours': [8, 14, 20, 2], // Every 6 hours
    'Every 8 hours': [8, 16, 0], // Every 8 hours
    'Every 12 hours': [9, 21],   // Every 12 hours
  };

  return frequencyMap[frequency] || [9]; // Default to 9 AM if frequency not found
};

/**
 * Calculate seconds from now until the specified time
 * Used for Android daily notifications
 */
const calculateSecondsUntilTime = (hour: number, minute: number): number => {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  // If target time has passed today, schedule for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const secondsUntil = Math.floor((target.getTime() - now.getTime()) / 1000);
  return secondsUntil;
};


/**
 * Schedule daily repeating notifications for a medication
 */
export const scheduleMedicationReminder = async (
  medication: Medication
): Promise<string[]> => {
  try {
    console.log(`📅 Scheduling reminder for: ${medication.name}`);

    // Check if medication is active and within date range
    if (!medication.isActive) {
      console.log(`⏭️ Medication ${medication.name} is inactive, skipping`);
      return [];
    }

    const now = new Date();
    const startDate = new Date(medication.startDate);
    const endDate = medication.endDate ? new Date(medication.endDate) : null;

    if (now < startDate) {
      console.log(`⏭️ Medication ${medication.name} hasn't started yet`);
      return [];
    }

    if (endDate && now > endDate) {
      console.log(`⏭️ Medication ${medication.name} has ended`);
      return [];
    }

    // Skip "As needed" medications
    if (medication.frequency === 'As needed') {
      console.log(`⏭️ Medication ${medication.name} is "As needed", no schedule`);
      return [];
    }

    // Get time slots based on frequency
    const timeSlots = getTimeSlots(medication.frequency);

    // Schedule notification for each time slot
    const scheduledIds: string[] = [];

    for (const hour of timeSlots) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 Time for ${medication.name}`,
          body: `${medication.strength} • ${medication.mealRelation}`, // ✅ FIXED: Use 'strength'
          data: {
            medicationId: medication.medicationId,
            medicationName: medication.name,
            strength: medication.strength, // ✅ FIXED: Changed from 'dosage'
            mealRelation: medication.mealRelation,
            instructions: medication.instructions,
            type: 'medication-reminder',
          } as MedicationReminderData,
          sound: 'default',
          badge: 1,
          categoryIdentifier: 'medication',
        },
        trigger: Platform.OS === 'android' 
        ? {
            // Android: Use daily time interval (86400 seconds = 24 hours)
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: calculateSecondsUntilTime(hour, 0),
            repeats: true,
            }
        : {
            // iOS: Use calendar trigger
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            repeats: true,
            hour,
            minute: 0,
            },
      });

      scheduledIds.push(notificationId);
      console.log(`✅ Scheduled notification at ${hour}:00 - ID: ${notificationId}`);
    }

    return scheduledIds;
  } catch (error) {
    console.error(`❌ Error scheduling reminder for ${medication.name}:`, error);
    throw error;
  }
};

/**
 * Schedule reminders for all active medications
 */
export const scheduleAllMedicationReminders = async (
  userId: string
): Promise<void> => {
  try {
    console.log('🔄 Scheduling reminders for all active medications...');

    // Cancel all existing medication reminders first
    await cancelAllMedicationReminders();

    // Get all active medications
    const medications = await getActiveMedications(userId);

    if (medications.length === 0) {
      console.log('ℹ️ No active medications found');
      return;
    }

    // Schedule reminder for each medication
    let totalScheduled = 0;
    for (const medication of medications) {
      const scheduledIds = await scheduleMedicationReminder(medication);
      totalScheduled += scheduledIds.length;
    }

    console.log(`✅ Scheduled ${totalScheduled} reminders for ${medications.length} medications`);
  } catch (error) {
    console.error('❌ Error scheduling all medication reminders:', error);
    throw error;
  }
};

// ============================================
// NOTIFICATION CANCELLATION
// ============================================

/**
 * Cancel all scheduled medication reminders
 */
export const cancelAllMedicationReminders = async (): Promise<void> => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // Filter medication reminders
    const medicationNotifications = scheduledNotifications.filter(
      (notification) => {
        const data = notification.content.data as Record<string, unknown>;
        return data?.type === 'medication-reminder';
      }
    );

    // Cancel each medication reminder
    for (const notification of medicationNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    console.log(`✅ Cancelled ${medicationNotifications.length} medication reminders`);
  } catch (error) {
    console.error('❌ Error cancelling medication reminders:', error);
    throw error;
  }
};

/**
 * Cancel reminders for a specific medication
 */
export const cancelMedicationReminder = async (
  medicationId: string
): Promise<void> => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    // Find notifications for this medication
    const medicationNotifications = scheduledNotifications.filter(
      (notification) => {
        const data = notification.content.data as Record<string, unknown>;
        return data?.medicationId === medicationId;
      }
    );

    // Cancel each notification
    for (const notification of medicationNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    console.log(`✅ Cancelled ${medicationNotifications.length} reminders for medication ${medicationId}`);
  } catch (error) {
    console.error(`❌ Error cancelling reminders for medication ${medicationId}:`, error);
    throw error;
  }
};

// ============================================
// NOTIFICATION ACTIONS (for Phase 1)
// ============================================

/**
 * Set up notification action categories
 * Allows users to interact with notifications (Take Now, Snooze)
 */
export const setupNotificationCategories = async (): Promise<void> => {
  try {
    await Notifications.setNotificationCategoryAsync('medication', [
      {
        identifier: 'take-now',
        buttonTitle: 'Take Now ✅',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'snooze',
        buttonTitle: 'Snooze 15m ⏰',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);

    console.log('✅ Notification action categories configured');
  } catch (error) {
    console.error('❌ Error setting up notification categories:', error);
  }
};

/**
 * Handle notification responses (user taps notification or action button)
 */
export const handleNotificationResponse = (
  response: Notifications.NotificationResponse,
  onTakeNow: (medicationId: string) => void,
  onSnooze: (medicationId: string) => void
): void => {
  const { actionIdentifier, notification } = response;
  const medicationData = notification.request.content.data as Record<string, unknown>; // ✅ FIXED

  if (actionIdentifier === 'take-now') {
    console.log(`✅ User tapped "Take Now" for ${medicationData.medicationName}`);
    onTakeNow(medicationData.medicationId as string);
  } else if (actionIdentifier === 'snooze') {
    console.log(`⏰ User tapped "Snooze" for ${medicationData.medicationName}`);
    onSnooze(medicationData.medicationId as string);
  } else {
    // User tapped notification body
    console.log(`👆 User opened notification for ${medicationData.medicationName}`);
  }
};

/**
 * Snooze a medication reminder by 15 minutes
 */
export const snoozeMedicationReminder = async (
  medication: Medication
): Promise<string> => {
  try {
    const snoozeMinutes = 15;
    const snoozeDate = new Date(Date.now() + snoozeMinutes * 60 * 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💊 Reminder: ${medication.name}`,
        body: `Snoozed for ${snoozeMinutes} minutes • ${medication.strength}`, // ✅ FIXED
        data: {
          medicationId: medication.medicationId,
          medicationName: medication.name,
          strength: medication.strength, // ✅ FIXED
          mealRelation: medication.mealRelation,
          type: 'medication-reminder-snooze',
        } as MedicationReminderData,
        sound: 'default',
        categoryIdentifier: 'medication',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE, // ✅ FIXED: Added type
        date: snoozeDate,
      },
    });

    console.log(`⏰ Snoozed ${medication.name} for ${snoozeMinutes} minutes`);
    return notificationId;
  } catch (error) {
    console.error(`❌ Error snoozing reminder for ${medication.name}:`, error);
    throw error;
  }
};

// ============================================
// DEBUGGING & TESTING
// ============================================

/**
 * Get all currently scheduled notifications (for debugging)
 */
export const getAllScheduledNotifications = async (): Promise<
  Notifications.NotificationRequest[]
> => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📋 Found ${notifications.length} scheduled notifications`);
    return notifications;
  } catch (error) {
    console.error('❌ Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Send a test notification immediately (for testing)
 */
export const sendTestNotification = async (): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Test Notification',
        body: 'This is a test notification from HealthPath!',
        data: { type: 'test' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, // ✅ FIXED: Added type
        seconds: 2,
      },
    });

    console.log('✅ Test notification scheduled for 2 seconds from now');
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
  }
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize notification service
 * Call this once when the app starts
 */
export const initializeNotificationService = async (
  userId: string
): Promise<void> => {
  try {
    console.log('🚀 Initializing notification service...');

    // Request permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('⚠️ Notification permissions not granted');
      return;
    }

    // Set up action categories
    await setupNotificationCategories();

    // Schedule all medication reminders
    await scheduleAllMedicationReminders(userId);

    console.log('✅ Notification service initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing notification service:', error);
  }
};
