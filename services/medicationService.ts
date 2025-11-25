// services/medicationService.ts

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// Import types from the types file
import { 
  Medication,
  DoseLog 
} from '../types/medication';

/**
 * Helper function to remove undefined values from an object.
 * Firestore does not support 'undefined' as a value.
 */
const cleanData = (data: any) => {
  const cleaned: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      cleaned[key] = data[key];
    }
  });
  return cleaned;
};

/**
 * Add a new medication
 */
export const addMedication = async (
  userId: string,
  medicationData: Omit<Medication, 'medicationId' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const medsRef = collection(db, `users/${userId}/medications`);
    const newMedRef = doc(medsRef);

    const medication: Medication = {
      medicationId: newMedRef.id,
      userId,
      ...medicationData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // FIX: Clean data to remove undefined fields before saving
    const cleanedMedication = cleanData({
      ...medication,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('💾 Saving cleaned medication data:', JSON.stringify(cleanedMedication, null, 2));

    await setDoc(newMedRef, cleanedMedication);

    return newMedRef.id;
  } catch (error) {
    console.error('Error adding medication:', error);
    throw error;
  }
};

/**
 * Get all medications for a user
 */
export const getAllMedications = async (userId: string): Promise<Medication[]> => {
  try {
    const medsRef = collection(db, `users/${userId}/medications`);
    const q = query(medsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      medicationId: doc.id,
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    } as Medication));
  } catch (error) {
    console.error('Error getting medications:', error);
    throw error;
  }
};

/**
 * Get active medications only
 */
export const getActiveMedications = async (userId: string): Promise<Medication[]> => {
  try {
    const medsRef = collection(db, `users/${userId}/medications`);
    const q = query(
      medsRef,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      medicationId: doc.id,
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    } as Medication));
  } catch (error) {
    console.error('Error getting active medications:', error);
    throw error;
  }
};

/**
 * Get a single medication by ID
 */
export const getMedication = async (
  userId: string,
  medicationId: string
): Promise<Medication | null> => {
  try {
    const medRef = doc(db, `users/${userId}/medications`, medicationId);
    const medDoc = await getDoc(medRef);

    if (!medDoc.exists()) {
      return null;
    }

    return {
      ...medDoc.data(),
      medicationId: medDoc.id,
      createdAt: (medDoc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (medDoc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    } as Medication;
  } catch (error) {
    console.error('Error getting medication:', error);
    throw error;
  }
};

/**
 * Update medication
 */
export const updateMedication = async (
  userId: string,
  medicationId: string,
  updates: Partial<Medication>
): Promise<void> => {
  try {
    const medRef = doc(db, `users/${userId}/medications`, medicationId);

    // Filter out undefined values using cleanData helper
    const cleanedUpdates = cleanData({
      ...updates,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(medRef, cleanedUpdates);
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
};

/**
 * Delete medication
 */
export const deleteMedication = async (
  userId: string,
  medicationId: string
): Promise<void> => {
  try {
    const medRef = doc(db, `users/${userId}/medications`, medicationId);
    await deleteDoc(medRef);
  } catch (error) {
    console.error('Error deleting medication:', error);
    throw error;
  }
};

/**
 * Mark medication as inactive (soft delete)
 */
export const deactivateMedication = async (
  userId: string,
  medicationId: string
): Promise<void> => {
  try {
    await updateMedication(userId, medicationId, {
      isActive: false,
    });
  } catch (error) {
    console.error('Error deactivating medication:', error);
    throw error;
  }
};

/**
 * Log a dose taken
 */
export const logDose = async (
  userId: string,
  medicationId: string,
  doseData: Omit<DoseLog, 'doseId' | 'medicationId' | 'createdAt'>
): Promise<string> => {
  try {
    const dosesRef = collection(db, `users/${userId}/medications/${medicationId}/doses`);
    const newDoseRef = doc(dosesRef);

    const doseLog: DoseLog = {
      doseId: newDoseRef.id,
      medicationId,
      ...doseData,
      createdAt: new Date(),
    };

    // Also clean dose data just in case
    const cleanedDoseLog = cleanData({
      ...doseLog,
      createdAt: serverTimestamp(),
    });

    await setDoc(newDoseRef, cleanedDoseLog);

    return newDoseRef.id;
  } catch (error) {
    console.error('Error logging dose:', error);
    throw error;
  }
};

/**
 * Get dose history for a medication
 */
export const getDoseHistory = async (
  userId: string,
  medicationId: string,
  limit: number = 30
): Promise<DoseLog[]> => {
  try {
    const dosesRef = collection(db, `users/${userId}/medications/${medicationId}/doses`);
    const q = query(dosesRef, orderBy('scheduledTime', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.slice(0, limit).map(doc => ({
      ...doc.data(),
      doseId: doc.id,
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    } as DoseLog));
  } catch (error) {
    console.error('Error getting dose history:', error);
    throw error;
  }
};

/**
 * Check medication adherence (percentage of doses taken)
 */
export const calculateAdherence = async (
  userId: string,
  medicationId: string,
  days: number = 7
): Promise<number> => {
  try {
    const doseHistory = await getDoseHistory(userId, medicationId, days * 4); // Assume max 4 doses/day
    
    if (doseHistory.length === 0) return 100; // No data = assume perfect
    
    const takenCount = doseHistory.filter(dose => dose.taken).length;
    const totalCount = doseHistory.length;
    
    return Math.round((takenCount / totalCount) * 100);
  } catch (error) {
    console.error('Error calculating adherence:', error);
    return 0;
  }
};
