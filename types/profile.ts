/**
 * User Profile Type Definitions
 * Based on HealthPath Database Design Documentation
 *
 * Firestore Path: users/{userId}
 */

export interface UserProfile {
  // Authentication & Identity
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string | null; // ✅ Added for mobile number
  photoURL: string | null;
  createdAt: string;
  lastActive: string;

  // Push Notifications
  pushToken?: string | null; // Expo push token for this device/user
  timezone?: string;         // IANA timezone, e.g. "Asia/Kolkata", "America/New_York"

  // Nested Profile Object
  profile: ProfileData;
}

export interface ProfileData {
  // Basic Information
  fullName: string;
  dob: string; // Format: YYYY-MM-DD
  age: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  height: string; // in cm
  weight: string; // in kg

  // Medical Background
  bloodGroup: BloodGroup;
  allergies: string;
  conditions: string;
  medications: string;
  surgeryHistory: string;
  familyHistory: string;

  // Lifestyle & Habits
  dietType: string;
  waterIntake: string;
  sleepDuration: string;
  smokingHabit: string;
  alcoholConsumption: string;
  physicalActivity: string;
  exerciseRoutine: string;

  // Female Health (Optional)
  lastMenstrualPeriod?: string;
  cycleLength?: string;
  isPregnant?: 'Yes' | 'No' | 'Unknown';

  // App Preferences
  vitalsReminderTime: string;
  notificationsEnabled: boolean;
  darkMode: boolean;
}

export type BloodGroup =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-'
  | '';

export type Gender =
  | 'Male'
  | 'Female'
  | 'Other'
  | 'Prefer not to say';

// Helper type for updating profile
export type ProfileUpdateData = {
  uid?: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string | null; // ✅ Added here too
  photoURL?: string | null;
  createdAt?: string;
  lastActive?: string;

  // New push notification fields (optional on update)
  pushToken?: string | null;
  timezone?: string;

  profile?: Partial<ProfileData>;
};

// Default empty profile
export const getDefaultProfile = (): ProfileData => ({
  fullName: '',
  dob: '',
  age: '',
  gender: 'Prefer not to say',
  height: '',
  weight: '',
  bloodGroup: '',
  allergies: '',
  conditions: '',
  medications: '',
  surgeryHistory: '',
  familyHistory: '',
  dietType: '',
  waterIntake: '',
  sleepDuration: '',
  smokingHabit: '',
  alcoholConsumption: '',
  physicalActivity: '',
  exerciseRoutine: '',
  vitalsReminderTime: '09:00',
  notificationsEnabled: true,
  darkMode: false,
});
