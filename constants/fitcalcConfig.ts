// constants/fitcalcConfig.ts

import { FitCalcField } from '../components/fitcalc/FitCalcCard';
import { CategoryId, FitCalcId } from '../types/fitcalc';

// ============================================================================
// TYPES
// ============================================================================

export type FitCalcConfigEntry = {
  title: string;
  description?: string;
  fields: FitCalcField[];
  category: CategoryId;
  icon: string; // Ionicons name
};

// ============================================================================
// CALCULATOR CONFIGURATIONS
// ============================================================================

export const FITCALC_CONFIG: Record<FitCalcId, FitCalcConfigEntry> = {
  // ========== FITNESS CATEGORY ========== (UNCHANGED)
  
  bmi: {
    title: 'BMI',
    description: 'Estimate of body fat based on height and weight.',
    category: 'fitness',
    icon: 'body-outline',
    fields: [
      { key: 'height', label: 'Height (cm)', type: 'number', keyboardType: 'numeric' },
      { key: 'weight', label: 'Weight (kg)', type: 'number', keyboardType: 'numeric' },
    ],
  },
  
  bmr: {
    title: 'BMR',
    description: 'Calories your body burns each day at complete rest.',
    category: 'fitness',
    icon: 'flame-outline',
    fields: [
      {
        key: 'gender',
        label: 'Gender',
        type: 'chips',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
      },
      { key: 'age', label: 'Age (years)', type: 'number', keyboardType: 'numeric' },
      { key: 'height', label: 'Height (cm)', type: 'number', keyboardType: 'numeric' },
      { key: 'weight', label: 'Weight (kg)', type: 'number', keyboardType: 'numeric' },
      {
        key: 'formula',
        label: 'Formula',
        type: 'chips',
        options: [
          { value: 'mifflin', label: 'Mifflin-St Jeor' },
          { value: 'harris', label: 'Harris-Benedict' },
        ],
      },
    ],
  },
  
  tdee: {
    title: 'TDEE',
    description: 'Daily calories burned including your typical activity.',
    category: 'fitness',
    icon: 'speedometer-outline',
    fields: [
      { key: 'bmr', label: 'BMR (kcal/day)', type: 'number', keyboardType: 'numeric' },
      {
        key: 'activity',
        label: 'Activity level',
        type: 'chips',
        options: [
          { value: '1.2', label: 'Sedentary' },
          { value: '1.375', label: 'Light' },
          { value: '1.55', label: 'Moderate' },
          { value: '1.725', label: 'Very Active' },
          { value: '1.9', label: 'Extreme' },
        ],
      },
      {
        key: 'goal',
        label: 'Goal',
        type: 'chips',
        options: [
          { value: 'maintain', label: 'Maintain' },
          { value: 'lose', label: 'Lose Weight' },
          { value: 'gain', label: 'Gain Weight' },
        ],
      },
    ],
  },
  
  macros: {
    title: 'Macros',
    description: 'Split daily calories into protein, carbs and fats.',
    category: 'fitness',
    icon: 'restaurant-outline',
    fields: [
      {
        key: 'calories',
        label: 'Goal calories (kcal/day)',
        type: 'number',
        keyboardType: 'numeric',
      },
      {
        key: 'preset',
        label: 'Macro preset',
        type: 'chips',
        options: [
          { value: 'balanced', label: 'Balanced' },
          { value: 'keto', label: 'Ketogenic' },
          { value: 'highp', label: 'High Protein' },
          { value: 'lowcarb', label: 'Low Carb' },
        ],
      },
    ],
  },
  
  onerm: {
    title: '1RM',
    description: 'Estimate max weight you can lift for one repetition.',
    category: 'fitness',
    icon: 'barbell-outline',
    fields: [
      {
        key: 'weight',
        label: 'Weight lifted (kg)',
        type: 'number',
        keyboardType: 'numeric',
      },
      {
        key: 'reps',
        label: 'Repetitions (1–10)',
        type: 'number',
        keyboardType: 'numeric',
      },
      {
        key: 'formula',
        label: 'Formula',
        type: 'chips',
        options: [
          { value: 'epley', label: 'Epley' },
          { value: 'brzycki', label: 'Brzycki' },
          { value: 'lombardi', label: 'Lombardi' },
        ],
      },
    ],
  },
  
  bodyfat: {
    title: 'Body Fat %',
    description: 'Estimate body fat percentage from measurements.',
    category: 'fitness',
    icon: 'scale-outline',
    fields: [
      {
        key: 'gender',
        label: 'Gender',
        type: 'chips',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
      },
      { key: 'height', label: 'Height (cm)', type: 'number', keyboardType: 'numeric' },
      { key: 'waist', label: 'Waist (cm)', type: 'number', keyboardType: 'numeric' },
      { key: 'neck', label: 'Neck (cm)', type: 'number', keyboardType: 'numeric' },
      { key: 'hip', label: 'Hip (cm, women only)', type: 'number', keyboardType: 'numeric' },
    ],
  },
  
  idealweight: {
    title: 'Ideal Weight',
    description: 'Healthy weight estimates from different formulas.',
    category: 'fitness',
    icon: 'accessibility-outline',
    fields: [
      {
        key: 'gender',
        label: 'Gender',
        type: 'chips',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
      },
      { key: 'height', label: 'Height (cm)', type: 'number', keyboardType: 'numeric' },
    ],
  },
  
  // ========== HEART CATEGORY ========== (UNCHANGED)
  
  hrzones: {
    title: 'HR Zones',
    description: 'Training intensity zones based on your age and HR.',
    category: 'heart',
    icon: 'pulse-outline',
    fields: [
      { key: 'age', label: 'Age (years)', type: 'number', keyboardType: 'numeric' },
      {
        key: 'resting',
        label: 'Resting HR (bpm, optional)',
        type: 'number',
        keyboardType: 'numeric',
      },
    ],
  },
  
  vo2max: {
    title: 'VO₂max',
    description: 'Estimate aerobic fitness from 1.5 mile run time.',
    category: 'heart',
    icon: 'trail-sign-outline',
    fields: [
      {
        key: 'time',
        label: '1.5 mile time (mm:ss)',
        type: 'text',
        keyboardType: 'default',
        helperText: 'e.g., 12:30',
      },
    ],
  },
  
  // ========== DAILY HEALTH CATEGORY ========== (UNCHANGED)
  
  water: {
    title: 'Water',
    description: 'Daily water needs based on weight and activity.',
    category: 'dailyhealth',
    icon: 'water-outline',
    fields: [
      { key: 'weight', label: 'Weight (kg)', type: 'number', keyboardType: 'numeric' },
      {
        key: 'activity',
        label: 'Activity level',
        type: 'chips',
        options: [
          { value: 'sedentary', label: 'Sedentary' },
          { value: 'lightly', label: 'Light' },
          { value: 'moderately', label: 'Moderate' },
          { value: 'very', label: 'Very Active' },
        ],
      },
    ],
  },
  
  protein: {
    title: 'Protein',
    description: 'Daily protein based on weight, activity and goal.',
    category: 'dailyhealth',
    icon: 'fitness-outline',
    fields: [
      { key: 'weight', label: 'Weight (kg)', type: 'number', keyboardType: 'numeric' },
      {
        key: 'activity',
        label: 'Activity level',
        type: 'chips',
        options: [
          { value: 'sedentary', label: 'Sedentary' },
          { value: 'lightly', label: 'Light' },
          { value: 'moderately', label: 'Moderate' },
          { value: 'very', label: 'Very Active' },
          { value: 'athlete', label: 'Athlete' },
        ],
      },
      {
        key: 'goal',
        label: 'Goal',
        type: 'chips',
        options: [
          { value: 'maintain', label: 'Maintain' },
          { value: 'lose', label: 'Fat Loss' },
          { value: 'gain', label: 'Muscle Gain' },
        ],
      },
    ],
  },
  
  activity: {
    title: 'Activity Cals',
    description: 'Estimate calories burned for a workout.',
    category: 'dailyhealth',
    icon: 'walk-outline',
    fields: [
      {
        key: 'type',
        label: 'Activity type',
        type: 'chips',
        options: [
          { value: 'walking', label: 'Walking' },
          { value: 'running', label: 'Running' },
          { value: 'cycling', label: 'Cycling' },
          { value: 'swimming', label: 'Swimming' },
          { value: 'weightlifting', label: 'Lifting' },
        ],
      },
      {
        key: 'intensity',
        label: 'Intensity',
        type: 'chips',
        options: [
          { value: 'light', label: 'Light' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'vigorous', label: 'Vigorous' },
        ],
      },
      {
        key: 'duration',
        label: 'Duration (minutes)',
        type: 'number',
        keyboardType: 'numeric',
      },
      { key: 'weight', label: 'Weight (kg)', type: 'number', keyboardType: 'numeric' },
    ],
  },
  
  running: {
    title: 'Running Pace',
    description: 'Calculate pace and speed from distance and time.',
    category: 'dailyhealth',
    icon: 'footsteps-outline',
    fields: [
      { key: 'distance', label: 'Distance (km)', type: 'number', keyboardType: 'numeric' },
      {
        key: 'time',
        label: 'Time (hh:mm:ss)',
        type: 'text',
        keyboardType: 'default',
        helperText: 'e.g., 00:45:30',
      },
    ],
  },
  
  ratios: {
    title: 'Body Ratios',
    description: 'Waist-to-height and waist-to-hip ratios.',
    category: 'dailyhealth',
    icon: 'stats-chart-outline',
    fields: [
      { key: 'height', label: 'Height (cm)', type: 'number', keyboardType: 'numeric' },
      { key: 'waist', label: 'Waist (cm)', type: 'number', keyboardType: 'numeric' },
      { key: 'hip', label: 'Hip (cm)', type: 'number', keyboardType: 'numeric' },
    ],
  },

  // ========== BIOHACKING CATEGORY ========== ✅ COMPLETELY SIMPLIFIED
  
  hrv: {
    title: 'Heart Health Score',
    description: 'Check your heart health based on how you feel.',
    category: 'biohacking',
    icon: 'heart-circle-outline',
    fields: [
      { 
        key: 'age', 
        label: 'Your age', 
        type: 'number', 
        keyboardType: 'numeric' 
      },
      {
        key: 'energyLevel',
        label: 'Energy level today',
        type: 'slider',
        min: 1,
        max: 10,
        step: 1,
        helperText: 'Low energy (1) to High energy (10)',
      },
      {
        key: 'stressLevel',
        label: 'Stress level today',
        type: 'slider',
        min: 1,
        max: 10,
        step: 1,
        helperText: 'Relaxed (1) to Very stressed (10)',
      },
      {
        key: 'exerciseFrequency',
        label: 'How often do you exercise?',
        type: 'chips',
        options: [
          { value: 'rarely', label: 'Rarely' },
          { value: 'sometimes', label: '1-2 times/week' },
          { value: 'often', label: '3-4 times/week' },
          { value: 'daily', label: 'Daily' },
        ],
      },
    ],
  },
  
  recovery: {
    title: 'Recovery Score',
    description: 'How well your body has recovered from yesterday.',
    category: 'biohacking',
    icon: 'refresh-outline',
    fields: [
      {
        key: 'sleepHours',
        label: 'Hours of sleep last night',
        type: 'number',
        keyboardType: 'numeric',
        helperText: 'e.g., 7.5',
      },
      {
        key: 'sleepQualityRating',
        label: 'Sleep quality',
        type: 'slider',
        min: 1,
        max: 10,
        step: 1,
        helperText: 'Poor (1) to Excellent (10)',
      },
      {
        key: 'morningFeeling',
        label: 'How do you feel this morning?',
        type: 'slider',
        min: 1,
        max: 10,
        step: 1,
        helperText: 'Exhausted (1) to Energized (10)',
      },
      {
        key: 'muscleSoreness',
        label: 'Muscle soreness',
        type: 'chips',
        options: [
          { value: 'none', label: 'None' },
          { value: 'light', label: 'Light' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'severe', label: 'Severe' },
        ],
      },
    ],
  },
  
  sleepquality: {
    title: 'Sleep Quality',
    description: 'Analyze your sleep quality and get recommendations.',
    category: 'biohacking',
    icon: 'moon-outline',
    fields: [
      {
        key: 'duration',
        label: 'Total sleep time (hours)',
        type: 'number',
        keyboardType: 'numeric',
        helperText: 'e.g., 7.5',
      },
      {
        key: 'sleepQualityRating',
        label: 'How well did you sleep?',
        type: 'slider',
        min: 1,
        max: 10,
        step: 1,
        helperText: 'Terrible (1) to Perfect (10)',
      },
      {
        key: 'wakeUps',
        label: 'Times you woke up',
        type: 'chips',
        options: [
          { value: 'none', label: 'None' },
          { value: 'once', label: 'Once' },
          { value: 'few', label: '2-3 times' },
          { value: 'many', label: 'Many times' },
        ],
      },
      {
        key: 'morningMood',
        label: 'Morning mood',
        type: 'slider',
        min: 1,
        max: 10,
        step: 1,
        helperText: 'Groggy (1) to Refreshed (10)',
      },
    ],
  },
  
  stress: {
    title: 'Stress Level',
    description: 'Check your current stress level and get tips.',
    category: 'biohacking',
    icon: 'alert-circle-outline',
    fields: [
      {
        key: 'stressRating',
        label: 'How stressed do you feel?',
        type: 'slider',
        min: 1,
        max: 10,
        step: 1,
        helperText: 'Calm (1) to Overwhelmed (10)',
      },
      {
        key: 'sleepQualityLast',
        label: 'Sleep quality last night',
        type: 'slider',
        min: 1,
        max: 10,
        step: 1,
        helperText: 'Poor (1) to Excellent (10)',
      },
      {
        key: 'workload',
        label: 'Current workload',
        type: 'chips',
        options: [
          { value: 'light', label: 'Light' },
          { value: 'normal', label: 'Normal' },
          { value: 'heavy', label: 'Heavy' },
          { value: 'overwhelming', label: 'Overwhelming' },
        ],
      },
      {
        key: 'physicalActivity',
        label: 'Physical activity today',
        type: 'chips',
        options: [
          { value: 'none', label: 'None' },
          { value: 'light', label: 'Light walk' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'intense', label: 'Intense' },
        ],
      },
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all calculators for a specific category
 */
export function getCalculatorsByCategory(categoryId: CategoryId): FitCalcId[] {
  return (Object.keys(FITCALC_CONFIG) as FitCalcId[]).filter(
    (calcId) => FITCALC_CONFIG[calcId].category === categoryId
  );
}

/**
 * Get calculator config by ID
 */
export function getCalculatorConfig(calcId: FitCalcId): FitCalcConfigEntry {
  return FITCALC_CONFIG[calcId];
}

/**
 * Get calculator title by ID
 */
export function getCalculatorTitle(calcId: FitCalcId): string {
  return FITCALC_CONFIG[calcId].title;
}

/**
 * Get calculator category by ID
 */
export function getCalculatorCategory(calcId: FitCalcId): CategoryId {
  return FITCALC_CONFIG[calcId].category;
}

/**
 * Check if calculator exists
 */
export function isValidCalculator(calcId: string): calcId is FitCalcId {
  return calcId in FITCALC_CONFIG;
}

// ============================================================================
// CATEGORY DEFINITIONS
// ============================================================================

export const CATEGORIES = [
  {
    id: 'fitness' as CategoryId,
    label: 'Fitness',
    icon: 'barbell-outline',
    calculators: getCalculatorsByCategory('fitness'),
  },
  {
    id: 'heart' as CategoryId,
    label: 'Heart',
    icon: 'heart-outline',
    calculators: getCalculatorsByCategory('heart'),
  },
  {
    id: 'dailyhealth' as CategoryId,
    label: 'Daily Health',
    icon: 'fitness-outline',
    calculators: getCalculatorsByCategory('dailyhealth'),
  },
  {
    id: 'biohacking' as CategoryId,
    label: 'Biohacking',
    icon: 'flash-outline',
    calculators: getCalculatorsByCategory('biohacking'),
  },
] as const;

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that all calculators are assigned to a category
 */
function validateConfig() {
  const allCalcIds = Object.keys(FITCALC_CONFIG) as FitCalcId[];
  const categorizedCalcs = CATEGORIES.flatMap(cat => cat.calculators);
  
  const uncategorized = allCalcIds.filter(id => !categorizedCalcs.includes(id));
  
  if (uncategorized.length > 0) {
    console.warn('Uncategorized calculators:', uncategorized);
  }
  
  return uncategorized.length === 0;
}

// Run validation in development
if (__DEV__) {
  validateConfig();
}
