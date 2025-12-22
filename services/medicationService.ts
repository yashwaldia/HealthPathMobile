// services/medicationService.ts
// ✅ ENHANCED: Added batch save and merge helpers for Smart Import feature
// Last Updated: December 17, 2025
export { resolveConflictsAndSave, smartImportMedications } from './smartImportService';

import firestore from '@react-native-firebase/firestore';
import {
  DoseLog,
  ExtractedMedication,
  Medication,
  MergeConflict,
} from '../types/medication';

// ✅ Import notification service
import {
  cancelMedicationReminder,
  scheduleAllMedicationReminders,
  scheduleMedicationReminder,
} from './notificationService';

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
 * Helper: Convert duration string to number of days
 * e.g., "7 days" -> 7, "2 weeks" -> 14, "1 month" -> 30
 */
export const parseDurationToDays = (duration?: string): number | undefined => {
  if (!duration) return undefined;
  
  const durationLower = duration.toLowerCase().trim();
  const match = durationLower.match(/(\d+)\s*(day|week|month|year)/);
  
  if (!match) return undefined;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'day':
      return value;
    case 'week':
      return value * 7;
    case 'month':
      return value * 30;
    case 'year':
      return value * 365;
    default:
      return undefined;
  }
};

/**
 * Helper: Convert ExtractedMedication to Medication format
 */
export const convertExtractedToMedication = (
  extracted: ExtractedMedication,
  userId: string,
  medicationId: string
): Medication => {
  const now = new Date();
  const startDate = extracted.startDate || now.toISOString().split('T')[0];
  const durationDays = extracted.durationDays || parseDurationToDays(extracted.duration);
  
  // Calculate end date if duration is provided
  let endDate: string | undefined;
  if (durationDays) {
    const end = new Date(startDate);
    end.setDate(end.getDate() + durationDays);
    endDate = end.toISOString().split('T')[0];
  }
  
  return {
    medicationId,
    userId,
    name: extracted.name,
    strength: extracted.strength || '',
    dosageForm: (extracted.dosageForm as any) || 'Tablet',
    frequency: (extracted.frequency as any) || 'As needed',
    customFrequency: extracted.customFrequency,
    mealRelation: (extracted.mealRelation as any) || 'Any time',
    startDate,
    durationDays,
    endDate,
    prescribedBy: extracted.prescribedBy,
    purpose: extracted.purpose,
    instructions: extracted.instructions,
    genericName: extracted.genericName,
    classification: extracted.classification,
    reminderEnabled: false, // User can enable later
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Add a new medication
 * ✅ ENHANCED: Now automatically schedules notification reminders
 */
export const addMedication = async (
  userId: string,
  medicationData: Omit<Medication, 'medicationId' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const newMedRef = firestore().collection(`users/${userId}/medications`).doc();

    const medication: Medication = {
      medicationId: newMedRef.id,
      userId,
      ...medicationData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Clean data to remove undefined fields before saving
    const cleanedMedication = cleanData({
      ...medication,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    console.log('💾 Saving cleaned medication data:', JSON.stringify(cleanedMedication, null, 2));

    // Save to Firestore
    await newMedRef.set(cleanedMedication);

    // ✅ UPDATED: Schedule notification reminders with userId parameter
    try {
      if (medication.isActive && medication.frequency !== 'As needed') {
        console.log('📅 Scheduling reminders for new medication...');
        await scheduleMedicationReminder(medication, userId);
        console.log('✅ Reminders scheduled successfully');
      }
    } catch (notificationError) {
      // Don't fail the entire operation if notification scheduling fails
      console.warn('⚠️ Failed to schedule notification, but medication was saved:', notificationError);
    }

    return newMedRef.id;
  } catch (error) {
    console.error('Error adding medication:', error);
    throw error;
  }
};

/**
 * ✅ NEW: Batch add medications (for Smart Import feature)
 * Adds multiple medications at once with transaction support
 */
export const batchAddMedications = async (
  userId: string,
  extractedMedications: ExtractedMedication[]
): Promise<string[]> => {
  try {
    console.log(`📦 Batch adding ${extractedMedications.length} medications...`);
    
    const batch = firestore().batch();
    const medicationIds: string[] = [];
    const medicationsToSchedule: Medication[] = [];

    for (const extracted of extractedMedications) {
      const newMedRef = firestore().collection(`users/${userId}/medications`).doc();
      const medicationId = newMedRef.id;
      medicationIds.push(medicationId);

      const medication = convertExtractedToMedication(extracted, userId, medicationId);
      
      const cleanedMedication = cleanData({
        ...medication,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      batch.set(newMedRef, cleanedMedication);
      
      // Track for notification scheduling
      if (medication.isActive && medication.frequency !== 'As needed') {
        medicationsToSchedule.push(medication);
      }
    }

    // Commit batch write
    await batch.commit();
    console.log(`✅ ${extractedMedications.length} medications saved to Firestore`);

    // Schedule notifications for active medications
    if (medicationsToSchedule.length > 0) {
      console.log(`📅 Scheduling reminders for ${medicationsToSchedule.length} medications...`);
      try {
        await Promise.all(
          medicationsToSchedule.map(med => 
            scheduleMedicationReminder(med, userId).catch(err => {
              console.warn(`⚠️ Failed to schedule reminder for ${med.name}:`, err);
            })
          )
        );
        console.log('✅ All reminders scheduled');
      } catch (notificationError) {
        console.warn('⚠️ Some notifications failed to schedule:', notificationError);
      }
    }

    return medicationIds;
  } catch (error) {
    console.error('Error batch adding medications:', error);
    throw error;
  }
};

/**
 * ✅ NEW: Merge medications (update existing with new prescription details)
 * Used when user chooses to merge in conflict resolution
 */
export const mergeMedication = async (
  userId: string,
  existingMedicationId: string,
  newMedicationData: ExtractedMedication,
  keepDetails: 'existing' | 'new'
): Promise<void> => {
  try {
    console.log(`🔀 Merging medication: ${existingMedicationId}`);
    
    const existingMed = await getMedication(userId, existingMedicationId);
    if (!existingMed) {
      throw new Error('Existing medication not found');
    }

    // Determine which details to keep
    const updates: Partial<Medication> = {
      // Always update schedule from new prescription
      frequency: (newMedicationData.frequency as any) || existingMed.frequency,
      mealRelation: (newMedicationData.mealRelation as any) || existingMed.mealRelation,
      startDate: newMedicationData.startDate || new Date().toISOString().split('T')[0],
      durationDays: newMedicationData.durationDays || parseDurationToDays(newMedicationData.duration),
      
      // Keep or update medication details based on user choice
      name: keepDetails === 'new' ? newMedicationData.name : existingMed.name,
      strength: keepDetails === 'new' ? (newMedicationData.strength || existingMed.strength) : existingMed.strength,
      dosageForm: keepDetails === 'new' ? ((newMedicationData.dosageForm as any) || existingMed.dosageForm) : existingMed.dosageForm,
      
      // Update other fields from new prescription
      prescribedBy: newMedicationData.prescribedBy || existingMed.prescribedBy,
      instructions: newMedicationData.instructions || existingMed.instructions,
      purpose: newMedicationData.purpose || existingMed.purpose,
      
      // Ensure medication is active
      isActive: true,
    };

    // Calculate end date
    if (updates.durationDays && updates.startDate) {
      const end = new Date(updates.startDate);
      end.setDate(end.getDate() + updates.durationDays);
      updates.endDate = end.toISOString().split('T')[0];
    }

    // Add merge note to instructions/notes
    const mergeNote = `\nMerged with ${newMedicationData.name} on ${new Date().toLocaleDateString()}`;
    updates.instructions = (updates.instructions || '') + mergeNote;

    await updateMedication(userId, existingMedicationId, updates);
    console.log('✅ Medication merged successfully');
  } catch (error) {
    console.error('Error merging medication:', error);
    throw error;
  }
};

/**
 * ✅ NEW: Detect potential duplicate medications
 * Returns medications that might conflict with new ones
 */
export const detectPotentialDuplicates = (
  existingMedications: Medication[],
  newMedications: ExtractedMedication[]
): MergeConflict[] => {
  const conflicts: MergeConflict[] = [];
  
  for (const newMed of newMedications) {
    // Skip if no classification data
    if (!newMed.classification || !newMed.genericName) continue;
    
    // Find existing medications with same classification
    const matchingExisting = existingMedications.filter(existing => 
      existing.isActive &&
      existing.classification === newMed.classification &&
      existing.genericName !== newMed.genericName
    );
    
    // Add conflicts
    for (const existingMed of matchingExisting) {
      conflicts.push({
        existingMed,
        newMed,
      });
    }
  }
  
  console.log(`🔍 Detected ${conflicts.length} potential conflicts`);
  return conflicts;
};

/**
 * Get all medications for a user
 */
export const getAllMedications = async (userId: string): Promise<Medication[]> => {
  try {
    const querySnapshot = await firestore()
      .collection(`users/${userId}/medications`)
      .orderBy('createdAt', 'desc')
      .get();

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      medicationId: doc.id,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
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
    const querySnapshot = await firestore()
      .collection(`users/${userId}/medications`)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      medicationId: doc.id,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
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
    const medDoc = await firestore()
      .collection(`users/${userId}/medications`)
      .doc(medicationId)
      .get();

    if (!medDoc.exists) {
      return null;
    }

    const data = medDoc.data();
    if (!data) {
      return null;
    }

    return {
      ...data,
      medicationId: medDoc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Medication;
  } catch (error) {
    console.error('Error getting medication:', error);
    throw error;
  }
};

/**
 * Update medication
 * ✅ ENHANCED: Now updates notification reminders automatically
 */
export const updateMedication = async (
  userId: string,
  medicationId: string,
  updates: Partial<Medication>
): Promise<void> => {
  try {
    const medRef = firestore().collection(`users/${userId}/medications`).doc(medicationId);

    // Filter out undefined values using cleanData helper
    const cleanedUpdates = cleanData({
      ...updates,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Update in Firestore
    await medRef.update(cleanedUpdates);

    // ✅ UPDATED: Update notification reminders with userId parameter
    try {
      // Get the updated medication data
      const updatedMed = await getMedication(userId, medicationId);
      
      if (updatedMed) {
        // Cancel old reminders
        await cancelMedicationReminder(medicationId);
        
        // Schedule new reminders if medication is active
        if (updatedMed.isActive && updatedMed.frequency !== 'As needed') {
          console.log('🔄 Rescheduling reminders after update...');
          await scheduleMedicationReminder(updatedMed, userId);
          console.log('✅ Reminders rescheduled successfully');
        }
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to update notifications, but medication was updated:', notificationError);
    }
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
};

/**
 * Delete medication
 * ✅ ENHANCED: Now cancels notification reminders automatically
 */
export const deleteMedication = async (
  userId: string,
  medicationId: string
): Promise<void> => {
  try {
    // ✅ Cancel notification reminders first
    try {
      console.log('🗑️ Cancelling reminders for deleted medication...');
      await cancelMedicationReminder(medicationId);
      console.log('✅ Reminders cancelled successfully');
    } catch (notificationError) {
      console.warn('⚠️ Failed to cancel notifications:', notificationError);
    }

    // Delete from Firestore
    await firestore()
      .collection(`users/${userId}/medications`)
      .doc(medicationId)
      .delete();
  } catch (error) {
    console.error('Error deleting medication:', error);
    throw error;
  }
};

/**
 * Mark medication as inactive (soft delete)
 * ✅ ENHANCED: Now cancels notification reminders automatically
 */
export const deactivateMedication = async (
  userId: string,
  medicationId: string
): Promise<void> => {
  try {
    // Update medication status
    await updateMedication(userId, medicationId, {
      isActive: false,
    });

    // ✅ Cancel notification reminders
    try {
      console.log('🔕 Cancelling reminders for deactivated medication...');
      await cancelMedicationReminder(medicationId);
      console.log('✅ Reminders cancelled successfully');
    } catch (notificationError) {
      console.warn('⚠️ Failed to cancel notifications:', notificationError);
    }
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
    const newDoseRef = firestore()
      .collection(`users/${userId}/medications/${medicationId}/doses`)
      .doc();

    const doseLog: DoseLog = {
      doseId: newDoseRef.id,
      medicationId,
      ...doseData,
      createdAt: new Date(),
    };

    // Clean dose data
    const cleanedDoseLog = cleanData({
      ...doseLog,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    await newDoseRef.set(cleanedDoseLog);

    console.log('✅ Dose logged successfully');

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
    const querySnapshot = await firestore()
      .collection(`users/${userId}/medications/${medicationId}/doses`)
      .orderBy('scheduledTime', 'desc')
      .limit(limit)
      .get();

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      doseId: doc.id,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
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

/**
 * ✅ Reschedule all medication reminders
 * Useful for when user changes notification preferences or after app update
 */
export const rescheduleAllReminders = async (userId: string): Promise<void> => {
  try {
    console.log('🔄 Rescheduling all medication reminders...');
    await scheduleAllMedicationReminders(userId);
    console.log('✅ All reminders rescheduled successfully');
  } catch (error) {
    console.error('Error rescheduling all reminders:', error);
    throw error;
  }
};
