// constants/gutHealthData.ts
// Data for Gut Health Wellness Module
// Last Updated: December 13, 2025 – Enhanced condition-based static suggestions

import { DailyTask, PersonalizedSuggestions, WarningSSign } from '../types/wellness';

// Normalize suggestions so all arrays are always present
const normalizeSuggestions = (s: PersonalizedSuggestions): Required<PersonalizedSuggestions> => ({
  food: s.food ?? [],
  exercise: s.exercise ?? [],
  mentalHealth: s.mentalHealth ?? [],
  lifestyle: s.lifestyle ?? [],
});

// ============================================================================
// GUT CONCERNS & DIET TYPES
// ============================================================================

export const GUT_CONCERNS = [
  { label: 'Bloating', value: 'bloating' },
  { label: 'Acidity', value: 'acidity' },
  { label: 'IBS (Irritable Bowel Syndrome)', value: 'ibs' },
  { label: 'Constipation', value: 'constipation' },
  { label: 'General Health', value: 'general' },
];

export const DIET_TYPES = [
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Non-Vegetarian', value: 'non-vegetarian' },
  { label: 'Vegan', value: 'vegan' },
];

export const SEVERITY_LEVELS = [
  { label: 'Mild', value: 'mild' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Severe', value: 'severe' },
];

// ============================================================================
// DIGESTIVE HEALTH INDICATORS
// ============================================================================

export const DIGESTIVE_HEALTH_INDICATORS = {
  excellent: {
    range: 'Excellent',
    color: '#4CAF50',
    icon: 'happy-outline',
    description: 'Optimal digestion',
  },
  good: {
    range: 'Good',
    color: '#8BC34A',
    icon: 'checkmark-circle-outline',
    description: 'Healthy gut',
  },
  fair: {
    range: 'Fair',
    color: '#FFC107',
    icon: 'alert-circle-outline',
    description: 'Minor issues',
  },
  poor: {
    range: 'Poor',
    color: '#FF9800',
    icon: 'warning-outline',
    description: 'Needs attention',
  },
  critical: {
    range: 'Critical',
    color: '#F44336',
    icon: 'close-circle-outline',
    description: 'Requires medical care',
  },
};

// ============================================================================
// BENEFICIAL FOODS
// ============================================================================

export const GUT_FRIENDLY_FOODS = [
  { food: 'Yogurt', emoji: '🥛', benefit: 'Probiotics' },
  { food: 'Banana', emoji: '🍌', benefit: 'Fiber' },
  { food: 'Ginger', emoji: '🫚', benefit: 'Anti-inflammatory' },
  { food: 'Oats', emoji: '🌾', benefit: 'Soluble fiber' },
  { food: 'Papaya', emoji: '🍈', benefit: 'Digestive enzymes' },
  { food: 'Fennel', emoji: '🌿', benefit: 'Reduces bloating' },
  { food: 'Kefir', emoji: '🥛', benefit: 'Gut bacteria' },
  { food: 'Kimchi', emoji: '🥬', benefit: 'Fermented food' },
];

export const FOODS_TO_AVOID = [
  { food: 'Fried Foods', emoji: '🍟', reason: 'Hard to digest' },
  { food: 'Spicy Food', emoji: '🌶️', reason: 'Causes irritation' },
  { food: 'Carbonated Drinks', emoji: '🥤', reason: 'Gas & bloating' },
  { food: 'Processed Foods', emoji: '🍕', reason: 'Low in fiber' },
  { food: 'Dairy (if intolerant)', emoji: '🧀', reason: 'Digestive issues' },
  { food: 'Caffeine', emoji: '☕', reason: 'Acidity' },
];

// ============================================================================
// DAILY TASKS (BASE STATIC ROUTINE)
// ============================================================================

export const GUT_HEALTH_DAILY_TASKS: DailyTask[] = [
  {
    taskId: 'gh-task-1',
    name: 'Drink warm water in morning',
    description: 'Start day with warm water + lemon',
    category: 'nutrition',
    completed: false,
    reminderTime: '07:00',
    priority: 'high',
  },
  {
    taskId: 'gh-task-2',
    name: 'Eat probiotic-rich food',
    description: 'Yogurt, kefir, or fermented foods',
    category: 'nutrition',
    completed: false,
    reminderTime: '09:00',
    priority: 'high',
  },
  {
    taskId: 'gh-task-3',
    name: 'Include fiber in meals',
    description: '25-30g fiber throughout the day',
    category: 'nutrition',
    completed: false,
    reminderTime: '12:00',
    priority: 'medium',
  },
  {
    taskId: 'gh-task-4',
    name: 'Avoid late-night eating',
    description: 'Finish dinner 2-3 hours before bed',
    category: 'nutrition',
    completed: false,
    reminderTime: '20:00',
    priority: 'high',
  },
  {
    taskId: 'gh-task-5',
    name: '30-minute walk after meals',
    description: 'Light activity aids digestion',
    category: 'exercise',
    completed: false,
    reminderTime: '13:00',
    priority: 'medium',
  },
  {
    taskId: 'gh-task-6',
    name: 'Stress management practice',
    description: 'Meditation, yoga, or deep breathing',
    category: 'mindfulness',
    completed: false,
    reminderTime: '18:00',
    priority: 'medium',
  },
];

// ============================================================================
// DIGESTIVE HEALTH TESTS
// ============================================================================

export const GUT_HEALTH_TESTS = [
  {
    name: 'Stool Test',
    frequency: 'Annually or as needed',
    description: 'Check for parasites, bacteria',
    importance: 'Detect infections',
  },
  {
    name: 'Food Allergy/Intolerance Test',
    frequency: 'As needed',
    description: 'Identify trigger foods',
    importance: 'Avoid problematic foods',
  },
  {
    name: 'Colonoscopy',
    frequency: 'Every 5-10 years (50+)',
    description: 'Screen for colon health',
    importance: 'Early cancer detection',
  },
  {
    name: 'H. Pylori Test',
    frequency: 'If symptoms persist',
    description: 'Check for bacterial infection',
    importance: 'Treat ulcers',
  },
];

// ============================================================================
// WARNING SIGNS
// ============================================================================

export const GUT_HEALTH_WARNING_SIGNS: WarningSSign[] = [
  {
    signId: 'gh-warning-1',
    symptom: 'Severe abdominal pain',
    action: 'Seek immediate medical attention',
    severity: 'critical',
    icon: 'alert-circle',
  },
  {
    signId: 'gh-warning-2',
    symptom: 'Blood in stool',
    action: 'Consult doctor immediately',
    severity: 'critical',
    icon: 'medical',
  },
  {
    signId: 'gh-warning-3',
    symptom: 'Persistent vomiting or diarrhea',
    action: 'Get medical help to prevent dehydration',
    severity: 'urgent',
    icon: 'warning',
  },
  {
    signId: 'gh-warning-4',
    symptom: 'Unexplained weight loss',
    action: 'Schedule doctor appointment',
    severity: 'urgent',
    icon: 'fitness',
  },
  {
    signId: 'gh-warning-5',
    symptom: 'Chronic bloating for 2+ weeks',
    action: 'Consult gastroenterologist',
    severity: 'caution',
    icon: 'information-circle',
  },
  {
    signId: 'gh-warning-6',
    symptom: 'Difficulty swallowing',
    action: 'Seek medical evaluation',
    severity: 'urgent',
    icon: 'alert',
  },
];

// ============================================================================
// BASE PERSONALIZED SUGGESTIONS (BY CONCERN ONLY)
// ============================================================================

export const getPersonalizedSuggestions = (
  concern: string
): PersonalizedSuggestions => {
  const suggestions: Record<string, PersonalizedSuggestions> = {
    bloating: {
      food: [
        'Eat slowly and chew thoroughly',
        'Avoid carbonated beverages',
        'Include ginger and peppermint tea',
        'Reduce salt intake',
      ],
      exercise: [
        'Light walking after meals',
        'Yoga poses (child\'s pose, wind-relieving pose)',
        'Gentle abdominal exercises',
      ],
      mentalHealth: [
        'Practice mindful eating',
        'Manage stress levels',
        'Get adequate sleep',
      ],
      lifestyle: [
        'Eat smaller, frequent meals',
        'Avoid tight clothing',
        'Keep food diary to identify triggers',
        'Stay hydrated',
      ],
    },
    acidity: {
      food: [
        'Avoid spicy and fried foods',
        'Eat alkaline foods (banana, melons)',
        'Have smaller, more frequent meals',
        'Limit citrus and tomato-based foods',
      ],
      exercise: [
        'Light walking (not immediately after heavy meals)',
        'Gentle yoga and stretching',
        'Avoid high-intensity workouts right after eating',
      ],
      mentalHealth: [
        'Practice relaxation or breathing exercises',
        'Maintain a regular sleep schedule',
        'Avoid late-night snacking when stressed',
      ],
      lifestyle: [
        'Elevate head while sleeping',
        'Avoid lying down immediately after meals',
        'Quit smoking if applicable',
        'Reduce alcohol and caffeine intake',
      ],
    },
    ibs: {
      food: [
        'Follow a structured low-FODMAP approach if possible',
        'Increase soluble fiber gradually',
        'Identify and avoid personal trigger foods (dairy, gluten, etc.)',
        'Include probiotic-rich foods consistently',
      ],
      exercise: [
        'Aim for regular moderate exercise most days',
        'Use gentle yoga routines that focus on the abdomen',
        'Walk at least 30 minutes daily where possible',
      ],
      mentalHealth: [
        'Use stress management techniques regularly',
        'Consider CBT or similar approaches if symptoms are stress-linked',
        'Practice relaxation before bedtime',
      ],
      lifestyle: [
        'Maintain regular meal timings',
        'Keep a symptom and food diary',
        'Stay well hydrated across the day',
        'Avoid heavy, late-night meals',
      ],
    },
    constipation: {
      food: [
        'Increase fiber intake (around 25–30g/day)',
        'Drink 8–10 glasses of water daily',
        'Include prunes, figs, and other natural laxative fruits',
        'Prefer whole grains over refined options',
      ],
      exercise: [
        'Engage in regular physical activity',
        'Walk at least 30 minutes daily',
        'Add simple abdominal exercises if comfortable',
      ],
      mentalHealth: [
        'Avoid suppressing the urge to pass stool',
        'Create a calm, unhurried bathroom routine',
        'Use stress-reduction habits if anxiety worsens symptoms',
      ],
      lifestyle: [
        'Fix a regular toilet routine, especially in the morning',
        'Avoid delaying bowel movements when the urge comes',
        'Limit processed and low-fiber foods',
        'Consider probiotic supplements after professional advice',
      ],
    },
    general: {
      food: [
        'Aim for a balanced, fiber-rich diet daily',
        'Include some fermented foods for gut bacteria support',
        'Stay well hydrated through the day',
        'Eat slowly and mindfully without distractions',
      ],
      exercise: [
        'Maintain regular physical activity each week',
        'Take light walks after main meals',
        'Practice yoga or stretching for digestion support',
      ],
      mentalHealth: [
        'Use stress management techniques regularly',
        'Aim for 7–8 hours of quality sleep',
        'Practice mindful eating habits',
      ],
      lifestyle: [
        'Maintain consistent meal times',
        'Avoid frequent overeating or binge meals',
        'Limit highly processed packaged foods',
        'Schedule periodic health checkups if needed',
      ],
    },
  };

  return suggestions[concern] || suggestions.general;
};

// ============================================================================
// ENHANCED CONDITION-BASED HELPERS
// ============================================================================

// Diet-specific extra suggestions (still static)
type DietSpecificSuggestions = {
  vegetarian: string[];
  'non-vegetarian': string[];
  vegan: string[];
};

export const DIET_SPECIFIC_FOOD_IDEAS: DietSpecificSuggestions = {
  vegetarian: [
    'Use curd, buttermilk, and homemade pickles as probiotic sources',
    'Add lentils and beans gradually to increase fiber without bloating',
  ],
  'non-vegetarian': [
    'Prefer grilled or steamed lean meats instead of fried items',
    'Limit processed meats; focus on fresh, lightly cooked options',
  ],
  vegan: [
    'Use plant-based yogurt or kefir alternatives for probiotics',
    'Include chia seeds, flaxseeds, and oats to boost fiber intake',
  ],
};

// 1) Concern + severity → richer suggestions
export const getConcernSeveritySuggestions = (
  concern: string,
  severity: string
): PersonalizedSuggestions => {
  const base = normalizeSuggestions(getPersonalizedSuggestions(concern));

  const result: Required<PersonalizedSuggestions> = {
    food: [...base.food],
    exercise: [...base.exercise],
    mentalHealth: [...base.mentalHealth],
    lifestyle: [...base.lifestyle],
  };

  // Generic severity layers
  if (severity === 'moderate') {
    result.food.push('Be more consistent with gut-friendly choices across all meals');
    result.lifestyle.push('Track symptoms daily to notice what worsens or improves them');
  }

  if (severity === 'severe') {
    result.food.push('Avoid known trigger foods strictly for at least 2–3 weeks');
    result.lifestyle.push('Discuss persistent or worsening symptoms with a gastroenterologist');
    result.mentalHealth.push('Consider professional support if stress or anxiety is high');
  }

  // Concern-specific severity tweaks
  if (concern === 'ibs' && severity === 'severe') {
    result.food.push('Work with a dietitian for a structured, phased low-FODMAP plan');
    result.lifestyle.push('Avoid large, heavy meals; prefer smaller, frequent portions');
  }

  if (concern === 'acidity' && severity === 'severe') {
    result.food.push('Avoid heavy, late-night dinners completely');
    result.lifestyle.push('Keep at least a 3-hour gap between dinner and lying down');
  }

  if (concern === 'constipation' && severity === 'severe') {
    result.food.push('Increase daily water intake to around 10–12 glasses, unless restricted');
    result.lifestyle.push('Maintain a fixed toilet schedule even on weekends and holidays');
  }

  if (concern === 'bloating' && severity === 'severe') {
    result.food.push('Temporarily cut down on high-gas foods like beans, cabbage, and soda');
    result.lifestyle.push('Avoid swallowing excess air (chewing gum, drinking with straws)');
  }

  return result;
};

// 2) Apply diet-type layer on top
export const applyDietSuggestions = (
  base: PersonalizedSuggestions,
  dietType: string
): PersonalizedSuggestions => {
  const normalized = normalizeSuggestions(base);

  const result: Required<PersonalizedSuggestions> = {
    food: [...normalized.food],
    exercise: [...normalized.exercise],
    mentalHealth: [...normalized.mentalHealth],
    lifestyle: [...normalized.lifestyle],
  };

  const dietIdeas = DIET_SPECIFIC_FOOD_IDEAS[dietType as keyof typeof DIET_SPECIFIC_FOOD_IDEAS];
  if (dietIdeas) {
    result.food.push(...dietIdeas);
  }

  return result;
};

// 3) Optional age / gender nuance
export const applyAgeGenderHints = (
  base: PersonalizedSuggestions,
  age: number,
  gender: 'male' | 'female'
): PersonalizedSuggestions => {
  const normalized = normalizeSuggestions(base);

  const result: Required<PersonalizedSuggestions> = {
    food: [...normalized.food],
    exercise: [...normalized.exercise],
    mentalHealth: [...normalized.mentalHealth],
    lifestyle: [...normalized.lifestyle],
  };

  if (age >= 45) {
    result.lifestyle.push(
      'Schedule regular health checkups to monitor digestion, metabolism, and nutrient levels'
    );
  }

  if (gender === 'female') {
    result.food.push(
      'Ensure adequate iron, calcium, and B12 through gut-friendly food sources or as advised'
    );
  }

  return result;
};

// 4) One combined helper for the screen to call
export const getFullPersonalizedGutSuggestions = (params: {
  concern: string;
  severity: string;
  dietType: string;
  age: number;
  gender: 'male' | 'female';
}): PersonalizedSuggestions => {
  const base = getConcernSeveritySuggestions(params.concern, params.severity);
  const withDiet = applyDietSuggestions(base, params.dietType);
  const withAgeGender = applyAgeGenderHints(withDiet, params.age, params.gender);
  return withAgeGender;
};

// ============================================================================
// PROBIOTICS & PREBIOTICS
// ============================================================================

export const PROBIOTIC_FOODS = [
  { name: 'Greek Yogurt', emoji: '🥛', benefit: 'Lactobacillus' },
  { name: 'Kefir', emoji: '🍶', benefit: 'Multiple strains' },
  { name: 'Kimchi', emoji: '🥬', benefit: 'Korean fermented' },
  { name: 'Sauerkraut', emoji: '🥗', benefit: 'Fermented cabbage' },
  { name: 'Miso', emoji: '🍜', benefit: 'Japanese fermented' },
  { name: 'Tempeh', emoji: '🍱', benefit: 'Fermented soybean' },
];

export const PREBIOTIC_FOODS = [
  { name: 'Garlic', emoji: '🧄', benefit: 'Feeds good bacteria' },
  { name: 'Onions', emoji: '🧅', benefit: 'Inulin source' },
  { name: 'Bananas', emoji: '🍌', benefit: 'Resistant starch' },
  { name: 'Asparagus', emoji: '🥒', benefit: 'High in inulin' },
  { name: 'Oats', emoji: '🌾', benefit: 'Beta-glucan fiber' },
  { name: 'Apples', emoji: '🍎', benefit: 'Pectin fiber' },
];

// ============================================================================
// DIGESTIVE ENZYMES / TIPS
// ============================================================================

export const DIGESTIVE_TIPS = [
  { tip: 'Chew food 20–30 times before swallowing', icon: 'restaurant-outline', benefit: 'Aids digestion' },
  { tip: 'Eat in a relaxed, distraction-free environment', icon: 'cafe-outline', benefit: 'Reduces stress' },
  { tip: 'Avoid drinking large quantities of water during meals', icon: 'water-outline', benefit: 'May support better digestion for some people' },
  { tip: 'Include naturally bitter foods in meals', icon: 'leaf-outline', benefit: 'Can stimulate digestive enzymes' },
  { tip: 'Take a light walk after main meals', icon: 'walk-outline', benefit: 'Improves gut motility' },
  { tip: 'Maintain regular meal timings daily', icon: 'time-outline', benefit: 'Helps regulate the digestive system' },
];
