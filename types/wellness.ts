// types/wellness.ts
// Type definitions for Wellness Modules
// Last Updated: December 14, 2025 - ✅ FIXED: Multiple concerns support + enhanced types

export type WellnessModuleType =
  | 'mother-care'
  | 'child-care'
  | 'liver-kidney'
  | 'skin-hair'
  | 'gut-health'
  | 'bone-joint'
  | 'teeth-oral'
  | 'beauty-fitness';

export type MealRelation = 'Before meals' | 'After meals' | 'With meals' | 'Any time';

export type UrgencyLevel = 'upcoming' | 'due-soon' | 'overdue';

export type NotificationPriority = 'low' | 'medium' | 'high';

// ✅ UPDATED: Added more task categories
export type TaskCategory = 
  | 'nutrition' 
  | 'exercise' 
  | 'activity' 
  | 'medication' 
  | 'hygiene' 
  | 'mindfulness'
  | 'feeding'
  | 'sleep'
  | 'learning'
  | 'social'
  | 'health'
  | 'self-care'
  | 'detox'          // ✅ ADDED for liver-kidney
  | 'mobility'       // ✅ ADDED for bone-joint
  | 'dental';        // ✅ ADDED for teeth-oral

// ✅ ADDED: Health status type (used across all modules)
export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

// ============================================================================
// CORE WELLNESS INTERFACES
// ============================================================================

export interface WellnessModuleProfile {
  moduleType: WellnessModuleType;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  currentDay: number;
  currentWeek: number;
  programDuration: number;
  completionPercentage: number;
  lastUpdated: Date;
  notificationsEnabled: boolean;
}

export interface DailyTask {
  taskId: string;
  name: string;
  description?: string;
  category: TaskCategory;
  completed: boolean;
  completedAt?: Date;
  reminderTime?: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  emoji?: string;
}

export interface DailyTracking {
  trackingId: string;
  date: string;
  dayNumber: number;
  tasks: DailyTask[];
  metrics: Record<string, any>;
  overallCompletion: number;
  notes?: string;
  createdAt: Date;
}

export interface WeeklyMilestone {
  weekNumber: number;
  startDate: string;
  endDate: string;
  title: string;
  milestones: string[];
  tips: string[];
  completionRate: number;
  aiInsights?: string;
}

export interface WellnessNotification {
  notificationId: string;
  type: 'reminder' | 'alert' | 'insight' | 'report';
  title: string;
  message: string;
  scheduledFor: Date;
  sentAt?: Date;
  read: boolean;
  priority: NotificationPriority;
  actionUrl?: string;
  moduleType: WellnessModuleType;
}

export interface WeeklyReport {
  reportId: string;
  moduleType: WellnessModuleType;
  weekNumber: number;
  generatedAt: Date;
  summary: string;
  achievements: string[];
  areasToImprove: string[];
  aiRecommendations: string;
  charts?: {
    [chartType: string]: any;
  };
  completionRate: number;
}

// ============================================================================
// MODULE-SPECIFIC INTERFACES
// ============================================================================

// --- MOTHER CARE ---
export interface MotherCareProfile extends WellnessModuleProfile {
  motherName: string;
  lmpDate: string;
  dueDate: string;
  currentWeekOfPregnancy: number;
  currentDayOfPregnancy: number;
  trimester: 1 | 2 | 3;
}

export interface MotherCareMetrics {
  weightKg?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  bloodSugarFasting?: number;
  waterIntakeLiters?: number;
  sleepHours?: number;
}

export interface PregnancyMilestone {
  week: number;
  babySize: string;
  babySizeEmoji: string;
  development: string;
  motherChanges: string;
}

export interface TrimesterData {
  trimester: 1 | 2 | 3;
  weekRange: [number, number];
  focus: string[];
  commonSymptoms: string[];
  nutritionTips: string[];
  exerciseTips: string[];
  warningSign: string[];
}

// --- CHILD CARE ---
export interface ChildCareProfile extends WellnessModuleProfile {
  childId: string;
  childName: string;
  birthDate: string;
  ageInMonths: number;
  ageInDays?: number;
  gender?: 'male' | 'female';
  developmentalStage?: '0-3m' | '3-6m' | '6-12m' | '12-24m' | '24-36m' | '36m+';
  photoUrl?: string;
  lastTrackedDate?: string;
}

export interface ChildProfileSummary {
  childId: string;
  childName: string;
  ageInMonths: number;
  ageDisplay: string;
  gender?: 'male' | 'female';
  lastTrackedDate?: string;
  photoUrl?: string;
  completionRate: number;
}

export interface ChildCareMilestone {
  ageMonths: number;
  milestone: string;
  expectedAge: string;
  achieved: boolean;
  achievedDate?: string;
}

export interface ChildCareFoodPlan {
  ageRange: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: string[];
  quantity?: string;
  notes?: string;
}

export interface ChildGrowthMetrics {
  weightKg?: number;
  heightCm?: number;
  headCircumferenceCm?: number;
  date: string;
}

// --- LIVER & KIDNEY ---
// ✅ UPDATED: Enhanced with proper types
export interface LiverKidneyProfile extends WellnessModuleProfile {
  detoxDay: number;
  hydrationGoalLiters: number;
  dietPlan: 'detox' | 'maintenance';
  condition: 'fatty-liver' | 'kidney-stones' | 'ckd' | 'hepatitis' | 'elevated-enzymes' | 'uti' | 'detox' | 'general';
  age: number;
  gender: 'male' | 'female';
  currentLiverStatus: HealthStatus;      // ✅ CHANGED to HealthStatus type
  currentKidneyStatus: HealthStatus;     // ✅ CHANGED to HealthStatus type
  lastTestDate?: string;
}

export interface LiverKidneyMetrics {
  waterIntakeLiters: number;
  alcoholConsumed: boolean;
  processedFoodConsumed: boolean;
  exerciseMinutes: number;
  sleepHours: number;
}

// --- SKIN & HAIR ---
// ✅ MAJOR UPDATE: Support for multiple concerns
export interface SkinHairProfile extends WellnessModuleProfile {
  concerns: string[];                    // ✅ CHANGED: Now array of concerns
  primaryConcern: string;                // ✅ ADDED: Main focus area
  skinType: 'oily' | 'dry' | 'combination' | 'sensitive' | 'normal';
  hairType: 'straight' | 'wavy' | 'curly' | 'coily';
  age: number;
  gender: 'male' | 'female';
  currentSkinCondition: HealthStatus;    // ✅ CHANGED to HealthStatus type
  currentHairCondition: HealthStatus;    // ✅ CHANGED to HealthStatus type
  lastTreatmentDate?: string;
  lastAnalysisDate?: string;             // ✅ ADDED: Track when detailed analysis was last viewed
}

export interface SkinHairMetrics {
  morningRoutineCompleted: boolean;
  nightRoutineCompleted: boolean;
  sunscreenApplied: boolean;
  waterIntakeLiters: number;
  sleepHours: number;
  scalpMassageDone?: boolean;
  hairOilApplied?: boolean;
  skinConditionRating?: number;          // 1-5 scale
  hairConditionRating?: number;          // 1-5 scale
}

// --- GUT HEALTH ---
// ✅ UPDATED: Enhanced concern types
export interface GutHealthProfile extends WellnessModuleProfile {
  concern: 'bloating' | 'acidity' | 'ibs' | 'constipation' | 'diarrhea' | 'indigestion' | 'acid-reflux' | 'general';
  dietType: 'vegetarian' | 'non-vegetarian' | 'vegan';
  age: number;
  gender: 'male' | 'female';
  currentDigestiveHealth: HealthStatus;  // ✅ CHANGED to HealthStatus type
  lastCheckupDate?: string;
  severityLevel: 'mild' | 'moderate' | 'severe';  // ✅ CHANGED: Made required with default
}

export interface GutHealthMetrics {
  bowelMovement: 'normal' | 'constipation' | 'diarrhea' | 'none';
  bloatingLevel: number;
  acidityLevel: number;
  waterIntakeLiters: number;
  probioticConsumed: boolean;
  fiberIntakeGrams?: number;
}

// --- BONE & JOINT ---
// ✅ UPDATED: Enhanced concern types
export interface BoneJointProfile extends WellnessModuleProfile {
  concern: 'pain' | 'stiffness' | 'flexibility' | 'strength' | 'arthritis' | 'osteoporosis' | 'inflammation' | 'general';
  affectedJoints: string[];
  age: number;
  gender: 'male' | 'female';
  currentMobilityStatus: HealthStatus;   // ✅ CHANGED to HealthStatus type
  currentPainLevel: number;              // ✅ CHANGED: Made required (0-10 scale)
  lastCheckupDate?: string;
  activityLevel: 'sedentary' | 'moderate' | 'active' | 'very-active';  // ✅ CHANGED: Made required
}

export interface BoneJointMetrics {
  painLevel: number;
  stiffnessLevel: number;
  exerciseMinutes: number;
  stretching: boolean;
  calciumIntakeMg?: number;
  vitaminDSupplementTaken: boolean;
}

// --- TEETH & ORAL CARE ---
// ✅ UPDATED: Enhanced types
export interface TeethOralProfile extends WellnessModuleProfile {
  concern: 'sensitivity' | 'whitening' | 'gum-health' | 'cavities' | 'bad-breath' | 'tooth-decay' | 'bleeding-gums' | 'gum-disease' | 'general';
  age: number;
  gender: 'male' | 'female';
  currentDentalHealth: HealthStatus;     // ✅ CHANGED to HealthStatus type
  lastDentalVisit?: string;
  hasDentalIssues: boolean;              // ✅ CHANGED: Made required with default false
  smokingStatus: 'non-smoker' | 'smoker' | 'ex-smoker';  // ✅ CHANGED: Made required
}

export interface TeethOralMetrics {
  morningBrushing: boolean;
  nightBrushing: boolean;
  flossing: boolean;
  mouthwashUsed: boolean;
  sugarIntakeLevel: 'low' | 'medium' | 'high';
}

// --- BEAUTY & FITNESS ---
// ✅ UPDATED: Already has dynamic calculation, enhanced types
export interface BeautyFitnessProfile extends WellnessModuleProfile {
  goal: 'weight-loss' | 'muscle-gain' | 'skin-glow' | 'overall-fitness';
  currentWeightKg: number;
  targetWeightKg: number;                // ✅ CHANGED: Made required
  heightCm: number;
  age: number;
  gender: 'male' | 'female';
  bmi: number;                           // ✅ CHANGED: Made required (calculated)
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';  // ✅ CHANGED: Made required
  currentBodyFat?: number;
  targetBodyFat?: number;
  lastWeightCheckDate: string;           // ✅ CHANGED: Made required
}

export interface BeautyFitnessMetrics {
  weightKg: number;
  workoutMinutes: number;
  caloriesConsumed: number;
  caloriesBurned: number;
  waterIntakeLiters: number;
  sleepHours: number;
  skinCareRoutine: boolean;
}

// ============================================================================
// MEDICAL REMINDERS
// ============================================================================

export interface MedicalReminder {
  reminderId: string;
  title: string;
  description: string;
  dueDate: string;
  dueDateRange?: string;
  urgency: UrgencyLevel;
  completed: boolean;
  completedDate?: string;
  notes?: string;
}

// ============================================================================
// WARNING SIGNS
// ============================================================================

export interface WarningSSign {
  signId: string;
  symptom: string;
  action: string;
  severity: 'critical' | 'urgent' | 'caution';
  icon: string;
}

// ============================================================================
// PERSONALIZED SUGGESTIONS
// ============================================================================

export interface PersonalizedSuggestions {
  food: string[];
  exercise: string[];
  mentalHealth: string[];
  lifestyle?: string[];
}

// ============================================================================
// ⭐ WEEKLY AI-GENERATED CONTENT TYPES
// ============================================================================

export interface DailyAIContent {
  dayNumber: number;
  dayOfWeek: string;
  tasks: DailyTask[];
  milestones: {
    physical: string[];
    cognitive: string[];
    social: string[];
    language: string[];
    tips: string[];
  };
  feeding: {
    summary: string;
    schedule: Array<{
      time: string;
      activity: string;
      amount?: string;
      emoji: string;
    }>;
    tips: string[];
  };
  activities: {
    morning: string[];
    afternoon: string[];
    evening: string[];
  };
}

export interface WeeklyAIContent {
  weekId: string;
  childId: string;
  childName: string;
  ageInMonths: number;
  generatedAt: string;
  expiresAt: string;
  days: DailyAIContent[];
}

export interface AIContentCache {
  weekId: string;
  isValid: boolean;
  expiresAt: string;
  daysRemaining: number;
}

// ============================================================================
// ✅ ADDED: DETAILED HEALTH ANALYSIS TYPES
// ============================================================================

export interface HealthAnalysis {
  moduleType: WellnessModuleType;
  generatedAt: string;
  overallStatus: HealthStatus;
  statusDescription: string;
  contributingFactors: AnalysisFactor[];
  recommendations: AnalysisRecommendation[];
  expectedTimeline: string;
  progressIndicators: ProgressIndicator[];
}

export interface AnalysisFactor {
  factorId: string;
  category: 'concern' | 'lifestyle' | 'age' | 'genetics' | 'environment';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  icon: string;
}

export interface AnalysisRecommendation {
  recommendationId: string;
  priority: 'high' | 'medium' | 'low';
  category: 'nutrition' | 'exercise' | 'lifestyle' | 'medical' | 'product';
  title: string;
  description: string;
  actionSteps: string[];
  expectedOutcome: string;
  timeframe: string;
}

export interface ProgressIndicator {
  indicatorId: string;
  metric: string;
  currentValue: number | string;
  targetValue: number | string;
  unit: string;
  progressPercentage: number;
  trend: 'improving' | 'stable' | 'declining';
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type ModuleStatus = 'not-started' | 'active' | 'paused' | 'completed';

export interface ModuleCardData {
  moduleType: WellnessModuleType;
  title: string;
  icon: string;
  color: string;
  description: string;
  status: ModuleStatus;
  progress: number;
}
