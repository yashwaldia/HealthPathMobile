// constants/beautyFitnessData.ts
// Data for Beauty & Fitness Wellness Module
// Last Updated: December 11, 2025

import { DailyTask, WarningSSign, PersonalizedSuggestions } from '../types/wellness';

// ============================================================================
// GOALS & FITNESS LEVELS
// ============================================================================

export const BEAUTY_FITNESS_GOALS = [
  { label: 'Weight Loss', value: 'weight-loss' },
  { label: 'Muscle Gain', value: 'muscle-gain' },
  { label: 'Skin Glow', value: 'skin-glow' },
  { label: 'Overall Fitness', value: 'overall-fitness' },
];

export const FITNESS_LEVELS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

// ============================================================================
// BMI CATEGORIES
// ============================================================================

export const BMI_CATEGORIES = {
  underweight: {
    range: 'Underweight',
    bmiRange: '< 18.5',
    color: '#2196F3',
    icon: 'arrow-down-outline',
    recommendation: 'Gain weight healthily',
  },
  normal: {
    range: 'Normal',
    bmiRange: '18.5 - 24.9',
    color: '#4CAF50',
    icon: 'checkmark-circle-outline',
    recommendation: 'Maintain current weight',
  },
  overweight: {
    range: 'Overweight',
    bmiRange: '25 - 29.9',
    color: '#FFC107',
    icon: 'alert-circle-outline',
    recommendation: 'Lose weight gradually',
  },
  obese: {
    range: 'Obese',
    bmiRange: '≥ 30',
    color: '#FF5722',
    icon: 'warning-outline',
    recommendation: 'Consult healthcare provider',
  },
};

export const calculateBMI = (weightKg: number, heightCm: number): number => {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
};

export const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return BMI_CATEGORIES.underweight;
  if (bmi < 25) return BMI_CATEGORIES.normal;
  if (bmi < 30) return BMI_CATEGORIES.overweight;
  return BMI_CATEGORIES.obese;
};

// ============================================================================
// FITNESS INDICATORS
// ============================================================================

export const FITNESS_INDICATORS = {
  excellent: {
    range: 'Excellent',
    color: '#4CAF50',
    icon: 'trophy-outline',
    description: 'Peak fitness',
  },
  good: {
    range: 'Good',
    color: '#8BC34A',
    icon: 'fitness-outline',
    description: 'Fit & healthy',
  },
  fair: {
    range: 'Fair',
    color: '#FFC107',
    icon: 'walk-outline',
    description: 'Moderate fitness',
  },
  poor: {
    range: 'Poor',
    color: '#FF9800',
    icon: 'alert-circle-outline',
    description: 'Needs improvement',
  },
  unfit: {
    range: 'Unfit',
    color: '#F44336',
    icon: 'close-circle-outline',
    description: 'Requires attention',
  },
};

// ============================================================================
// BENEFICIAL FOODS
// ============================================================================

export const WEIGHT_LOSS_FOODS = [
  { food: 'Leafy Greens', emoji: '🥬', benefit: 'Low calorie, high fiber' },
  { food: 'Eggs', emoji: '🥚', benefit: 'High protein, filling' },
  { food: 'Salmon', emoji: '🐟', benefit: 'Protein & healthy fats' },
  { food: 'Berries', emoji: '🫐', benefit: 'Low sugar, antioxidants' },
  { food: 'Greek Yogurt', emoji: '🥛', benefit: 'Protein-rich' },
  { food: 'Almonds', emoji: '🌰', benefit: 'Healthy fats' },
  { food: 'Quinoa', emoji: '🌾', benefit: 'Complete protein' },
  { food: 'Green Tea', emoji: '🍵', benefit: 'Metabolism boost' },
];

export const MUSCLE_GAIN_FOODS = [
  { food: 'Chicken Breast', emoji: '🍗', benefit: 'Lean protein' },
  { food: 'Eggs', emoji: '🥚', benefit: 'Complete protein' },
  { food: 'Whey Protein', emoji: '🥤', benefit: 'Fast absorption' },
  { food: 'Sweet Potato', emoji: '🍠', benefit: 'Complex carbs' },
  { food: 'Oats', emoji: '🌾', benefit: 'Energy & fiber' },
  { food: 'Tuna', emoji: '🐟', benefit: 'High protein, low fat' },
  { food: 'Cottage Cheese', emoji: '🧀', benefit: 'Casein protein' },
  { food: 'Brown Rice', emoji: '🍚', benefit: 'Sustained energy' },
];

export const SKIN_GLOW_FOODS = [
  { food: 'Avocado', emoji: '🥑', benefit: 'Healthy fats' },
  { food: 'Walnuts', emoji: '🌰', benefit: 'Omega-3' },
  { food: 'Tomatoes', emoji: '🍅', benefit: 'Lycopene' },
  { food: 'Berries', emoji: '🫐', benefit: 'Antioxidants' },
  { food: 'Dark Chocolate', emoji: '🍫', benefit: 'Flavonoids' },
  { food: 'Spinach', emoji: '🥬', benefit: 'Vitamins A & C' },
  { food: 'Papaya', emoji: '🍈', benefit: 'Vitamin C' },
  { food: 'Green Tea', emoji: '🍵', benefit: 'Polyphenols' },
];

// ============================================================================
// DAILY TASKS
// ============================================================================

export const BEAUTY_FITNESS_DAILY_TASKS: DailyTask[] = [
  {
    taskId: 'bf-task-1',
    name: 'Morning workout session',
    description: '30-45 minutes exercise',
    category: 'exercise',
    completed: false,
    reminderTime: '06:00',
    priority: 'high',
  },
  {
    taskId: 'bf-task-2',
    name: 'Healthy breakfast',
    description: 'Protein + complex carbs',
    category: 'nutrition',
    completed: false,
    reminderTime: '08:00',
    priority: 'high',
  },
  {
    taskId: 'bf-task-3',
    name: 'Track calories & macros',
    description: 'Log all meals and snacks',
    category: 'nutrition',
    completed: false,
    reminderTime: '20:00',
    priority: 'medium',
  },
  {
    taskId: 'bf-task-4',
    name: 'Drink 8 glasses of water',
    description: 'Stay hydrated throughout day',
    category: 'nutrition',
    completed: false,
    reminderTime: '12:00',
    priority: 'high',
  },
  {
    taskId: 'bf-task-5',
    name: 'Skincare routine',
    description: 'Cleanse, moisturize, protect',
    category: 'hygiene',
    completed: false,
    reminderTime: '22:00',
    priority: 'medium',
  },
  {
    taskId: 'bf-task-6',
    name: '7-8 hours quality sleep',
    description: 'Recovery is essential',
    category: 'sleep',
    completed: false,
    reminderTime: '23:00',
    priority: 'high',
  },
];

// ============================================================================
// WORKOUT PLANS
// ============================================================================

export const BEGINNER_WORKOUT_PLAN = [
  { day: 'Monday', focus: 'Full Body', duration: '30 min' },
  { day: 'Tuesday', focus: 'Cardio', duration: '20 min' },
  { day: 'Wednesday', focus: 'Rest', duration: 'Recovery' },
  { day: 'Thursday', focus: 'Full Body', duration: '30 min' },
  { day: 'Friday', focus: 'Cardio', duration: '20 min' },
  { day: 'Saturday', focus: 'Yoga/Stretching', duration: '30 min' },
  { day: 'Sunday', focus: 'Rest', duration: 'Recovery' },
];

export const INTERMEDIATE_WORKOUT_PLAN = [
  { day: 'Monday', focus: 'Upper Body', duration: '45 min' },
  { day: 'Tuesday', focus: 'Lower Body', duration: '45 min' },
  { day: 'Wednesday', focus: 'Cardio + Core', duration: '40 min' },
  { day: 'Thursday', focus: 'Upper Body', duration: '45 min' },
  { day: 'Friday', focus: 'Lower Body', duration: '45 min' },
  { day: 'Saturday', focus: 'Active Recovery', duration: '30 min' },
  { day: 'Sunday', focus: 'Rest', duration: 'Recovery' },
];

export const ADVANCED_WORKOUT_PLAN = [
  { day: 'Monday', focus: 'Chest + Triceps', duration: '60 min' },
  { day: 'Tuesday', focus: 'Back + Biceps', duration: '60 min' },
  { day: 'Wednesday', focus: 'Legs', duration: '60 min' },
  { day: 'Thursday', focus: 'Shoulders + Abs', duration: '60 min' },
  { day: 'Friday', focus: 'Full Body HIIT', duration: '45 min' },
  { day: 'Saturday', focus: 'Cardio + Core', duration: '45 min' },
  { day: 'Sunday', focus: 'Active Recovery', duration: '30 min' },
];

// ============================================================================
// HEALTH ASSESSMENTS
// ============================================================================

export const BEAUTY_FITNESS_ASSESSMENTS = [
  {
    name: 'Body Composition Analysis',
    frequency: 'Monthly',
    description: 'Track body fat, muscle mass',
    importance: 'Monitor progress',
  },
  {
    name: 'Fitness Assessment',
    frequency: 'Every 3 months',
    description: 'Strength, endurance, flexibility',
    importance: 'Adjust training plan',
  },
  {
    name: 'Blood Work',
    frequency: 'Every 6 months',
    description: 'Check vitamins, hormones',
    importance: 'Overall health',
  },
  {
    name: 'Skin Analysis',
    frequency: 'Every 6 months',
    description: 'Professional skin assessment',
    importance: 'Personalized skincare',
  },
];

// ============================================================================
// WARNING SIGNS
// ============================================================================

export const BEAUTY_FITNESS_WARNING_SIGNS: WarningSSign[] = [
  {
    signId: 'bf-warning-1',
    symptom: 'Chest pain during exercise',
    action: 'Stop immediately, seek medical help',
    severity: 'critical',
    icon: 'alert-circle',
  },
  {
    signId: 'bf-warning-2',
    symptom: 'Extreme fatigue or dizziness',
    action: 'Rest and consult doctor',
    severity: 'urgent',
    icon: 'warning',
  },
  {
    signId: 'bf-warning-3',
    symptom: 'Rapid unexplained weight loss/gain',
    action: 'Medical evaluation needed',
    severity: 'urgent',
    icon: 'fitness',
  },
  {
    signId: 'bf-warning-4',
    symptom: 'Persistent joint or muscle pain',
    action: 'Consult healthcare provider',
    severity: 'caution',
    icon: 'body-outline',
  },
  {
    signId: 'bf-warning-5',
    symptom: 'Extreme skin changes or rashes',
    action: 'See dermatologist',
    severity: 'urgent',
    icon: 'medical',
  },
  {
    signId: 'bf-warning-6',
    symptom: 'Irregular heartbeat during exercise',
    action: 'Stop exercise, consult doctor',
    severity: 'critical',
    icon: 'heart',
  },
];

// ============================================================================
// PERSONALIZED SUGGESTIONS
// ============================================================================

export const getPersonalizedSuggestions = (
  goal: string
): PersonalizedSuggestions => {
  const suggestions: Record<string, PersonalizedSuggestions> = {
    'weight-loss': {
      food: [
        'Calorie deficit: 500-750 cal/day',
        'High protein (0.8-1g per lb body weight)',
        'Focus on whole foods',
        'Control portion sizes',
      ],
      exercise: [
        'Cardio 4-5x per week (30-45 min)',
        'Strength training 3x per week',
        'Increase daily steps (10,000+)',
        'HIIT workouts 2x per week',
      ],
      mentalHealth: [
        'Set realistic goals (1-2 lbs/week)',
        'Track progress with photos',
        'Stay consistent, not perfect',
        'Celebrate non-scale victories',
      ],
      lifestyle: [
        'Get 7-8 hours sleep',
        'Manage stress levels',
        'Stay hydrated',
        'Meal prep weekly',
      ],
    },
    'muscle-gain': {
      food: [
        'Calorie surplus: 300-500 cal/day',
        'High protein (1-1.2g per lb body weight)',
        'Complex carbs around workouts',
        'Eat every 3-4 hours',
      ],
      exercise: [
        'Progressive overload training',
        'Focus on compound movements',
        'Train each muscle 2x per week',
        'Rest 48-72 hours between same muscle',
      ],
      mentalHealth: [
        'Be patient (muscle builds slowly)',
        'Track strength gains',
        'Prioritize recovery',
        'Stay motivated',
      ],
      lifestyle: [
        'Sleep 8-9 hours for recovery',
        'Supplement: Protein, Creatine',
        'Reduce cardio (interferes with gains)',
        'Stay consistent with training',
      ],
    },
    'skin-glow': {
      food: [
        'Antioxidant-rich foods daily',
        'Omega-3 fatty acids',
        'Vitamin C & E sources',
        'Stay well hydrated (3L+ water)',
      ],
      exercise: [
        'Cardio for blood circulation',
        'Yoga for stress reduction',
        'Avoid excessive sweating without cleaning',
        'Regular light exercise',
      ],
      mentalHealth: [
        '7-8 hours quality sleep',
        'Stress management crucial',
        'Practice self-care routines',
        'Meditation for skin health',
      ],
      lifestyle: [
        'Consistent skincare routine',
        'SPF protection daily',
        'Avoid smoking & alcohol',
        'Professional facials monthly',
      ],
    },
    'overall-fitness': {
      food: [
        'Balanced macros (40% carbs, 30% protein, 30% fat)',
        'Whole, unprocessed foods',
        'Adequate protein daily',
        'Hydration is key',
      ],
      exercise: [
        'Mix of cardio & strength',
        'Flexibility training',
        '150+ minutes activity/week',
        'Include rest days',
      ],
      mentalHealth: [
        'Focus on how you feel',
        'Consistent routine',
        'Manage stress effectively',
        'Prioritize sleep',
      ],
      lifestyle: [
        'Active lifestyle daily',
        'Regular health checkups',
        'Avoid smoking & excess alcohol',
        'Build sustainable habits',
      ],
    },
  };

  return suggestions[goal] || suggestions['overall-fitness'];
};

// ============================================================================
// MACRO CALCULATORS
// ============================================================================

export const calculateMacros = (
  weightKg: number,
  goal: string,
  activityLevel: string
): { calories: number; protein: number; carbs: number; fats: number } => {
  let bmr = weightKg * 22; // Simplified BMR
  
  // Activity multiplier
  const multipliers: Record<string, number> = {
    'sedentary': 1.2,
    'moderate': 1.55,
    'active': 1.725,
    'very-active': 1.9,
  };
  
  const tdee = bmr * (multipliers[activityLevel] || 1.55);
  
  let calories = tdee;
  let proteinRatio = 0.3;
  let carbsRatio = 0.4;
  let fatsRatio = 0.3;
  
  if (goal === 'weight-loss') {
    calories = tdee - 500;
    proteinRatio = 0.35;
    carbsRatio = 0.35;
    fatsRatio = 0.3;
  } else if (goal === 'muscle-gain') {
    calories = tdee + 300;
    proteinRatio = 0.3;
    carbsRatio = 0.45;
    fatsRatio = 0.25;
  }
  
  return {
    calories: Math.round(calories),
    protein: Math.round((calories * proteinRatio) / 4), // 4 cal per g
    carbs: Math.round((calories * carbsRatio) / 4),
    fats: Math.round((calories * fatsRatio) / 9), // 9 cal per g
  };
};

// ============================================================================
// EXERCISE LIBRARY
// ============================================================================

export const EXERCISE_CATEGORIES = {
  cardio: [
    { name: 'Running', caloriesBurn: '300-500/hr', difficulty: 'Medium' },
    { name: 'Cycling', caloriesBurn: '400-600/hr', difficulty: 'Medium' },
    { name: 'Swimming', caloriesBurn: '400-700/hr', difficulty: 'Medium' },
    { name: 'Jump Rope', caloriesBurn: '600-800/hr', difficulty: 'High' },
  ],
  strength: [
    { name: 'Squats', muscleGroup: 'Legs', reps: '8-12' },
    { name: 'Deadlifts', muscleGroup: 'Full Body', reps: '6-10' },
    { name: 'Bench Press', muscleGroup: 'Chest', reps: '8-12' },
    { name: 'Pull-ups', muscleGroup: 'Back', reps: '6-10' },
  ],
  flexibility: [
    { name: 'Yoga', duration: '30-60 min', benefit: 'Full body' },
    { name: 'Pilates', duration: '45-60 min', benefit: 'Core strength' },
    { name: 'Stretching', duration: '15-20 min', benefit: 'Recovery' },
  ],
};

// ============================================================================
// PROGRESS TRACKING METRICS
// ============================================================================

export const TRACKING_METRICS = [
  { metric: 'Weight', unit: 'kg', frequency: 'Weekly' },
  { metric: 'Body Fat %', unit: '%', frequency: 'Monthly' },
  { metric: 'Measurements', unit: 'cm', frequency: 'Bi-weekly' },
  { metric: 'Photos', unit: 'Front/Side/Back', frequency: 'Monthly' },
  { metric: 'Strength', unit: 'Max weight', frequency: 'Monthly' },
  { metric: 'Endurance', unit: 'Time/Distance', frequency: 'Monthly' },
];

// ============================================================================
// SUPPLEMENTS
// ============================================================================

export const COMMON_SUPPLEMENTS = [
  { name: 'Protein Powder', use: 'Muscle recovery', timing: 'Post-workout' },
  { name: 'Creatine', use: 'Strength & power', timing: 'Daily (5g)' },
  { name: 'Omega-3', use: 'Anti-inflammatory', timing: 'With meals' },
  { name: 'Vitamin D', use: 'Bone & immune health', timing: 'Daily' },
  { name: 'Multivitamin', use: 'Nutritional insurance', timing: 'With breakfast' },
  { name: 'BCAAs', use: 'Muscle preservation', timing: 'During workout' },
];
// Add these exports after FITNESS_LEVELS

// Alias for compatibility
export const FITNESS_GOALS = BEAUTY_FITNESS_GOALS;

export const SKIN_TYPES = [
  { label: 'Normal', value: 'normal' },
  { label: 'Oily', value: 'oily' },
  { label: 'Dry', value: 'dry' },
  { label: 'Combination', value: 'combination' },
  { label: 'Sensitive', value: 'sensitive' },
];

export const WORKOUT_TYPES = [
  { name: 'Cardio', icon: 'heart-outline', benefit: 'Heart health' },
  { name: 'Strength', icon: 'barbell-outline', benefit: 'Muscle building' },
  { name: 'HIIT', icon: 'flame-outline', benefit: 'Fat burning' },
  { name: 'Yoga', icon: 'body-outline', benefit: 'Flexibility' },
  { name: 'Pilates', icon: 'fitness-outline', benefit: 'Core strength' },
  { name: 'Swimming', icon: 'water-outline', benefit: 'Full body workout' },
];

export const BEAUTY_TREATMENTS = [
  { name: 'Face Mask', frequency: '2x/week' },
  { name: 'Hair Treatment', frequency: 'Weekly' },
  { name: 'Body Scrub', frequency: 'Weekly' },
  { name: 'Moisturizing', frequency: 'Daily' },
];

export const SKIN_HEALTHY_FOODS = SKIN_GLOW_FOODS; // Alias

export const HAIR_HEALTHY_FOODS = [
  { food: 'Eggs', emoji: '🥚', benefit: 'Biotin & protein' },
  { food: 'Spinach', emoji: '🥬', benefit: 'Iron & folate' },
  { food: 'Greek Yogurt', emoji: '🥛', benefit: 'Protein & B vitamins' },
  { food: 'Almonds', emoji: '🌰', benefit: 'Vitamin E' },
  { food: 'Carrots', emoji: '🥕', benefit: 'Vitamin A' },
  { food: 'Lentils', emoji: '🫘', benefit: 'Iron & zinc' },
];

// Change BEAUTY_FITNESS_ASSESSMENTS to BEAUTY_FITNESS_CHECKUPS
export const BEAUTY_FITNESS_CHECKUPS = BEAUTY_FITNESS_ASSESSMENTS.map(assessment => ({
  name: assessment.name,
  frequency: assessment.frequency,
  description: assessment.description,
}));
