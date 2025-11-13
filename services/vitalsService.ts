import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDocs, Timestamp, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { VitalRecord } from '../types/vitals';

const VITALS_COLLECTION = 'vitals';

export const vitalsService = {
  // Add new vital record
  async addVitalRecord(userId: string, data: Omit<VitalRecord, 'id' | 'userId'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, VITALS_COLLECTION), {
        ...data,
        userId,
        date: data.date || new Date().toISOString(),
        source: data.source || 'manual',
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding vital record:', error);
      throw new Error('Failed to save vital record');
    }
  },

  // Get all vitals for user
  async getUserVitals(userId: string, recordLimit?: number): Promise<VitalRecord[]> {
    try {
      const q = query(
        collection(db, VITALS_COLLECTION),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        ...(recordLimit ? [firestoreLimit(recordLimit)] : [])
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as VitalRecord[];
    } catch (error) {
      console.error('Error fetching vitals:', error);
      throw new Error('Failed to fetch vitals');
    }
  },

  // Get vitals within date range
  async getVitalsInRange(userId: string, startDate: Date, endDate: Date): Promise<VitalRecord[]> {
    try {
      const q = query(
        collection(db, VITALS_COLLECTION),
        where('userId', '==', userId),
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
      throw new Error('Failed to fetch vitals');
    }
  },

  // Update vital record
  async updateVitalRecord(recordId: string, data: Partial<VitalRecord>): Promise<void> {
    try {
      const docRef = doc(db, VITALS_COLLECTION, recordId);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating vital record:', error);
      throw new Error('Failed to update vital record');
    }
  },

  // Delete vital record
  async deleteVitalRecord(recordId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, VITALS_COLLECTION, recordId));
    } catch (error) {
      console.error('Error deleting vital record:', error);
      throw new Error('Failed to delete vital record');
    }
  },

  // Get latest reading for each vital type
  async getLatestVitals(userId: string): Promise<Partial<VitalRecord>> {
    try {
      const records = await this.getUserVitals(userId, 1);
      return records[0] || {};
    } catch (error) {
      console.error('Error fetching latest vitals:', error);
      return {};
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
