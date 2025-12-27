// services/notificationService.ts
import firestore from '@react-native-firebase/firestore';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication } from '../types/medication';
import { createReminderNotification } from './appNotificationService';
import { getActiveMedications, getAllMedications } from './medicationService';

// ============================================
// NOTIFICATION CONFIGURATION
// ============================================
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

// ✅ NEW: Sleep Timer Notification Data
export interface SleepTimerNotificationData {
  type: 'sleep-timer';
  startTime: number;
  userId: string;
  action?: 'stop' | 'cancel';
}

// ✅ NEW: Sleep Timer Constants
export const SLEEP_TIMER_NOTIFICATION_ID = 'sleep-timer-active';
export const SLEEP_TIMER_CHANNEL_ID = 'sleep-timer';

// ============================================
// TIME SLOT CALCULATION (✅ FIXED: Uses reminderTimes first, then frequency)
// ============================================
const getMedicationTimeSlots = (medication: Medication): number[] => {
  // ✅ PRIORITY 1: Use user-customized reminderTimes if available
  if (medication.reminderTimes && medication.reminderTimes.length > 0) {
    return medication.reminderTimes
      .map(time => parseInt(time.split(':')[0])) // "09:00" -> 9
      .filter(hour => hour >= 0 && hour <= 23);
  }

  // ✅ PRIORITY 2: Fallback to frequency-based defaults
  const frequencyMap: Record<string, number[]> = {
    'Once a day': [9],
    'Twice a day': [9, 21],
    'Thrice a day': [9, 14, 21],
    'Four times a day': [8, 12, 16, 20],
    'Every 4 hours': [8, 12, 16, 20, 0, 4],
    'Every 6 hours': [8, 14, 20, 2],
    'Every 8 hours': [8, 16, 0],
    'Every 12 hours': [9, 21],
    'Weekly': [9], // Morning once a week
  };

  return frequencyMap[medication.frequency] || [9];
};

// ============================================
// ✅ FIXED: EXPORT this function so medication-tracker.tsx can use it
// ============================================
export const isRemindersScheduledToday = async (userId: string): Promise<boolean> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const snapshot = await firestore()
      .collection(`users/${userId}/notifications`)
      .where('type', '==', 'reminder')
      .where('data.scheduledToday', '==', true)
      .where('timestamp', '>=', today)
      .limit(1)
      .get();
    
    return !snapshot.empty;
  } catch (error) {
    console.warn('⚠️ Could not check daily reminder flag:', error);
    return false;
  }
};

// ============================================
// CLEANUP COMPLETED MEDICATIONS
// ============================================
export const cancelCompletedMedications = async (userId: string): Promise<void> => {
  try {
    console.log('🧹 Checking for completed medications to cleanup...');
    const allMedications = await getAllMedications(userId);
    const now = new Date();
    const completedMedIds: string[] = [];
    
    for (const med of allMedications) {
      const isInactive = !med.isActive;
      const isExpired = med.endDate && now > new Date(med.endDate);
      if (isInactive || isExpired) {
        completedMedIds.push(med.medicationId);
        console.log(`✅ Found completed med: ${med.name} (${isInactive ? 'inactive' : 'expired'})`);
      }
    }
    
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
// NOTIFICATION LISTENER SETUP
// ============================================
export const setupNotificationListeners = (userId: string) => {
  console.log('🎧 Setting up notification listeners for user:', userId);

  const receivedSubscription = Notifications.addNotificationReceivedListener(async (notification) => {
    const data = notification.request.content.data as Record<string, unknown>;
    
    // Save medication reminders to Firestore
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
    
    // ✅ NEW: Handle sleep timer notifications
    if (data?.type === 'sleep-timer') {
      console.log('😴 Sleep timer notification received');
    }
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    console.log('👆 User tapped notification:', data);
    
    // Handle medication actions
    if (response.actionIdentifier === 'take-now') {
      console.log('✅ User wants to take medication now');
    } else if (response.actionIdentifier === 'snooze') {
      console.log('⏰ User snoozed medication');
    }
    
    // ✅ NEW: Handle sleep timer actions
    if (response.actionIdentifier === 'stop-timer') {
      console.log('🛑 User stopped sleep timer from notification');
    } else if (response.actionIdentifier === 'cancel-timer') {
      console.log('❌ User cancelled sleep timer');
    }
  });

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
      await configureAndroidNotificationChannels();
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

const configureAndroidNotificationChannels = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  
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
  
  await Notifications.setNotificationChannelAsync(SLEEP_TIMER_CHANNEL_ID, {
    name: 'Sleep Timer',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0],
    sound: null,
    enableVibrate: false,
    enableLights: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    description: 'Persistent sleep tracking timer notifications',
  });
  
  console.log('✅ Android notification channels configured');
};

// ============================================
// ✅ FIXED: MEDICATION REMINDER SCHEDULING (NO MORE REPEATS!)
// ============================================
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

    if (now < startDate || (endDate && now > endDate) || medication.frequency === 'As needed') {
      console.log(`⏭️ Medication ${medication.name} - not in active date range`);
      return [];
    }

    const timeSlots = getMedicationTimeSlots(medication);
    const scheduledIds: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ✅ FIXED: Schedule ONLY for TODAY (no repeats!)
    for (const hour of timeSlots) {
      const triggerTime = new Date(today);
      triggerTime.setHours(hour, 0, 0, 0);

      // Skip if time already passed today
      if (triggerTime < now) continue;

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
            scheduledToday: true, // ✅ NEW: Daily flag
          } as MedicationReminderData,
          sound: 'default',
          badge: 1,
          categoryIdentifier: 'medication',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerTime,
        },
      });

      scheduledIds.push(notificationId);
      console.log(`✅ Scheduled ${medication.name} at ${hour}:00 today - ID: ${notificationId}`);

      // Save to Firestore
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
            scheduledToday: true,
          }
        );
      } catch (firestoreError) {
        console.error('❌ Error saving to Firestore:', firestoreError);
      }
    }

    return scheduledIds;
  } catch (error) {
    console.error(`❌ Error scheduling reminder for ${medication.name}:`, error);
    throw error;
  }
};

// ✅ FIXED: Only schedule if not done today
export const scheduleAllMedicationReminders = async (userId: string): Promise<void> => {
  try {
    // ✅ NEW: Check if already scheduled today
    const alreadyScheduledToday = await isRemindersScheduledToday(userId);
    if (alreadyScheduledToday) {
      console.log('ℹ️ Reminders already scheduled today, skipping');
      return;
    }

    console.log('🔄 Scheduling TODAY\'S reminders for all active medications...');
    
    // Cancel any old notifications first
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

    console.log(`✅ Scheduled ${totalScheduled} reminders for today (${medications.length} medications)`);
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
      n => (n.content.data as Record<string, unknown>)?.type === 'medication-reminder'
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

export const cancelMedicationReminder = async (medicationId: string): Promise<void> => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const medicationNotifications = scheduledNotifications.filter(
      n => (n.content.data as Record<string, unknown>)?.medicationId === medicationId
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

export const cancelSleepTimerNotification = async (): Promise<void> => {
  try {
    await Notifications.dismissNotificationAsync(SLEEP_TIMER_NOTIFICATION_ID);
    console.log('✅ Sleep timer notification dismissed');
  } catch (error) {
    console.error('❌ Error dismissing sleep timer notification:', error);
    throw error;
  }
};

// ============================================
// NOTIFICATION ACTIONS & CATEGORIES
// ============================================
export const setupNotificationCategories = async (): Promise<void> => {
  try {
    await Notifications.setNotificationCategoryAsync('medication', [
      { identifier: 'take-now', buttonTitle: 'Take Now ✅', options: { opensAppToForeground: true } },
      { identifier: 'snooze', buttonTitle: 'Snooze 15m ⏰', options: { opensAppToForeground: false } },
    ]);
    
    await Notifications.setNotificationCategoryAsync('sleep-timer', [
      { identifier: 'stop-timer', buttonTitle: 'Stop Timer 🛑', options: { opensAppToForeground: true } },
      { identifier: 'cancel-timer', buttonTitle: 'Cancel ❌', options: { opensAppToForeground: false, isDestructive: true } },
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

export const snoozeMedicationReminder = async (medication: Medication, userId: string): Promise<string> => {
  try {
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
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: snoozeDate },
    });

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
export const getAllScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
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
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 },
    });
    console.log('✅ Test notification scheduled for 2 seconds from now');
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
  }
};

// ============================================
// ✅ FIXED: INITIALIZATION (Only runs scheduling if needed)
// ============================================
export const initializeNotificationService = async (userId: string): Promise<void> => {
  try {
    console.log('🚀 Initializing notification service...');

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('⚠️ Notification permissions not granted');
      return;
    }

    await setupNotificationCategories();
    await cancelCompletedMedications(userId);
    
    // ✅ FIXED: Only schedule if needed (not every app start)
    const alreadyScheduledToday = await isRemindersScheduledToday(userId);
    if (!alreadyScheduledToday) {
      await scheduleAllMedicationReminders(userId);
    } else {
      console.log('ℹ️ Reminders already scheduled today, skipping scheduling');
    }

    console.log('✅ Notification service initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing notification service:', error);
  }
};
