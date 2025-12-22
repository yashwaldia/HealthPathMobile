// services/fitCalcService.ts

import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { FitCalcId, GetCalcInputs, GetCalcResult } from '../types/fitcalc';

// ============================================================================
// TYPES
// ============================================================================

export type FitCalcHistoryEntry<T extends FitCalcId = FitCalcId> = {
  entryId: string;
  calculatorId: T;
  inputs: GetCalcInputs<T>;
  result: GetCalcResult<T>;
  savedAt: Date;
};

type FirestoreHistoryDocument = {
  calculatorId: FitCalcId;
  inputs: any;
  result: any;
  savedAt: FirebaseFirestoreTypes.Timestamp;
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

class FitCalcServiceError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'UNKNOWN',
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'FitCalcServiceError';
  }
}

function handleFirestoreError(error: unknown): never {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('permission') || message.includes('denied')) {
      throw new FitCalcServiceError(
        'Permission denied. Please check your authentication.',
        'PERMISSION_DENIED',
        error
      );
    }
    
    if (message.includes('network') || message.includes('offline')) {
      throw new FitCalcServiceError(
        'Network error. Please check your connection.',
        'NETWORK_ERROR',
        error
      );
    }
    
    if (message.includes('not found') || message.includes('does not exist')) {
      throw new FitCalcServiceError(
        'Document not found.',
        'NOT_FOUND',
        error
      );
    }
  }
  
  throw new FitCalcServiceError(
    'An unexpected error occurred.',
    'UNKNOWN',
    error
  );
}

// ============================================================================
// COLLECTION REFERENCE HELPER
// ============================================================================

function getHistoryCollection(userId: string) {
  return firestore()
    .collection('users')
    .doc(userId)
    .collection('fitcalc_history');
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Save a new calculation to user's history
 * 
 * @param userId - User's Firebase UID
 * @param calculatorId - Calculator identifier
 * @param inputs - Calculator input values
 * @param result - Calculated result
 * @returns Promise resolving to the new document ID
 * @throws FitCalcServiceError
 */
export async function saveFitCalcHistory<T extends FitCalcId>(
  userId: string,
  calculatorId: T,
  inputs: GetCalcInputs<T>,
  result: GetCalcResult<T>
): Promise<string> {
  try {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }
    
    if (!calculatorId?.trim()) {
      throw new Error('Calculator ID is required');
    }
    
    const docRef = await getHistoryCollection(userId).add({
      calculatorId,
      inputs,
      result,
      savedAt: firestore.Timestamp.now(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('[FitCalcService] Error saving history:', error);
    return handleFirestoreError(error);
  }
}

/**
 * Load past calculations for a specific calculator
 * 
 * @param userId - User's Firebase UID
 * @param calculatorId - Calculator identifier
 * @param maxCount - Maximum number of entries to load (default: 10)
 * @returns Promise resolving to array of history entries
 * @throws FitCalcServiceError
 */
export async function loadFitCalcHistory<T extends FitCalcId>(
  userId: string,
  calculatorId: T,
  maxCount: number = 10
): Promise<FitCalcHistoryEntry<T>[]> {
  try {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }
    
    if (!calculatorId?.trim()) {
      throw new Error('Calculator ID is required');
    }
    
    if (maxCount < 1 || maxCount > 100) {
      throw new Error('maxCount must be between 1 and 100');
    }
    
    const snapshot = await getHistoryCollection(userId)
      .where('calculatorId', '==', calculatorId)
      .orderBy('savedAt', 'desc')
      .limit(maxCount)
      .get();
    
    const entries: FitCalcHistoryEntry<T>[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as FirestoreHistoryDocument;
      return {
        entryId: docSnap.id,
        calculatorId: data.calculatorId as T,
        inputs: data.inputs || {},
        result: data.result || {},
        savedAt: data.savedAt?.toDate() || new Date(),
      };
    });
    
    return entries;
  } catch (error) {
    console.error('[FitCalcService] Error loading history:', error);
    return handleFirestoreError(error);
  }
}

/**
 * Delete a single history entry
 * 
 * @param userId - User's Firebase UID
 * @param entryId - History entry document ID
 * @throws FitCalcServiceError
 */
export async function deleteFitCalcHistoryEntry(
  userId: string,
  entryId: string
): Promise<void> {
  try {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }
    
    if (!entryId?.trim()) {
      throw new Error('Entry ID is required');
    }
    
    await getHistoryCollection(userId)
      .doc(entryId)
      .delete();
  } catch (error) {
    console.error('[FitCalcService] Error deleting history entry:', error);
    return handleFirestoreError(error);
  }
}

/**
 * Load all history entries for a user (across all calculators)
 * 
 * @param userId - User's Firebase UID
 * @param maxCount - Maximum number of entries to load (default: 50)
 * @returns Promise resolving to array of all history entries
 * @throws FitCalcServiceError
 */
export async function loadAllFitCalcHistory(
  userId: string,
  maxCount: number = 50
): Promise<FitCalcHistoryEntry[]> {
  try {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }
    
    if (maxCount < 1 || maxCount > 100) {
      throw new Error('maxCount must be between 1 and 100');
    }
    
    const snapshot = await getHistoryCollection(userId)
      .orderBy('savedAt', 'desc')
      .limit(maxCount)
      .get();
    
    const entries: FitCalcHistoryEntry[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as FirestoreHistoryDocument;
      return {
        entryId: docSnap.id,
        calculatorId: data.calculatorId,
        inputs: data.inputs || {},
        result: data.result || {},
        savedAt: data.savedAt?.toDate() || new Date(),
      };
    });
    
    return entries;
  } catch (error) {
    console.error('[FitCalcService] Error loading all history:', error);
    return handleFirestoreError(error);
  }
}

/**
 * Delete all history entries for a specific calculator
 * 
 * @param userId - User's Firebase UID
 * @param calculatorId - Calculator identifier
 * @returns Promise resolving to number of deleted entries
 * @throws FitCalcServiceError
 */
export async function deleteCalculatorHistory(
  userId: string,
  calculatorId: FitCalcId
): Promise<number> {
  try {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }
    
    if (!calculatorId?.trim()) {
      throw new Error('Calculator ID is required');
    }
    
    const snapshot = await getHistoryCollection(userId)
      .where('calculatorId', '==', calculatorId)
      .get();
    
    const batch = firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return snapshot.size;
  } catch (error) {
    console.error('[FitCalcService] Error deleting calculator history:', error);
    return handleFirestoreError(error);
  }
}

/**
 * Delete all history entries for a user
 * 
 * @param userId - User's Firebase UID
 * @returns Promise resolving to number of deleted entries
 * @throws FitCalcServiceError
 */
export async function deleteAllHistory(userId: string): Promise<number> {
  try {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }
    
    const snapshot = await getHistoryCollection(userId).get();
    
    const batch = firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return snapshot.size;
  } catch (error) {
    console.error('[FitCalcService] Error deleting all history:', error);
    return handleFirestoreError(error);
  }
}

/**
 * Get count of history entries for a specific calculator
 * 
 * @param userId - User's Firebase UID
 * @param calculatorId - Calculator identifier
 * @returns Promise resolving to count of entries
 * @throws FitCalcServiceError
 */
export async function getHistoryCount(
  userId: string,
  calculatorId: FitCalcId
): Promise<number> {
  try {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }
    
    if (!calculatorId?.trim()) {
      throw new Error('Calculator ID is required');
    }
    
    const snapshot = await getHistoryCollection(userId)
      .where('calculatorId', '==', calculatorId)
      .count()
      .get();
    
    return snapshot.data().count;
  } catch (error) {
    console.error('[FitCalcService] Error getting history count:', error);
    return handleFirestoreError(error);
  }
}

/**
 * Update an existing history entry
 * 
 * @param userId - User's Firebase UID
 * @param entryId - History entry document ID
 * @param inputs - Updated input values
 * @param result - Updated result values
 * @throws FitCalcServiceError
 */
export async function updateFitCalcHistory<T extends FitCalcId>(
  userId: string,
  entryId: string,
  inputs: GetCalcInputs<T>,
  result: GetCalcResult<T>
): Promise<void> {
  try {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }
    
    if (!entryId?.trim()) {
      throw new Error('Entry ID is required');
    }
    
    await getHistoryCollection(userId)
      .doc(entryId)
      .update({
        inputs,
        result,
        updatedAt: firestore.Timestamp.now(),
      });
  } catch (error) {
    console.error('[FitCalcService] Error updating history entry:', error);
    return handleFirestoreError(error);
  }
}

// ============================================================================
// EXPORT ERROR CLASS FOR HANDLING
// ============================================================================

export { FitCalcServiceError };
