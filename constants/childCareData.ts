// constants/childCareData.ts
// Child Care module data and configurations
// Last Updated: December 11, 2025 - FIXED

import { DailyTask } from '../types/wellness';

// Age milestones (in months)
export const AGE_MILESTONES = {
  0: { range: '0-3 months', label: 'Newborn', icon: '👶' },
  3: { range: '3-6 months', label: 'Infant', icon: '👶' },
  6: { range: '6-12 months', label: 'Baby', icon: '🍼' },
  12: { range: '1-2 years', label: 'Toddler', icon: '👧' },
  24: { range: '2-3 years', label: 'Young Child', icon: '👦' },
  36: { range: '3-5 years', label: 'Preschooler', icon: '🧒' },
  60: { range: '5+ years', label: 'School Age', icon: '🎒' },
};

// Developmental milestones by age range
export const DEVELOPMENTAL_MILESTONES = [
  {
    ageMonths: 0,
    range: '0-3 months',
    physical: ['Lifts head during tummy time', 'Opens and closes hands', 'Tracks objects with eyes'],
    cognitive: ['Recognizes familiar faces', 'Responds to sounds', 'Shows interest in surroundings'],
    social: ['Smiles at people', 'Enjoys playing', 'Tries to look at parents'],
  },
  {
    ageMonths: 3,
    range: '3-6 months',
    physical: ['Rolls over', 'Sits with support', 'Reaches for toys'],
    cognitive: ['Responds to own name', 'Shows curiosity', 'Explores with hands and mouth'],
    social: ['Laughs', 'Babbles', 'Recognizes familiar people'],
  },
  {
    ageMonths: 6,
    range: '6-12 months',
    physical: ['Sits without support', 'Crawls', 'Stands with support', 'May start walking'],
    cognitive: ['Finds hidden objects', 'Explores in different ways', 'Puts things in container'],
    social: ['Afraid of strangers', 'Favorite toys', 'Understands "no"'],
  },
  {
    ageMonths: 12,
    range: '1-2 years',
    physical: ['Walks alone', 'Runs', 'Climbs stairs', 'Kicks ball'],
    cognitive: ['Points to objects', 'Knows names of people', 'Says several single words'],
    social: ['Shows defiance', 'Plays mainly beside others', 'Shows affection'],
  },
  {
    ageMonths: 24,
    range: '2-3 years',
    physical: ['Runs easily', 'Climbs well', 'Pedals tricycle'],
    cognitive: ['Follows 2-3 step instructions', 'Names most familiar things', 'Completes simple puzzles'],
    social: ['Copies adults and friends', 'Shows affection without prompting', 'Takes turns in games'],
  },
  {
    ageMonths: 36,
    range: '3-5 years',
    physical: ['Hops and skips', 'Catches a bouncing ball', 'Uses fork and spoon well'],
    cognitive: ['Counts to 10', 'Knows colors and shapes', 'Tells stories'],
    social: ['Wants to please friends', 'More independent', 'Understands rules'],
  },
];

// Daily tasks by age range - FIXED: Changed title to name
export const DAILY_TASKS_BY_AGE: Record<string, DailyTask[]> = {
  '0-6': [
    { taskId: 'feeding-1', name: 'Morning feed', category: 'feeding', completed: false, priority: 'high' },
    { taskId: 'diaper-1', name: 'Diaper changes (6-8 times)', category: 'hygiene', completed: false, priority: 'high' },
    { taskId: 'tummy-time', name: 'Tummy time (5-10 min)', category: 'activity', completed: false, priority: 'medium' },
    { taskId: 'bath', name: 'Bath time', category: 'hygiene', completed: false, priority: 'medium' },
    { taskId: 'sleep-track', name: 'Track sleep schedule', category: 'sleep', completed: false, priority: 'high' },
  ],
  '6-12': [
    { taskId: 'feeding-2', name: 'Solid food introduction', category: 'feeding', completed: false, priority: 'high' },
    { taskId: 'playtime', name: 'Interactive playtime', category: 'activity', completed: false, priority: 'high' },
    { taskId: 'diaper-2', name: 'Diaper changes', category: 'hygiene', completed: false, priority: 'high' },
    { taskId: 'reading', name: 'Reading/story time', category: 'learning', completed: false, priority: 'medium' },
    { taskId: 'outdoor', name: 'Outdoor time', category: 'activity', completed: false, priority: 'medium' },
  ],
  '12-24': [
    { taskId: 'meals', name: 'Regular meals (3 times)', category: 'feeding', completed: false, priority: 'high' },
    { taskId: 'snacks', name: 'Healthy snacks (2 times)', category: 'feeding', completed: false, priority: 'medium' },
    { taskId: 'active-play', name: 'Active play (running, climbing)', category: 'activity', completed: false, priority: 'high' },
    { taskId: 'learning-activity', name: 'Learning activity', category: 'learning', completed: false, priority: 'medium' },
    { taskId: 'bedtime-routine', name: 'Bedtime routine', category: 'sleep', completed: false, priority: 'high' },
  ],
  '24+': [
    { taskId: 'balanced-meals', name: 'Balanced meals', category: 'feeding', completed: false, priority: 'high' },
    { taskId: 'educational-activity', name: 'Educational activity', category: 'learning', completed: false, priority: 'high' },
    { taskId: 'physical-activity', name: 'Physical activity (1 hour)', category: 'activity', completed: false, priority: 'high' },
    { taskId: 'social-interaction', name: 'Social playtime', category: 'social', completed: false, priority: 'medium' },
    { taskId: 'screen-time-limit', name: 'Limit screen time', category: 'health', completed: false, priority: 'medium' },
  ],
};

// Vaccination schedule
export const VACCINATION_SCHEDULE = [
  { age: 'Birth', vaccines: ['Hepatitis B (1st dose)', 'BCG', 'OPV 0'] },
  { age: '6 weeks', vaccines: ['DTaP 1', 'IPV 1', 'Hib 1', 'PCV 1', 'Rotavirus 1'] },
  { age: '10 weeks', vaccines: ['DTaP 2', 'IPV 2', 'Hib 2', 'PCV 2', 'Rotavirus 2'] },
  { age: '14 weeks', vaccines: ['DTaP 3', 'IPV 3', 'Hib 3', 'PCV 3', 'Rotavirus 3'] },
  { age: '6 months', vaccines: ['Hepatitis B (3rd dose)', 'Influenza (annual)'] },
  { age: '9 months', vaccines: ['MMR 1'] },
  { age: '12 months', vaccines: ['Hepatitis A 1', 'Varicella 1', 'PCV 4'] },
  { age: '15 months', vaccines: ['MMR 2', 'Varicella 2', 'DTaP 4'] },
  { age: '18 months', vaccines: ['Hepatitis A 2'] },
  { age: '4-6 years', vaccines: ['DTaP 5', 'IPV 4', 'MMR 3'] },
];

// Feeding guidelines by age
export const FEEDING_GUIDELINES = {
  '0-6': {
    primary: 'Breast milk or formula only',
    frequency: '8-12 times per day (on demand)',
    notes: 'No water, juice, or solid foods yet',
  },
  '6-12': {
    primary: 'Breast milk/formula + solid foods',
    frequency: '4-6 milk feeds + 2-3 solid meals',
    notes: 'Introduce iron-rich foods, single ingredients first',
  },
  '12-24': {
    primary: 'Family foods + milk',
    frequency: '3 meals + 2 snacks + milk',
    notes: 'Whole milk until age 2, avoid choking hazards',
  },
  '24+': {
    primary: 'Balanced family meals',
    frequency: '3 meals + 2 healthy snacks',
    notes: 'Variety of foods, limit sugar and processed foods',
  },
};

// Warning signs by age
export const CHILD_CARE_WARNING_SIGNS = [
  {
    category: 'Immediate Emergency',
    emoji: '🚨',
    signs: [
      'Difficulty breathing or blue lips',
      'Severe vomiting or diarrhea (dehydration)',
      'High fever (above 104°F) that won\'t go down',
      'Seizure or loss of consciousness',
      'Severe allergic reaction (swelling, rash)',
    ],
  },
  {
    category: 'Contact Doctor Soon',
    emoji: '⚠️',
    signs: [
      'Fever lasting more than 3 days',
      'Persistent crying (inconsolable)',
      'Not eating or drinking',
      'Rash that doesn\'t fade when pressed',
      'Unusual lethargy or irritability',
    ],
  },
  {
    category: 'Developmental Concerns',
    emoji: '📊',
    signs: [
      'Not meeting age milestones',
      'Loss of previously acquired skills',
      'No eye contact or social interaction',
      'Not responding to name by 12 months',
      'No single words by 16 months',
    ],
  },
];

// Helper functions
export function getAgeGroup(ageInMonths: number): string {
  if (ageInMonths < 6) return '0-6';
  if (ageInMonths < 12) return '6-12';
  if (ageInMonths < 24) return '12-24';
  return '24+';
}

export function getDailyTasksForAge(ageInMonths: number): DailyTask[] {
  const ageGroup = getAgeGroup(ageInMonths);
  return DAILY_TASKS_BY_AGE[ageGroup] || [];
}

export function getMilestoneForAge(ageInMonths: number) {
  const milestone = DEVELOPMENTAL_MILESTONES.find((m) => ageInMonths >= m.ageMonths);
  return milestone || DEVELOPMENTAL_MILESTONES[0];
}

export function calculateAgeInMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  return Math.max(0, months);
}
