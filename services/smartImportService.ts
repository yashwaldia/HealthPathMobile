// services/smartImportService.ts
// ✅ MISSING: Main smart import orchestrator
// Last Updated: December 18, 2025

import { ExtractedMedication, MergeConflict } from '../types/medication';
import {
    batchAddMedications,
    detectPotentialDuplicates,
    getAllMedications,
    mergeMedication,
} from './medicationService';

/**
 * MAIN Smart Import Function - Orchestrates entire flow
 * 1. Detect duplicates → 2. Show conflicts → 3. Batch save/merge
 */
export const smartImportMedications = async (
  userId: string,
  extractedMedications: ExtractedMedication[]
): Promise<{
  addedCount: number;
  mergedCount: number;
  conflicts: MergeConflict[];
}> => {
  try {
    console.log(`🚀 Smart importing ${extractedMedications.length} medications...`);

    // 1. Get existing medications
    const existingMedications = await getAllMedications(userId);

    // 2. Detect potential conflicts
    const conflicts = detectPotentialDuplicates(existingMedications, extractedMedications);
    
    if (conflicts.length > 0) {
      // Throw conflict for UI to handle
      const error = new Error('Conflicts detected');
      (error as any).conflict = conflicts[0]; // Show first conflict
      (error as any).allConflicts = conflicts;
      throw error;
    }

    // 3. No conflicts - batch add all
    const medicationIds = await batchAddMedications(userId, extractedMedications);
    
    return {
      addedCount: medicationIds.length,
      mergedCount: 0,
      conflicts: [],
    };
  } catch (error: any) {
    if (error.conflict) {
      return {
        addedCount: 0,
        mergedCount: 0,
        conflicts: error.allConflicts || [error.conflict],
      };
    }
    throw error;
  }
};

/**
 * Resolve ALL conflicts and save remaining medications
 */
export const resolveConflictsAndSave = async (
  userId: string,
  extractedMedications: ExtractedMedication[],
  resolvedConflicts: { existingId: string; keepNew: boolean }[]
): Promise<{
  addedCount: number;
  mergedCount: number;
}> => {
  try {
    const existingMedications = await getAllMedications(userId);
    
    // Process resolved conflicts (merges)
    let mergedCount = 0;
    for (const resolution of resolvedConflicts) {
      const newMedData = extractedMedications.find(
        med => med.name === resolution.existingId.split('-')[0]
      )!;
      
      await mergeMedication(userId, resolution.existingId, newMedData!, 
        resolution.keepNew ? 'new' : 'existing');
      mergedCount++;
    }

    // Filter out resolved medications and batch add the rest
    const remainingMeds = extractedMedications.filter(med => 
      !resolvedConflicts.some(r => r.existingId.includes(med.name || ''))
    );

    const addedIds = await batchAddMedications(userId, remainingMeds);
    
    return {
      addedCount: addedIds.length,
      mergedCount,
    };
  } catch (error) {
    console.error('Error resolving conflicts:', error);
    throw error;
  }
};
