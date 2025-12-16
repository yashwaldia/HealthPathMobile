// services/fitCalcService.ts
import firestore from '@react-native-firebase/firestore';
import { FitCalcId } from '../types/fitcalc';

export type FitCalcHistoryEntry = {
  entryId: string;
  calculatorId: FitCalcId;
  inputs: any;
  result: any;
  savedAt: Date;
};

/**
 * Save a new calculation to user's history
 */
export async function saveFitCalcHistory(
  userId: string,
  calculatorId: FitCalcId,
  inputs: any,
  result: any
): Promise<string> {
  const docRef = await firestore()
    .collection('users')
    .doc(userId)
    .collection('fitcalc_history')
    .add({
      calculatorId,
      inputs,
      result,
      savedAt: firestore.Timestamp.now(),
    });
  return docRef.id;
}

/**
 * Load past calculations for a specific calculator
 */
export async function loadFitCalcHistory(
  userId: string,
  calculatorId: FitCalcId,
  maxCount: number = 10
): Promise<FitCalcHistoryEntry[]> {
  const snapshot = await firestore()
    .collection('users')
    .doc(userId)
    .collection('fitcalc_history')
    .where('calculatorId', '==', calculatorId)
    .orderBy('savedAt', 'desc')
    .limit(maxCount)
    .get();

  const entries: FitCalcHistoryEntry[] = [];
  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    entries.push({
      entryId: docSnap.id,
      calculatorId: data.calculatorId as FitCalcId,
      inputs: data.inputs || {},
      result: data.result || {},
      savedAt: data.savedAt?.toDate() || new Date(),
    });
  });

  return entries;
}

/**
 * Delete a single history entry
 */
export async function deleteFitCalcHistoryEntry(
  userId: string,
  entryId: string
): Promise<void> {
  await firestore()
    .collection('users')
    .doc(userId)
    .collection('fitcalc_history')
    .doc(entryId)
    .delete();
}
