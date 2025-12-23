// services/appNotificationService.ts
import firestore from '@react-native-firebase/firestore';

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
      if (
        typeof data[key] === 'object' &&
        data[key] !== null &&
        !Array.isArray(data[key])
      ) {
        cleaned[key] = cleanData(data[key]);
      } else {
        cleaned[key] = data[key];
      }
    }
  });
  return Object.keys(cleaned).length > 0 ? cleaned : null;
};

const getNotificationsCollection = (userId: string) =>
  firestore()
    .collection('users')
    .doc(userId)
    .collection('notifications');

/**
 * Fetch notifications for a specific user
 */
export const getNotifications = async (
  userId: string
): Promise<AppNotification[]> => {
  try {
    const snapshot = await getNotificationsCollection(userId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

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
export const markAsRead = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  try {
    await getNotificationsCollection(userId)
      .doc(notificationId)
      .update({ read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

/**
 * Clear (delete) all notifications for a user
 */
export const clearAllNotifications = async (userId: string): Promise<void> => {
  try {
    const collectionRef = getNotificationsCollection(userId);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) return;

    const batch = firestore().batch();
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
): Promise<void> => {
  try {
    const notificationsRef = getNotificationsCollection(userId);

    const cleanedData = payload.data ? cleanData(payload.data) : null;

    await notificationsRef.add({
      title: payload.title,
      body: payload.body,
      type: payload.type,
      data: cleanedData,
      read: false,
      timestamp: firestore.FieldValue.serverTimestamp(),
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
): Promise<void> => {
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
): Promise<void> => {
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
): Promise<void> => {
  return createNotification(userId, {
    title: options.title || 'Weekly Health Report Ready',
    body:
      options.body ||
      'Your AI health summary is ready. Tap to view this week report.',
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
export const createTestNotification = async (
  userId: string
): Promise<void> => {
  try {
    await createNotification(userId, {
      title: 'Welcome to PI HEALTH',
      body: 'This is a test notification to verify the system.',
      type: 'general',
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
  }
};
