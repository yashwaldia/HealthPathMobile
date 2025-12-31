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
  
  // ✅ NEW: Notification Scheduling Tracking (Dec 31, 2025)
  lastScheduledDate?: string; // ISO date when notifications were last scheduled
  lastScheduledTimestamp?: Date; // Firestore timestamp for per-med tracking
  
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
 * Extracted Medication from AI (for Smart Import)
 * Enhanced with additional fields from web version
 */
export interface ExtractedMedication {
  name: string;
  strength?: string;
  dosageForm?: DosageForm;
  frequency?: FrequencyType;
  customFrequency?: string;
  mealRelation?: MealRelation;
  duration?: string; // Will be parsed to durationDays
  durationDays?: number;
  startDate?: string;
  endDate?: string;
  instructions?: string;
  prescribedBy?: string;
  purpose?: string;
  genericName?: string;
  classification?: string;
  confidence?: number; // AI confidence score (0-100)
}

/**
 * AI Classification Result
 * Used for duplicate detection and merging
 */
export interface AIClassificationResult {
  originalName: string;
  genericName: string;
  classification: string; // e.g., "Painkiller", "Antibiotic", "Antacid"
  confidence?: number;
}

/**
 * Merge Conflict Interface
 * Represents a potential duplicate medication that needs user resolution
 */
export interface MergeConflict {
  existingMed: Medication;
  newMed: ExtractedMedication & {
    genericName?: string;
    classification?: string;
  };
}

/**
 * AI Medication Comparison Result
 * Suggestion from AI about whether to merge or keep separate
 */
export interface MedicationComparisonResult {
  suggestion: 'merge' | 'add_new' | 'uncertain';
  reasoning: string;
  confidence: number; // 0-100
  recommendedAction?: string;
}

/**
 * Smart Import Input
 * Input format for smart import feature
 */
export interface SmartImportInput {
  text?: string;
  images?: string[]; // base64 or URIs
}

/**
 * Smart Import Stage
 * Controls the flow of smart import modal
 */
export type SmartImportStage = 'input' | 'review';

/**
 * Smart Import Input Mode
 * Type of input for smart import
 */
export type SmartImportInputMode = 'upload' | 'text';

/**
 * Calendar Day Data
 * Represents a single day in the medication calendar
 */
export interface CalendarDayData {
  date: Date;
  medications: Medication[];
  hasDoses: boolean;
}

/**
 * Calendar Month Data
 * Complete data for calendar month view
 */
export interface CalendarMonthData {
  year: number;
  month: number;
  monthName: string;
  days: (CalendarDayData | null)[]; // null for empty cells
}

/**
 * Medication Status
 * Runtime calculated status for a medication
 */
export interface MedicationStatus {
  adherence: number; // Percentage (0-100)
  dosesTakenToday: number;
  expectedDoses: number;
  isDue: boolean;
  isActive: boolean;
  daysRemaining?: number;
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

/**
 * Motivational Toast Type
 * Different categories of motivational messages
 */
export type MotivationalToastType = 
  | 'dose_taken'
  | 'all_done'
  | 'streak'
  | 'reminder'
  | 'encouragement';

/**
 * Motivational Toast Message
 */
export interface MotivationalToast {
  type: MotivationalToastType;
  message: string;
  emoji?: string;
}
