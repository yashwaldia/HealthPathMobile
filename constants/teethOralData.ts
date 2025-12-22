// constants/teethOralData.ts
// Data for Teeth & Oral Care Wellness Module
// Last Updated: December 13, 2025 - Enhanced with comprehensive dental data

import { DailyTask, WarningSign, PersonalizedSuggestions } from '../types/wellness';

// ============================================================================
// CONCERNS & SMOKING STATUS
// ============================================================================

export const TEETH_ORAL_CONCERNS = [
  { label: 'Tooth Sensitivity', value: 'sensitivity' },
  { label: 'Teeth Whitening', value: 'whitening' },
  { label: 'Gum Health', value: 'gum-health' },
  { label: 'Cavity Prevention', value: 'cavities' },
  { label: 'Bad Breath', value: 'bad-breath' },
  { label: 'General Dental Health', value: 'general' },
];

export const SMOKING_STATUS = [
  { label: 'Non-Smoker', value: 'non-smoker' },
  { label: 'Current Smoker', value: 'smoker' },
  { label: 'Former Smoker', value: 'former-smoker' },
];

// ============================================================================
// DENTAL HEALTH INDICATORS
// ============================================================================

export const DENTAL_HEALTH_INDICATORS = {
  excellent: {
    range: 'Excellent',
    color: '#4CAF50',
    icon: 'happy-outline',
    description: 'Perfect oral health',
  },
  good: {
    range: 'Good',
    color: '#8BC34A',
    icon: 'checkmark-circle-outline',
    description: 'Healthy teeth & gums',
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
    description: 'Urgent dental care needed',
  },
};

// ============================================================================
// BENEFICIAL FOODS
// ============================================================================

export const TEETH_STRENGTHENING_FOODS = [
  { food: 'Milk', emoji: '🥛', benefit: 'Calcium for enamel' },
  { food: 'Cheese', emoji: '🧀', benefit: 'Neutralizes acid' },
  { food: 'Yogurt', emoji: '🥛', benefit: 'Probiotics for gums' },
  { food: 'Leafy Greens', emoji: '🥬', benefit: 'Calcium & folic acid' },
  { food: 'Apples', emoji: '🍎', benefit: 'Natural cleaning' },
  { food: 'Carrots', emoji: '🥕', benefit: 'Stimulates saliva' },
  { food: 'Celery', emoji: '🥒', benefit: 'Natural floss' },
  { food: 'Almonds', emoji: '🌰', benefit: 'Calcium & protein' },
  { food: 'Green Tea', emoji: '🍵', benefit: 'Fights bacteria' },
  { food: 'Water', emoji: '💧', benefit: 'Rinses bacteria' },
  { food: 'Strawberries', emoji: '🍓', benefit: 'Natural whitening' },
  { food: 'Sesame Seeds', emoji: '🌾', benefit: 'Calcium boost' },
];

export const FOODS_TO_AVOID_FOR_TEETH = [
  { food: 'Sugary Drinks', emoji: '🥤', reason: 'Causes cavities' },
  { food: 'Candy', emoji: '🍬', reason: 'Tooth decay' },
  { food: 'Ice', emoji: '🧊', reason: 'Cracks enamel' },
  { food: 'Citrus', emoji: '🍋', reason: 'Erodes enamel' },
  { food: 'Coffee', emoji: '☕', reason: 'Stains teeth' },
  { food: 'Sticky Foods', emoji: '🍯', reason: 'Clings to teeth' },
  { food: 'Alcohol', emoji: '🍷', reason: 'Dries mouth' },
  { food: 'White Bread', emoji: '🍞', reason: 'Turns to sugar' },
];

// ============================================================================
// CALCIUM-RICH FOODS FOR TEETH
// ============================================================================

export const CALCIUM_RICH_FOODS = [
  { name: 'Milk', emoji: '🥛', calcium: '300mg per cup' },
  { name: 'Cheddar Cheese', emoji: '🧀', calcium: '200mg per oz' },
  { name: 'Yogurt', emoji: '🥛', calcium: '400mg per cup' },
  { name: 'Tofu', emoji: '🥢', calcium: '250mg per serving' },
  { name: 'Sardines', emoji: '🐟', calcium: '325mg per serving' },
  { name: 'Almonds', emoji: '🌰', calcium: '75mg per oz' },
  { name: 'Spinach', emoji: '🥬', calcium: '240mg per cup' },
  { name: 'Kale', emoji: '🥬', calcium: '180mg per cup' },
];

// ============================================================================
// VITAMIN-RICH FOODS FOR ORAL HEALTH
// ============================================================================

export const VITAMIN_C_FOODS = [
  { name: 'Oranges', emoji: '🍊', benefit: 'Gum health' },
  { name: 'Strawberries', emoji: '🍓', benefit: 'Collagen production' },
  { name: 'Bell Peppers', emoji: '🫑', benefit: 'Tissue repair' },
  { name: 'Kiwi', emoji: '🥝', benefit: 'Immune support' },
  { name: 'Broccoli', emoji: '🥦', benefit: 'Antioxidants' },
];

export const VITAMIN_D_FOODS = [
  { name: 'Salmon', emoji: '🐟', benefit: 'Calcium absorption' },
  { name: 'Egg Yolks', emoji: '🥚', benefit: 'Bone health' },
  { name: 'Fortified Milk', emoji: '🥛', benefit: 'Strong teeth' },
  { name: 'Mushrooms', emoji: '🍄', benefit: 'Vitamin D source' },
];

// ============================================================================
// DAILY TASKS
// ============================================================================

export const TEETH_ORAL_DAILY_TASKS: DailyTask[] = [
  {
    taskId: 'to-task-1',
    name: 'Brush teeth in morning',
    description: '2 minutes with fluoride toothpaste',
    category: 'hygiene',
    completed: false,
    reminderTime: '07:00',
    priority: 'high',
  },
  {
    taskId: 'to-task-2',
    name: 'Floss between teeth',
    description: 'Clean between all teeth',
    category: 'hygiene',
    completed: false,
    reminderTime: '07:30',
    priority: 'high',
  },
  {
    taskId: 'to-task-3',
    name: 'Use mouthwash',
    description: 'Antibacterial rinse',
    category: 'hygiene',
    completed: false,
    reminderTime: '08:00',
    priority: 'medium',
  },
  {
    taskId: 'to-task-4',
    name: 'Avoid sugary snacks',
    description: 'Choose tooth-friendly foods',
    category: 'nutrition',
    completed: false,
    priority: 'medium',
  },
  {
    taskId: 'to-task-5',
    name: 'Drink water after meals',
    description: 'Rinse away food particles',
    category: 'hygiene',
    completed: false,
    priority: 'medium',
  },
  {
    taskId: 'to-task-6',
    name: 'Brush teeth before bed',
    description: '2 minutes, gentle circular motions',
    category: 'hygiene',
    completed: false,
    reminderTime: '22:00',
    priority: 'high',
  },
  {
    taskId: 'to-task-7',
    name: 'Clean tongue',
    description: 'Remove bacteria from tongue',
    category: 'hygiene',
    completed: false,
    priority: 'medium',
  },
];

// ============================================================================
// DENTAL CHECKUPS
// ============================================================================

export const TEETH_ORAL_CHECKUPS = [
  {
    name: 'Dental Cleaning',
    frequency: 'Every 6 months',
    description: 'Professional teeth cleaning',
    importance: 'Prevent plaque buildup',
  },
  {
    name: 'Dental Examination',
    frequency: 'Every 6 months',
    description: 'Check for cavities & issues',
    importance: 'Early problem detection',
  },
  {
    name: 'X-Rays',
    frequency: 'Every 1-2 years',
    description: 'Check hidden problems',
    importance: 'Detect issues early',
  },
  {
    name: 'Gum Health Assessment',
    frequency: 'Every visit',
    description: 'Check for gum disease',
    importance: 'Prevent periodontitis',
  },
  {
    name: 'Oral Cancer Screening',
    frequency: 'Annually',
    description: 'Check for abnormalities',
    importance: 'Early cancer detection',
  },
  {
    name: 'Fluoride Treatment',
    frequency: 'Every 6-12 months',
    description: 'Strengthen tooth enamel',
    importance: 'Cavity prevention',
  },
];

// ============================================================================
// WARNING SIGNS
// ============================================================================

export const TEETH_ORAL_WARNING_SIGNS: WarningSign[] = [
  {
    signId: 'to-warning-1',
    symptom: 'Severe toothache or abscess',
    action: 'See dentist immediately',
    severity: 'critical',
    icon: 'alert-circle',
  },
  {
    signId: 'to-warning-2',
    symptom: 'Bleeding gums that won\'t stop',
    action: 'Urgent dental care needed',
    severity: 'urgent',
    icon: 'medical',
  },
  {
    signId: 'to-warning-3',
    symptom: 'Loose or knocked-out tooth',
    action: 'Emergency dental visit',
    severity: 'critical',
    icon: 'warning',
  },
  {
    signId: 'to-warning-4',
    symptom: 'Swollen jaw or face',
    action: 'Seek immediate medical attention',
    severity: 'critical',
    icon: 'alert',
  },
  {
    signId: 'to-warning-5',
    symptom: 'Persistent bad breath',
    action: 'Schedule dental checkup',
    severity: 'caution',
    icon: 'information-circle',
  },
  {
    signId: 'to-warning-6',
    symptom: 'White or red patches in mouth',
    action: 'Get oral cancer screening',
    severity: 'urgent',
    icon: 'eye-outline',
  },
  {
    signId: 'to-warning-7',
    symptom: 'Persistent jaw pain',
    action: 'Consult dentist for TMJ issues',
    severity: 'caution',
    icon: 'alert-circle-outline',
  },
  {
    signId: 'to-warning-8',
    symptom: 'Receding gums',
    action: 'See dentist to prevent tooth loss',
    severity: 'urgent',
    icon: 'arrow-down',
  },
];

// ============================================================================
// PERSONALIZED SUGGESTIONS
// ============================================================================

export const getPersonalizedSuggestions = (
  concern: string
): PersonalizedSuggestions => {
  const suggestions: Record<string, PersonalizedSuggestions> = {
    sensitivity: {
      food: [
        'Avoid extremely hot or cold foods',
        'Limit acidic foods (citrus, tomatoes)',
        'Eat calcium-rich foods daily',
        'Choose soft foods if pain persists',
      ],
      exercise: [
        'Practice proper brushing technique',
        'Don\'t brush too hard',
        'Use soft-bristled toothbrush',
        'Brush gently at 45° angle',
      ],
      mentalHealth: [
        'Avoid teeth grinding (stress management)',
        'Consider mouthguard if grinding',
        'Manage jaw clenching',
        'Practice relaxation techniques',
      ],
      lifestyle: [
        'Use desensitizing toothpaste',
        'Apply fluoride treatments',
        'See dentist if sensitivity persists',
        'Avoid whitening products temporarily',
      ],
    },
    whitening: {
      food: [
        'Limit coffee, tea, red wine',
        'Avoid dark berries and sauces',
        'Eat crunchy fruits & vegetables',
        'Drink through straw for staining drinks',
      ],
      exercise: [
        'Brush after consuming staining foods',
        'Rinse mouth after meals',
        'Regular professional cleanings',
        'Use whitening toothpaste',
      ],
      mentalHealth: [
        'Set realistic expectations',
        'Maintain consistent routine',
        'Be patient with results',
        'Track gradual improvements',
      ],
      lifestyle: [
        'Use whitening toothpaste daily',
        'Consider professional whitening',
        'Quit smoking/tobacco immediately',
        'Practice good oral hygiene',
      ],
    },
    'gum-health': {
      food: [
        'Vitamin C rich foods daily',
        'Omega-3 fatty acids',
        'Probiotics for oral health',
        'Avoid sticky, sugary foods',
      ],
      exercise: [
        'Gentle gum massage daily',
        'Proper flossing technique',
        'Use interdental brushes',
        'Massage gums with clean finger',
      ],
      mentalHealth: [
        'Manage stress (affects gums)',
        'Don\'t ignore bleeding gums',
        'Regular dental visits',
        'Stay consistent with care',
      ],
      lifestyle: [
        'Floss daily without fail',
        'Use antibacterial mouthwash',
        'Replace toothbrush every 3 months',
        'Don\'t smoke',
      ],
    },
    cavities: {
      food: [
        'Limit sugar intake drastically',
        'Avoid frequent snacking',
        'Eat cheese to neutralize acid',
        'Drink fluoridated water',
      ],
      exercise: [
        'Brush twice daily minimum',
        'Floss daily',
        'Use fluoride toothpaste',
        'Brush for full 2 minutes',
      ],
      mentalHealth: [
        'Build consistent routine',
        'Don\'t skip brushing',
        'Regular dental checkups',
        'Stay committed to oral health',
      ],
      lifestyle: [
        'Sealants for cavity prevention',
        'Fluoride treatments',
        'Rinse after sugary foods',
        'Chew sugar-free gum',
      ],
    },
    'bad-breath': {
      food: [
        'Drink plenty of water',
        'Eat crunchy fruits & vegetables',
        'Avoid onions and garlic',
        'Chew sugar-free mint gum',
      ],
      exercise: [
        'Clean tongue daily',
        'Brush after every meal',
        'Floss to remove food particles',
        'Use antibacterial mouthwash',
      ],
      mentalHealth: [
        'Address underlying anxiety',
        'Don\'t be embarrassed to seek help',
        'Regular dental checkups',
        'Stay confident in treatment',
      ],
      lifestyle: [
        'Replace toothbrush frequently',
        'Stay hydrated all day',
        'Avoid tobacco products',
        'Use tongue scraper',
      ],
    },
    general: {
      food: [
        'Balanced diet with calcium',
        'Limit sugar intake',
        'Eat crunchy fruits & vegetables',
        'Stay hydrated throughout day',
      ],
      exercise: [
        'Brush twice daily (2 minutes)',
        'Floss once daily',
        'Use mouthwash',
        'Clean tongue regularly',
      ],
      mentalHealth: [
        'Maintain consistent routine',
        'Don\'t skip dental visits',
        'Manage stress effectively',
        'Build healthy habits',
      ],
      lifestyle: [
        'Replace toothbrush every 3 months',
        'Visit dentist every 6 months',
        'Avoid tobacco products',
        'Protect teeth during sports',
      ],
    },
  };

  return suggestions[concern] || suggestions.general;
};

// ============================================================================
// BRUSHING TECHNIQUE
// ============================================================================

export const PROPER_BRUSHING_STEPS = [
  { step: 1, instruction: 'Hold brush at 45° angle to gums', icon: 'chevron-forward-outline' },
  { step: 2, instruction: 'Gentle circular motions', icon: 'sync-outline' },
  { step: 3, instruction: 'Brush outer, inner, chewing surfaces', icon: 'grid-outline' },
  { step: 4, instruction: 'Brush tongue for fresh breath', icon: 'restaurant-outline' },
  { step: 5, instruction: 'Brush for full 2 minutes', icon: 'time-outline' },
  { step: 6, instruction: 'Rinse thoroughly', icon: 'water-outline' },
];

export const FLOSSING_STEPS = [
  { step: 1, instruction: 'Use 18 inches of floss', icon: 'resize-outline' },
  { step: 2, instruction: 'Wind around middle fingers', icon: 'hand-left-outline' },
  { step: 3, instruction: 'Gently slide between teeth', icon: 'arrow-down-outline' },
  { step: 4, instruction: 'Curve around tooth base', icon: 'moon-outline' },
  { step: 5, instruction: 'Move floss up and down', icon: 'swap-vertical-outline' },
  { step: 6, instruction: 'Use clean section for each tooth', icon: 'checkmark-outline' },
];

// ============================================================================
// FLUORIDE BENEFITS
// ============================================================================

export const FLUORIDE_BENEFITS = [
  {
    benefit: 'Strengthens Enamel',
    description: 'Makes teeth more resistant to acid',
    icon: 'shield-checkmark',
  },
  {
    benefit: 'Prevents Cavities',
    description: 'Reduces tooth decay by 25%',
    icon: 'checkmark-circle',
  },
  {
    benefit: 'Reverses Early Decay',
    description: 'Remineralizes weak spots',
    icon: 'refresh',
  },
  {
    benefit: 'Protects All Ages',
    description: 'Benefits children and adults',
    icon: 'people',
  },
];

// ============================================================================
// MOUTHWASH TYPES
// ============================================================================

export const MOUTHWASH_TYPES = [
  {
    type: 'Antibacterial',
    use: 'Kills bacteria & prevents gum disease',
    when: 'Daily use',
    icon: 'shield',
  },
  {
    type: 'Fluoride Rinse',
    use: 'Strengthens enamel & prevents cavities',
    when: 'After brushing',
    icon: 'water',
  },
  {
    type: 'Whitening',
    use: 'Removes surface stains',
    when: 'Twice daily',
    icon: 'sparkles',
  },
  {
    type: 'Sensitivity',
    use: 'Reduces tooth sensitivity',
    when: 'As needed',
    icon: 'snow',
  },
];

// ============================================================================
// NATURAL REMEDIES
// ============================================================================

export const NATURAL_ORAL_REMEDIES = [
  {
    remedy: 'Oil Pulling (Coconut Oil)',
    use: 'Reduces bacteria',
    application: 'Swish 15-20 min daily',
    emoji: '🥥',
  },
  {
    remedy: 'Salt Water Rinse',
    use: 'Reduces inflammation',
    application: 'Rinse 2-3x daily',
    emoji: '🧂',
  },
  {
    remedy: 'Baking Soda',
    use: 'Natural whitening',
    application: 'Brush gently 1-2x/week',
    emoji: '🧪',
  },
  {
    remedy: 'Clove Oil',
    use: 'Pain relief',
    application: 'Apply to affected tooth',
    emoji: '🌿',
  },
  {
    remedy: 'Aloe Vera',
    use: 'Soothes gums',
    application: 'Apply gel to gums',
    emoji: '🌱',
  },
  {
    remedy: 'Green Tea',
    use: 'Antibacterial properties',
    application: 'Drink 2-3 cups daily',
    emoji: '🍵',
  },
];

// ============================================================================
// TOOTHBRUSH & PRODUCTS
// ============================================================================

export const TOOTHBRUSH_TIPS = [
  { tip: 'Use soft-bristled brush', icon: 'brush-outline', reason: 'Gentle on gums' },
  { tip: 'Replace every 3 months', icon: 'time-outline', reason: 'Maintains effectiveness' },
  { tip: 'Electric brush recommended', icon: 'flash-outline', reason: 'Better cleaning' },
  { tip: 'Store upright to air dry', icon: 'arrow-up-outline', reason: 'Prevents bacteria' },
  { tip: 'Don\'t share toothbrushes', icon: 'people-outline', reason: 'Hygiene' },
  { tip: 'Use fluoride toothpaste', icon: 'flask-outline', reason: 'Strengthens enamel' },
  { tip: 'Brush for 2 minutes', icon: 'timer-outline', reason: 'Thorough cleaning' },
  { tip: 'Don\'t rinse after brushing', icon: 'water-outline', reason: 'Let fluoride work' },
];

// ============================================================================
// TEETH WHITENING TIPS
// ============================================================================

export const WHITENING_METHODS = [
  { 
    method: 'Whitening Toothpaste', 
    effectiveness: 'Mild', 
    duration: 'Ongoing',
    cost: 'Low',
  },
  { 
    method: 'Whitening Strips', 
    effectiveness: 'Moderate', 
    duration: '2 weeks',
    cost: 'Moderate',
  },
  { 
    method: 'Professional Whitening', 
    effectiveness: 'High', 
    duration: '1 session',
    cost: 'High',
  },
  { 
    method: 'Custom Trays', 
    effectiveness: 'High', 
    duration: '2-4 weeks',
    cost: 'High',
  },
  { 
    method: 'Natural Remedies', 
    effectiveness: 'Very Mild', 
    duration: 'Ongoing',
    cost: 'Very Low',
  },
];

// ============================================================================
// GUM DISEASE STAGES
// ============================================================================

export const GUM_DISEASE_STAGES = [
  {
    stage: 'Gingivitis',
    severity: 'Mild',
    symptoms: 'Red, swollen gums that bleed',
    reversible: true,
    treatment: 'Better brushing & flossing',
  },
  {
    stage: 'Early Periodontitis',
    severity: 'Moderate',
    symptoms: 'Gums pull away from teeth',
    reversible: false,
    treatment: 'Professional cleaning & care',
  },
  {
    stage: 'Advanced Periodontitis',
    severity: 'Severe',
    symptoms: 'Tooth loss, bone damage',
    reversible: false,
    treatment: 'Surgery may be needed',
  },
];

// ============================================================================
// EMERGENCY DENTAL TIPS
// ============================================================================

export const DENTAL_EMERGENCIES = [
  {
    emergency: 'Knocked-out tooth',
    action: 'Keep moist, see dentist within 30 min',
    icon: 'alert-circle',
    priority: 'Critical',
  },
  {
    emergency: 'Cracked tooth',
    action: 'Rinse mouth, apply cold compress',
    icon: 'warning',
    priority: 'Urgent',
  },
  {
    emergency: 'Severe toothache',
    action: 'Rinse, floss gently, see dentist',
    icon: 'medical',
    priority: 'Urgent',
  },
  {
    emergency: 'Lost filling',
    action: 'Temporary filling kit, see dentist soon',
    icon: 'construct',
    priority: 'Moderate',
  },
  {
    emergency: 'Broken jaw',
    action: 'Go to ER immediately',
    icon: 'alert',
    priority: 'Critical',
  },
  {
    emergency: 'Bitten tongue/lip',
    action: 'Clean area, apply pressure, ice',
    icon: 'bandage',
    priority: 'Moderate',
  },
];

// ============================================================================
// DENTAL MYTHS & FACTS
// ============================================================================

export const DENTAL_MYTHS = [
  {
    myth: 'Whitening damages enamel',
    fact: 'Professional whitening is safe when done correctly',
  },
  {
    myth: 'Sugar is the only cause of cavities',
    fact: 'Any carbohydrate can contribute to cavities',
  },
  {
    myth: 'Bleeding gums are normal',
    fact: 'Bleeding gums indicate gum disease',
  },
  {
    myth: 'Baby teeth don\'t matter',
    fact: 'They hold space for permanent teeth',
  },
  {
    myth: 'Harder brushing = cleaner teeth',
    fact: 'Gentle brushing is more effective',
  },
];
