// services/notificationService.ts

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication } from '../types/medication';
import { getActiveMedications, getAllMedications } from './medicationService';  // ✅ ADDED: getAllMedications
import { createReminderNotification } from './appNotificationService';

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
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ============================================
// TYPES & INTERFACES
// ============================================

export interface MedicationReminderData {
  medicationId: string;
  medicationName: string;
  strength: string;
  mealRelation: string;
  instructions?: string;
  type: string;
  [key: string]: unknown;
}

export interface ScheduledNotification {
  identifier: string;
  medicationId: string;
  scheduledTime: Date;
}

// ============================================
// ✅ NEW: CLEANUP COMPLETED MEDICATIONS
// ============================================

/**
 * Cancel reminders for completed medications (!isActive || expired endDate)
 * CRITICAL FIX: Runs on app init to cleanup stale notifications
 */
export const cancelCompletedMedications = async (userId: string): Promise<void> => {
  try {
    console.log('🧹 Checking for completed medications to cleanup...');
    
    // Get ALL medications (not just active ones)
    const allMedications = await getAllMedications(userId);
    const now = new Date();
    
    // Find completed medications: !isActive OR endDate passed
    const completedMedIds: string[] = [];
    for (const med of allMedications) {
      const isInactive = !med.isActive;
      const isExpired = med.endDate && now > new Date(med.endDate);
      
      if (isInactive || isExpired) {
        completedMedIds.push(med.medicationId);
        console.log(`✅ Found completed med: ${med.name} (${isInactive ? 'inactive' : 'expired'})`);
      }
    }
    
    // Cancel reminders for all completed meds
    for (const medId of completedMedIds) {
      try {
        await cancelMedicationReminder(medId);
      } catch (error) {
        console.warn(`⚠️ Failed to cancel reminders for ${medId}:`, error);
      }
    }
    
    console.log(`✅ Cleaned up ${completedMedIds.length} completed medications`);
  } catch (error) {
    console.error('❌ Error cancelling completed medications:', error);
  }
};

// ============================================
// NOTIFICATION LISTENER SETUP (BACKUP ONLY)
// ============================================

/**
 * Set up listeners to save notifications to Firestore when they're delivered
 * NOTE: This is a backup - we now save notifications during scheduling
 */
export const setupNotificationListeners = (userId: string) => {
  console.log('🎧 Setting up notification listeners for user:', userId);

  // Listener 1: When notification is received (app in foreground or background)
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    async (notification) => {
      const data = notification.request.content.data as Record<string, unknown>;
      
      // Only save medication reminders to Firestore
      if (data?.type === 'medication-reminder' || data?.type === 'medication-reminder-snooze') {
        console.log('💊 Medication reminder received, saving to Firestore...');
        
        try {
          await createReminderNotification(
            userId,
            notification.request.content.title || 'Medication Reminder',
            notification.request.content.body || '',
            {
              medicationId: data.medicationId,
              medicationName: data.medicationName,
              strength: data.strength,
              mealRelation: data.mealRelation,
              instructions: data.instructions,
            }
          );
          console.log('✅ Notification saved to Firestore');
        } catch (error) {
          console.error('❌ Error saving notification to Firestore:', error);
        }
      }
    }
  );

  // Listener 2: When user taps on notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    async (response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      
      console.log('👆 User tapped notification:', data);
      
      // You can add custom navigation logic here if needed
      if (response.actionIdentifier === 'take-now') {
        console.log('✅ User wants to take medication now');
      } else if (response.actionIdentifier === 'snooze') {
        console.log('⏰ User snoozed medication');
      }
    }
  );

  // Return cleanup function
  return {
    remove: () => {
      console.log('🧹 Cleaning up notification listeners');
      receivedSubscription.remove();
      responseSubscription.remove();
    },
  };
};

// ============================================
// PERMISSION MANAGEMENT
// ============================================

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Notification permission denied');
      return false;
    }

    console.log('✅ Notification permission granted');
    
    if (Platform.OS === 'android') {
      await configureAndroidNotificationChannel();
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

export const checkNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
};

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

const getTimeSlots = (frequency: string): number[] => {
  const frequencyMap: { [key: string]: number[] } = {
    'Once a day': [9],
    'Twice a day': [9, 21],
    'Thrice a day': [9, 14, 21],
    'Four times a day': [8, 12, 16, 20],
    'Every 4 hours': [8, 12, 16, 20, 0, 4],
    'Every 6 hours': [8, 14, 20, 2],
    'Every 8 hours': [8, 16, 0],
    'Every 12 hours': [9, 21],
  };
  return frequencyMap[frequency] || [9];
};

const calculateSecondsUntilTime = (hour: number, minute: number): number => {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const secondsUntil = Math.floor((target.getTime() - now.getTime()) / 1000);
  return secondsUntil;
};

// ✅ UPDATED: Now accepts userId and saves to Firestore immediately
export const scheduleMedicationReminder = async (
  medication: Medication,
  userId: string
): Promise<string[]> => {
  try {
    console.log(`📅 Scheduling reminder for: ${medication.name}`);

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

    if (medication.frequency === 'As needed') {
      console.log(`⏭️ Medication ${medication.name} is "As needed", no schedule`);
      return [];
    }

    const timeSlots = getTimeSlots(medication.frequency);
    const scheduledIds: string[] = [];

    for (const hour of timeSlots) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 Time for ${medication.name}`,
          body: `${medication.strength} • ${medication.mealRelation}`,
          data: {
            medicationId: medication.medicationId,
            medicationName: medication.name,
            strength: medication.strength,
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
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: calculateSecondsUntilTime(hour, 0),
              repeats: true,
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              repeats: true,
              hour,
              minute: 0,
            },
      });

      scheduledIds.push(notificationId);
      console.log(`✅ Scheduled notification at ${hour}:00 - ID: ${notificationId}`);

      // ✅ NEW: Save to Firestore immediately (in-app notification center)
      try {
        await createReminderNotification(
          userId,
          `💊 Time for ${medication.name}`,
          `${medication.strength} • ${medication.mealRelation}`,
          {
            medicationId: medication.medicationId,
            medicationName: medication.name,
            strength: medication.strength,
            mealRelation: medication.mealRelation,
            instructions: medication.instructions,
            scheduledTime: `${hour}:00`,
            notificationId: notificationId,
          }
        );
        console.log(`💾 Saved reminder to Firestore for ${medication.name} at ${hour}:00`);
      } catch (firestoreError) {
        console.error('❌ Error saving to Firestore:', firestoreError);
        // Don't throw - notification is still scheduled on device
      }
    }

    return scheduledIds;
  } catch (error) {
    console.error(`❌ Error scheduling reminder for ${medication.name}:`, error);
    throw error;
  }
};

// ✅ UPDATED: Now passes userId to scheduleMedicationReminder
export const scheduleAllMedicationReminders = async (
  userId: string
): Promise<void> => {
  try {
    console.log('🔄 Scheduling reminders for all active medications...');
    
    await cancelAllMedicationReminders();
    
    const medications = await getActiveMedications(userId);
    
    if (medications.length === 0) {
      console.log('ℹ️ No active medications found');
      return;
    }

    let totalScheduled = 0;
    for (const medication of medications) {
      const scheduledIds = await scheduleMedicationReminder(medication, userId);
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

export const cancelAllMedicationReminders = async (): Promise<void> => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    const medicationNotifications = scheduledNotifications.filter(
      (notification) => {
        const data = notification.content.data as Record<string, unknown>;
        return data?.type === 'medication-reminder';
      }
    );

    for (const notification of medicationNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    console.log(`✅ Cancelled ${medicationNotifications.length} medication reminders`);
  } catch (error) {
    console.error('❌ Error cancelling medication reminders:', error);
    throw error;
  }
};

export const cancelMedicationReminder = async (
  medicationId: string
): Promise<void> => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    const medicationNotifications = scheduledNotifications.filter(
      (notification) => {
        const data = notification.content.data as Record<string, unknown>;
        return data?.medicationId === medicationId;
      }
    );

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
// NOTIFICATION ACTIONS
// ============================================

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

export const handleNotificationResponse = (
  response: Notifications.NotificationResponse,
  onTakeNow: (medicationId: string) => void,
  onSnooze: (medicationId: string) => void
): void => {
  const { actionIdentifier, notification } = response;
  const medicationData = notification.request.content.data as Record<string, unknown>;

  if (actionIdentifier === 'take-now') {
    console.log(`✅ User tapped "Take Now" for ${medicationData.medicationName}`);
    onTakeNow(medicationData.medicationId as string);
  } else if (actionIdentifier === 'snooze') {
    console.log(`⏰ User tapped "Snooze" for ${medicationData.medicationName}`);
    onSnooze(medicationData.medicationId as string);
  } else {
    console.log(`👆 User opened notification for ${medicationData.medicationName}`);
  }
};

export const snoozeMedicationReminder = async (
  medication: Medication,
  userId: string
): Promise<string> => {
  try {
    // ✅ NEW: Check if medication is still valid before snoozing
    const now = new Date();
    const endDate = medication.endDate ? new Date(medication.endDate) : null;
    
    if (!medication.isActive || (endDate && now > endDate)) {
      console.log(`⏭️ Cannot snooze completed medication: ${medication.name}`);
      throw new Error('Medication is no longer active');
    }

    const snoozeMinutes = 15;
    const snoozeDate = new Date(Date.now() + snoozeMinutes * 60 * 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💊 Reminder: ${medication.name}`,
        body: `Snoozed for ${snoozeMinutes} minutes • ${medication.strength}`,
        data: {
          medicationId: medication.medicationId,
          medicationName: medication.name,
          strength: medication.strength,
          mealRelation: medication.mealRelation,
          type: 'medication-reminder-snooze',
        } as MedicationReminderData,
        sound: 'default',
        categoryIdentifier: 'medication',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: snoozeDate,
      },
    });

    // ✅ Save snooze notification to Firestore
    try {
      await createReminderNotification(
        userId,
        `💊 Reminder: ${medication.name}`,
        `Snoozed for ${snoozeMinutes} minutes • ${medication.strength}`,
        {
          medicationId: medication.medicationId,
          medicationName: medication.name,
          strength: medication.strength,
          mealRelation: medication.mealRelation,
          snoozed: true,
          snoozeMinutes: snoozeMinutes,
        }
      );
    } catch (firestoreError) {
      console.error('❌ Error saving snooze to Firestore:', firestoreError);
    }

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

export const sendTestNotification = async (): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Test Notification',
        body: 'This is a test notification from PI HEALTH!',
        data: { type: 'test' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
    console.log('✅ Test notification scheduled for 2 seconds from now');
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
  }
};

// ============================================
// INITIALIZATION (UPDATED)
// ============================================

/**
 * ✅ CRITICAL FIX: Now cancels completed meds FIRST, then schedules active ones
 */
export const initializeNotificationService = async (
  userId: string
): Promise<void> => {
  try {
    console.log('🚀 Initializing notification service...');

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('⚠️ Notification permissions not granted');
      return;
    }

    await setupNotificationCategories();
    
    // ✅ NEW STEP 1: Cancel completed medications first
    await cancelCompletedMedications(userId);
    
    // ✅ STEP 2: Schedule active medications
    await scheduleAllMedicationReminders(userId);

    console.log('✅ Notification service initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing notification service:', error);
  }
};
