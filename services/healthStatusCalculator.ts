// services/healthStatusCalculator.ts
// Unified Health Status Calculator for All Wellness Modules
// Last Updated: December 14, 2025

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

// ============================================================================
// SKIN & HAIR MODULE CALCULATORS
// ============================================================================

/**
 * Calculate skin health status based on concerns, skin type, and age
 */
export const calculateSkinHealthStatus = (
  concerns: string[],
  skinType: string,
  age: number
): HealthStatus => {
  let score = 0;

  // Concern severity scoring
  const severityMap: Record<string, number> = {
    'acne': 3,
    'pigmentation': 3,
    'dry-skin': 1,
    'dull-skin': 1,
    'general': 0,
  };

  concerns.forEach((c) => {
    score += severityMap[c] || 0;
  });

  // Multiple concerns penalty
  if (concerns.length > 2) score += 1;
  if (concerns.length > 3) score += 2;

  // Age factor (skin aging)
  if (age > 40) score += 0.5;
  if (age > 55) score += 1;

  // Skin type factor
  if (skinType === 'sensitive') score += 1;
  if (skinType === 'oily') score += 0.5;

  // Return health status
  if (score >= 8) return 'critical';
  if (score >= 5) return 'poor';
  if (score >= 3) return 'fair';
  if (score >= 1) return 'good';
  return 'excellent';
};

/**
 * Calculate hair health status based on concerns, hair type, age, and gender
 */
export const calculateHairHealthStatus = (
  concerns: string[],
  hairType: string,
  age: number,
  gender: 'male' | 'female'
): HealthStatus => {
  let score = 0;

  // Concern severity scoring
  const severityMap: Record<string, number> = {
    'hair-fall': 3,
    'damaged-hair': 2,
    'general': 0,
  };

  concerns.forEach((c) => {
    score += severityMap[c] || 0;
  });

  // Multiple concerns
  if (concerns.length > 1) score += 1;

  // Age and gender factors
  if (age > 35 && gender === 'male') score += 1.5; // Male pattern baldness
  if (age > 40 && gender === 'female') score += 0.5;
  if (age > 50) score += 1;

  // Hair type factor (damaged/brittle hair types)
  if (hairType === 'coily') score += 0.5; // More prone to dryness

  // Return health status
  if (score >= 6) return 'critical';
  if (score >= 4) return 'poor';
  if (score >= 2) return 'fair';
  if (score >= 1) return 'good';
  return 'excellent';
};

// ============================================================================
// GUT HEALTH MODULE CALCULATOR
// ============================================================================

/**
 * Calculate digestive health status based on concern and severity level
 */
export const calculateDigestiveHealthStatus = (
  concern: string,
  severityLevel: 'mild' | 'moderate' | 'severe' = 'mild'
): HealthStatus => {
  // Concern base scores
  const concernScores: Record<string, number> = {
    'ibs': 3,
    'acid-reflux': 2,
    'constipation': 2,
    'bloating': 1,
    'diarrhea': 2,
    'indigestion': 1,
    'general': 0,
  };

  let score = concernScores[concern] || 0;

  // Severity multiplier
  if (severityLevel === 'moderate') {
    score *= 1.5;
  } else if (severityLevel === 'severe') {
    score *= 2.5;
  }

  // Return health status
  if (score >= 7) return 'critical';
  if (score >= 5) return 'poor';
  if (score >= 3) return 'fair';
  if (score >= 1) return 'good';
  return 'excellent';
};

// ============================================================================
// LIVER & KIDNEY MODULE CALCULATORS
// ============================================================================

/**
 * Calculate liver health status based on condition and age
 */
export const calculateLiverHealthStatus = (
  condition: string,
  age: number
): HealthStatus => {
  // Condition severity scores
  const conditionScores: Record<string, number> = {
    'fatty-liver': 3,
    'hepatitis': 4,
    'cirrhosis': 5,
    'elevated-enzymes': 2,
    'detox': 1,
    'general': 0,
  };

  let score = conditionScores[condition] || 0;

  // Age factor (liver function declines with age)
  if (age > 50) score += 1;
  if (age > 65) score += 1.5;

  // Return health status
  if (score >= 6) return 'critical';
  if (score >= 4) return 'poor';
  if (score >= 2) return 'fair';
  if (score >= 1) return 'good';
  return 'excellent';
};

/**
 * Calculate kidney health status based on condition and hydration level
 */
export const calculateKidneyHealthStatus = (
  condition: string,
  hydrationGoalLiters: number = 3
): HealthStatus => {
  // Condition severity scores
  const conditionScores: Record<string, number> = {
    'kidney-stones': 3,
    'ckd': 4, // Chronic kidney disease
    'uti': 2,
    'high-creatinine': 3,
    'proteinuria': 3,
    'detox': 1,
    'general': 0,
  };

  let score = conditionScores[condition] || 0;

  // Hydration penalty (kidney health depends on proper hydration)
  if (hydrationGoalLiters < 2) {
    score += 2;
  } else if (hydrationGoalLiters < 2.5) {
    score += 1;
  }

  // Return health status
  if (score >= 6) return 'critical';
  if (score >= 4) return 'poor';
  if (score >= 2) return 'fair';
  if (score >= 1) return 'good';
  return 'excellent';
};

// ============================================================================
// BONE & JOINT MODULE CALCULATOR
// ============================================================================

/**
 * Calculate mobility status based on concern, affected joints, and pain level
 */
export const calculateMobilityStatus = (
  concern: string,
  affectedJoints: string[],
  painLevel: number = 0
): HealthStatus => {
  let score = 0;

  // Concern severity scores
  const concernScores: Record<string, number> = {
    'arthritis': 3,
    'osteoporosis': 4,
    'joint-pain': 2,
    'inflammation': 2,
    'stiffness': 1,
    'general': 0,
  };

  score += concernScores[concern] || 0;

  // Multiple joints affected (each additional joint adds to severity)
  if (affectedJoints.length >= 4) {
    score += 3;
  } else if (affectedJoints.length >= 2) {
    score += affectedJoints.length - 1;
  }

  // Pain level contribution (0-10 scale)
  if (painLevel >= 8) {
    score += 3;
  } else if (painLevel >= 6) {
    score += 2;
  } else if (painLevel >= 4) {
    score += 1;
  } else if (painLevel >= 2) {
    score += 0.5;
  }

  // Return health status
  if (score >= 9) return 'critical';
  if (score >= 6) return 'poor';
  if (score >= 3) return 'fair';
  if (score >= 1) return 'good';
  return 'excellent';
};

// ============================================================================
// TEETH & ORAL MODULE CALCULATOR
// ============================================================================

/**
 * Calculate dental health status based on concern, smoking status, and existing issues
 */
export const calculateDentalHealthStatus = (
  concern: string,
  smokingStatus: string,
  hasDentalIssues: boolean
): HealthStatus => {
  let score = 0;

  // Concern severity scores
  const concernScores: Record<string, number> = {
    'cavities': 2,
    'gum-disease': 3,
    'sensitivity': 1,
    'tooth-decay': 3,
    'bad-breath': 1,
    'bleeding-gums': 2,
    'general': 0,
  };

  score += concernScores[concern] || 0;

  // Smoking impact (significant risk factor for dental health)
  if (smokingStatus === 'smoker') {
    score += 2.5;
  } else if (smokingStatus === 'ex-smoker') {
    score += 1;
  }

  // Existing dental issues
  if (hasDentalIssues) {
    score += 2;
  }

  // Return health status
  if (score >= 7) return 'critical';
  if (score >= 5) return 'poor';
  if (score >= 3) return 'fair';
  if (score >= 1) return 'good';
  return 'excellent';
};

// ============================================================================
// BEAUTY & FITNESS MODULE CALCULATOR (BMI-based)
// ============================================================================

/**
 * Calculate fitness status based on BMI
 * Note: Beauty & Fitness already has dynamic calculation in the screen,
 * but we provide this for consistency
 */
export const calculateFitnessStatus = (
  currentWeightKg: number,
  heightCm: number,
  age: number
): HealthStatus => {
  if (!heightCm || !currentWeightKg || heightCm <= 0 || currentWeightKg <= 0) {
    return 'good'; // Default if invalid data
  }

  // Calculate BMI
  const heightM = heightCm / 100;
  const bmi = currentWeightKg / (heightM * heightM);

  // Age adjustment factor (metabolism slows with age)
  let adjustedBmi = bmi;
  if (age > 50) {
    adjustedBmi += 0.5;
  } else if (age > 65) {
    adjustedBmi += 1;
  }

  // Determine status based on BMI ranges
  if (adjustedBmi < 16 || adjustedBmi > 35) {
    return 'critical'; // Severe underweight or obesity
  } else if ((adjustedBmi >= 16 && adjustedBmi < 18.5) || (adjustedBmi >= 30 && adjustedBmi < 35)) {
    return 'poor'; // Underweight or obese
  } else if ((adjustedBmi >= 18.5 && adjustedBmi < 20) || (adjustedBmi >= 27 && adjustedBmi < 30)) {
    return 'fair'; // Slightly underweight or overweight
  } else if (adjustedBmi >= 25 && adjustedBmi < 27) {
    return 'good'; // Slightly overweight but manageable
  } else if (adjustedBmi >= 18.5 && adjustedBmi < 25) {
    return 'excellent'; // Ideal BMI range
  }

  return 'good'; // Default fallback
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a human-readable description of the health status
 */
export const getHealthStatusDescription = (status: HealthStatus): string => {
  const descriptions: Record<HealthStatus, string> = {
    excellent: 'Your health metrics are excellent! Keep up the great work.',
    good: 'Your health is in good condition with minor areas to watch.',
    fair: 'Some concerns present. Focus on targeted improvements.',
    poor: 'Multiple issues detected. Consider consulting a healthcare professional.',
    critical: 'Serious health concerns. Immediate medical attention recommended.',
  };

  return descriptions[status];
};

/**
 * Get a color code for the health status
 */
export const getHealthStatusColor = (status: HealthStatus): string => {
  const colors: Record<HealthStatus, string> = {
    excellent: '#4CAF50', // Green
    good: '#8BC34A',      // Light green
    fair: '#FFC107',      // Amber
    poor: '#FF9800',      // Orange
    critical: '#F44336',  // Red
  };

  return colors[status];
};

/**
 * Get an icon name for the health status
 */
export const getHealthStatusIcon = (status: HealthStatus): string => {
  const icons: Record<HealthStatus, string> = {
    excellent: 'checkmark-circle',
    good: 'happy-outline',
    fair: 'alert-circle-outline',
    poor: 'warning-outline',
    critical: 'close-circle',
  };

  return icons[status];
};
