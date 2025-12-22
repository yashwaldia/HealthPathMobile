// constants/liverKidneyData.ts
// Liver & Kidney Care Module Data
// Last Updated: December 13, 2025 - Enhanced with comprehensive organ health data

import { DailyTask, PersonalizedSuggestions, WarningSign } from '../types/wellness';

// ============================================================================
// HEALTH CONCERNS
// ============================================================================

export const LIVER_KIDNEY_CONCERNS = [
  { label: 'Fatty Liver Prevention', value: 'fatty-liver' },
  { label: 'Kidney Disease (CKD)', value: 'ckd' },
  { label: 'Liver Cirrhosis', value: 'cirrhosis' },
  { label: 'Kidney Stones', value: 'kidney-stones' },
  { label: 'Hepatitis Management', value: 'hepatitis' },
  { label: 'General Organ Health', value: 'general' },
];

export const ALCOHOL_CONSUMPTION = [
  { label: 'Non-Drinker', value: 'none' },
  { label: 'Occasional (1-2 drinks/week)', value: 'occasional' },
  { label: 'Moderate (3-7 drinks/week)', value: 'moderate' },
  { label: 'Heavy (8+ drinks/week)', value: 'heavy' },
  { label: 'Former Drinker', value: 'former' },
];

export const DIABETES_STATUS = [
  { label: 'No Diabetes', value: 'none' },
  { label: 'Pre-Diabetic', value: 'pre-diabetic' },
  { label: 'Type 1 Diabetes', value: 'type1' },
  { label: 'Type 2 Diabetes', value: 'type2' },
];

// ============================================================================
// ORGAN HEALTH METRICS
// ============================================================================

export const LIVER_HEALTH_INDICATORS = {
  excellent: {
    range: 'Excellent',
    color: '#4CAF50',
    icon: 'checkmark-circle-outline',
    description: 'Your liver function is optimal',
  },
  good: {
    range: 'Good',
    color: '#8BC34A',
    icon: 'happy-outline',
    description: 'Your liver function is healthy',
  },
  moderate: {
    range: 'Moderate',
    color: '#FFC107',
    icon: 'alert-circle-outline',
    description: 'Consider lifestyle improvements',
  },
  attention: {
    range: 'Needs Attention',
    color: '#FF9800',
    icon: 'warning-outline',
    description: 'Consult your healthcare provider',
  },
  critical: {
    range: 'Critical',
    color: '#F44336',
    icon: 'close-circle-outline',
    description: 'Immediate medical attention required',
  },
};

export const KIDNEY_HEALTH_INDICATORS = {
  excellent: {
    range: 'Stage 1 (Normal)',
    gfr: '90+',
    color: '#4CAF50',
    icon: 'checkmark-circle-outline',
    description: 'Kidney function is normal',
  },
  good: {
    range: 'Stage 2 (Mild)',
    gfr: '60-89',
    color: '#8BC34A',
    icon: 'happy-outline',
    description: 'Mildly decreased kidney function',
  },
  moderate: {
    range: 'Stage 3 (Moderate)',
    gfr: '30-59',
    color: '#FFC107',
    icon: 'alert-circle-outline',
    description: 'Moderately decreased kidney function',
  },
  severe: {
    range: 'Stage 4 (Severe)',
    gfr: '15-29',
    color: '#FF9800',
    icon: 'warning-outline',
    description: 'Severely decreased kidney function',
  },
  failure: {
    range: 'Stage 5 (Failure)',
    gfr: '<15',
    color: '#F44336',
    icon: 'close-circle-outline',
    description: 'Kidney failure - dialysis may be needed',
  },
};

// ============================================================================
// BENEFICIAL FOODS
// ============================================================================

export const LIVER_BENEFICIAL_FOODS = [
  { food: 'Leafy Greens', emoji: '🥬', benefit: 'Neutralize toxins' },
  { food: 'Garlic', emoji: '🧄', benefit: 'Activates liver enzymes' },
  { food: 'Turmeric', emoji: '🌿', benefit: 'Anti-inflammatory' },
  { food: 'Green Tea', emoji: '🍵', benefit: 'Rich in antioxidants' },
  { food: 'Beetroot', emoji: '🥗', benefit: 'Purifies blood' },
  { food: 'Walnuts', emoji: '🌰', benefit: 'Supports liver cleansing' },
  { food: 'Citrus Fruits', emoji: '🍊', benefit: 'Boosts detox enzymes' },
  { food: 'Avocado', emoji: '🥑', benefit: 'Produces glutathione' },
  { food: 'Olive Oil', emoji: '🫒', benefit: 'Healthy fats for liver' },
  { food: 'Apples', emoji: '🍎', benefit: 'High in pectin' },
  { food: 'Broccoli', emoji: '🥦', benefit: 'Liver detoxification' },
  { food: 'Fish', emoji: '🐟', benefit: 'Omega-3 fatty acids' },
];

export const KIDNEY_BENEFICIAL_FOODS = [
  { food: 'Cauliflower', emoji: '🥦', benefit: 'Low in potassium' },
  { food: 'Blueberries', emoji: '🫐', benefit: 'Rich in antioxidants' },
  { food: 'Red Bell Peppers', emoji: '🫑', benefit: 'Low in potassium' },
  { food: 'Cabbage', emoji: '🥬', benefit: 'High in fiber' },
  { food: 'Garlic', emoji: '🧄', benefit: 'Anti-inflammatory' },
  { food: 'Onions', emoji: '🧅', benefit: 'Supports kidney function' },
  { food: 'Apples', emoji: '🍎', benefit: 'High in fiber' },
  { food: 'Cranberries', emoji: '🫐', benefit: 'Prevents UTIs' },
  { food: 'Egg Whites', emoji: '🥚', benefit: 'High-quality protein' },
  { food: 'Olive Oil', emoji: '🫒', benefit: 'Healthy fats' },
  { food: 'Arugula', emoji: '🥗', benefit: 'Low in potassium' },
  { food: 'Macadamia Nuts', emoji: '🌰', benefit: 'Kidney-friendly fats' },
];

// ============================================================================
// DETOX FOODS & DRINKS
// ============================================================================

export const LIVER_DETOX_DRINKS = [
  {
    name: 'Lemon Water',
    emoji: '🍋',
    recipe: 'Warm water with fresh lemon juice',
    timing: 'Morning on empty stomach',
  },
  {
    name: 'Green Smoothie',
    emoji: '🥬',
    recipe: 'Spinach, apple, lemon, ginger',
    timing: 'Breakfast or snack',
  },
  {
    name: 'Beetroot Juice',
    emoji: '🥤',
    recipe: 'Fresh beetroot, carrot, apple',
    timing: 'Mid-morning',
  },
  {
    name: 'Turmeric Tea',
    emoji: '🍵',
    recipe: 'Turmeric, ginger, black pepper, honey',
    timing: 'Evening',
  },
  {
    name: 'Dandelion Tea',
    emoji: '🌼',
    recipe: 'Dandelion root tea',
    timing: 'Afternoon',
  },
];

export const KIDNEY_CLEANSING_DRINKS = [
  {
    name: 'Cranberry Juice',
    emoji: '🫐',
    benefit: 'Prevents UTIs',
    recommendation: 'Unsweetened, 1 glass daily',
  },
  {
    name: 'Lemon Water',
    emoji: '🍋',
    benefit: 'Reduces kidney stones',
    recommendation: 'Warm water with lemon, morning',
  },
  {
    name: 'Watermelon Juice',
    emoji: '🍉',
    benefit: 'Natural diuretic',
    recommendation: 'Fresh, consult doctor first',
  },
  {
    name: 'Basil Tea',
    emoji: '🌿',
    benefit: 'Kidney stone prevention',
    recommendation: '1-2 cups daily',
  },
];

// ============================================================================
// FOODS TO AVOID
// ============================================================================

export const LIVER_FOODS_TO_AVOID = [
  {
    category: 'Alcohol',
    items: ['Beer', 'Wine', 'Spirits', 'Cocktails'],
    reason: 'Damages liver cells',
    emoji: '🍺',
  },
  {
    category: 'High-Fat Foods',
    items: ['Fried foods', 'Fast food', 'Processed meats', 'Full-fat dairy'],
    reason: 'Can cause fatty liver disease',
    emoji: '🍟',
  },
  {
    category: 'High-Sugar Foods',
    items: ['Soda', 'Candy', 'Pastries', 'Ice cream'],
    reason: 'Increases fat buildup in liver',
    emoji: '🍭',
  },
  {
    category: 'High-Sodium Foods',
    items: ['Canned foods', 'Pickles', 'Soy sauce', 'Processed foods'],
    reason: 'Can cause fluid retention',
    emoji: '🧂',
  },
  {
    category: 'Processed Foods',
    items: ['Packaged snacks', 'Instant noodles', 'Frozen meals'],
    reason: 'Contains preservatives and additives',
    emoji: '📦',
  },
];

export const KIDNEY_FOODS_TO_AVOID = [
  {
    category: 'High-Sodium Foods',
    items: ['Table salt', 'Canned soups', 'Processed meats', 'Chips'],
    reason: 'Increases blood pressure and kidney strain',
    emoji: '🧂',
  },
  {
    category: 'High-Potassium Foods',
    items: ['Bananas', 'Oranges', 'Potatoes', 'Tomatoes', 'Spinach'],
    reason: 'Can be dangerous with kidney disease',
    emoji: '🍌',
  },
  {
    category: 'High-Phosphorus Foods',
    items: ['Dairy products', 'Nuts', 'Beans', 'Cola drinks'],
    reason: 'Can weaken bones',
    emoji: '🥛',
  },
  {
    category: 'High-Protein Foods (if advised)',
    items: ['Red meat', 'Organ meats', 'Large portions of protein'],
    reason: 'Puts extra strain on kidneys',
    emoji: '🥩',
  },
  {
    category: 'Artificial Additives',
    items: ['Diet sodas', 'Artificial sweeteners', 'Processed foods'],
    reason: 'Harmful for kidney function',
    emoji: '🥤',
  },
];

// ============================================================================
// DAILY TASKS
// ============================================================================

export const LIVER_KIDNEY_DAILY_TASKS: DailyTask[] = [
  {
    taskId: 'lk-task-1',
    name: 'Drink 8-10 glasses of water',
    description: 'Stay hydrated throughout the day',
    category: 'nutrition',
    completed: false,
    reminderTime: '09:00',
    priority: 'high',
  },
  {
    taskId: 'lk-task-2',
    name: 'Eat organ-friendly breakfast',
    description: 'Oatmeal, fruits, green tea',
    category: 'nutrition',
    completed: false,
    reminderTime: '08:00',
    priority: 'high',
  },
  {
    taskId: 'lk-task-3',
    name: '30-minute moderate exercise',
    description: 'Walking, yoga, or light cardio',
    category: 'exercise',
    completed: false,
    reminderTime: '17:00',
    priority: 'medium',
  },
  {
    taskId: 'lk-task-4',
    name: 'Monitor blood pressure',
    description: 'Check and record your BP',
    category: 'activity',
    completed: false,
    reminderTime: '19:00',
    priority: 'medium',
  },
  {
    taskId: 'lk-task-5',
    name: 'Take prescribed medications',
    description: 'As per doctor\'s advice',
    category: 'medication',
    completed: false,
    reminderTime: '20:00',
    priority: 'high',
  },
  {
    taskId: 'lk-task-6',
    name: 'Avoid alcohol completely',
    description: 'Protect your liver and kidneys',
    category: 'mindfulness',
    completed: false,
    priority: 'high',
  },
  {
    taskId: 'lk-task-7',
    name: 'Track salt intake',
    description: 'Keep sodium under 2,300mg',
    category: 'nutrition',
    completed: false,
    priority: 'medium',
  },
];

// ============================================================================
// HERBS & SUPPLEMENTS
// ============================================================================

export const LIVER_FRIENDLY_HERBS = [
  {
    name: 'Milk Thistle',
    emoji: '🌾',
    benefit: 'Protects liver cells',
    usage: 'Consult doctor for dosage',
  },
  {
    name: 'Dandelion Root',
    emoji: '🌼',
    benefit: 'Promotes bile production',
    usage: 'As tea or supplement',
  },
  {
    name: 'Artichoke',
    emoji: '🥬',
    benefit: 'Supports liver regeneration',
    usage: 'In food or extract',
  },
  {
    name: 'Turmeric (Curcumin)',
    emoji: '🌿',
    benefit: 'Anti-inflammatory',
    usage: 'Daily in food or supplement',
  },
  {
    name: 'Ginger',
    emoji: '🫚',
    benefit: 'Aids digestion and liver',
    usage: 'Tea or fresh in meals',
  },
];

export const KIDNEY_FRIENDLY_HERBS = [
  {
    name: 'Nettle Leaf',
    emoji: '🌿',
    benefit: 'Natural diuretic',
    usage: 'As tea',
  },
  {
    name: 'Parsley',
    emoji: '🌱',
    benefit: 'Kidney cleansing',
    usage: 'Fresh in food',
  },
  {
    name: 'Marshmallow Root',
    emoji: '🌾',
    benefit: 'Soothes urinary tract',
    usage: 'As tea or supplement',
  },
  {
    name: 'Ginger',
    emoji: '🫚',
    benefit: 'Improves kidney function',
    usage: 'Tea or fresh',
  },
];

// ============================================================================
// LIFESTYLE TIPS
// ============================================================================

export const LIVER_LIFESTYLE_TIPS = [
  {
    tip: 'Maintain healthy weight',
    icon: 'fitness-outline',
    importance: 'Prevents fatty liver',
  },
  {
    tip: 'Get vaccinated (Hep A & B)',
    icon: 'shield-checkmark-outline',
    importance: 'Prevents hepatitis',
  },
  {
    tip: 'Practice safe hygiene',
    icon: 'hand-left-outline',
    importance: 'Reduces infection risk',
  },
  {
    tip: 'Limit medication use',
    icon: 'medical-outline',
    importance: 'Reduces liver stress',
  },
  {
    tip: 'Sleep 7-8 hours',
    icon: 'moon-outline',
    importance: 'Liver regenerates during sleep',
  },
  {
    tip: 'Manage stress',
    icon: 'heart-outline',
    importance: 'Reduces inflammation',
  },
];

export const KIDNEY_LIFESTYLE_TIPS = [
  {
    tip: 'Control blood pressure',
    icon: 'pulse-outline',
    importance: 'Protects kidney function',
  },
  {
    tip: 'Manage diabetes',
    icon: 'medical-outline',
    importance: 'Prevents kidney damage',
  },
  {
    tip: 'Don\'t smoke',
    icon: 'close-circle-outline',
    importance: 'Reduces kidney disease risk',
  },
  {
    tip: 'Limit NSAIDs',
    icon: 'warning-outline',
    importance: 'Protects kidneys',
  },
  {
    tip: 'Stay active',
    icon: 'walk-outline',
    importance: 'Improves overall health',
  },
  {
    tip: 'Regular checkups',
    icon: 'calendar-outline',
    importance: 'Early detection',
  },
];

// ============================================================================
// LAB TEST SCHEDULE
// ============================================================================

export const LIVER_KIDNEY_LAB_TESTS = [
  {
    testId: 'test-1',
    name: 'Liver Function Test (LFT)',
    frequency: 'Every 3-6 months',
    parameters: ['ALT', 'AST', 'ALP', 'Bilirubin', 'Albumin', 'Total Protein'],
    icon: 'flask-outline',
  },
  {
    testId: 'test-2',
    name: 'Kidney Function Test (KFT)',
    frequency: 'Every 3-6 months',
    parameters: ['Creatinine', 'BUN', 'eGFR', 'Electrolytes'],
    icon: 'water-outline',
  },
  {
    testId: 'test-3',
    name: 'Complete Blood Count (CBC)',
    frequency: 'Every 6 months',
    parameters: ['Hemoglobin', 'WBC', 'RBC', 'Platelets'],
    icon: 'medical-outline',
  },
  {
    testId: 'test-4',
    name: 'Lipid Profile',
    frequency: 'Every 6 months',
    parameters: ['Total Cholesterol', 'LDL', 'HDL', 'Triglycerides'],
    icon: 'heart-outline',
  },
  {
    testId: 'test-5',
    name: 'Urine Analysis',
    frequency: 'Every 3 months',
    parameters: ['Protein', 'Blood', 'Glucose', 'pH'],
    icon: 'beaker-outline',
  },
  {
    testId: 'test-6',
    name: 'Ultrasound (Liver/Kidney)',
    frequency: 'Annually or as advised',
    parameters: ['Size', 'Structure', 'Abnormalities'],
    icon: 'scan-outline',
  },
];

// ============================================================================
// WARNING SIGNS
// ============================================================================

export const LIVER_KIDNEY_WARNING_SIGNS: WarningSign[] = [
  {
    signId: 'lk-warning-1',
    symptom: 'Dark urine or pale stools',
    action: 'Contact your healthcare provider immediately',
    severity: 'critical',
    icon: 'alert-circle',
  },
  {
    signId: 'lk-warning-2',
    symptom: 'Yellowing of skin or eyes (Jaundice)',
    action: 'Seek immediate medical attention',
    severity: 'critical',
    icon: 'medical',
  },
  {
    signId: 'lk-warning-3',
    symptom: 'Swelling in legs, ankles, or face',
    action: 'Contact your doctor - may indicate kidney issues',
    severity: 'urgent',
    icon: 'warning',
  },
  {
    signId: 'lk-warning-4',
    symptom: 'Persistent nausea or vomiting',
    action: 'Consult your healthcare provider',
    severity: 'urgent',
    icon: 'alert-circle',
  },
  {
    signId: 'lk-warning-5',
    symptom: 'Severe abdominal pain',
    action: 'Seek immediate medical attention',
    severity: 'critical',
    icon: 'medical',
  },
  {
    signId: 'lk-warning-6',
    symptom: 'Unusual fatigue or weakness',
    action: 'Get your liver and kidney function tested',
    severity: 'caution',
    icon: 'warning',
  },
  {
    signId: 'lk-warning-7',
    symptom: 'Decreased urine output',
    action: 'Contact your healthcare provider',
    severity: 'urgent',
    icon: 'alert-circle',
  },
  {
    signId: 'lk-warning-8',
    symptom: 'Blood in urine',
    action: 'Seek medical attention immediately',
    severity: 'critical',
    icon: 'medical',
  },
  {
    signId: 'lk-warning-9',
    symptom: 'Confusion or difficulty concentrating',
    action: 'May indicate liver encephalopathy - seek help',
    severity: 'urgent',
    icon: 'alert',
  },
  {
    signId: 'lk-warning-10',
    symptom: 'Easy bruising or bleeding',
    action: 'Contact your doctor',
    severity: 'caution',
    icon: 'bandage',
  },
];

// ============================================================================
// PERSONALIZED SUGGESTIONS
// ============================================================================

export const getPersonalizedSuggestions = (concern: string): PersonalizedSuggestions => {
  const suggestions: Record<string, PersonalizedSuggestions> = {
    'fatty-liver': {
      food: [
        'Avoid all alcohol completely',
        'Reduce saturated fats drastically',
        'Increase fiber intake (fruits, vegetables)',
        'Choose lean proteins over red meat',
      ],
      exercise: [
        'Focus on weight loss exercises',
        'Walk 45 minutes daily',
        'Strength training 2-3x/week',
        'Lose 7-10% of body weight gradually',
      ],
      mentalHealth: [
        'Set realistic weight loss goals',
        'Track food intake daily',
        'Join support groups',
        'Manage stress through meditation',
      ],
      lifestyle: [
        'Get liver function tests regularly',
        'Avoid unnecessary medications',
        'Sleep 7-8 hours nightly',
        'Quit smoking if applicable',
      ],
    },
    ckd: {
      food: [
        'Monitor potassium and phosphorus intake strictly',
        'Limit sodium to less than 2,300mg/day',
        'Reduce protein as per doctor advice',
        'Consult dietitian for meal planning',
      ],
      exercise: [
        '30 minutes moderate activity daily',
        'Walking or swimming preferred',
        'Avoid high-intensity workouts',
        'Consult doctor before starting',
      ],
      mentalHealth: [
        'Join CKD support groups',
        'Learn about your condition',
        'Practice stress management',
        'Stay positive and proactive',
      ],
      lifestyle: [
        'Monitor blood pressure twice daily',
        'Take medications exactly as prescribed',
        'Track fluid intake if restricted',
        'Regular kidney function tests',
      ],
    },
    cirrhosis: {
      food: [
        'Absolutely no alcohol',
        'Low-sodium diet (1,500mg/day)',
        'Small frequent meals',
        'Adequate protein (unless restricted)',
      ],
      exercise: [
        'Light walking as tolerated',
        'Gentle stretching exercises',
        'Avoid heavy lifting',
        'Rest when fatigued',
      ],
      mentalHealth: [
        'Regular doctor visits',
        'Monitor for complications',
        'Support group participation',
        'Counseling if needed',
      ],
      lifestyle: [
        'Avoid all hepatotoxic substances',
        'Get hepatitis vaccinations',
        'Monitor for fluid retention',
        'Emergency plan for complications',
      ],
    },
    'kidney-stones': {
      food: [
        'Drink 10-12 glasses of water daily',
        'Reduce sodium intake',
        'Limit animal protein',
        'Avoid high-oxalate foods if advised',
      ],
      exercise: [
        'Stay physically active',
        'Walking helps kidney function',
        'Maintain healthy weight',
        'Avoid dehydration during exercise',
      ],
      mentalHealth: [
        'Don\'t ignore symptoms',
        'Follow preventive measures',
        'Understand stone types',
        'Regular follow-ups',
      ],
      lifestyle: [
        'Increase lemon juice in water',
        'Limit vitamin C supplements',
        'Monitor calcium intake',
        'Get urine tests regularly',
      ],
    },
    hepatitis: {
      food: [
        'No alcohol whatsoever',
        'Eat balanced, nutritious meals',
        'Avoid raw or undercooked foods',
        'Stay hydrated',
      ],
      exercise: [
        'Moderate activity as tolerated',
        'Rest when tired',
        'Avoid overexertion',
        'Gradually increase activity',
      ],
      mentalHealth: [
        'Follow treatment plan strictly',
        'Get emotional support',
        'Learn about your hepatitis type',
        'Protect others from transmission',
      ],
      lifestyle: [
        'Practice safe hygiene',
        'Don\'t share personal items',
        'Regular liver function tests',
        'Avoid hepatotoxic medications',
      ],
    },
    general: {
      food: [
        'Balanced diet with fruits and vegetables',
        'Limit processed foods',
        'Stay hydrated with water',
        'Choose whole grains',
      ],
      exercise: [
        '30 minutes daily physical activity',
        'Mix cardio and strength training',
        'Stay consistent',
        'Find activities you enjoy',
      ],
      mentalHealth: [
        'Manage stress effectively',
        'Get adequate sleep',
        'Practice mindfulness',
        'Maintain social connections',
      ],
      lifestyle: [
        'Limit alcohol consumption',
        'Don\'t smoke',
        'Regular health checkups',
        'Maintain healthy weight',
      ],
    },
  };

  return suggestions[concern] || suggestions.general;
};

// ============================================================================
// HYDRATION GUIDELINES
// ============================================================================

export const HYDRATION_GUIDELINES = [
  {
    condition: 'Normal Kidney Function',
    amount: '8-10 glasses (2-2.5 liters)',
    note: 'Drink more in hot weather or during exercise',
  },
  {
    condition: 'Early CKD (Stage 1-2)',
    amount: '8-10 glasses',
    note: 'Stay well hydrated unless restricted',
  },
  {
    condition: 'Moderate CKD (Stage 3-4)',
    amount: 'Consult doctor',
    note: 'May need fluid restriction',
  },
  {
    condition: 'Advanced CKD/Dialysis',
    amount: 'Strict restriction',
    note: 'Follow doctor\'s orders precisely',
  },
  {
    condition: 'Liver Disease with Ascites',
    amount: 'Fluid restriction',
    note: 'Usually 1-1.5 liters/day',
  },
];

// ============================================================================
// EXERCISE RECOMMENDATIONS
// ============================================================================

export const EXERCISE_RECOMMENDATIONS = [
  {
    type: 'Walking',
    duration: '30-45 minutes',
    frequency: 'Daily',
    benefit: 'Low-impact, kidney and liver friendly',
    icon: 'walk-outline',
  },
  {
    type: 'Swimming',
    duration: '30 minutes',
    frequency: '3-4x per week',
    benefit: 'Full body workout, gentle on joints',
    icon: 'fitness-outline',
  },
  {
    type: 'Yoga',
    duration: '20-30 minutes',
    frequency: 'Daily',
    benefit: 'Reduces stress, improves circulation',
    icon: 'body-outline',
  },
  {
    type: 'Cycling',
    duration: '30 minutes',
    frequency: '3-4x per week',
    benefit: 'Cardiovascular health',
    icon: 'bicycle-outline',
  },
  {
    type: 'Light Strength Training',
    duration: '20-30 minutes',
    frequency: '2-3x per week',
    benefit: 'Maintains muscle mass',
    icon: 'barbell-outline',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getLiverHealthStatus = (alt: number, ast: number) => {
  // Normal ALT: 7-56 U/L, Normal AST: 10-40 U/L
  if (alt <= 56 && ast <= 40) return LIVER_HEALTH_INDICATORS.excellent;
  if (alt <= 70 && ast <= 50) return LIVER_HEALTH_INDICATORS.good;
  if (alt <= 100 && ast <= 80) return LIVER_HEALTH_INDICATORS.moderate;
  if (alt <= 150 && ast <= 120) return LIVER_HEALTH_INDICATORS.attention;
  return LIVER_HEALTH_INDICATORS.critical;
};

export const getKidneyHealthStatus = (gfr: number) => {
  if (gfr >= 90) return KIDNEY_HEALTH_INDICATORS.excellent;
  if (gfr >= 60) return KIDNEY_HEALTH_INDICATORS.good;
  if (gfr >= 30) return KIDNEY_HEALTH_INDICATORS.moderate;
  if (gfr >= 15) return KIDNEY_HEALTH_INDICATORS.severe;
  return KIDNEY_HEALTH_INDICATORS.failure;
};

export const calculateGFR = (
  creatinine: number,
  age: number,
  gender: 'male' | 'female',
  race: 'black' | 'other' = 'other'
): number => {
  // Using CKD-EPI equation
  const k = gender === 'female' ? 0.7 : 0.9;
  const alpha = gender === 'female' ? -0.329 : -0.411;
  const genderFactor = gender === 'female' ? 1.018 : 1;
  const raceFactor = race === 'black' ? 1.159 : 1;

  const gfr =
    141 *
    Math.min(creatinine / k, 1) ** alpha *
    Math.max(creatinine / k, 1) ** -1.209 *
    0.993 ** age *
    genderFactor *
    raceFactor;

  return Math.round(gfr);
};
