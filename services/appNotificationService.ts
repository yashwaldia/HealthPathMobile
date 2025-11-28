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
  addDoc 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig'; // Adjust this path to where your 'db' is exported

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'vitals' | 'ai-insight' | 'reminder' | 'child-health' | 'general';
  read: boolean;
  timestamp: Date;
  data?: any;
}

/**
 * Fetch notifications for a specific user
 */
export const getNotifications = async (userId: string): Promise<AppNotification[]> => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Safely convert Firestore Timestamp to JS Date
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
      };
    }) as AppNotification[];
  } catch (error) {
    console.error("Error fetching notifications:", error);
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
    console.error("Error marking notification as read:", error);
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
     snapshot.docs.forEach((doc) => {
       batch.delete(doc.ref);
     });
     await batch.commit();
   } catch (error) {
     console.error("Error clearing notifications:", error);
   }
};

/**
 * (Optional) Create a test notification manually
 */
export const createTestNotification = async (userId: string) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    await addDoc(notificationsRef, {
      title: 'Welcome to HealthPath',
      body: 'This is a test notification to verify the system.',
      type: 'general',
      read: false,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating test notification:", error);
  }
};
