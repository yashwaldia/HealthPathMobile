// services/appNotificationService.ts
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export type AppNotificationType =
  | 'vitals'
  | 'ai-insight'
  | 'reminder'
  | 'child-health'
  | 'general';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: AppNotificationType;
  read: boolean;
  timestamp: Date;
  data?: any;
}

/**
 * Fetch notifications for a specific user
 */
export const getNotifications = async (
  userId: string
): Promise<AppNotification[]> => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        ...data,
        // Safely convert Firestore Timestamp to JS Date
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
      } as AppNotification;
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (userId: string, notificationId: string) => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

/**
 * Clear (delete) all notifications for a user
 */
export const clearAllNotifications = async (userId: string) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const snapshot = await getDocs(notificationsRef);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};

/**
 * Low-level helper to create a notification of any type
 * Make sure `type` matches NotificationCenter filters:
 *  - 'vitals'
 *  - 'ai-insight'
 *  - 'reminder'
 *  - 'child-health'
 *  - 'general'
 */
export const createNotification = async (
  userId: string,
  payload: {
    title: string;
    body: string;
    type: AppNotificationType;
    data?: any;
  }
) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    await addDoc(notificationsRef, {
      title: payload.title,
      body: payload.body,
      type: payload.type,
      data: payload.data ?? null,
      read: false,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

/**
 * Convenience: Vitals notification (shows under "Vitals" tab)
 */
export const createVitalsNotification = async (
  userId: string,
  title: string,
  body: string,
  data?: any
) => {
  return createNotification(userId, {
    title,
    body,
    type: 'vitals',
    data,
  });
};

/**
 * Convenience: Reminder notification (shows under "Reminder" tab)
 */
export const createReminderNotification = async (
  userId: string,
  title: string,
  body: string,
  data?: any
) => {
  return createNotification(userId, {
    title,
    body,
    type: 'reminder',
    data,
  });
};

/**
 * Convenience: Weekly health report / AI insight notification
 * - Appears in:
 *   - "Weekly" tab when data.type === 'weekly-report'
 */
export const createWeeklyReportNotification = async (
  userId: string,
  options: {
    title?: string;
    body?: string;
    // extra data for navigation / display
    reportId?: string;
    summary?: string;
  } = {}
) => {
  return createNotification(userId, {
    title: options.title ?? 'Weekly Health Report Ready',
    body:
      options.body ??
      'Your AI health summary is ready. Tap to view this week’s report.',
    type: 'ai-insight',
    data: {
      type: 'weekly-report', // IMPORTANT: used by NotificationCenter "Weekly" filter
      reportId: options.reportId ?? null,
      summary: options.summary ?? null,
    },
  });
};

/**
 * (Optional) Create a generic test notification
 * - Will appear only in "All" (type = 'general')
 */
export const createTestNotification = async (userId: string) => {
  try {
    await createNotification(userId, {
      title: 'Welcome to HealthPath',
      body: 'This is a test notification to verify the system.',
      type: 'general',
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
  }
};
