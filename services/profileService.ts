/**
 * Profile Service - Firebase Firestore CRUD Operations
 * Based on HealthPath Database Design Documentation
 * 
 * Firestore Path: users/{userId}
 */

import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { UserProfile, ProfileData, ProfileUpdateData, getDefaultProfile } from '../types/profile';

const db = getFirestore();

export const profileService = {
  /**
   * Get user profile from Firestore
   * @param userId - Firebase Auth UID
   * @returns UserProfile object or null if not found
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        console.log('✅ Profile loaded successfully');
        return data;
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
   * @param userId - Firebase Auth UID
   * @param initialData - Initial user data from auth
   */
  async createProfile(
    userId: string, 
    initialData: {
      email: string;
      displayName: string;
      photoURL: string | null;
    }
  ): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      
      const newProfile: UserProfile = {
        uid: userId,
        email: initialData.email,
        displayName: initialData.displayName,
        photoURL: initialData.photoURL,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
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
   * Update user profile
   * Merges with existing data
   * @param userId - Firebase Auth UID
   * @param data - Partial profile data to update
   */
  async updateProfile(userId: string, data: ProfileUpdateData): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      
      // Prepare update data
      const updateData: any = {
        ...data,
        lastActive: new Date().toISOString(),
      };

      // If updating nested profile object
      if (data.profile) {
        // Get current profile first
        const currentProfile = await this.getProfile(userId);
        
        if (currentProfile) {
          // Merge nested profile data
          updateData.profile = {
            ...currentProfile.profile,
            ...data.profile,
          };
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
   * @param userId - Firebase Auth UID
   * @param profileData - Partial profile data
   */
  async updateProfileData(userId: string, profileData: Partial<ProfileData>): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      
      // Get current profile
      const currentProfile = await this.getProfile(userId);
      
      if (!currentProfile) {
        throw new Error('Profile not found');
      }

      // Merge with existing profile data
      const updatedProfile = {
        ...currentProfile.profile,
        ...profileData,
      };

      await updateDoc(docRef, {
        profile: updatedProfile,
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
   * @param userId - Firebase Auth UID
   */
  async updateLastActive(userId: string): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        lastActive: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Error updating last active:', error);
      // Don't throw - this is a non-critical update
    }
  },

  /**
   * Calculate age from date of birth
   * @param dob - Date of birth in YYYY-MM-DD format
   * @returns Age as string
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
   * @param dateString - ISO date string
   * @returns Formatted date string
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'Not set';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },
};
