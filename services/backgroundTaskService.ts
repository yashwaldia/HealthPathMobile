// services/backgroundTaskService.ts
// ✅ Background task for daily medication reminder refresh
// Last Updated: December 30, 2025

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import auth from '@react-native-firebase/auth';
import { scheduleAllMedicationReminders, cancelCompletedMedications } from './notificationService';

// Task identifier
const BACKGROUND_NOTIFICATION_TASK = 'MEDICATION_REMINDER_REFRESH';

// ============================================
// DEFINE BACKGROUND TASK
// ============================================
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    console.log('🔄 [Background Task] Starting medication reminder refresh...');
    
    // Get current authenticated user
    const currentUser = auth().currentUser;
    
    if (!currentUser) {
      console.log('⚠️ [Background Task] No authenticated user, skipping');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    console.log(`👤 [Background Task] Running for user: ${currentUser.uid}`);

    // Step 1: Clean up expired/completed medications
    await cancelCompletedMedications(currentUser.uid);
    console.log('✅ [Background Task] Expired medications cleaned');

    // Step 2: Reschedule all active medications for next 7 days
    await scheduleAllMedicationReminders(currentUser.uid);
    console.log('✅ [Background Task] Reminders rescheduled successfully');

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('❌ [Background Task] Error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ============================================
// REGISTER BACKGROUND TASK
// ============================================
export const registerBackgroundTask = async (): Promise<boolean> => {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    
    if (isRegistered) {
      console.log('ℹ️ [Background Task] Already registered');
      return true;
    }

    // Register the background fetch task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
      minimumInterval: 60 * 60 * 12, // 12 hours (43200 seconds)
      stopOnTerminate: false, // Continue after app is closed
      startOnBoot: true, // Start when device restarts
    });

    console.log('✅ [Background Task] Registered successfully (runs every 12 hours)');
    return true;
  } catch (error) {
    console.error('❌ [Background Task] Registration failed:', error);
    return false;
  }
};

// ============================================
// UNREGISTER BACKGROUND TASK
// ============================================
export const unregisterBackgroundTask = async (): Promise<boolean> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    
    if (!isRegistered) {
      console.log('ℹ️ [Background Task] Not registered, nothing to unregister');
      return true;
    }

    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log('✅ [Background Task] Unregistered successfully');
    return true;
  } catch (error) {
    console.error('❌ [Background Task] Unregistration failed:', error);
    return false;
  }
};

// ============================================
// GET BACKGROUND TASK STATUS
// ============================================
export const getBackgroundTaskStatus = async (): Promise<{
  status: BackgroundFetch.BackgroundFetchStatus;
  isRegistered: boolean;
} | null> => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    
    // ✅ FIXED: Handle null status
    if (status === null || status === undefined) {
      console.warn('⚠️ [Background Task] Could not get status');
      return null;
    }
    
    const statusMap = {
      [BackgroundFetch.BackgroundFetchStatus.Restricted]: 'Restricted',
      [BackgroundFetch.BackgroundFetchStatus.Denied]: 'Denied',
      [BackgroundFetch.BackgroundFetchStatus.Available]: 'Available',
    };

    console.log(`📊 [Background Task] Status: ${statusMap[status]}, Registered: ${isRegistered}`);
    
    return { status, isRegistered };
  } catch (error) {
    console.error('❌ [Background Task] Error getting status:', error);
    return null;
  }
};

// ============================================
// FORCE RUN BACKGROUND TASK (for testing)
// ============================================
export const forceRunBackgroundTask = async (): Promise<boolean> => {
  try {
    console.log('🧪 [Background Task] Force running task...');
    
    const currentUser = auth().currentUser;
    
    if (!currentUser) {
      console.log('⚠️ [Background Task] No authenticated user');
      return false;
    }

    // Manually execute the task logic
    await cancelCompletedMedications(currentUser.uid);
    await scheduleAllMedicationReminders(currentUser.uid);
    
    console.log('✅ [Background Task] Force run completed successfully');
    return true;
  } catch (error) {
    console.error('❌ [Background Task] Force run failed:', error);
    return false;
  }
};
