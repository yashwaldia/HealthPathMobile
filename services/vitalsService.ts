import { 
  collection, 
  setDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc,
  Timestamp, 
  limit as firestoreLimit 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { VitalRecord } from '../types/vitals';

const VITALS_COLLECTION = 'vitals';
const LATEST_VITALS_COLLECTION = 'latestVitals'; // New collection for dashboard display

export const vitalsService = {
  /**
   * Update or create the latest vitals record for dashboard display
   * This REPLACES the old data with new data
   */
  async updateLatestVitals(userId: string, data: Omit<VitalRecord, 'id' | 'userId'>): Promise<string> {
    try {
      // Use user ID as document ID - this ensures only ONE record per user
      const docRef = doc(db, LATEST_VITALS_COLLECTION, userId);
      
      await setDoc(docRef, {
        ...data,
        userId,
        date: data.date || new Date().toISOString(),
        source: data.source || 'manual',
      }, { merge: false }); // merge: false means REPLACE, not merge
      
      return userId;
    } catch (error) {
      console.error('Error updating latest vitals:', error);
      throw new Error('Failed to save vital record');
    }
  },

  /**
   * Add vital record to history (optional - for keeping historical data)
   * This creates a new record each time for history tracking
   */
  async addVitalToHistory(userId: string, data: Omit<VitalRecord, 'id' | 'userId'>): Promise<string> {
    try {
      const historyRef = collection(db, `users/${userId}/vitalsHistory`);
      const docRef = doc(historyRef); // Auto-generate ID
      
      await setDoc(docRef, {
        ...data,
        userId,
        date: data.date || new Date().toISOString(),
        source: data.source || 'manual',
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding vital to history:', error);
      throw new Error('Failed to save vital history');
    }
  },

  /**
   * Get the latest vitals for dashboard display
   * Returns only ONE record per user
   */
  async getLatestVitals(userId: string): Promise<Partial<VitalRecord>> {
    try {
      const docRef = doc(db, LATEST_VITALS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as VitalRecord;
      }
      
      return {};
    } catch (error) {
      console.error('Error fetching latest vitals:', error);
      return {};
    }
  },

  /**
   * Get vitals history for charts and trends
   */
  async getVitalsHistory(userId: string, recordLimit?: number): Promise<VitalRecord[]> {
    try {
      const historyRef = collection(db, `users/${userId}/vitalsHistory`);
      const q = query(
        historyRef,
        orderBy('date', 'desc'),
        ...(recordLimit ? [firestoreLimit(recordLimit)] : [])
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as VitalRecord[];
    } catch (error) {
      console.error('Error fetching vitals history:', error);
      return [];
    }
  },

  /**
   * Delete the latest vitals (clears dashboard)
   */
  async deleteLatestVitals(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, LATEST_VITALS_COLLECTION, userId));
    } catch (error) {
      console.error('Error deleting latest vitals:', error);
      throw new Error('Failed to delete vitals');
    }
  },

  /**
   * Get vitals within date range from history
   */
  async getVitalsInRange(userId: string, startDate: Date, endDate: Date): Promise<VitalRecord[]> {
    try {
      const historyRef = collection(db, `users/${userId}/vitalsHistory`);
      const q = query(
        historyRef,
        where('date', '>=', startDate.toISOString()),
        where('date', '<=', endDate.toISOString()),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as VitalRecord[];
    } catch (error) {
      console.error('Error fetching vitals in range:', error);
      return [];
    }
  },
};

// Helper function to calculate vital status
export const getVitalStatus = (
  type: string,
  value1: number,
  value2?: number
): 'normal' | 'alert' | 'critical' => {
  if (isNaN(value1)) return 'normal';

  switch (type) {
    case 'bloodPressure':
      if (!value2 || isNaN(value2)) return 'normal';
      if (value1 < 90 || value2 < 60) return 'alert'; // Low
      if (value1 >= 140 || value2 >= 90) return 'critical'; // High
      if (value1 >= 121 || value2 >= 81) return 'alert'; // Elevated
      return 'normal';

    case 'bloodSugar':
      if (value1 < 70) return 'alert'; // Low
      if (value1 >= 126) return 'critical'; // High
      if (value1 >= 100) return 'alert'; // Prediabetic range
      return 'normal';

    case 'heartRate':
    case 'pulseRate':
      if (value1 < 60 || value1 > 100) return 'alert';
      return 'normal';

    case 'oxygenSaturation':
      if (value1 < 92) return 'critical';
      if (value1 < 95) return 'alert';
      return 'normal';

    case 'temperature':
      if (value1 < 35) return 'alert'; // Hypothermia
      if (value1 >= 38) return 'critical'; // Fever
      if (value1 > 37.2) return 'alert'; // Slightly elevated
      return 'normal';

    default:
      return 'normal';
  }
};

// Helper to format time since last reading
export const timeSince = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
};
