// constants/childCareData.ts
// Child Care module data and configurations
// Last Updated: December 16, 2025 - ✅ UPDATED: Vaccination schedule format aligned with desktop

import { DailyTask, Vaccination } from '../types/wellness';

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

// Daily tasks by age range (used as fallback when no custom tasks)
export const DAILY_TASKS_BY_AGE: Record<string, DailyTask[]> = {
  '0-6': [
    { taskId: 'feeding-1', name: 'Morning feed', category: 'feeding', completed: false, priority: 'high', emoji: '🍼' },
    { taskId: 'diaper-1', name: 'Diaper changes (6-8 times)', category: 'hygiene', completed: false, priority: 'high', emoji: '🧷' },
    { taskId: 'tummy-time', name: 'Tummy time (5-10 min)', category: 'activity', completed: false, priority: 'medium', emoji: '🤸' },
    { taskId: 'bath', name: 'Bath time', category: 'hygiene', completed: false, priority: 'medium', emoji: '🛁' },
    { taskId: 'sleep-track', name: 'Track sleep schedule', category: 'sleep', completed: false, priority: 'high', emoji: '😴' },
  ],
  '6-12': [
    { taskId: 'feeding-2', name: 'Solid food introduction', category: 'feeding', completed: false, priority: 'high', emoji: '🥄' },
    { taskId: 'playtime', name: 'Interactive playtime', category: 'activity', completed: false, priority: 'high', emoji: '🧸' },
    { taskId: 'diaper-2', name: 'Diaper changes', category: 'hygiene', completed: false, priority: 'high', emoji: '🧷' },
    { taskId: 'reading', name: 'Reading/story time', category: 'learning', completed: false, priority: 'medium', emoji: '📖' },
    { taskId: 'outdoor', name: 'Outdoor time', category: 'activity', completed: false, priority: 'medium', emoji: '🌳' },
  ],
  '12-24': [
    { taskId: 'meals', name: 'Regular meals (3 times)', category: 'feeding', completed: false, priority: 'high', emoji: '🍽️' },
    { taskId: 'snacks', name: 'Healthy snacks (2 times)', category: 'feeding', completed: false, priority: 'medium', emoji: '🍎' },
    { taskId: 'active-play', name: 'Active play (running, climbing)', category: 'activity', completed: false, priority: 'high', emoji: '⚽' },
    { taskId: 'learning-activity', name: 'Learning activity', category: 'learning', completed: false, priority: 'medium', emoji: '🎨' },
    { taskId: 'bedtime-routine', name: 'Bedtime routine', category: 'sleep', completed: false, priority: 'high', emoji: '🌙' },
  ],
  '24+': [
    { taskId: 'balanced-meals', name: 'Balanced meals', category: 'feeding', completed: false, priority: 'high', emoji: '🥗' },
    { taskId: 'educational-activity', name: 'Educational activity', category: 'learning', completed: false, priority: 'high', emoji: '📚' },
    { taskId: 'physical-activity', name: 'Physical activity (1 hour)', category: 'activity', completed: false, priority: 'high', emoji: '🏃' },
    { taskId: 'social-interaction', name: 'Social playtime', category: 'social', completed: false, priority: 'medium', emoji: '👫' },
    { taskId: 'screen-time-limit', name: 'Limit screen time', category: 'health', completed: false, priority: 'medium', emoji: '📱' },
  ],
};

// ✅ UPDATED: Vaccination schedule (aligned with desktop format)
// Uses id, name, ageInWeeks, ageDescription structure
export const VACCINATION_SCHEDULE: Vaccination[] = [
  { id: 'bcg_opv0_hepb1', name: 'BCG, OPV 0, Hep B 1', ageInWeeks: 0, ageDescription: 'Birth' },
  { id: 'dtp1_ipv1_hib1_hepb2', name: 'DTP 1, IPV 1, Hib 1, Hep B 2', ageInWeeks: 6, ageDescription: '6 Weeks' },
  { id: 'dtp2_ipv2_hib2', name: 'DTP 2, IPV 2, Hib 2', ageInWeeks: 10, ageDescription: '10 Weeks' },
  { id: 'dtp3_ipv3_hib3_rota3', name: 'DTP 3, IPV 3, Hib 3, Rota 3', ageInWeeks: 14, ageDescription: '14 Weeks' },
  { id: 'flu1', name: 'Influenza 1', ageInWeeks: 26, ageDescription: '6 Months' },
  { id: 'mmr1', name: 'Measles, MMR 1', ageInWeeks: 39, ageDescription: '9 Months' },
  { id: 'hib_booster_varicella1', name: 'Hib Booster, Varicella 1', ageInWeeks: 65, ageDescription: '12–15 Months' },
  { id: 'dtp_b1_ipv_b', name: 'DTP Booster 1, IPV Booster', ageInWeeks: 78, ageDescription: '1.5 Years' },
  { id: 'dtp_b2_mmr2_varicella2', name: 'DTP Booster 2, MMR 2, Varicella 2', ageInWeeks: 234, ageDescription: '4–6 Years' },
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
  // Find the milestone that matches or is closest to the age (descending order)
  for (let i = DEVELOPMENTAL_MILESTONES.length - 1; i >= 0; i--) {
    if (ageInMonths >= DEVELOPMENTAL_MILESTONES[i].ageMonths) {
      return DEVELOPMENTAL_MILESTONES[i];
    }
  }
  return DEVELOPMENTAL_MILESTONES[0];
}

export function calculateAgeInMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  return Math.max(0, months);
}

// ✅ NEW: Calculate age in weeks from birth date
export function calculateAgeInWeeks(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birth.getTime());
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  return diffWeeks;
}

// ✅ NEW: Get vaccine status based on child's age
export function getVaccineStatus(
  vaccine: Vaccination,
  childAgeInWeeks: number,
  vaccinationRecord: { [vaccineId: string]: 'Completed' | 'Missed' }
): 'Completed' | 'Upcoming' | 'Pending' | 'Missed' {
  // Check if manually marked
  if (vaccinationRecord[vaccine.id] === 'Completed') {
    return 'Completed';
  }
  if (vaccinationRecord[vaccine.id] === 'Missed') {
    return 'Missed';
  }

  // Calculate status based on age
  const weeksDifference = childAgeInWeeks - vaccine.ageInWeeks;
  
  if (weeksDifference < -4) {
    // More than 4 weeks before due date
    return 'Upcoming';
  } else if (weeksDifference >= -4 && weeksDifference <= 4) {
    // Within 4 weeks window (before or after)
    return 'Pending';
  } else {
    // More than 4 weeks overdue
    return 'Missed';
  }
}
