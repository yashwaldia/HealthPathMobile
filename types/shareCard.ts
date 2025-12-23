// types/shareCard.ts
/**
 * Share Card Feature Type Definitions
 * Handles all data structures for shareable health cards
 * 
 * Integrates with existing PI HEALTH types:
 * - vitals.ts
 * - profile.ts
 * - wellness.ts
 * - fitcalc.ts
 */

import type {
  BmiResult,
  HrZonesResult
} from './fitcalc';
import type { VitalStatus } from './vitals';
import type { WellnessModuleType } from './wellness';

// ============================================================================
// CARD TYPE ENUM
// ============================================================================

/**
 * Available share card types in PI HEALTH
 */
export type ShareCardType =
  | 'bmi'                  // Body Mass Index card
  | 'heart-rate'           // Heart Rate card
  | 'blood-pressure'       // Blood Pressure card
  | 'vitals-summary'       // Multi-vital overview card
  | 'weekly-report'        // 7-day health summary
  | 'wellness-progress'    // Wellness module progress
  | 'mother-care'          // Pregnancy tracking card
  | 'child-growth'         // Child development card
  | 'fitness-calculator'  // FitCalc result card
  | 'motivational'; // ✨ ADD THIS LINE


// ============================================================================
// CARD DATA INTERFACES
// ============================================================================

/**
 * Base interface for all share card data
 */
export interface BaseShareCardData {
  cardType: ShareCardType;
  userName: string;          // User's display name
  date: string;              // ISO timestamp of data
  generatedAt: Date;         // When card was generated
}

/**
 * BMI Share Card Data
 */
export interface BMICardData extends BaseShareCardData {
  cardType: 'bmi';
  bmi: BmiResult;            // Reusing existing BmiResult type
  stats: {
    weight: string;          // e.g., "68 kg"
    height: string;          // e.g., "175 cm"
    healthyRange: string;    // e.g., "18.5-24.9"
  };
  motivationalText: string;
}

/**
 * Heart Rate Share Card Data
 */
export interface HeartRateCardData extends BaseShareCardData {
  cardType: 'heart-rate';
  heartRate: {
    current: number;         // BPM
    resting?: number;        // Resting BPM (optional)
    sevenDayAverage: number; // Weekly average BPM
    status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    trend?: 'up' | 'down' | 'stable';
    trendPercentage?: number;
  };
  zones?: HrZonesResult;     // Reusing existing HrZonesResult type
  motivationalText: string;
}

/**
 * Blood Pressure Share Card Data
 */
export interface BloodPressureCardData extends BaseShareCardData {
  cardType: 'blood-pressure';
  bloodPressure: {
    systolic: number;
    diastolic: number;
    status: 'Normal' | 'Elevated' | 'High' | 'Very High' | 'Low';
    statusColor: string;     // Hex color from colors.ts
  };
  pulse?: number;            // BPM (optional)
  sevenDayAverage?: {
    systolic: number;
    diastolic: number;
  };
  lastChecked: string;       // Relative time e.g., "2 hours ago"
  motivationalText: string;
}

/**
 * Multi-Vital Summary Card Data
 */
export interface VitalsSummaryCardData extends BaseShareCardData {
  cardType: 'vitals-summary';
  vitals: {
    bloodPressure?: {
      systolic: number;
      diastolic: number;
      status: VitalStatus;
      icon: string;          // Ionicons name
    };
    heartRate?: {
      value: number;
      status: VitalStatus;
      icon: string;
    };
    bloodSugar?: {
      value: number;
      type: 'fasting' | 'postmeal';
      status: VitalStatus;
      icon: string;
    };
    weight?: {
      value: number;
      change: number;        // +/- kg from last week
      icon: string;
    };
    temperature?: {
      value: number;
      status: VitalStatus;
      icon: string;
    };
    oxygenSaturation?: {
      value: number;
      status: VitalStatus;
      icon: string;
    };
  };
  overallStatus: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention';
}

/**
 * Weekly Health Report Card Data
 */
export interface WeeklyReportCardData extends BaseShareCardData {
  cardType: 'weekly-report';
  dateRange: {
    start: string;           // e.g., "Dec 16"
    end: string;             // e.g., "Dec 22"
  };
  stats: {
    daysLogged: number;      // e.g., 5 out of 7
    totalDays: number;       // Always 7
    streak: number;          // Current streak
  };
  keyMetrics: {
    bloodPressure?: {
      average: string;       // e.g., "120/80"
      status: VitalStatus;
    };
    heartRate?: {
      average: number;
      status: VitalStatus;
    };
    weight?: {
      current: number;
      change: number;        // +/- kg
    };
    bloodSugar?: {
      average: number;
      status: VitalStatus;
    };
  };
  achievements: string[];    // e.g., ["🔥 7-day streak!", "📉 BP improved"]
}

/**
 * Wellness Module Progress Card Data
 */
export interface WellnessProgressCardData extends BaseShareCardData {
  cardType: 'wellness-progress';
  module: {
    type: WellnessModuleType;
    name: string;
    icon: string;            // Ionicons name
    color: string;           // Hex color from wellnessData.ts
  };
  progress: {
    currentDay: number;
    totalDays: number;
    percentage: number;
    tasksCompleted: number;
    totalTasks: number;
  };
  streak: {
    current: number;
    icon: string;
  };
  nextMilestone?: {
    day: number;
    description: string;
  };
  motivationalText: string;
}

/**
 * Mother Care (Pregnancy) Card Data
 */
export interface MotherCareCardData extends BaseShareCardData {
  cardType: 'mother-care';
  pregnancy: {
    week: number;
    day: number;
    trimester: 1 | 2 | 3;
    babySize: string;        // e.g., "Eggplant"
    babySizeEmoji: string;   // e.g., "🍆"
    daysUntilDue: number;
  };
  recentStats: {
    weight?: string;         // e.g., "68 kg (+12 kg)"
    bloodPressure?: string;  // e.g., "115/75"
    bloodPressureStatus?: VitalStatus;
  };
  milestone?: string;        // e.g., "Baby can open eyes now!"
}

/**
 * Child Growth Card Data
 */
export interface ChildGrowthCardData extends BaseShareCardData {
  cardType: 'child-growth';
  child: {
    name: string;            // Can be "My Baby" for privacy
    ageInMonths: number;
    gender?: 'male' | 'female';
  };
  growth: {
    height: {
      value: string;         // e.g., "82 cm"
      percentile?: number;   // e.g., 75 (optional)
    };
    weight: {
      value: string;         // e.g., "11.5 kg"
      percentile?: number;   // e.g., 60 (optional)
    };
  };
  recentMilestone?: string;  // e.g., "First words: Mama, Dada"
  vaccinationStatus?: 'Completed' | 'Missed' | 'Pending' | 'Upcoming';
  nextCheckup?: string;      // e.g., "Feb 15, 2025"
}

/**
 * Fitness Calculator Result Card Data
 */
export interface FitnessCalculatorCardData extends BaseShareCardData {
  cardType: 'fitness-calculator';
  calculator: {
    type: 'bmi' | 'bmr' | 'tdee' | 'vo2max' | 'hr-zones' | 'macros';
    name: string;
    icon: string;            // Ionicons name
  };
  result: {
    mainValue: string;       // e.g., "2,450 calories/day" or "48 ml/kg/min"
    unit: string;
    status?: string;
  };
  breakdown?: {
    label: string;
    value: string;
  }[];
  motivationalText: string;
}

// ============================================================================
// UNION TYPE FOR ALL CARD DATA
// ============================================================================

export type ShareCardData =
  | BMICardData
  | HeartRateCardData
  | BloodPressureCardData
  | VitalsSummaryCardData
  | WeeklyReportCardData
  | WellnessProgressCardData
  | MotherCareCardData
  | ChildGrowthCardData
  | FitnessCalculatorCardData;

// ============================================================================
// CARD TEMPLATE METADATA
// ============================================================================

/**
 * Metadata for each card type
 */
export interface ShareCardTemplate {
  type: ShareCardType;
  name: string;
  description: string;
  icon: string;              // Ionicons name
  requiredData: string[];    // Which fields must exist in user profile/vitals
  category: 'vitals' | 'wellness' | 'fitness' | 'family';
  enabled: boolean;          // Can be toggled based on feature availability
  order: number;             // Display order in card selector
}

// ============================================================================
// SHARE RESULT
// ============================================================================

/**
 * Result after capture and share
 */
export interface ShareResult {
  success: boolean;
  imageUri?: string;         // Local file:// path to captured image
  error?: string;
  shared: boolean;           // Did user actually share or cancel?
}

// ============================================================================
// CARD AVAILABILITY CHECK
// ============================================================================

/**
 * Check if card can be generated based on available data
 */
export interface CardAvailability {
  type: ShareCardType;
  available: boolean;
  missingData?: string[];    // e.g., ["height", "weight"]
  reason?: string;           // Human-readable reason
}

// ============================================================================
// CARD DIMENSIONS & LAYOUT
// ============================================================================

/**
 * Standard card dimensions for Instagram/WhatsApp stories
 */
export interface CardDimensions {
  width: number;             // 1080px
  height: number;            // 1920px (9:16 ratio)
  previewWidth: number;      // 270px (scaled for screen)
  previewHeight: number;     // 480px (scaled for screen)
}

/**
 * Card layout sections
 */
export interface CardLayout {
  header: {
    height: number;          // Percentage of total height
    backgroundColor: string;
  };
  content: {
    height: number;
    backgroundColor: string;
    padding: number;
  };
  footer: {
    height: number;
    backgroundColor: string;
  };
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Type guard to check card type
 */
export function isShareCardType(value: string): value is ShareCardType {
  const validTypes: ShareCardType[] = [
    'bmi',
    'heart-rate',
    'blood-pressure',
    'vitals-summary',
    'weekly-report',
    'wellness-progress',
    'mother-care',
    'child-growth',
    'fitness-calculator',
  ];
  return validTypes.includes(value as ShareCardType);
}

/**
 * Extract card type from card data
 */
export type ExtractCardType<T extends ShareCardData> = T['cardType'];
