// services/sleepTimerService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import firestore from '@react-native-firebase/firestore'; // ✅ FIXED: React Native Firebase
import { SleepTimerState, SleepSession, SleepStats } from '../types/sleepTimer';

// ============================================================================
// CONSTANTS
// ============================================================================

const SLEEP_TIMER_KEY = '@pi_health_sleep_timer';
const SLEEP_TIMER_NOTIFICATION_ID = 'sleep-timer-active';
const SLEEP_SESSIONS_COLLECTION = 'sleepSessions';

// ============================================================================
// SLEEP TIMER CORE FUNCTIONS
// ============================================================================

/**
 * ✅ Start Sleep Timer
 * Creates persistent notification and saves state to AsyncStorage
 */
export const startSleepTimer = async (userId: string): Promise<void> => {
  try {
    const startTime = Date.now();
    
    const timerState: SleepTimerState = {
      isRunning: true,
      startTime,
      userId,
      notificationId: SLEEP_TIMER_NOTIFICATION_ID,
    };
    
    await AsyncStorage.setItem(SLEEP_TIMER_KEY, JSON.stringify(timerState));
    
    await Notifications.scheduleNotificationAsync({
      identifier: SLEEP_TIMER_NOTIFICATION_ID,
      content: {
        title: '😴 Sleep Timer Active',
        body: 'Tracking your sleep. Tap "Stop" when you wake up.',
        data: {
          type: 'sleep-timer',
          startTime: startTime.toString(),
          userId,
        },
        priority: Notifications.AndroidNotificationPriority.HIGH,
        sticky: true,
        categoryIdentifier: 'sleep-timer',
      },
      trigger: null,
    });
    
    console.log('✅ Sleep timer started at:', new Date(startTime).toLocaleString());
    console.log('💾 Timer state saved to AsyncStorage');
  } catch (error) {
    console.error('❌ Error starting sleep timer:', error);
    throw error;
  }
};

/**
 * ✅ Stop Sleep Timer
 * Calculates duration, saves to Firebase, and clears notification
 */
export const stopSleepTimer = async (): Promise<SleepSession | null> => {
  try {
    const stateStr = await AsyncStorage.getItem(SLEEP_TIMER_KEY);
    
    if (!stateStr) {
      console.warn('⚠️ No active sleep timer found');
      return null;
    }
    
    const state: SleepTimerState = JSON.parse(stateStr);
    const endTime = Date.now();
    const durationMs = endTime - state.startTime;
    const durationMinutes = Math.floor(durationMs / 60000);
    const durationHours = parseFloat((durationMinutes / 60).toFixed(2));
    
    // Create sleep session object
    const sleepSession = {
      userId: state.userId,
      startTime: firestore.Timestamp.fromDate(new Date(state.startTime)),
      endTime: firestore.Timestamp.fromDate(new Date(endTime)),
      duration: durationMinutes,
      durationHours,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };
    
    // ✅ FIXED: React Native Firebase API
    const docRef = await firestore()
      .collection('users')
      .doc(state.userId)
      .collection(SLEEP_SESSIONS_COLLECTION)
      .add(sleepSession);
    
    await Notifications.dismissNotificationAsync(SLEEP_TIMER_NOTIFICATION_ID);
    await AsyncStorage.removeItem(SLEEP_TIMER_KEY);
    
    console.log(`✅ Sleep timer stopped. Duration: ${durationHours} hours (${durationMinutes} minutes)`);
    console.log(`💾 Sleep session saved to Firebase with ID: ${docRef.id}`);
    
    return {
      sessionId: docRef.id,
      userId: state.userId,
      startTime: new Date(state.startTime),
      endTime: new Date(endTime),
      duration: durationMinutes,
      durationHours,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('❌ Error stopping sleep timer:', error);
    throw error;
  }
};

/**
 * ✅ Get Current Timer Status
 * Returns null if no timer is running
 */
export const getSleepTimerStatus = async (): Promise<SleepTimerState | null> => {
  try {
    const stateStr = await AsyncStorage.getItem(SLEEP_TIMER_KEY);
    
    if (!stateStr) {
      return null;
    }
    
    const state: SleepTimerState = JSON.parse(stateStr);
    
    // Validate that timer is still valid (not older than 24 hours)
    const now = Date.now();
    const elapsedHours = (now - state.startTime) / 3600000;
    
    if (elapsedHours > 24) {
      console.warn('⚠️ Sleep timer older than 24 hours, clearing...');
      await AsyncStorage.removeItem(SLEEP_TIMER_KEY);
      await Notifications.dismissNotificationAsync(SLEEP_TIMER_NOTIFICATION_ID);
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('❌ Error getting sleep timer status:', error);
    return null;
  }
};

/**
 * ✅ Cancel Sleep Timer
 * Stops timer without saving data (user cancelled)
 */
export const cancelSleepTimer = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SLEEP_TIMER_KEY);
    await Notifications.dismissNotificationAsync(SLEEP_TIMER_NOTIFICATION_ID);
    console.log('✅ Sleep timer cancelled');
  } catch (error) {
    console.error('❌ Error cancelling sleep timer:', error);
    throw error;
  }
};

// ============================================================================
// NOTIFICATION UPDATE FUNCTIONS
// ============================================================================

/**
 * ✅ Update Sleep Timer Notification
 * Call this when app comes to foreground to update elapsed time
 */
export const updateSleepTimerNotification = async (): Promise<void> => {
  try {
    const state = await getSleepTimerStatus();
    
    if (!state || !state.isRunning) {
      return;
    }
    
    const elapsed = calculateElapsedTime(state.startTime);
    
    await Notifications.dismissNotificationAsync(SLEEP_TIMER_NOTIFICATION_ID);
    
    await Notifications.scheduleNotificationAsync({
      identifier: SLEEP_TIMER_NOTIFICATION_ID,
      content: {
        title: '😴 Sleep Timer Active',
        body: `Sleeping for: ${elapsed.formatted}`,
        data: {
          type: 'sleep-timer',
          startTime: state.startTime.toString(),
          userId: state.userId,
        },
        sticky: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'sleep-timer',
      },
      trigger: null,
    });
    
    console.log(`🔄 Sleep timer notification updated: ${elapsed.formatted}`);
  } catch (error) {
    console.error('❌ Error updating sleep timer notification:', error);
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate Elapsed Time
 * Returns formatted time string and raw values
 */
export const calculateElapsedTime = (startTime: number): {
  hours: number;
  minutes: number;
  formatted: string;
  formattedShort: string;
} => {
  const elapsed = Date.now() - startTime;
  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  
  return {
    hours,
    minutes,
    formatted: `${hours}h ${minutes}m`,
    formattedShort: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
  };
};

/**
 * Format Sleep Duration for Display
 */
export const formatSleepDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} minutes`;
  }
  
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
};

// ============================================================================
// FIREBASE DATA RETRIEVAL
// ============================================================================

/**
 * ✅ Get Recent Sleep Sessions
 * Returns last N sleep sessions for the user
 */
export const getRecentSleepSessions = async (
  userId: string,
  limitCount: number = 10
): Promise<SleepSession[]> => {
  try {
    // ✅ FIXED: React Native Firebase API
    const snapshot = await firestore()
      .collection('users')
      .doc(userId)
      .collection(SLEEP_SESSIONS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();
    
    const sessions: SleepSession[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        sessionId: doc.id,
        userId: data.userId,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || new Date(),
        duration: data.duration,
        durationHours: data.durationHours,
        quality: data.quality,
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
    
    console.log(`✅ Retrieved ${sessions.length} sleep sessions`);
    return sessions;
  } catch (error) {
    console.error('❌ Error getting sleep sessions:', error);
    return [];
  }
};

/**
 * ✅ Get Sleep Statistics
 * Calculate sleep stats for analytics
 */
export const getSleepStats = async (userId: string): Promise<SleepStats | null> => {
  try {
    const sessions = await getRecentSleepSessions(userId, 30);
    
    if (sessions.length === 0) {
      return null;
    }
    
    const totalHours = sessions.reduce((sum, s) => sum + s.durationHours, 0);
    const averageDuration = totalHours / sessions.length;
    
    const durations = sessions.map(s => s.durationHours);
    const longestSleep = Math.max(...durations);
    const shortestSleep = Math.min(...durations);
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7Days = sessions.filter(s => s.createdAt >= sevenDaysAgo);
    const last7DaysAverage = last7Days.length > 0
      ? last7Days.reduce((sum, s) => sum + s.durationHours, 0) / last7Days.length
      : 0;
    
    const last30DaysAverage = averageDuration;
    
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - averageDuration, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    const sleepConsistency = Math.max(0, Math.min(100, 100 - (stdDev * 20)));
    
    return {
      averageDuration: parseFloat(averageDuration.toFixed(2)),
      totalSessions: sessions.length,
      longestSleep: parseFloat(longestSleep.toFixed(2)),
      shortestSleep: parseFloat(shortestSleep.toFixed(2)),
      last7DaysAverage: parseFloat(last7DaysAverage.toFixed(2)),
      last30DaysAverage: parseFloat(last30DaysAverage.toFixed(2)),
      sleepConsistency: Math.round(sleepConsistency),
    };
  } catch (error) {
    console.error('❌ Error calculating sleep stats:', error);
    return null;
  }
};

/**
 * ✅ Update Sleep Session Quality
 * Add quality rating and notes to an existing sleep session
 */
export const updateSleepSessionQuality = async (
  userId: string,
  sessionId: string,
  quality: number,
  notes?: string
): Promise<void> => {
  try {
    // ✅ FIXED: React Native Firebase API
    await firestore()
      .collection('users')
      .doc(userId)
      .collection(SLEEP_SESSIONS_COLLECTION)
      .doc(sessionId)
      .update({
        quality,
        notes: notes || '',
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    
    console.log(`✅ Sleep session ${sessionId} updated with quality: ${quality}`);
  } catch (error) {
    console.error('❌ Error updating sleep session quality:', error);
    throw error;
  }
};

// ============================================================================
// INITIALIZATION & CLEANUP
// ============================================================================

/**
 * ✅ Initialize Sleep Timer Service
 * Call this on app startup to resume timer if needed
 */
export const initializeSleepTimerService = async (): Promise<void> => {
  try {
    const state = await getSleepTimerStatus();
    
    if (state?.isRunning) {
      console.log('🔄 Resuming active sleep timer from previous session');
      await updateSleepTimerNotification();
    } else {
      console.log('✅ Sleep timer service initialized (no active timer)');
    }
  } catch (error) {
    console.error('❌ Error initializing sleep timer service:', error);
  }
};

/**
 * ✅ Cleanup Stale Timer
 * Removes timer if it's been running for more than 24 hours
 */
export const cleanupStaleSleepTimer = async (): Promise<void> => {
  try {
    const state = await getSleepTimerStatus();
    
    if (state) {
      const elapsedHours = (Date.now() - state.startTime) / 3600000;
      
      if (elapsedHours > 24) {
        console.warn('⚠️ Cleaning up stale sleep timer (>24 hours)');
        await cancelSleepTimer();
      }
    }
  } catch (error) {
    console.error('❌ Error cleaning up stale sleep timer:', error);
  }
};
