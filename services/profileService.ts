/**
 * Profile Service - Firebase Firestore CRUD Operations
 * Firestore Path: users/{userId}
 * 
 * Modern React Native Firebase v23 Implementation
 */

import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';
import { ProfileData, ProfileUpdateData, UserProfile, getDefaultProfile } from '../types/profile';

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
      
      // ✅ CORRECT: .exists() is a METHOD in React Native Firebase
      if (docSnap.exists()) {
        console.log('✅ Profile loaded successfully');
        const data = docSnap.data();
        
        // ✅ Convert Firestore timestamps to ISO strings (matching authService pattern)
        return {
          ...data,
          createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data?.createdAt || new Date().toISOString()),
          lastActive: data?.lastActive?.toDate ? data.lastActive.toDate().toISOString() : (data?.lastActive || new Date().toISOString()),
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
   * Create initial profile on signup
   */
  async createProfile(
    userId: string, 
    initialData: { email: string; displayName: string; photoURL: string | null; }
  ): Promise<void> {
    try {
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

      await firestore()
        .collection('users')
        .doc(userId)
        .set(newProfile);
        
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

      await firestore()
        .collection('users')
        .doc(userId)
        .update(updateData);
        
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

      await firestore()
        .collection('users')
        .doc(userId)
        .update({
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
   * Format date for display - handles Firestore Timestamp and ISO strings
   */
  formatDate(dateInput: string | FirebaseFirestoreTypes.Timestamp | Date | any): string {
    if (!dateInput) return 'Not set';
    
    let date: Date;
    
    // Handle Firestore Timestamp object (React Native Firebase)
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

  /**
   * Listen to profile changes in real-time (optional)
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
          // ✅ CORRECT: .exists() is a METHOD
          if (docSnap.exists()) {
            const data = docSnap.data();
            const profile: UserProfile = {
              ...data,
              createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data?.createdAt || new Date().toISOString()),
              lastActive: data?.lastActive?.toDate ? data.lastActive.toDate().toISOString() : (data?.lastActive || new Date().toISOString()),
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
};

export default profileService;
