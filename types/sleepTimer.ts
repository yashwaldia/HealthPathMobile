// types/sleepTimer.ts

/**
 * Sleep Timer State stored in AsyncStorage
 */
export interface SleepTimerState {
  isRunning: boolean;
  startTime: number; // Unix timestamp (milliseconds)
  userId: string;
  notificationId?: string;
}

/**
 * Sleep Session saved to Firebase after timer stops
 */
export interface SleepSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // Total duration in minutes
  durationHours: number; // Hours (e.g., 7.5)
  quality?: number; // Optional: User-rated quality (1-10)
  notes?: string; // Optional: Sleep notes
  deepSleepPercent?: number; // Optional: For future integration with wearables
  remSleepPercent?: number; // Optional: For future integration with wearables
  awakenings?: number; // Optional: Number of times woke up
  createdAt: Date;
}

/**
 * Sleep Statistics for analytics
 */
export interface SleepStats {
  averageDuration: number; // Average sleep duration in hours
  totalSessions: number;
  longestSleep: number; // Hours
  shortestSleep: number; // Hours
  last7DaysAverage: number;
  last30DaysAverage: number;
  sleepConsistency: number; // Score 0-100 based on schedule consistency
}

/**
 * Sleep Timer Notification Data
 */
export interface SleepTimerNotificationData {
  type: 'sleep-timer';
  startTime: number;
  userId: string;
  action?: 'stop' | 'add-note';
}
