/**
 * Profile Service - Firebase Firestore CRUD Operations
 * Firestore Path: users/{userId}
 */

import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { UserProfile, ProfileData, ProfileUpdateData, getDefaultProfile } from '../types/profile';

const db = getFirestore();

export const profileService = {
  /**
   * Get user profile from Firestore
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('✅ Profile loaded successfully');
        return docSnap.data() as UserProfile;
      }
      
      console.log('⚠️ Profile not found');
      return null;
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      throw error;
    }
  },

  /**
   * Create initial profile on signup
   */
  async createProfile(
    userId: string, 
    initialData: { email: string; displayName: string; photoURL: string | null; }
  ): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      let timezone = 'UTC';
      
      try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      } catch {
        timezone = 'UTC';
      }
      
      const newProfile: UserProfile = {
        uid: userId,
        email: initialData.email,
        displayName: initialData.displayName,
        photoURL: initialData.photoURL,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        pushToken: null,
        timezone,
        profile: getDefaultProfile(),
      };

      await setDoc(docRef, newProfile);
      console.log('✅ Profile created successfully');
    } catch (error) {
      console.error('❌ Error creating profile:', error);
      throw error;
    }
  },

  /**
   * Update user profile - merges with existing data
   */
  async updateProfile(userId: string, data: ProfileUpdateData): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      const updateData: any = { ...data, lastActive: new Date().toISOString() };

      if (data.profile) {
        const currentProfile = await this.getProfile(userId);
        if (currentProfile) {
          updateData.profile = { ...currentProfile.profile, ...data.profile };
        }
      }

      await updateDoc(docRef, updateData);
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
      const docRef = doc(db, 'users', userId);
      const currentProfile = await this.getProfile(userId);
      
      if (!currentProfile) throw new Error('Profile not found');

      await updateDoc(docRef, {
        profile: { ...currentProfile.profile, ...profileData },
        lastActive: new Date().toISOString(),
      });

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
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, { lastActive: new Date().toISOString() });
    } catch (error) {
      console.error('❌ Error updating last active:', error);
    }
  },

  /**
   * Save/update Expo push token
   */
  async updatePushToken(userId: string, pushToken: string | null): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
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
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
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
   * Format date for display - handles Firestore Timestamp and ISO strings
   */
  formatDate(dateInput: string | Timestamp | Date | any): string {
    if (!dateInput) return 'Not set';
    
    let date: Date;
    
    // Handle Firestore Timestamp object
    if (dateInput?.toDate && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } 
    // Handle ISO string or Date object
    else {
      date = new Date(dateInput);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },
};
