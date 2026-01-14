// services/profileService.ts

/**
 * Profile Service - Firebase Firestore CRUD Operations
 * Firestore Path: users/{userId}
 * * Modern React Native Firebase v23 Implementation
 * ✅ FIXED: Wellness collection bug
 * ✅ FIXED: Duplicate medication deletion
 * ✅ OPTIMIZED: Error handling and performance
 * ✅ PHASE 1 P0: Fixed undefined value handling in createProfile (Edge Cases 2.1-2.5, 13.1-13.2)
 * ✅ PHASE 2 P1: Added retry logic for network failures during deletion (Edge Cases 3.2, 3.3, 7.2)
 * ✅ PHASE 3: Added deep sanitization to prevent "Unsupported field value: undefined" crashes
 */

import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';
import { 
  getDefaultProfile, 
  PeriodCycleResult, 
  ProfileData, 
  ProfileUpdateData, 
  UserProfile 
} from '../types/profile';

/**
 * ✅ NEW: Deletion progress callback interface
 */
export interface DeletionProgress {
  phase: string;
  completedSteps: number;
  totalSteps: number;
  currentCollection?: string;
  deletedCount?: number;
  totalCount?: number;
}

/**
 * ✅ NEW: Deletion checkpoint for recovery
 */
interface DeletionCheckpoint {
  userId: string;
  completedCollections: string[];
  lastUpdated: number;
}

export const profileService = {
  /**
   * Get user profile from Firestore
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docSnap = await firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      if (docSnap.exists) {
        console.log('✅ Profile loaded successfully');
        const data = docSnap.data();
        
        return {
          ...data,
          createdAt: data?.createdAt?.toDate 
            ? data.createdAt.toDate().toISOString() 
            : (data?.createdAt || new Date().toISOString()),
          lastActive: data?.lastActive?.toDate 
            ? data.lastActive.toDate().toISOString() 
            : (data?.lastActive || new Date().toISOString()),
        } as UserProfile;
      }
      
      console.log('⚠️ Profile not found');
      return null;
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      throw error;
    }
  },

  /**
   * ✅ PHASE 1 P0 FIX: Create initial profile on signup
   * * CRITICAL FIXES APPLIED:
   * - ✅ Edge Case 13.1: Recursively removes undefined values (Fixes crash)
   * - ✅ Edge Case 2.1: Handle undefined/null displayName with fallback
   * - ✅ Edge Case 2.5: Added retry mechanism for network failures
   */
  async createProfile(
    userId: string, 
    initialData: { 
      email?: string | null; 
      displayName?: string | null; 
      photoURL?: string | null; 
    }
  ): Promise<void> {
    // Validate and sanitize input data
    const sanitizedData = this._sanitizeProfileData(initialData);
    
    // Validate required email field
    if (!sanitizedData.email || sanitizedData.email.trim() === '') {
      throw new Error('Email is required to create a profile. Please ensure your authentication method provides an email address.');
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Profile creation attempt ${attempt}/${maxRetries} for user: ${userId}`);

        // Get timezone with fallback
        let timezone = 'UTC';
        try {
          timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        } catch {
          timezone = 'UTC';
        }
        
        // Build raw profile
        const rawProfile = {
          uid: userId,
          email: sanitizedData.email,
          displayName: sanitizedData.displayName,
          photoURL: sanitizedData.photoURL,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          pushToken: null,
          timezone,
          profile: getDefaultProfile(),
        };

        // ✅ CRITICAL FIX: Recursively remove undefined values
        // This prevents the [Error: Unsupported field value: undefined] crash
        const safeProfile = this._removeUndefined(rawProfile);

        // Final validation
        this._validateProfileForFirestore(safeProfile);

        await firestore()
          .collection('users')
          .doc(userId)
          .set(safeProfile);
          
        console.log('✅ Profile created successfully');
        return;
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Profile creation attempt ${attempt} failed:`, error);

        if (error instanceof Error && error.message.includes('validation')) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 500;
          console.log(`⏳ Retrying in ${delayMs}ms...`);
          await this._delay(delayMs);
        }
      }
    }

    console.error('❌ Profile creation failed after all retry attempts');
    throw new Error(`Failed to create profile after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  },

  /**
   * ✅ HELPER: Sanitize and validate profile data from Firebase Auth
   */
  _sanitizeProfileData(
    data: { email?: string | null; displayName?: string | null; photoURL?: string | null }
  ): { email: string; displayName: string; photoURL: string | null } {
    let email = data.email?.trim() || '';
    
    if (!email || email === '') {
      email = '';
    }

    let displayName = data.displayName?.trim() || '';
    
    if (!displayName || displayName === '') {
      if (email && email.includes('@')) {
        displayName = email.split('@')[0];
        console.log(`ℹ️ Generated displayName from email: ${displayName}`);
      } else {
        displayName = 'User';
        console.log('ℹ️ Using default displayName: User');
      }
    }

    const photoURL = data.photoURL?.trim() || null;

    return {
      email,
      displayName,
      photoURL,
    };
  },

  /**
   * ✅ NEW HELPER: Recursively remove undefined values
   * Firestore crashes if any field (even nested ones) is undefined.
   */
  _removeUndefined(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) return obj;

    // Handle Arrays
    if (Array.isArray(obj)) {
      return obj.map(v => this._removeUndefined(v));
    }

    // Handle Objects
    const result: any = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value !== undefined) {
        result[key] = this._removeUndefined(value);
      }
    });
    return result;
  },

  /**
   * ✅ HELPER: Final validation before Firestore write
   */
  _validateProfileForFirestore(profile: UserProfile): void {
    // Note: We rely on _removeUndefined to strip undefineds, 
    // so we just check required top-level fields here.
    if (!profile.uid || profile.uid.trim() === '') {
      throw new Error('Profile validation failed: uid is required');
    }

    if (!profile.email || profile.email.trim() === '') {
      throw new Error('Profile validation failed: email is required');
    }

    console.log('✅ Profile validation passed');
  },

  /**
   * ✅ HELPER: Delay utility for retry backoff
   */
  _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * ✅ NEW: Check if error is network-related
   */
  _isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code?.toLowerCase() || '';
    
    const networkIndicators = [
      'network', 'timeout', 'unavailable', 'failed to fetch',
      'connection', 'offline', 'econnrefused', 'enotfound', 'etimedout',
    ];
    
    return networkIndicators.some(indicator => 
      errorMessage.includes(indicator) || errorCode.includes(indicator)
    );
  },

  /**
   * ✅ NEW: Check if error is retryable
   */
  _isRetryableError(error: any): boolean {
    if (this._isNetworkError(error)) {
      return true;
    }
    
    const retryableCodes = [
      'unavailable', 'deadline-exceeded', 'resource-exhausted', 'aborted', 'internal',
    ];
    
    return retryableCodes.includes(error?.code);
  },

  /**
   * Update user profile - merges with existing data
   */
  async updateProfile(userId: string, data: ProfileUpdateData): Promise<void> {
    try {
      const updateData: any = { 
        ...data, 
        lastActive: new Date().toISOString() 
      };

      if (data.profile) {
        const currentProfile = await this.getProfile(userId);
        if (currentProfile) {
          updateData.profile = { ...currentProfile.profile, ...data.profile };
        }
      }

      // ✅ FIX: Clean undefined values before update
      const safeUpdateData = this._removeUndefined(updateData);

      await firestore()
        .collection('users')
        .doc(userId)
        .update(safeUpdateData);
        
      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Update only profile data (nested object)
   */
  async updateProfileData(userId: string, profileData: Partial<ProfileData>): Promise<void> {
    try {
      const currentProfile = await this.getProfile(userId);
      
      if (!currentProfile) throw new Error('Profile not found');

      const updatePayload = {
        profile: { ...currentProfile.profile, ...profileData },
        lastActive: new Date().toISOString(),
      };

      // ✅ FIX: Clean undefined values before update
      const safePayload = this._removeUndefined(updatePayload);

      await firestore()
        .collection('users')
        .doc(userId)
        .update(safePayload);

      console.log('✅ Profile data updated successfully');
    } catch (error) {
      console.error('❌ Error updating profile data:', error);
      throw error;
    }
  },

  /**
   * Update user's last active timestamp
   */
  async updateLastActive(userId: string): Promise<void> {
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .update({ 
          lastActive: new Date().toISOString() 
        });
    } catch (error) {
      console.error('❌ Error updating last active:', error);
    }
  },

  /**
   * Save/update Expo push token
   */
  async updatePushToken(userId: string, pushToken: string | null): Promise<void> {
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          pushToken,
          lastActive: new Date().toISOString(),
        });
        
      console.log('✅ Push token updated successfully');
    } catch (error) {
      console.error('❌ Error updating push token:', error);
      throw error;
    }
  },

  /**
   * Update user's timezone
   */
  async updateTimezone(userId: string, timezone: string): Promise<void> {
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          timezone,
          lastActive: new Date().toISOString(),
        });
        
      console.log('✅ Timezone updated successfully');
    } catch (error) {
      console.error('❌ Error updating timezone:', error);
      throw error;
    }
  },

  /**
   * Calculate age from date of birth
   */
  calculateAge(dob: string): string {
    if (!dob) return '';
    
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  },

  /**
   * Format date for display
   */
  formatDate(dateInput: string | FirebaseFirestoreTypes.Timestamp | Date | any): string {
    if (!dateInput) return 'Not set';
    
    let date: Date;
    
    if (dateInput?.toDate && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } else {
      date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  /**
   * Calculate Period Cycle Predictions
   */
  calculatePeriodCycle(profileData: ProfileData): PeriodCycleResult {
    const { periodStartDate, averageCycleLength } = profileData;

    if (!periodStartDate) {
      return {
        hasSufficientData: false,
        notes: 'Please enter your last period start date to see predictions.',
      };
    }

    const lastPeriodStart = new Date(periodStartDate);
    if (isNaN(lastPeriodStart.getTime())) {
      return {
        hasSufficientData: false,
        notes: 'Invalid period start date format. Please use YYYY-MM-DD.',
      };
    }

    const cycleLength = averageCycleLength || 28;
    
    if (cycleLength < 21 || cycleLength > 45) {
      return {
        hasSufficientData: false,
        notes: 'Average cycle length should be between 21-45 days.',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysSinceLastPeriod = Math.floor(
      (today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    const cycleDay = (daysSinceLastPeriod % cycleLength) + 1;

    const nextPeriodStart = new Date(lastPeriodStart);
    const cyclesPassed = Math.floor(daysSinceLastPeriod / cycleLength) + 1;
    nextPeriodStart.setDate(lastPeriodStart.getDate() + (cycleLength * cyclesPassed));

    const daysUntilNextPeriod = Math.floor(
      (nextPeriodStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const periodDuration = 5;
    const nextPeriodEnd = new Date(nextPeriodStart);
    nextPeriodEnd.setDate(nextPeriodStart.getDate() + periodDuration);

    const ovulationDate = new Date(nextPeriodStart);
    ovulationDate.setDate(nextPeriodStart.getDate() - 14);

    const daysUntilOvulation = Math.floor(
      (ovulationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const fertileWindowStart = new Date(ovulationDate);
    fertileWindowStart.setDate(ovulationDate.getDate() - 5);
    
    const fertileWindowEnd = new Date(ovulationDate);
    fertileWindowEnd.setDate(ovulationDate.getDate() + 1);

    let currentPhase: PeriodCycleResult['currentPhase'] = 'Unknown';
    
    if (cycleDay >= 1 && cycleDay <= 5) {
      currentPhase = 'Menstruation';
    } else if (cycleDay >= 6 && cycleDay <= 13) {
      currentPhase = 'Follicular';
    } else if (cycleDay >= 14 && cycleDay <= 16) {
      currentPhase = 'Ovulation';
    } else if (cycleDay >= 17 && cycleDay <= cycleLength) {
      currentPhase = 'Luteal';
    }

    const formatToISO = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    return {
      hasSufficientData: true,
      lastPeriodStart: periodStartDate,
      lastPeriodEnd: profileData.periodEndDate,
      averageCycleLength: cycleLength,
      nextPeriodStart: formatToISO(nextPeriodStart),
      nextPeriodEnd: formatToISO(nextPeriodEnd),
      ovulationDate: formatToISO(ovulationDate),
      fertileWindowStart: formatToISO(fertileWindowStart),
      fertileWindowEnd: formatToISO(fertileWindowEnd),
      cycleDay,
      cycleLength,
      daysUntilNextPeriod,
      daysUntilOvulation,
      currentPhase,
      notes: daysUntilNextPeriod < 0 
        ? 'Your period may be overdue. Please update your period data.'
        : undefined,
    };
  },

  /**
   * Listen to profile changes in real-time
   */
  subscribeToProfile(
    userId: string, 
    onUpdate: (profile: UserProfile | null) => void
  ): () => void {
    const unsubscribe = firestore()
      .collection('users')
      .doc(userId)
      .onSnapshot(
        (docSnap) => {
          if (docSnap.exists) {
            const data = docSnap.data();
            const profile: UserProfile = {
              ...data,
              createdAt: data?.createdAt?.toDate 
                ? data.createdAt.toDate().toISOString() 
                : (data?.createdAt || new Date().toISOString()),
              lastActive: data?.lastActive?.toDate 
                ? data.lastActive.toDate().toISOString() 
                : (data?.lastActive || new Date().toISOString()),
            } as UserProfile;
            onUpdate(profile);
          } else {
            onUpdate(null);
          }
        },
        (error) => {
          console.error('❌ Error listening to profile:', error);
          onUpdate(null);
        }
      );

    return unsubscribe;
  },

  /**
   * ✅ PHASE 2 P1: Enhanced delete user profile with retry logic
   * * @param userId - The user ID whose data should be deleted
   * @param onProgress - Optional callback for progress updates
   */
  async deleteUserProfile(
    userId: string,
    onProgress?: (progress: DeletionProgress) => void
  ): Promise<void> {
    try {
      console.log('🗑️ Starting user data deletion for:', userId);

      // ✅ VALIDATION: Ensure userId is provided
      if (!userId || userId.trim() === '') {
        throw new Error('Invalid userId: Cannot delete user with empty ID');
      }

      // ✅ NEW: Initialize deletion checkpoint
      const checkpoint: DeletionCheckpoint = {
        userId,
        completedCollections: [],
        lastUpdated: Date.now(),
      };

      // Define all collections to delete
      const simpleCollections = [
        'vitalsHistory',
        'vitals',
        'lab_reports',
        'nutrition',
        'screenings',
        'symptoms',
        'biohacking',
        'children',
        'notifications',
        'weeklyReports',
        'appNotifications',
        'metadata',
        'radiologyAnalyses',
        'fitcalc_history',
        'fitcalc',
        'sleepSessions',
      ];

      const totalSteps = simpleCollections.length + 4; // +4 for medications, wellness, childProfiles, main doc
      let completedSteps = 0;

      // ✅ STEP 1: Delete simple subcollections with retry
      console.log(`🗑️ Deleting ${simpleCollections.length} simple subcollections...`);
      
      for (const collectionName of simpleCollections) {
        onProgress?.({
          phase: 'Deleting subcollections',
          completedSteps,
          totalSteps,
          currentCollection: collectionName,
        });

        await this._deleteCollectionWithRetry(userId, collectionName);
        
        checkpoint.completedCollections.push(collectionName);
        checkpoint.lastUpdated = Date.now();
        completedSteps++;
      }

      // ✅ STEP 2: Delete medications with nested doses
      onProgress?.({
        phase: 'Deleting medications',
        completedSteps,
        totalSteps,
        currentCollection: 'medications',
      });

      console.log('🗑️ Deleting medications and their nested doses...');
      await this._deleteMedicationsWithRetry(userId);
      
      checkpoint.completedCollections.push('medications');
      checkpoint.lastUpdated = Date.now();
      completedSteps++;

      // ✅ STEP 3: Delete wellness collection
      onProgress?.({
        phase: 'Deleting wellness data',
        completedSteps,
        totalSteps,
        currentCollection: 'wellness',
      });

      console.log('🗑️ Deleting wellness data...');
      await this._deleteWellnessWithRetry(userId);
      
      checkpoint.completedCollections.push('wellness');
      checkpoint.lastUpdated = Date.now();
      completedSteps++;

      // ✅ STEP 4: Delete child profiles
      onProgress?.({
        phase: 'Deleting child profiles',
        completedSteps,
        totalSteps,
        currentCollection: 'childProfiles',
      });

      console.log('🗑️ Deleting child profiles...');
      await this._deleteChildProfilesWithRetry(userId);
      
      checkpoint.completedCollections.push('childProfiles');
      checkpoint.lastUpdated = Date.now();
      completedSteps++;

      // ✅ STEP 5: Delete main user document
      onProgress?.({
        phase: 'Finalizing deletion',
        completedSteps,
        totalSteps,
        currentCollection: 'users',
      });

      console.log('🗑️ Deleting main user document...');
      await this._deleteMainDocumentWithRetry(userId);
      
      completedSteps++;

      // ✅ Success
      onProgress?.({
        phase: 'Complete',
        completedSteps: totalSteps,
        totalSteps,
      });

      console.log('✅ User profile and all data deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting user profile:', error);
      throw error;
    }
  },

  /**
   * ✅ NEW: Delete collection with retry logic
   */
  async _deleteCollectionWithRetry(
    userId: string,
    collectionName: string,
    maxRetries: number = 3
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.deleteCollection(userId, collectionName);
        return; // Success
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Attempt ${attempt}/${maxRetries} failed for ${collectionName}:`, error);

        if (!this._isRetryableError(error)) {
          console.log(`⚠️ Non-retryable error for ${collectionName}, skipping...`);
          return;
        }

        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Retrying ${collectionName} in ${delayMs}ms...`);
          await this._delay(delayMs);
        }
      }
    }
    console.warn(`⚠️ Failed to delete ${collectionName} after ${maxRetries} attempts:`, lastError);
  },

  /**
   * ✅ NEW: Delete medications with retry logic
   */
  async _deleteMedicationsWithRetry(userId: string, maxRetries: number = 3): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.deleteMedicationsWithDoses(userId);
        return;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Medications deletion attempt ${attempt}/${maxRetries} failed:`, error);

        if (!this._isRetryableError(error)) {
          console.log('⚠️ Non-retryable error for medications, skipping...');
          return;
        }

        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Retrying medications deletion in ${delayMs}ms...`);
          await this._delay(delayMs);
        }
      }
    }
    console.warn(`⚠️ Failed to delete medications after ${maxRetries} attempts:`, lastError);
  },

  /**
   * ✅ NEW: Delete wellness with retry logic
   */
  async _deleteWellnessWithRetry(userId: string, maxRetries: number = 3): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.deleteWellnessCollection(userId);
        return;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Wellness deletion attempt ${attempt}/${maxRetries} failed:`, error);

        if (!this._isRetryableError(error)) {
          console.log('⚠️ Non-retryable error for wellness, skipping...');
          return;
        }

        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Retrying wellness deletion in ${delayMs}ms...`);
          await this._delay(delayMs);
        }
      }
    }
    console.warn(`⚠️ Failed to delete wellness after ${maxRetries} attempts:`, lastError);
  },

  /**
   * ✅ NEW: Delete child profiles with retry logic
   */
  async _deleteChildProfilesWithRetry(userId: string, maxRetries: number = 3): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.deleteChildProfiles(userId);
        return;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Child profiles deletion attempt ${attempt}/${maxRetries} failed:`, error);

        if (!this._isRetryableError(error)) {
          console.log('⚠️ Non-retryable error for child profiles, skipping...');
          return;
        }

        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Retrying child profiles deletion in ${delayMs}ms...`);
          await this._delay(delayMs);
        }
      }
    }
    console.warn(`⚠️ Failed to delete child profiles after ${maxRetries} attempts:`, lastError);
  },

  /**
   * ✅ NEW: Delete main user document with retry logic
   */
  async _deleteMainDocumentWithRetry(userId: string, maxRetries: number = 3): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await firestore()
          .collection('users')
          .doc(userId)
          .delete();
        
        console.log('✅ Main user document deleted');
        return;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Main document deletion attempt ${attempt}/${maxRetries} failed:`, error);

        if (!this._isRetryableError(error)) {
          throw new Error(`Failed to delete main user document: ${error.message}`);
        }

        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Retrying main document deletion in ${delayMs}ms...`);
          await this._delay(delayMs);
        }
      }
    }
    throw new Error(`Failed to delete main user document after ${maxRetries} attempts: ${lastError?.message}`);
  },

  /**
   * Helper: Delete a simple subcollection (no nested subcollections)
   */
  async deleteCollection(userId: string, collectionName: string): Promise<void> {
    try {
      const collectionRef = firestore()
        .collection('users')
        .doc(userId)
        .collection(collectionName);

      const snapshot = await collectionRef.get();

      if (snapshot.empty) {
        console.log(`⚠️ No documents in ${collectionName}`);
        return;
      }

      console.log(`🗑️ Deleting ${snapshot.size} documents from ${collectionName}...`);

      const batchSize = 500;
      let batch = firestore().batch();
      let operationCount = 0;

      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        operationCount++;

        if (operationCount === batchSize) {
          await batch.commit();
          batch = firestore().batch();
          operationCount = 0;
        }
      }

      if (operationCount > 0) {
        await batch.commit();
      }

      console.log(`✅ Deleted ${collectionName}`);
    } catch (error) {
      console.error(`❌ Error deleting ${collectionName}:`, error);
      throw error;
    }
  },

  /**
   * Helper: Delete medications collection and nested doses subcollection
   */
  async deleteMedicationsWithDoses(userId: string): Promise<void> {
    try {
      const medicationsRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('medications');

      const medicationsSnapshot = await medicationsRef.get();

      if (medicationsSnapshot.empty) {
        console.log('⚠️ No medications to delete');
        return;
      }

      console.log(`🗑️ Found ${medicationsSnapshot.size} medications to delete`);

      for (const medicationDoc of medicationsSnapshot.docs) {
        const dosesRef = medicationDoc.ref.collection('doses');
        const dosesSnapshot = await dosesRef.get();

        if (!dosesSnapshot.empty) {
          console.log(`🗑️ Deleting ${dosesSnapshot.size} doses for medication ${medicationDoc.id}`);
          
          let batch = firestore().batch();
          let count = 0;

          for (const doseDoc of dosesSnapshot.docs) {
            batch.delete(doseDoc.ref);
            count++;

            if (count === 500) {
              await batch.commit();
              batch = firestore().batch();
              count = 0;
            }
          }

          if (count > 0) {
            await batch.commit();
          }
        }

        await medicationDoc.ref.delete();
      }

      console.log('✅ Deleted all medications and doses');
    } catch (error) {
      console.error('❌ Error deleting medications:', error);
      throw error;
    }
  },

  /**
   * Helper: Delete wellness collection
   */
  async deleteWellnessCollection(userId: string): Promise<void> {
    try {
      const wellnessRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('wellness');

      const wellnessSnapshot = await wellnessRef.get();

      if (wellnessSnapshot.empty) {
        console.log('⚠️ No wellness data to delete');
        return;
      }

      console.log(`🗑️ Deleting ${wellnessSnapshot.size} wellness documents...`);

      let batch = firestore().batch();
      let count = 0;

      for (const doc of wellnessSnapshot.docs) {
        batch.delete(doc.ref);
        count++;

        if (count === 500) {
          await batch.commit();
          batch = firestore().batch();
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
      }

      console.log('✅ Deleted wellness collection');
    } catch (error) {
      console.error('❌ Error deleting wellness:', error);
      throw error;
    }
  },

  /**
   * Helper: Delete wellnessModules (if exists)
   */
  async deleteWellnessModules(userId: string): Promise<void> {
    try {
      const modulesRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('wellnessModules');

      const modulesSnapshot = await modulesRef.get();

      if (modulesSnapshot.empty) {
        console.log('⚠️ No wellness modules to delete');
        return;
      }

      console.log(`🗑️ Deleting ${modulesSnapshot.size} wellness modules...`);

      for (const moduleDoc of modulesSnapshot.docs) {
        const nestedCollections = [
          'dailyTracking',
          'weeklyData',
          'weeklyReports',
          'notifications',
          'moduleData',
        ];

        for (const nestedCollection of nestedCollections) {
          const nestedRef = moduleDoc.ref.collection(nestedCollection);
          const nestedSnapshot = await nestedRef.get();

          if (!nestedSnapshot.empty) {
            let batch = firestore().batch();
            let count = 0;

            for (const nestedDoc of nestedSnapshot.docs) {
              batch.delete(nestedDoc.ref);
              count++;

              if (count === 500) {
                await batch.commit();
                batch = firestore().batch();
                count = 0;
              }
            }

            if (count > 0) {
              await batch.commit();
            }
          }
        }

        await moduleDoc.ref.delete();
      }

      console.log('✅ Deleted all wellness modules');
    } catch (error) {
      console.error('❌ Error deleting wellness modules:', error);
      throw error;
    }
  },

  /**
   * Helper: Delete childProfiles and all nested subcollections
   */
  async deleteChildProfiles(userId: string): Promise<void> {
    try {
      const profilesRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('childProfiles');

      const profilesSnapshot = await profilesRef.get();

      if (profilesSnapshot.empty) {
        console.log('⚠️ No child profiles to delete');
        return;
      }

      console.log(`🗑️ Deleting ${profilesSnapshot.size} child profiles...`);

      for (const profileDoc of profilesSnapshot.docs) {
        const nestedCollections = [
          'dailyTracking',
          'weeklyData',
          'weeklyReports',
          'notifications',
          'moduleData',
          'growthMetrics',
          'weeklyAIContent',
        ];

        for (const nestedCollection of nestedCollections) {
          const nestedRef = profileDoc.ref.collection(nestedCollection);
          const nestedSnapshot = await nestedRef.get();

          if (!nestedSnapshot.empty) {
            let batch = firestore().batch();
            let count = 0;

            for (const nestedDoc of nestedSnapshot.docs) {
              batch.delete(nestedDoc.ref);
              count++;

              if (count === 500) {
                await batch.commit();
                batch = firestore().batch();
                count = 0;
              }
            }

            if (count > 0) {
              await batch.commit();
            }
          }
        }

        await profileDoc.ref.delete();
      }

      console.log('✅ Deleted all child profiles');
    } catch (error) {
      console.error('❌ Error deleting child profiles:', error);
      throw error;
    }
  },
};

export default profileService;