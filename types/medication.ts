// types/medication.ts

/**
 * Core Medication Interface
 */
export interface Medication {
  medicationId: string;
  userId: string;
  name: string;
  strength: string; // e.g., "500mg", "10mg/5ml"
  dosageForm: DosageForm;
  
  // Schedule
  frequency: FrequencyType;
  customFrequency?: string;
  mealRelation: MealRelation;
  
  // Duration
  startDate: string; // YYYY-MM-DD
  durationDays?: number;
  endDate?: string; // YYYY-MM-DD
  
  // Additional Information
  prescribedBy?: string;
  purpose?: string;
  sideEffects?: string[];
  instructions?: string;
  genericName?: string;
  classification?: string;
  
  // Reminders
  reminderEnabled: boolean;
  reminderTimes?: string[]; // Array of times like ["09:00", "21:00"]
  
  // Status
  isActive: boolean;
  refillDate?: string;
  refillsRemaining?: number;
  
  // Media
  image?: string; // Firebase Storage URL or base64
  prescriptionImage?: string; // Original prescription photo
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dosage Form Types
 */
export type DosageForm = 
  | 'Tablet' 
  | 'Capsule' 
  | 'Syrup' 
  | 'Injection' 
  | 'Cream' 
  | 'Ointment'
  | 'Drops'
  | 'Inhaler'
  | 'Patch'
  | 'Suppository'
  | 'Other';

/**
 * Frequency Types
 */
export type FrequencyType = 
  | 'Once a day' 
  | 'Twice a day' 
  | 'Thrice a day' 
  | 'Four times a day' 
  | 'As needed' 
  | 'Every 4 hours'
  | 'Every 6 hours'
  | 'Every 8 hours'
  | 'Every 12 hours'
  | 'Weekly'
  | 'Custom';

/**
 * Meal Relation Types
 */
export type MealRelation = 
  | 'Before meals' 
  | 'After meals' 
  | 'With meals' 
  | 'Empty stomach'
  | 'Any time';

/**
 * Dose Log for tracking adherence
 */
export interface DoseLog {
  doseId: string;
  medicationId: string;
  scheduledTime: string; // ISO string
  takenTime?: string; // ISO string
  taken: boolean;
  skipped: boolean;
  notes?: string;
  createdAt: Date;
}

/**
 * Medication Reminder
 */
export interface MedicationReminder {
  reminderId: string;
  medicationId: string;
  time: string; // HH:mm format
  enabled: boolean;
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
}

/**
 * Extracted Medication from AI (for Smart Upload)
 */
export interface ExtractedMedication {
  name: string;
  strength?: string;
  dosageForm?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  prescribedBy?: string;
  confidence?: number; // AI confidence score
}

/**
 * Medication Statistics
 */
export interface MedicationStats {
  totalMedications: number;
  activeMedications: number;
  todaysDoses: number;
  completedToday: number;
  adherenceRate: number; // Percentage
  upcomingRefills: Medication[];
}

/**
 * Quick Add Medication (for simplified input)
 */
export interface QuickAddMedication {
  name: string;
  strength: string;
  frequency: FrequencyType;
  startDate: string;
}
