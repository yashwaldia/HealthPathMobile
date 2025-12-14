// constants/motherCareData.ts
// Mother Care Module Specific Data
// Last Updated: December 11, 2025 - FIXED taskName to name

import {
  PregnancyMilestone,
  TrimesterData,
  PersonalizedSuggestions,
  WarningSSign,
  MedicalReminder,
  DailyTask,
} from '../types/wellness';

// ============================================================================
// PREGNANCY MILESTONES (Week-by-week data)
// ============================================================================

export const PREGNANCY_MILESTONES: Record<number, PregnancyMilestone> = {
  4: {
    week: 4,
    babySize: 'poppy seed',
    babySizeEmoji: '🌱',
    development: 'Embryo implantation occurs. Neural tube begins forming.',
    motherChanges: 'You may not notice any changes yet.',
  },
  5: {
    week: 5,
    babySize: 'sesame seed',
    babySizeEmoji: '🌾',
    development: 'Heart and circulatory system begin to form.',
    motherChanges: 'Missed period. Possible early pregnancy symptoms.',
  },
  6: {
    week: 6,
    babySize: 'lentil',
    babySizeEmoji: '🫘',
    development: 'Heart begins to beat. Facial features starting to develop.',
    motherChanges: 'Morning sickness may begin. Breast tenderness.',
  },
  8: {
    week: 8,
    babySize: 'kidney bean',
    babySizeEmoji: '🫘',
    development: 'All essential organs have begun to form. Baby makes spontaneous movements.',
    motherChanges: 'Fatigue and nausea may increase. Frequent urination.',
  },
  10: {
    week: 10,
    babySize: 'prune',
    babySizeEmoji: '🫐',
    development: 'Fingers and toes are no longer webbed. Bones and cartilage forming.',
    motherChanges: 'Mood swings common. Visible baby bump may start showing.',
  },
  12: {
    week: 12,
    babySize: 'plum',
    babySizeEmoji: '🍑',
    development: 'All vital organs are formed and functioning. Baby can make tiny movements.',
    motherChanges: 'Morning sickness may ease. Energy levels improving.',
  },
  16: {
    week: 16,
    babySize: 'avocado',
    babySizeEmoji: '🥑',
    development: 'Baby can hear sounds. Eyes can move. Skeleton hardening.',
    motherChanges: 'You may feel the first flutters of movement. Appetite increasing.',
  },
  20: {
    week: 20,
    babySize: 'banana',
    babySizeEmoji: '🍌',
    development: 'Baby is very active. Can swallow and produce meconium.',
    motherChanges: 'Baby bump clearly visible. You can feel baby movements regularly.',
  },
  24: {
    week: 24,
    babySize: 'corn',
    babySizeEmoji: '🌽',
    development: 'Lungs are developing. Baby responds to sounds.',
    motherChanges: 'Possible backache. Increased appetite.',
  },
  28: {
    week: 28,
    babySize: 'eggplant',
    babySizeEmoji: '🍆',
    development: 'Eyes can open and close. Sleep-wake cycles developing.',
    motherChanges: 'Third trimester begins. More frequent urination. Braxton Hicks contractions may start.',
  },
  32: {
    week: 32,
    babySize: 'coconut',
    babySizeEmoji: '🥥',
    development: 'Baby practicing breathing movements. Gaining weight rapidly.',
    motherChanges: 'Shortness of breath. Difficulty sleeping.',
  },
  36: {
    week: 36,
    babySize: 'papaya',
    babySizeEmoji: '🫛',
    development: 'Baby is head-down. Lungs nearly mature.',
    motherChanges: 'Increased pelvic pressure. Frequent bathroom trips.',
  },
  40: {
    week: 40,
    babySize: 'watermelon',
    babySizeEmoji: '🍉',
    development: 'Baby is fully developed and ready for birth!',
    motherChanges: 'Due date! Watch for signs of labor.',
  },
};

// Fill in remaining weeks (simplified version - you can expand later)
for (let week = 1; week <= 40; week++) {
  if (!PREGNANCY_MILESTONES[week]) {
    PREGNANCY_MILESTONES[week] = {
      week,
      babySize: 'developing',
      babySizeEmoji: '👶',
      development: `Week ${week} of pregnancy. Baby continues to grow and develop.`,
      motherChanges: 'Your body is adapting to pregnancy changes.',
    };
  }
}

// ============================================================================
// TRIMESTER DATA
// ============================================================================

export const TRIMESTER_DATA: TrimesterData[] = [
  {
    trimester: 1,
    weekRange: [1, 13],
    focus: ['Prenatal vitamins', 'Folic acid intake', 'Avoid harmful substances', 'Rest'],
    commonSymptoms: ['Nausea', 'Fatigue', 'Breast tenderness', 'Frequent urination', 'Mood swings'],
    nutritionTips: [
      'Take folic acid (400-600mcg daily)',
      'Eat small, frequent meals',
      'Stay hydrated (8-10 glasses water)',
      'Include iron-rich foods (spinach, lentils)',
      'Avoid raw/undercooked foods',
    ],
    exerciseTips: [
      'Light walking (20-30 minutes)',
      'Prenatal yoga',
      'Avoid high-impact activities',
      'Listen to your body',
    ],
    warningSign: [
      'Heavy vaginal bleeding',
      'Severe abdominal pain',
      'Severe nausea preventing eating/drinking',
      'Fever above 100.4°F',
    ],
  },
  {
    trimester: 2,
    weekRange: [14, 27],
    focus: ['Balanced diet', 'Regular exercise', 'Monitor baby movements', 'Prenatal appointments'],
    commonSymptoms: ['Backache', 'Leg cramps', 'Increased energy', 'Visible baby bump', 'Baby movements'],
    nutritionTips: [
      'Increase protein intake (70-100g daily)',
      'Include calcium-rich foods (milk, paneer, almonds)',
      'Omega-3 fatty acids (walnuts, chia seeds)',
      'Complex carbs (whole grains, oats)',
      'Continue iron and folic acid supplements',
    ],
    exerciseTips: [
      '30 minutes moderate activity daily',
      'Swimming (excellent low-impact exercise)',
      'Prenatal yoga and stretching',
      'Pelvic floor exercises',
      'Avoid exercises lying flat on back',
    ],
    warningSign: [
      'Vaginal bleeding or fluid leak',
      'Severe or persistent headache',
      'Sudden swelling of face/hands',
      'Decreased baby movements',
    ],
  },
  {
    trimester: 3,
    weekRange: [28, 40],
    focus: ['Birth preparation', 'Baby positioning', 'Hospital bag', 'Labor signs awareness'],
    commonSymptoms: ['Shortness of breath', 'Frequent urination', 'Braxton Hicks', 'Fatigue', 'Swelling'],
    nutritionTips: [
      'Small, frequent meals (6-7 times)',
      'Avoid spicy/greasy foods',
      'Dates consumption (after 36 weeks)',
      'Stay hydrated',
      'Continue prenatal vitamins',
    ],
    exerciseTips: [
      'Walking (helps with labor)',
      'Pelvic tilts and squats',
      'Breathing exercises',
      'Perineal massage (after 34 weeks)',
      'Avoid strenuous activities',
    ],
    warningSign: [
      'Regular painful contractions before 37 weeks',
      'Water breaking',
      'Heavy bleeding',
      'Severe headache with vision changes',
      'No baby movements for several hours',
    ],
  },
];

// ============================================================================
// DAILY TASKS TEMPLATES (by Trimester)
// ============================================================================

export const DAILY_TASKS_TRIMESTER_1: DailyTask[] = [
  {
    taskId: 't1-task-1',
    name: 'Take prenatal vitamin with folic acid',
    description: '400-600mcg folic acid daily',
    category: 'medication',
    completed: false,
    priority: 'high',
    reminderTime: '09:00',
  },
  {
    taskId: 't1-task-2',
    name: 'Drink 8 glasses of water',
    description: 'Stay hydrated throughout the day',
    category: 'nutrition',
    completed: false,
    priority: 'high',
    reminderTime: '10:00',
  },
  {
    taskId: 't1-task-3',
    name: 'Eat protein-rich snack',
    description: 'Roasted chana, nuts, or boiled eggs',
    category: 'nutrition',
    completed: false,
    priority: 'medium',
    reminderTime: '16:00',
  },
  {
    taskId: 't1-task-4',
    name: '20-minute walk',
    description: 'Light exercise to boost energy',
    category: 'exercise',
    completed: false,
    priority: 'medium',
    reminderTime: '18:00',
  },
  {
    taskId: 't1-task-5',
    name: 'Track mood and symptoms',
    description: 'Note any nausea, fatigue, or concerns',
    category: 'activity',
    completed: false,
    priority: 'low',
    reminderTime: '21:00',
  },
];

export const DAILY_TASKS_TRIMESTER_2: DailyTask[] = [
  {
    taskId: 't2-task-1',
    name: 'Take prenatal vitamin',
    category: 'medication',
    completed: false,
    priority: 'high',
    reminderTime: '09:00',
  },
  {
    taskId: 't2-task-2',
    name: 'Drink 10 glasses of water',
    category: 'nutrition',
    completed: false,
    priority: 'high',
    reminderTime: '10:00',
  },
  {
    taskId: 't2-task-3',
    name: 'Eat calcium-rich food',
    description: 'Milk, paneer, yogurt, or almonds',
    category: 'nutrition',
    completed: false,
    priority: 'high',
    reminderTime: '12:00',
  },
  {
    taskId: 't2-task-4',
    name: '30-minute moderate exercise',
    description: 'Walking, swimming, or prenatal yoga',
    category: 'exercise',
    completed: false,
    priority: 'high',
    reminderTime: '17:00',
  },
  {
    taskId: 't2-task-5',
    name: 'Monitor baby movements',
    description: 'Note when you feel kicks or flutters',
    category: 'activity',
    completed: false,
    priority: 'high',
    reminderTime: '20:00',
  },
  {
    taskId: 't2-task-6',
    name: 'Pelvic floor exercises',
    description: '10 minutes of Kegel exercises',
    category: 'exercise',
    completed: false,
    priority: 'medium',
    reminderTime: '21:00',
  },
];

export const DAILY_TASKS_TRIMESTER_3: DailyTask[] = [
  {
    taskId: 't3-task-1',
    name: 'Take prenatal vitamin',
    category: 'medication',
    completed: false,
    priority: 'high',
    reminderTime: '09:00',
  },
  {
    taskId: 't3-task-2',
    name: 'Drink water regularly',
    description: 'Aim for 10-12 glasses',
    category: 'nutrition',
    completed: false,
    priority: 'high',
    reminderTime: '10:00',
  },
  {
    taskId: 't3-task-3',
    name: 'Eat small, frequent meals',
    description: '6-7 meals throughout the day',
    category: 'nutrition',
    completed: false,
    priority: 'high',
  },
  {
    taskId: 't3-task-4',
    name: 'Walking (20-30 minutes)',
    description: 'Helps with labor preparation',
    category: 'exercise',
    completed: false,
    priority: 'high',
    reminderTime: '18:00',
  },
  {
    taskId: 't3-task-5',
    name: 'Track baby movements',
    description: 'Count kicks - should feel 10 in 2 hours',
    category: 'activity',
    completed: false,
    priority: 'high',
    reminderTime: '20:00',
  },
  {
    taskId: 't3-task-6',
    name: 'Breathing exercises',
    description: 'Practice for labor',
    category: 'mindfulness',
    completed: false,
    priority: 'medium',
    reminderTime: '21:00',
  },
  {
    taskId: 't3-task-7',
    name: 'Check hospital bag',
    description: 'Ensure everything is packed',
    category: 'activity',
    completed: false,
    priority: 'medium',
  },
];

// ============================================================================
// MEDICAL REMINDERS TEMPLATE
// ============================================================================

export const MEDICAL_REMINDERS_TEMPLATE: MedicalReminder[] = [
  {
    reminderId: 'med-1',
    title: 'First trimester screening',
    description: 'NT scan and blood tests',
    dueDate: '',
    dueDateRange: '11-14 weeks',
    urgency: 'upcoming',
    completed: false,
  },
  {
    reminderId: 'med-2',
    title: 'Anomaly scan (Level 2)',
    description: 'Detailed ultrasound to check baby development',
    dueDate: '',
    dueDateRange: '18-22 weeks',
    urgency: 'upcoming',
    completed: false,
  },
  {
    reminderId: 'med-3',
    title: 'Glucose tolerance test',
    description: 'Test for gestational diabetes',
    dueDate: '',
    dueDateRange: '24-28 weeks',
    urgency: 'upcoming',
    completed: false,
  },
  {
    reminderId: 'med-4',
    title: 'Group B Strep test',
    description: 'Vaginal swab test',
    dueDate: '',
    dueDateRange: '35-37 weeks',
    urgency: 'upcoming',
    completed: false,
  },
];

// ============================================================================
// WARNING SIGNS (Mother Care Specific)
// ============================================================================

export const MOTHER_CARE_WARNING_SIGNS: WarningSSign[] = [
  {
    signId: 'mc-warning-1',
    symptom: 'Severe abdominal pain',
    action: 'Contact your healthcare provider immediately',
    severity: 'critical',
    icon: 'alert-circle',
  },
  {
    signId: 'mc-warning-2',
    symptom: 'Heavy vaginal bleeding',
    action: 'Seek medical attention right away',
    severity: 'critical',
    icon: 'medical',
  },
  {
    signId: 'mc-warning-3',
    symptom: 'Severe dizziness or fainting',
    action: 'Contact your healthcare provider',
    severity: 'urgent',
    icon: 'warning',
  },
  {
    signId: 'mc-warning-4',
    symptom: 'Sudden severe headache with vision changes',
    action: 'Call your doctor immediately - possible preeclampsia',
    severity: 'critical',
    icon: 'eye-off',
  },
  {
    signId: 'mc-warning-5',
    symptom: 'No baby movements for several hours (after 28 weeks)',
    action: 'Contact your healthcare provider immediately',
    severity: 'critical',
    icon: 'time',
  },
  {
    signId: 'mc-warning-6',
    symptom: 'Gush of fluid from vagina',
    action: 'Call your doctor - your water may have broken',
    severity: 'urgent',
    icon: 'water',
  },
  {
    signId: 'mc-warning-7',
    symptom: 'Regular painful contractions before 37 weeks',
    action: 'Contact your healthcare provider - possible preterm labor',
    severity: 'critical',
    icon: 'pulse',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getMilestoneForWeek = (week: number): PregnancyMilestone => {
  return PREGNANCY_MILESTONES[week] || PREGNANCY_MILESTONES[1];
};

export const getTrimesterFromWeek = (week: number): 1 | 2 | 3 => {
  if (week <= 13) return 1;
  if (week <= 27) return 2;
  return 3;
};

export const getTrimesterData = (trimester: 1 | 2 | 3): TrimesterData => {
  return TRIMESTER_DATA[trimester - 1];
};

export const getDailyTasksForTrimester = (trimester: 1 | 2 | 3): DailyTask[] => {
  switch (trimester) {
    case 1:
      return DAILY_TASKS_TRIMESTER_1;
    case 2:
      return DAILY_TASKS_TRIMESTER_2;
    case 3:
      return DAILY_TASKS_TRIMESTER_3;
    default:
      return DAILY_TASKS_TRIMESTER_1;
  }
};

// Calculate weeks and days between two dates
export const calculatePregnancyAge = (lmpDate: string): { weeks: number; days: number; totalDays: number } => {
  const lmp = new Date(lmpDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lmp.getTime());
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { weeks, days, totalDays };
};

// Calculate estimated due date (EDD = LMP + 280 days)
export const calculateDueDate = (lmpDate: string): string => {
  const lmp = new Date(lmpDate);
  lmp.setDate(lmp.getDate() + 280);
  return lmp.toISOString().split('T')[0];
};
