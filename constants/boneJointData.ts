// constants/boneJointData.ts
// Data for Bone & Joint Wellness Module
// Last Updated: December 13, 2025

import { DailyTask, PersonalizedSuggestions, WarningSign } from '../types/wellness';

// ============================================================================
// CONCERNS & ACTIVITY LEVELS
// ============================================================================

export const BONE_JOINT_CONCERNS = [
  { label: 'Pain', value: 'pain' },
  { label: 'Stiffness', value: 'stiffness' },
  { label: 'Flexibility', value: 'flexibility' },
  { label: 'Strength', value: 'strength' },
  { label: 'General Health', value: 'general' },
];

export const AFFECTED_JOINTS = [
  { label: 'Knee', value: 'knee', emoji: '🦵' },
  { label: 'Hip', value: 'hip', emoji: '🦴' },
  { label: 'Shoulder', value: 'shoulder', emoji: '💪' },
  { label: 'Elbow', value: 'elbow', emoji: '🤳' },
  { label: 'Wrist', value: 'wrist', emoji: '🤚' },
  { label: 'Ankle', value: 'ankle', emoji: '🦶' },
  { label: 'Back/Spine', value: 'back', emoji: '🧍' },
  { label: 'Neck', value: 'neck', emoji: '👤' },
];

export const ACTIVITY_LEVELS = [
  { label: 'Sedentary', value: 'sedentary' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Active', value: 'active' },
  { label: 'Very Active', value: 'very-active' },
];

// ============================================================================
// BONE & JOINT HEALTH INDICATORS
// ============================================================================

export const MOBILITY_INDICATORS = {
  excellent: {
    range: 'Excellent',
    color: '#4CAF50',
    icon: 'fitness-outline',
    description: 'Full mobility',
  },
  good: {
    range: 'Good',
    color: '#8BC34A',
    icon: 'checkmark-circle-outline',
    description: 'Healthy joints',
  },
  fair: {
    range: 'Fair',
    color: '#FFC107',
    icon: 'alert-circle-outline',
    description: 'Minor limitations',
  },
  poor: {
    range: 'Poor',
    color: '#FF9800',
    icon: 'warning-outline',
    description: 'Significant issues',
  },
  critical: {
    range: 'Critical',
    color: '#F44336',
    icon: 'close-circle-outline',
    description: 'Severe impairment',
  },
} as const;

// ⭐ NEW: Bone Density Indicators (similar to liver-kidney pattern)
export const BONE_DENSITY_INDICATORS = {
  excellent: {
    range: 'Excellent',
    color: '#4CAF50',
    icon: 'fitness-outline',
    description: 'Strong bones, very good density',
  },
  good: {
    range: 'Good',
    color: '#8BC34A',
    icon: 'checkmark-circle-outline',
    description: 'Healthy bone density',
  },
  fair: {
    range: 'Fair',
    color: '#FFC107',
    icon: 'alert-circle-outline',
    description: 'Slightly low bone density',
  },
  low: {
    range: 'Low (Osteopenia)',
    color: '#FF9800',
    icon: 'warning-outline',
    description: 'Below normal bone density',
  },
  critical: {
    range: 'Very Low (Osteoporosis)',
    color: '#F44336',
    icon: 'close-circle-outline',
    description: 'Severe bone loss',
  },
} as const;

export const PAIN_SCALE = [
  { level: 0, label: 'No Pain', color: '#4CAF50', emoji: '😊' },
  { level: '1-2', label: 'Mild', color: '#8BC34A', emoji: '🙂' },
  { level: '3-4', label: 'Moderate', color: '#FFC107', emoji: '😐' },
  { level: '5-6', label: 'Severe', color: '#FF9800', emoji: '😣' },
  { level: '7-8', label: 'Very Severe', color: '#FF5722', emoji: '😖' },
  { level: '9-10', label: 'Unbearable', color: '#F44336', emoji: '😱' },
];

// ============================================================================
// BENEFICIAL FOODS
// ============================================================================

export const BONE_STRENGTHENING_FOODS = [
  { food: 'Milk', emoji: '🥛', benefit: 'Calcium' },
  { food: 'Salmon', emoji: '🐟', benefit: 'Vitamin D & Omega-3' },
  { food: 'Almonds', emoji: '🌰', benefit: 'Calcium & Magnesium' },
  { food: 'Spinach', emoji: '🥬', benefit: 'Vitamin K' },
  { food: 'Eggs', emoji: '🥚', benefit: 'Vitamin D' },
  { food: 'Tofu', emoji: '🍱', benefit: 'Calcium' },
  { food: 'Cheese', emoji: '🧀', benefit: 'Calcium & Protein' },
  { food: 'Broccoli', emoji: '🥦', benefit: 'Calcium & Vitamin K' },
];

export const JOINT_SUPPORTING_FOODS = [
  { food: 'Turmeric', emoji: '🌿', benefit: 'Anti-inflammatory' },
  { food: 'Ginger', emoji: '🫚', benefit: 'Reduces inflammation' },
  { food: 'Berries', emoji: '🫐', benefit: 'Antioxidants' },
  { food: 'Olive Oil', emoji: '🫒', benefit: 'Healthy fats' },
  { food: 'Green Tea', emoji: '🍵', benefit: 'Polyphenols' },
  { food: 'Walnuts', emoji: '🌰', benefit: 'Omega-3' },
  { food: 'Bone Broth', emoji: '🍜', benefit: 'Collagen' },
  { food: 'Cherries', emoji: '🍒', benefit: 'Anti-inflammatory' },
];

// ============================================================================
// DAILY TASKS
// ============================================================================

export const BONE_JOINT_DAILY_TASKS: DailyTask[] = [
  {
    taskId: 'bj-task-1',
    name: 'Morning stretching routine',
    description: '10-15 minutes gentle stretches',
    category: 'exercise',
    completed: false,
    reminderTime: '07:00',
    priority: 'high',
  },
  {
    taskId: 'bj-task-2',
    name: 'Calcium-rich breakfast',
    description: 'Milk, yogurt, or fortified foods',
    category: 'nutrition',
    completed: false,
    reminderTime: '08:00',
    priority: 'high',
  },
  {
    taskId: 'bj-task-3',
    name: 'Vitamin D supplement',
    description: 'Take daily supplement or get sunlight',
    category: 'medication',
    completed: false,
    reminderTime: '09:00',
    priority: 'high',
  },
  {
    taskId: 'bj-task-4',
    name: 'Low-impact exercise',
    description: 'Walking, swimming, or cycling',
    category: 'exercise',
    completed: false,
    reminderTime: '17:00',
    priority: 'medium',
  },
  {
    taskId: 'bj-task-5',
    name: 'Joint-friendly movements',
    description: 'Range-of-motion exercises',
    category: 'exercise',
    completed: false,
    reminderTime: '18:00',
    priority: 'medium',
  },
  {
    taskId: 'bj-task-6',
    name: 'Evening stretching',
    description: 'Gentle stretches before bed',
    category: 'exercise',
    completed: false,
    reminderTime: '21:00',
    priority: 'medium',
  },
];

// ============================================================================
// BONE & JOINT TESTS
// ============================================================================

export const BONE_JOINT_TESTS = [
  {
    name: 'Bone Density Test (DEXA)',
    frequency: 'Every 2 years (50+ or at risk)',
    description: 'Measures bone strength',
    importance: 'Detect osteoporosis early',
  },
  {
    name: 'Vitamin D Level Test',
    frequency: 'Annually',
    description: 'Check Vitamin D status',
    importance: 'Essential for bone health',
  },
  {
    name: 'Calcium Level Test',
    frequency: 'As recommended',
    description: 'Check calcium in blood',
    importance: 'Monitor bone health',
  },
  {
    name: 'X-Ray or MRI',
    frequency: 'As needed',
    description: 'Imaging for joint issues',
    importance: 'Diagnose problems',
  },
  {
    name: 'Rheumatoid Factor Test',
    frequency: 'If symptoms present',
    description: 'Check for arthritis',
    importance: 'Early intervention',
  },
];

// ============================================================================
// WARNING SIGNS
// ============================================================================

export const BONE_JOINT_WARNING_SIGNS: WarningSign[] = [
  {
    signId: 'bj-warning-1',
    symptom: 'Sudden severe joint pain',
    action: 'Seek immediate medical attention',
    severity: 'critical',
    icon: 'alert-circle',
  },
  {
    signId: 'bj-warning-2',
    symptom: 'Joint swelling with fever',
    action: 'Go to emergency room',
    severity: 'critical',
    icon: 'medical',
  },
  {
    signId: 'bj-warning-3',
    symptom: 'Inability to move joint',
    action: 'Consult doctor immediately',
    severity: 'urgent',
    icon: 'warning',
  },
  {
    signId: 'bj-warning-4',
    symptom: 'Joint deformity or dislocation',
    action: 'Seek emergency care',
    severity: 'critical',
    icon: 'alert',
  },
  {
    signId: 'bj-warning-5',
    symptom: 'Persistent pain for 2+ weeks',
    action: 'Schedule orthopedic consultation',
    severity: 'caution',
    icon: 'information-circle',
  },
  {
    signId: 'bj-warning-6',
    symptom: 'Frequent fractures or bone breaks',
    action: 'Get bone density test',
    severity: 'urgent',
    icon: 'fitness',
  },
];

// ============================================================================
// PERSONALIZED SUGGESTIONS
// ============================================================================

export const getPersonalizedSuggestions = (
  concern: string
): PersonalizedSuggestions => {
  const suggestions: Record<string, PersonalizedSuggestions> = {
    pain: {
      food: [
        'Anti-inflammatory foods (turmeric, ginger)',
        'Omega-3 rich foods (salmon, walnuts)',
        'Reduce inflammatory foods (sugar, processed)',
        'Stay well hydrated',
      ],
      exercise: [
        'Low-impact exercises (swimming, cycling)',
        'Gentle yoga or tai chi',
        'Avoid high-impact activities',
        'Apply heat/ice as needed',
      ],
      mentalHealth: [
        'Pain management techniques',
        'Stress reduction',
        'Adequate sleep',
      ],
      lifestyle: [
        'Maintain healthy weight',
        'Use proper posture',
        'Consider physical therapy',
        'Take prescribed medications',
      ],
    },
    stiffness: {
      food: [
        'Vitamin D rich foods',
        'Calcium sources daily',
        'Anti-inflammatory diet',
        'Adequate protein intake',
      ],
      exercise: [
        'Daily stretching routine',
        'Range-of-motion exercises',
        'Warm up before activities',
        'Regular gentle movement',
      ],
      mentalHealth: [
        'Morning mobility routine',
        'Consistent sleep schedule',
        'Manage stress levels',
      ],
      lifestyle: [
        'Warm bath/shower in morning',
        'Keep joints warm',
        'Avoid prolonged sitting',
        'Ergonomic workspace',
      ],
    },
    flexibility: {
      food: [
        'Collagen-rich foods (bone broth)',
        'Vitamin C for collagen production',
        'Adequate protein',
        'Stay hydrated',
      ],
      exercise: [
        'Daily stretching (15-20 min)',
        'Yoga or Pilates',
        'Dynamic stretching exercises',
        'Gradual progression',
      ],
      mentalHealth: [
        'Patience with progress',
        'Consistent practice',
        'Mind-body connection',
      ],
      lifestyle: [
        'Stretch after warm-up',
        'Don\'t bounce while stretching',
        'Breathe deeply',
        'Regular flexibility training',
      ],
    },
    strength: {
      food: [
        'High protein diet (1.2-1.6g/kg)',
        'Calcium and Vitamin D',
        'Adequate calories',
        'Post-workout nutrition',
      ],
      exercise: [
        'Progressive resistance training',
        'Weight-bearing exercises',
        'Strength training 2-3x/week',
        'Include rest days',
      ],
      mentalHealth: [
        'Set realistic goals',
        'Track progress',
        'Stay motivated',
      ],
      lifestyle: [
        'Adequate recovery time',
        'Quality sleep (7-9 hours)',
        'Proper form over weight',
        'Consider trainer guidance',
      ],
    },
    general: {
      food: [
        'Balanced diet with calcium & Vitamin D',
        'Include anti-inflammatory foods',
        'Adequate protein',
        'Stay hydrated',
      ],
      exercise: [
        'Mix of cardio and strength',
        'Regular stretching',
        'Low-impact activities',
        'Stay active daily',
      ],
      mentalHealth: [
        'Manage stress',
        'Get quality sleep',
        'Maintain positive mindset',
      ],
      lifestyle: [
        'Maintain healthy weight',
        'Good posture',
        'Avoid smoking',
        'Regular health checkups',
      ],
    },
  };

  return suggestions[concern] || suggestions.general;
};

// ============================================================================
// EXERCISES FOR SPECIFIC JOINTS
// ============================================================================

export const JOINT_SPECIFIC_EXERCISES = {
  knee: [
    { exercise: 'Leg raises', reps: '10-15', icon: 'fitness-outline' },
    { exercise: 'Wall squats', reps: '10-12', icon: 'body-outline' },
    { exercise: 'Step-ups', reps: '8-10', icon: 'arrow-up-outline' },
    { exercise: 'Hamstring curls', reps: '10-15', icon: 'repeat-outline' },
  ],
  shoulder: [
    { exercise: 'Arm circles', reps: '10 each way', icon: 'sync-outline' },
    { exercise: 'Wall push-ups', reps: '8-10', icon: 'hand-left-outline' },
    { exercise: 'Shoulder shrugs', reps: '12-15', icon: 'arrow-up-outline' },
    { exercise: 'Pendulum swings', reps: '10 each', icon: 'infinite-outline' },
  ],
  back: [
    { exercise: 'Cat-cow stretch', reps: '10-12', icon: 'paw-outline' },
    { exercise: 'Bridge pose', reps: '10-12', icon: 'fitness-outline' },
    { exercise: 'Knee-to-chest', reps: '8-10', icon: 'body-outline' },
    { exercise: 'Bird dog', reps: '10 each side', icon: 'paw-outline' },
  ],
  hip: [
    { exercise: 'Hip circles', reps: '10 each way', icon: 'sync-outline' },
    { exercise: 'Clamshells', reps: '12-15', icon: 'ellipse-outline' },
    { exercise: 'Hip flexor stretch', reps: 'Hold 30s', icon: 'time-outline' },
    { exercise: 'Side leg raises', reps: '10-12', icon: 'trending-up-outline' },
  ],
};

// ============================================================================
// SUPPLEMENTS
// ============================================================================

export const BONE_JOINT_SUPPLEMENTS = [
  { name: 'Calcium', dosage: '1000-1200mg/day', benefit: 'Bone strength' },
  { name: 'Vitamin D', dosage: '600-800 IU/day', benefit: 'Calcium absorption' },
  { name: 'Vitamin K2', dosage: '90-120mcg/day', benefit: 'Bone mineralization' },
  { name: 'Magnesium', dosage: '300-400mg/day', benefit: 'Bone density' },
  { name: 'Glucosamine', dosage: '1500mg/day', benefit: 'Joint cartilage' },
  { name: 'Chondroitin', dosage: '1200mg/day', benefit: 'Joint health' },
  { name: 'Omega-3', dosage: '1000-2000mg/day', benefit: 'Anti-inflammatory' },
  { name: 'Collagen', dosage: '10g/day', benefit: 'Joint support' },
];

// ============================================================================
// POSTURE TIPS
// ============================================================================

export const POSTURE_TIPS = [
  { tip: 'Keep shoulders back', icon: 'body-outline', area: 'Upper body' },
  { tip: 'Align ears over shoulders', icon: 'ear-outline', area: 'Neck' },
  { tip: 'Engage core muscles', icon: 'fitness-outline', area: 'Core' },
  { tip: 'Feet flat on floor', icon: 'footsteps-outline', area: 'Lower body' },
  { tip: 'Screen at eye level', icon: 'desktop-outline', area: 'Workspace' },
  { tip: 'Take movement breaks', icon: 'walk-outline', area: 'Activity' },
];
