// services/fitCalcService.ts

import {
  collection,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
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
  const ref = collection(db, 'users', userId, 'fitcalc_history');
  const docRef = await addDoc(ref, {
    calculatorId,
    inputs,
    result,
    savedAt: Timestamp.now(),
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
  const ref = collection(db, 'users', userId, 'fitcalc_history');
  const q = query(
    ref,
    where('calculatorId', '==', calculatorId),
    orderBy('savedAt', 'desc'),
    limit(maxCount)
  );

  const snapshot = await getDocs(q);

  const entries: FitCalcHistoryEntry[] = [];
  snapshot.forEach((docSnap) => {
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
  const ref = doc(db, 'users', userId, 'fitcalc_history', entryId);
  await deleteDoc(ref);
}
