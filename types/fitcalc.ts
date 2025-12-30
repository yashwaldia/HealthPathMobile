// types/fitcalc.ts

/**
 * FitCalc - Fitness Calculator Types
 * 
 * This file contains all TypeScript types and interfaces for the 19 fitness calculators
 * organized into four categories: Fitness, Heart, Daily Health, and Biohacking
 * 
 * Updated: December 29, 2025 - Added Sleep Graph calculator
 */

// ============================================================================
// CALCULATOR IDS
// ============================================================================

export type FitCalcId =
  | 'bmi'          // Body Mass Index
  | 'bmr'          // Basal Metabolic Rate
  | 'tdee'         // Total Daily Energy Expenditure
  | 'macros'       // Macronutrients
  | 'onerm'        // One-Rep Max
  | 'bodyfat'      // Body Fat Percentage
  | 'idealweight'  // Ideal Weight
  | 'hrzones'      // Heart Rate Zones
  | 'vo2max'       // VO₂ Max
  | 'water'        // Water Intake
  | 'protein'      // Protein Intake
  | 'activity'     // Activity Calories
  | 'running'      // Running Pace
  | 'ratios'       // Body Ratios
  | 'hrv'          // Heart Health Score (formerly HRV)
  | 'recovery'     // Recovery Score
  | 'sleepquality' // Sleep Quality Score
  | 'sleepgraph'   // Sleep History Graph ✅ NEW
  | 'stress';      // Stress Level Analysis

// ============================================================================
// CATEGORY TYPES
// ============================================================================

export type CategoryId = 'fitness' | 'heart' | 'dailyhealth' | 'biohacking';

export type CategoryDefinition = {
  id: CategoryId;
  label: string;
  calculators: FitCalcId[];
};

// ============================================================================
// COMMON TYPES
// ============================================================================

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'lightly' | 'moderately' | 'very';
export type Goal = 'maintain' | 'lose' | 'gain';
export type Intensity = 'light' | 'moderate' | 'vigorous';

// ✅ NEW: Biohacking-specific types
export type ExerciseFrequency = 'rarely' | 'sometimes' | 'often' | 'daily';
export type MuscleSoreness = 'none' | 'light' | 'moderate' | 'severe';
export type WakeUpFrequency = 'none' | 'once' | 'few' | 'many';
export type Workload = 'light' | 'normal' | 'heavy' | 'overwhelming';
export type PhysicalActivityLevel = 'none' | 'light' | 'moderate' | 'intense';

// ============================================================================
// FITNESS CALCULATORS (UNCHANGED)
// ============================================================================

// ---- BMI (Body Mass Index) ----

export type BmiInputs = {
  height?: string; // cm
  weight?: string; // kg
};

export type BmiResult = {
  value: string;
  category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese';
  hint: string;
  categoryClass:
    | 'category-underweight'
    | 'category-normal'
    | 'category-overweight'
    | 'category-obese';
};

// ---- BMR (Basal Metabolic Rate) ----

export type BmrInputs = {
  gender?: Gender;
  age?: string;    // years
  height?: string; // cm
  weight?: string; // kg
  formula?: 'mifflin' | 'harris';
};

export type BmrResult = {
  value: number; // kcal/day
};

// ---- TDEE (Total Daily Energy Expenditure) ----

export type TdeeInputs = {
  bmr?: string;
  activity?: string; // Activity multiplier: "1.2" | "1.375" | "1.55" | "1.725" | "1.9"
  goal?: Goal;
};

export type TdeeResult = {
  tdee: number;   // Total daily energy expenditure
  target: number; // Target calories based on goal
};

// ---- Macros (Macronutrients) ----

export type MacrosInputs = {
  calories?: string; // kcal/day
  preset?: 'balanced' | 'keto' | 'highp' | 'lowcarb';
};

export type MacrosResult = {
  protein: number; // g/day
  fat: number;     // g/day
  carbs: number;   // g/day
  ratios: {
    protein: number; // Fraction of total kcal (e.g., 0.3 = 30%)
    fat: number;
    carbs: number;
  };
  kcal: {
    protein: number;
    fat: number;
    carbs: number;
    total: number;
  };
};

// ---- One-Rep Max (1RM) ----

export type OneRmInputs = {
  weight?: string; // kg
  reps?: string;   // 1-10 repetitions
  formula?: 'epley' | 'brzycki' | 'lombardi';
};

export type OneRmResult = {
  value: number; // kg
};

// ---- Body Fat Percentage ----

export type BodyFatInputs = {
  gender?: Gender;
  height?: string; // cm
  waist?: string;  // cm
  neck?: string;   // cm
  hip?: string;    // cm (required for females)
};

export type BodyFatResult = {
  value: string; // Percentage (e.g., "18.5")
};

// ---- Ideal Weight ----

export type IdealWeightInputs = {
  gender?: Gender;
  height?: string; // cm
};

export type IdealWeightResult = {
  devine: number;   // Devine formula (kg)
  robinson: number; // Robinson formula (kg)
  miller: number;   // Miller formula (kg)
};

// ============================================================================
// HEART CALCULATORS (UNCHANGED)
// ============================================================================

// ---- Heart Rate Zones ----

export type HrZonesInputs = {
  age?: string;     // years
  resting?: string; // bpm (optional)
};

export type HrZonesResult = {
  maxHR: number;
  zone1: string; // Recovery (50-60% max HR)
  zone2: string; // Endurance (60-70% max HR)
  zone3: string; // Aerobic (70-80% max HR)
  zone4: string; // Anaerobic (80-90% max HR)
  zone5: string; // Max effort (90-100% max HR)
};

// ---- VO₂ Max ----

export type Vo2maxInputs = {
  time?: string; // Format: "mm:ss" or "hh:mm:ss" for 1.5 mile run
};

export type Vo2maxResult = {
  value: string; // ml/kg/min
};

// ============================================================================
// DAILY HEALTH CALCULATORS (UNCHANGED)
// ============================================================================

// ---- Water Intake ----

export type WaterInputs = {
  weight?: string;   // kg
  activity?: ActivityLevel;
};

export type WaterResult = {
  value: string; // liters/day
};

// ---- Protein Intake ----

export type ProteinInputs = {
  weight?: string;   // kg
  activity?: ActivityLevel | 'athlete';
  goal?: Goal;
};

export type ProteinResult = {
  value: number; // g/day
};

// ---- Activity Calories ----

export type ActivityInputs = {
  type?: 'walking' | 'running' | 'cycling' | 'swimming' | 'weightlifting';
  intensity?: Intensity;
  duration?: string; // minutes
  weight?: string;   // kg
};

export type ActivityResult = {
  value: number; // kcal burned
};

// ---- Running Pace ----

export type RunningInputs = {
  distance?: string; // km
  time?: string;     // Format: "hh:mm:ss"
};

export type RunningResult = {
  pace: string;  // Format: "MM:SS" per km
  speed: string; // km/h
};

// ---- Body Ratios ----

export type RatiosInputs = {
  height?: string; // cm
  waist?: string;  // cm
  hip?: string;    // cm
};

export type RatiosResult = {
  whtr: string; // Waist-to-height ratio
  whr: string;  // Waist-to-hip ratio
};

// ============================================================================
// BIOHACKING CALCULATORS - ✅ UPDATED WITH SIMPLIFIED INPUTS
// ============================================================================

// ---- HRV → Heart Health Score (SIMPLIFIED) ----

export type HrvInputs = {
  age?: string;                      // years
  energyLevel?: string;              // 1-10 slider
  stressLevel?: string;              // 1-10 slider
  exerciseFrequency?: ExerciseFrequency; // rarely/sometimes/often/daily
};

export type HrvResult = {
  score: number;         // 0-100 score
  category: string;      // 'Excellent' | 'Good' | 'Fair' | 'Needs Attention'
  recommendation: string;
};

// ---- Recovery Score (SIMPLIFIED) ----

export type RecoveryInputs = {
  sleepHours?: string;            // hours of sleep (e.g., "7.5")
  sleepQualityRating?: string;    // 1-10 slider
  morningFeeling?: string;        // 1-10 slider
  muscleSoreness?: MuscleSoreness; // none/light/moderate/severe
};

export type RecoveryResult = {
  score: number;   // 0-100 score
  category: string; // 'Fully Recovered' | 'Good' | 'Fair' | 'Poor'
  advice: string;
};

// ---- Sleep Quality (SIMPLIFIED) ----

export type SleepQualityInputs = {
  duration?: string;               // Total sleep hours (e.g., "7.5")
  sleepQualityRating?: string;     // 1-10 slider
  wakeUps?: WakeUpFrequency;       // none/once/few/many
  morningMood?: string;            // 1-10 slider
};

export type SleepQualityResult = {
  score: number;          // 0-100 score
  quality: string;        // 'Excellent' | 'Good' | 'Fair' | 'Poor'
  improvements: string[]; // Array of improvement tips
};

// ---- Sleep Graph (NEW) ✅ ----

export type SleepGraphInputs = {
  // No user inputs needed - automatically fetches from Firebase
};

export type SleepGraphResult = {
  totalSessions: number;   // Total number of sleep sessions tracked
  averageDuration: number; // Average sleep duration in hours
  longestSleep: number;    // Longest session in hours
  shortestSleep: number;   // Shortest session in hours
  last7DaysAvg: number;    // Last 7 days average (hours)
  last30DaysAvg: number;   // Last 30 days average (hours)
  consistency: number;     // Sleep consistency score (0-100)
  sessions: Array<{
    date: string;          // ISO date string (YYYY-MM-DD)
    hours: number;         // Duration in hours
  }>;
};

// ---- Stress Level (SIMPLIFIED) ----

export type StressInputs = {
  stressRating?: string;              // 1-10 slider
  sleepQualityLast?: string;          // 1-10 slider
  workload?: Workload;                // light/normal/heavy/overwhelming
  physicalActivity?: PhysicalActivityLevel; // none/light/moderate/intense
};

export type StressResult = {
  level: number;    // 0-100 stress level
  category: string; // 'Low' | 'Moderate' | 'High' | 'Very High'
  tips: string[];   // Array of stress management tips
};

// ============================================================================
// AGGREGATED STATE TYPES
// ============================================================================

/**
 * All calculator inputs mapped by calculator ID
 * Used for managing form state across all calculators
 */
export type FitCalcInputs = {
  bmi?: BmiInputs;
  bmr?: BmrInputs;
  tdee?: TdeeInputs;
  macros?: MacrosInputs;
  onerm?: OneRmInputs;
  bodyfat?: BodyFatInputs;
  idealweight?: IdealWeightInputs;
  hrzones?: HrZonesInputs;
  vo2max?: Vo2maxInputs;
  water?: WaterInputs;
  protein?: ProteinInputs;
  activity?: ActivityInputs;
  running?: RunningInputs;
  ratios?: RatiosInputs;
  hrv?: HrvInputs;
  recovery?: RecoveryInputs;
  sleepquality?: SleepQualityInputs;
  sleepgraph?: SleepGraphInputs; // ✅ NEW
  stress?: StressInputs;
};

/**
 * All calculator results mapped by calculator ID
 * Used for managing computation results across all calculators
 */
export type FitCalcResults = {
  bmi?: BmiResult;
  bmr?: BmrResult;
  tdee?: TdeeResult;
  macros?: MacrosResult;
  onerm?: OneRmResult;
  bodyfat?: BodyFatResult;
  idealweight?: IdealWeightResult;
  hrzones?: HrZonesResult;
  vo2max?: Vo2maxResult;
  water?: WaterResult;
  protein?: ProteinResult;
  activity?: ActivityResult;
  running?: RunningResult;
  ratios?: RatiosResult;
  hrv?: HrvResult;
  recovery?: RecoveryResult;
  sleepquality?: SleepQualityResult;
  sleepgraph?: SleepGraphResult; // ✅ NEW
  stress?: StressResult;
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type-safe calculator input getter
 */
export type GetCalcInputs<T extends FitCalcId> = 
  T extends 'bmi' ? BmiInputs :
  T extends 'bmr' ? BmrInputs :
  T extends 'tdee' ? TdeeInputs :
  T extends 'macros' ? MacrosInputs :
  T extends 'onerm' ? OneRmInputs :
  T extends 'bodyfat' ? BodyFatInputs :
  T extends 'idealweight' ? IdealWeightInputs :
  T extends 'hrzones' ? HrZonesInputs :
  T extends 'vo2max' ? Vo2maxInputs :
  T extends 'water' ? WaterInputs :
  T extends 'protein' ? ProteinInputs :
  T extends 'activity' ? ActivityInputs :
  T extends 'running' ? RunningInputs :
  T extends 'ratios' ? RatiosInputs :
  T extends 'hrv' ? HrvInputs :
  T extends 'recovery' ? RecoveryInputs :
  T extends 'sleepquality' ? SleepQualityInputs :
  T extends 'sleepgraph' ? SleepGraphInputs : // ✅ NEW
  T extends 'stress' ? StressInputs :
  never;

/**
 * Type-safe calculator result getter
 */
export type GetCalcResult<T extends FitCalcId> = 
  T extends 'bmi' ? BmiResult :
  T extends 'bmr' ? BmrResult :
  T extends 'tdee' ? TdeeResult :
  T extends 'macros' ? MacrosResult :
  T extends 'onerm' ? OneRmResult :
  T extends 'bodyfat' ? BodyFatResult :
  T extends 'idealweight' ? IdealWeightResult :
  T extends 'hrzones' ? HrZonesResult :
  T extends 'vo2max' ? Vo2maxResult :
  T extends 'water' ? WaterResult :
  T extends 'protein' ? ProteinResult :
  T extends 'activity' ? ActivityResult :
  T extends 'running' ? RunningResult :
  T extends 'ratios' ? RatiosResult :
  T extends 'hrv' ? HrvResult :
  T extends 'recovery' ? RecoveryResult :
  T extends 'sleepquality' ? SleepQualityResult :
  T extends 'sleepgraph' ? SleepGraphResult : // ✅ NEW
  T extends 'stress' ? StressResult :
  never;

// ============================================================================
// VALIDATION HELPERS (Type Guards)
// ============================================================================

export function isValidFitCalcId(id: string): id is FitCalcId {
  const validIds: FitCalcId[] = [
    'bmi', 'bmr', 'tdee', 'macros', 'onerm', 'bodyfat', 'idealweight',
    'hrzones', 'vo2max', 'water', 'protein', 'activity', 'running', 'ratios',
    'hrv', 'recovery', 'sleepquality', 'sleepgraph', 'stress' // ✅ Added sleepgraph
  ];
  return validIds.includes(id as FitCalcId);
}

export function isValidGender(value: string): value is Gender {
  return value === 'male' || value === 'female';
}

export function isValidGoal(value: string): value is Goal {
  return value === 'maintain' || value === 'lose' || value === 'gain';
}

// ✅ NEW: Biohacking validation helpers
export function isValidExerciseFrequency(value: string): value is ExerciseFrequency {
  return ['rarely', 'sometimes', 'often', 'daily'].includes(value);
}

export function isValidMuscleSoreness(value: string): value is MuscleSoreness {
  return ['none', 'light', 'moderate', 'severe'].includes(value);
}

export function isValidWakeUpFrequency(value: string): value is WakeUpFrequency {
  return ['none', 'once', 'few', 'many'].includes(value);
}

export function isValidWorkload(value: string): value is Workload {
  return ['light', 'normal', 'heavy', 'overwhelming'].includes(value);
}

export function isValidPhysicalActivity(value: string): value is PhysicalActivityLevel {
  return ['none', 'light', 'moderate', 'intense'].includes(value);
}
