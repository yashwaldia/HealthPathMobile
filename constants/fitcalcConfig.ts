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
  // ========== FITNESS CATEGORY ==========
  
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
  
  // ========== HEART CATEGORY ==========
  
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
  
  // ========== DAILY HEALTH CATEGORY ==========
  
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
