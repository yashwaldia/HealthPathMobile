// services/appNotificationService.ts
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
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
 * Helper function to remove undefined values from an object
 * Firestore does not support undefined as a value
 */
const cleanData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const cleaned: any = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined) {
      if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
        cleaned[key] = cleanData(data[key]);
      } else {
        cleaned[key] = data[key];
      }
    }
  });
  return Object.keys(cleaned).length > 0 ? cleaned : null;
};

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
    
    const cleanedData = payload.data ? cleanData(payload.data) : null;
    
    await addDoc(notificationsRef, {
      title: payload.title,
      body: payload.body,
      type: payload.type,
      data: cleanedData,
      read: false,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

/**
 * Convenience: Vitals notification
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
 * Convenience: Reminder notification
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
 * Convenience: Weekly health report notification
 */
export const createWeeklyReportNotification = async (
  userId: string,
  options: {
    title?: string;
    body?: string;
    reportId?: string;
    summary?: string;
  } = {}
) => {
  return createNotification(userId, {
    title: options.title || 'Weekly Health Report Ready',
    body: options.body || 'Your AI health summary is ready. Tap to view this week report.',
    type: 'ai-insight',
    data: {
      type: 'weekly-report',
      reportId: options.reportId || null,
      summary: options.summary || null,
    },
  });
};

/**
 * Create a generic test notification
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
