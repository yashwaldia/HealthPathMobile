// constants/skinHairData.ts
// Data for Skin & Hair Care Wellness Module
// Last Updated: December 13, 2025 - Enhanced with comprehensive health indicators

import { DailyTask, PersonalizedSuggestions, WarningSSign } from '../types/wellness';

// ============================================================================
// SKIN TYPES & CONDITIONS
// ============================================================================

export const SKIN_TYPES = [
  { label: 'Oily', value: 'oily' },
  { label: 'Dry', value: 'dry' },
  { label: 'Combination', value: 'combination' },
  { label: 'Sensitive', value: 'sensitive' },
  { label: 'Normal', value: 'normal' },
];

export const HAIR_TYPES = [
  { label: 'Straight', value: 'straight' },
  { label: 'Wavy', value: 'wavy' },
  { label: 'Curly', value: 'curly' },
  { label: 'Coily', value: 'coily' },
];

export const SKIN_HAIR_CONCERNS = [
  { label: 'Acne & Breakouts', value: 'acne' },
  { label: 'Hair Loss', value: 'hair-fall' },
  { label: 'Dull Skin', value: 'dull-skin' },
  { label: 'Pigmentation', value: 'pigmentation' },
  { label: 'Dry Skin', value: 'dry-skin' },
  { label: 'Damaged Hair', value: 'damaged-hair' },
  { label: 'General Health', value: 'general' },
];

// ============================================================================
// COMPREHENSIVE SKIN HEALTH INDICATORS
// ============================================================================

export const SKIN_HEALTH_INDICATORS = {
  excellent: {
    range: 'Excellent',
    color: '#4CAF50',
    icon: 'happy-outline',
    description: 'Clear, glowing, radiant skin',
    characteristics: [
      'No active breakouts',
      'Even skin tone',
      'Good hydration',
      'Minimal pores',
      'Natural glow',
    ],
    advice: 'Maintain current routine and healthy habits',
  },
  good: {
    range: 'Good',
    color: '#8BC34A',
    icon: 'checkmark-circle-outline',
    description: 'Healthy skin with minor imperfections',
    characteristics: [
      'Few occasional breakouts',
      'Generally even tone',
      'Well-hydrated',
      'Good texture',
    ],
    advice: 'Continue consistent skincare routine',
  },
  fair: {
    range: 'Fair',
    color: '#FFC107',
    icon: 'alert-circle-outline',
    description: 'Some visible concerns',
    characteristics: [
      'Regular breakouts',
      'Some dryness or oiliness',
      'Uneven skin tone',
      'Visible pores',
    ],
    advice: 'Address specific concerns with targeted treatments',
  },
  poor: {
    range: 'Poor',
    color: '#FF9800',
    icon: 'warning-outline',
    description: 'Multiple skin issues present',
    characteristics: [
      'Frequent breakouts',
      'Significant dryness or excess oil',
      'Noticeable pigmentation',
      'Irritation or redness',
    ],
    advice: 'Consult dermatologist for treatment plan',
  },
  critical: {
    range: 'Critical',
    color: '#F44336',
    icon: 'close-circle-outline',
    description: 'Severe skin problems requiring immediate attention',
    characteristics: [
      'Severe acne or cystic breakouts',
      'Persistent inflammation',
      'Major pigmentation issues',
      'Possible scarring',
    ],
    advice: 'Urgent dermatologist consultation required',
  },
};

// ============================================================================
// COMPREHENSIVE HAIR HEALTH INDICATORS
// ============================================================================

export const HAIR_HEALTH_INDICATORS = {
  excellent: {
    range: 'Excellent',
    color: '#4CAF50',
    icon: 'sparkles-outline',
    description: 'Strong, shiny, healthy hair',
    characteristics: [
      'Minimal hair fall (<50 strands/day)',
      'Good shine and bounce',
      'Strong hair strands',
      'Healthy scalp',
      'Good hair density',
    ],
    advice: 'Maintain current hair care routine',
  },
  good: {
    range: 'Good',
    color: '#8BC34A',
    icon: 'checkmark-circle-outline',
    description: 'Healthy hair with normal shedding',
    characteristics: [
      'Normal hair fall (50-100 strands/day)',
      'Good shine',
      'Manageable texture',
      'No major concerns',
    ],
    advice: 'Continue protective hair care practices',
  },
  fair: {
    range: 'Fair',
    color: '#FFC107',
    icon: 'alert-circle-outline',
    description: 'Some hair concerns present',
    characteristics: [
      'Increased shedding (100-150 strands/day)',
      'Some dryness or frizz',
      'Occasional breakage',
      'Mild scalp issues',
    ],
    advice: 'Use strengthening treatments and improve diet',
  },
  poor: {
    range: 'Poor',
    color: '#FF9800',
    icon: 'warning-outline',
    description: 'Significant hair problems',
    characteristics: [
      'Heavy shedding (>150 strands/day)',
      'Visible thinning',
      'Frequent breakage',
      'Scalp irritation',
      'Dull, lifeless hair',
    ],
    advice: 'Consult trichologist for proper diagnosis',
  },
  critical: {
    range: 'Critical',
    color: '#F44336',
    icon: 'close-circle-outline',
    description: 'Severe hair loss or damage',
    characteristics: [
      'Excessive hair loss (>200 strands/day)',
      'Visible bald patches',
      'Severe breakage',
      'Scalp infections or severe dandruff',
    ],
    advice: 'Immediate medical consultation required',
  },
};

// ============================================================================
// BENEFICIAL FOODS (ENHANCED)
// ============================================================================

export const SKIN_BENEFICIAL_FOODS = [
  { 
    food: 'Blueberries', 
    emoji: '🫐', 
    benefit: 'Rich Antioxidants',
    nutrients: 'Vitamin C, Anthocyanins',
  },
  { 
    food: 'Avocado', 
    emoji: '🥑', 
    benefit: 'Healthy Fats',
    nutrients: 'Vitamin E, Omega-3',
  },
  { 
    food: 'Tomatoes', 
    emoji: '🍅', 
    benefit: 'Lycopene',
    nutrients: 'Vitamin C, Antioxidants',
  },
  { 
    food: 'Carrots', 
    emoji: '🥕', 
    benefit: 'Vitamin A',
    nutrients: 'Beta-carotene',
  },
  { 
    food: 'Walnuts', 
    emoji: '🌰', 
    benefit: 'Omega-3',
    nutrients: 'Healthy Fats, Vitamin E',
  },
  { 
    food: 'Green Tea', 
    emoji: '🍵', 
    benefit: 'Polyphenols',
    nutrients: 'Antioxidants, EGCG',
  },
  { 
    food: 'Sweet Potato', 
    emoji: '🍠', 
    benefit: 'Beta-carotene',
    nutrients: 'Vitamin A, C',
  },
  { 
    food: 'Papaya', 
    emoji: '🍈', 
    benefit: 'Vitamin C',
    nutrients: 'Enzymes, Antioxidants',
  },
  { 
    food: 'Dark Chocolate', 
    emoji: '🍫', 
    benefit: 'Flavonoids',
    nutrients: 'Antioxidants',
  },
  { 
    food: 'Bell Peppers', 
    emoji: '🫑', 
    benefit: 'Vitamin C',
    nutrients: 'Beta-carotene',
  },
];

export const HAIR_BENEFICIAL_FOODS = [
  { 
    food: 'Eggs', 
    emoji: '🥚', 
    benefit: 'Protein & Biotin',
    nutrients: 'Vitamin D, B12',
  },
  { 
    food: 'Spinach', 
    emoji: '🥬', 
    benefit: 'Iron',
    nutrients: 'Folate, Vitamin A, C',
  },
  { 
    food: 'Salmon', 
    emoji: '🐟', 
    benefit: 'Omega-3',
    nutrients: 'Protein, Vitamin D',
  },
  { 
    food: 'Sweet Pepper', 
    emoji: '🫑', 
    benefit: 'Vitamin C',
    nutrients: 'Antioxidants',
  },
  { 
    food: 'Almonds', 
    emoji: '🌰', 
    benefit: 'Vitamin E',
    nutrients: 'Biotin, Healthy Fats',
  },
  { 
    food: 'Greek Yogurt', 
    emoji: '🥛', 
    benefit: 'Protein',
    nutrients: 'Vitamin B5, Probiotics',
  },
  { 
    food: 'Lentils', 
    emoji: '🫘', 
    benefit: 'Iron & Zinc',
    nutrients: 'Protein, Biotin',
  },
  { 
    food: 'Berries', 
    emoji: '🫐', 
    benefit: 'Antioxidants',
    nutrients: 'Vitamin C',
  },
  { 
    food: 'Oysters', 
    emoji: '🦪', 
    benefit: 'Zinc',
    nutrients: 'Protein, Iron',
  },
  { 
    food: 'Pumpkin Seeds', 
    emoji: '🎃', 
    benefit: 'Zinc',
    nutrients: 'Iron, Magnesium',
  },
];

// ============================================================================
// SKINCARE ROUTINE (ENHANCED)
// ============================================================================

export const MORNING_SKINCARE_ROUTINE = [
  { 
    step: 1, 
    name: 'Gentle Cleanser', 
    duration: '2 min', 
    icon: 'water-outline',
    purpose: 'Remove overnight oils and impurities',
  },
  { 
    step: 2, 
    name: 'Toner', 
    duration: '1 min', 
    icon: 'leaf-outline',
    purpose: 'Balance pH and prep skin',
  },
  { 
    step: 3, 
    name: 'Vitamin C Serum', 
    duration: '2 min', 
    icon: 'flask-outline',
    purpose: 'Brighten and protect',
  },
  { 
    step: 4, 
    name: 'Moisturizer', 
    duration: '2 min', 
    icon: 'rainy-outline',
    purpose: 'Hydrate and nourish',
  },
  { 
    step: 5, 
    name: 'Sunscreen SPF 50+', 
    duration: '2 min', 
    icon: 'sunny-outline',
    purpose: 'UV protection (most important step)',
  },
];

export const NIGHT_SKINCARE_ROUTINE = [
  { 
    step: 1, 
    name: 'Oil/Balm Cleanser', 
    duration: '2 min', 
    icon: 'water-outline',
    purpose: 'Remove makeup and sunscreen',
  },
  { 
    step: 2, 
    name: 'Water-based Cleanser', 
    duration: '2 min', 
    icon: 'sparkles-outline',
    purpose: 'Deep cleanse pores',
  },
  { 
    step: 3, 
    name: 'Toner/Essence', 
    duration: '1 min', 
    icon: 'leaf-outline',
    purpose: 'Hydrate and prep',
  },
  { 
    step: 4, 
    name: 'Treatment Serum', 
    duration: '3 min', 
    icon: 'flask-outline',
    purpose: 'Target specific concerns',
  },
  { 
    step: 5, 
    name: 'Night Cream/Moisturizer', 
    duration: '2 min', 
    icon: 'moon-outline',
    purpose: 'Repair and regenerate',
  },
];

// ============================================================================
// HAIR CARE ROUTINE (ENHANCED)
// ============================================================================

export const HAIR_CARE_TIPS = [
  { 
    tip: 'Warm Oil Massage 2x/week', 
    icon: 'finger-print-outline', 
    benefit: 'Stimulates hair growth',
    howTo: 'Massage coconut or olive oil for 10 mins',
  },
  { 
    tip: 'Gentle Shampooing', 
    icon: 'water-outline', 
    benefit: 'Prevents damage',
    howTo: 'Use sulfate-free shampoo, focus on scalp',
  },
  { 
    tip: 'Deep Conditioning Weekly', 
    icon: 'leaf-outline', 
    benefit: 'Moisturizes and strengthens',
    howTo: 'Apply mask for 20-30 mins with heat',
  },
  { 
    tip: 'Minimize Heat Styling', 
    icon: 'flame-outline', 
    benefit: 'Prevents breakage',
    howTo: 'Use heat protectant, low temperature',
  },
  { 
    tip: 'Trim Every 8-12 Weeks', 
    icon: 'cut-outline', 
    benefit: 'Removes split ends',
    howTo: 'Regular professional trims',
  },
  { 
    tip: 'Silk/Satin Pillowcase', 
    icon: 'bed-outline', 
    benefit: 'Reduces friction and breakage',
    howTo: 'Switch from cotton pillowcases',
  },
  { 
    tip: 'Avoid Tight Hairstyles', 
    icon: 'alert-outline', 
    benefit: 'Prevents traction alopecia',
    howTo: 'Use loose braids or buns',
  },
  { 
    tip: 'Cold Water Rinse', 
    icon: 'snow-outline', 
    benefit: 'Seals cuticles, adds shine',
    howTo: 'Final rinse with cold water',
  },
];

// ============================================================================
// DAILY TASKS (ENHANCED)
// ============================================================================

export const SKIN_HAIR_DAILY_TASKS: DailyTask[] = [
  {
    taskId: 'sh-task-1',
    name: 'Complete morning skincare routine',
    description: 'Cleanse → Tone → Serum → Moisturize → Sunscreen SPF 50+',
    category: 'hygiene',
    completed: false,
    reminderTime: '08:00',
    priority: 'high',
  },
  {
    taskId: 'sh-task-2',
    name: 'Drink 8-10 glasses of water',
    description: 'Hydration is key for glowing skin and healthy hair',
    category: 'nutrition',
    completed: false,
    reminderTime: '09:00',
    priority: 'high',
  },
  {
    taskId: 'sh-task-3',
    name: 'Eat antioxidant-rich foods',
    description: 'Berries, leafy greens, nuts, and colorful vegetables',
    category: 'nutrition',
    completed: false,
    reminderTime: '12:00',
    priority: 'medium',
  },
  {
    taskId: 'sh-task-4',
    name: 'Avoid touching face throughout day',
    description: 'Prevents bacteria transfer and breakouts',
    category: 'hygiene',
    completed: false,
    priority: 'medium',
  },
  {
    taskId: 'sh-task-5',
    name: 'Take hair vitamins (if prescribed)',
    description: 'Biotin, multivitamin, or prescribed supplements',
    category: 'medication',
    completed: false,
    reminderTime: '14:00',
    priority: 'medium',
  },
  {
    taskId: 'sh-task-6',
    name: 'Complete night skincare routine',
    description: 'Double cleanse → Tone → Treatment → Night cream',
    category: 'hygiene',
    completed: false,
    reminderTime: '22:00',
    priority: 'high',
  },
  {
    taskId: 'sh-task-7',
    name: 'Get 7-8 hours quality sleep',
    description: 'Essential for skin repair and hair growth',
    category: 'sleep',
    completed: false,
    reminderTime: '23:00',
    priority: 'high',
  },
  {
    taskId: 'sh-task-8',
    name: '5-minute scalp massage',
    description: 'Stimulates blood flow to hair follicles',
    category: 'self-care',
    completed: false,
    reminderTime: '20:00',
    priority: 'low',
  },
];

// ============================================================================
// DERMATOLOGY CHECKUPS (ENHANCED)
// ============================================================================

export const SKIN_HAIR_CHECKUPS = [
  {
    name: 'Full Skin Examination',
    frequency: 'Every 6 months',
    description: 'Comprehensive skin check for abnormalities',
    importance: 'Early detection of skin issues and cancer',
    parameters: ['Mole check', 'Skin texture', 'Pigmentation', 'Overall health'],
  },
  {
    name: 'Hair & Scalp Analysis',
    frequency: 'Every 3-6 months',
    description: 'Professional evaluation of hair and scalp health',
    importance: 'Detect hair loss causes and scalp conditions',
    parameters: ['Hair density', 'Scalp health', 'Hair strength', 'Growth patterns'],
  },
  {
    name: 'Allergy Patch Testing',
    frequency: 'If needed',
    description: 'Identify allergens causing skin reactions',
    importance: 'Avoid products that trigger allergies',
    parameters: ['Product reactions', 'Contact dermatitis', 'Ingredient sensitivity'],
  },
  {
    name: 'Vitamin & Mineral Panel',
    frequency: 'Annually',
    description: 'Blood test for deficiencies affecting skin/hair',
    importance: 'Optimize nutritional status for beauty health',
    parameters: ['Vitamin D', 'B12', 'Iron', 'Biotin', 'Zinc'],
  },
  {
    name: 'Hormone Level Check',
    frequency: 'If experiencing issues',
    description: 'Hormonal imbalances can affect skin and hair',
    importance: 'Address root causes of acne or hair loss',
    parameters: ['Thyroid', 'PCOS markers', 'Androgens'],
  },
];

// ============================================================================
// WARNING SIGNS (ENHANCED)
// ============================================================================

export const SKIN_HAIR_WARNING_SIGNS: WarningSSign[] = [
  {
    signId: 'sh-warning-1',
    symptom: 'Sudden severe acne outbreak or cystic acne',
    action: 'Consult dermatologist immediately - may need prescription treatment',
    severity: 'urgent',
    icon: 'alert-circle',
  },
  {
    signId: 'sh-warning-2',
    symptom: 'Excessive hair loss (>100-150 strands/day)',
    action: 'See a trichologist or dermatologist for proper diagnosis',
    severity: 'urgent',
    icon: 'warning',
  },
  {
    signId: 'sh-warning-3',
    symptom: 'Persistent itching, rashes, or hives',
    action: 'Get medical evaluation - could be allergic reaction',
    severity: 'urgent',
    icon: 'medical',
  },
  {
    signId: 'sh-warning-4',
    symptom: 'Dark patches, melasma, or sudden pigmentation changes',
    action: 'Dermatology checkup needed - could be hormonal',
    severity: 'caution',
    icon: 'eye-outline',
  },
  {
    signId: 'sh-warning-5',
    symptom: 'Scalp inflammation, sores, or severe dandruff',
    action: 'Seek medical attention - may be scalp infection',
    severity: 'urgent',
    icon: 'medkit',
  },
  {
    signId: 'sh-warning-6',
    symptom: 'Moles changing in size, shape, or color',
    action: 'URGENT: See dermatologist immediately - melanoma risk',
    severity: 'critical',
    icon: 'alert',
  },
  {
    signId: 'sh-warning-7',
    symptom: 'Bald patches or sudden hair thinning',
    action: 'Consult trichologist - could be alopecia areata',
    severity: 'urgent',
    icon: 'warning-outline',
  },
  {
    signId: 'sh-warning-8',
    symptom: 'Severe reactions to new products (burning, swelling)',
    action: 'Stop using immediately and consult dermatologist',
    severity: 'urgent',
    icon: 'flame',
  },
];

// ============================================================================
// PERSONALIZED SUGGESTIONS (ENHANCED)
// ============================================================================

export const getPersonalizedSuggestions = (
  concern: string
): PersonalizedSuggestions => {
  const suggestions: Record<string, PersonalizedSuggestions> = {
    acne: {
      food: [
        'Eat probiotic-rich foods (yogurt, kimchi, sauerkraut)',
        'Reduce dairy, sugar, and high-glycemic foods',
        'Include zinc-rich foods (pumpkin seeds, chickpeas, oysters)',
        'Drink green tea daily for anti-inflammatory benefits',
        'Add omega-3 sources (salmon, walnuts, flaxseeds)',
      ],
      exercise: [
        'Regular exercise to reduce stress and balance hormones',
        'Yoga for hormonal balance and stress reduction',
        'Always cleanse face after workouts',
        'Avoid touching face during exercise',
      ],
      mentalHealth: [
        'Manage stress through meditation or deep breathing',
        'Get 7-8 hours quality sleep for skin repair',
        'Practice mindfulness to reduce cortisol levels',
        'Consider stress-reducing activities',
      ],
      lifestyle: [
        'Change pillowcases 2-3 times per week',
        'Use non-comedogenic, oil-free products',
        'Never sleep with makeup on',
        'Keep hair away from face',
        'Clean phone screen regularly',
        'Use separate clean towels for face',
      ],
    },
    'hair-fall': {
      food: [
        'Increase protein intake (eggs, fish, lentils, chicken)',
        'Eat iron-rich foods (spinach, red meat, beans)',
        'Include biotin sources (nuts, seeds, eggs, avocado)',
        'Stay hydrated - drink 8-10 glasses water daily',
        'Add vitamin E foods (almonds, sunflower seeds)',
      ],
      exercise: [
        'Daily scalp massage 5-10 minutes for blood circulation',
        'Yoga poses like downward dog for increased blood flow',
        'Regular cardio exercise for overall health',
        'Inversion exercises to boost scalp circulation',
      ],
      mentalHealth: [
        'Reduce stress through meditation and relaxation',
        'Ensure adequate 7-8 hours sleep',
        'Practice stress-management techniques',
        'Consider professional help if stress is chronic',
      ],
      lifestyle: [
        'Avoid tight hairstyles (ponytails, buns, braids)',
        'Use mild, sulfate-free, paraben-free shampoo',
        'Minimize heat styling tools',
        'Oil massage with coconut/castor oil 2x weekly',
        'Use wide-tooth comb on wet hair',
        'Trim regularly to prevent split ends',
        'Sleep on silk or satin pillowcase',
      ],
    },
    'dull-skin': {
      food: [
        'Eat vitamin C rich foods (citrus, berries, kiwi)',
        'Include healthy fats (avocado, nuts, olive oil)',
        'Drink plenty of water - stay hydrated',
        'Consume antioxidant-rich foods (dark berries, green tea)',
        'Add collagen-boosting foods (bone broth, citrus)',
      ],
      exercise: [
        'Regular cardio for improved blood circulation',
        'Facial exercises and lymphatic drainage massage',
        'Yoga for natural glow and stress reduction',
        'At least 30 minutes daily movement',
      ],
      mentalHealth: [
        'Get quality sleep - skin repairs at night',
        'Manage stress levels effectively',
        'Practice regular self-care routines',
        'Maintain positive mental state',
      ],
      lifestyle: [
        'Exfoliate 2-3 times per week (not daily)',
        'Use vitamin C serum in morning routine',
        'Never skip sunscreen - use SPF 50+ daily',
        'Stay consistently hydrated',
        'Use illuminating moisturizers',
        'Get regular facials or treatments',
      ],
    },
    pigmentation: {
      food: [
        'Eat vitamin E rich foods (almonds, sunflower seeds, avocado)',
        'Include vitamin C foods (citrus fruits, bell peppers)',
        'Consume lycopene (tomatoes, watermelon, pink grapefruit)',
        'Drink plenty of water for skin health',
        'Add turmeric to meals (natural brightener)',
      ],
      exercise: [
        'Regular exercise for detoxification and circulation',
        'Yoga for stress reduction and hormonal balance',
        'Avoid outdoor exercise during peak sun hours (10 AM - 4 PM)',
        'Indoor workouts during high UV times',
      ],
      mentalHealth: [
        'Manage stress effectively (can worsen pigmentation)',
        'Get adequate rest and quality sleep',
        'Practice mindfulness and relaxation',
        'Address hormonal imbalances if present',
      ],
      lifestyle: [
        'Use SPF 50+ sunscreen DAILY (even indoors)',
        'Reapply sunscreen every 2-3 hours',
        'Wear protective clothing, hat, sunglasses outdoors',
        'Use brightening serums (vitamin C, niacinamide)',
        'Avoid picking at skin or dark spots',
        'Use products with kojic acid, arbutin, or licorice',
        'Consider professional treatments (chemical peels, laser)',
      ],
    },
    'dry-skin': {
      food: [
        'Eat omega-3 rich foods (salmon, walnuts, chia seeds)',
        'Include healthy fats (avocado, olive oil, nuts)',
        'Stay hydrated - drink 8-10 glasses water',
        'Add vitamin E sources (almonds, sunflower seeds)',
        'Consume water-rich fruits (cucumber, watermelon)',
      ],
      exercise: [
        'Gentle exercise to boost circulation',
        'Avoid excessive sweating that can dehydrate skin',
        'Moisturize immediately after showering',
        'Practice facial massage for product absorption',
      ],
      mentalHealth: [
        'Reduce stress which can worsen skin dryness',
        'Get quality sleep for skin regeneration',
        'Practice self-care and relaxation',
      ],
      lifestyle: [
        'Use gentle, creamy cleansers (avoid harsh soaps)',
        'Apply hyaluronic acid serum on damp skin',
        'Use rich moisturizers with ceramides',
        'Take shorter, lukewarm showers (not hot)',
        'Use humidifier in dry environments',
        'Apply facial oil or sleeping mask at night',
        'Avoid over-exfoliation',
      ],
    },
    'damaged-hair': {
      food: [
        'Increase protein intake for hair repair',
        'Eat biotin-rich foods (eggs, nuts, seeds)',
        'Include keratin-building foods',
        'Stay hydrated for hair moisture',
        'Add vitamin A foods (sweet potato, carrots)',
      ],
      exercise: [
        'Scalp massage to stimulate follicles',
        'Gentle yoga for stress reduction',
        'Protect hair during workouts',
      ],
      mentalHealth: [
        'Manage stress to prevent further damage',
        'Quality sleep for hair regeneration',
        'Relaxation techniques',
      ],
      lifestyle: [
        'STOP all heat styling immediately',
        'Deep condition weekly with protein mask',
        'Trim split ends every 6-8 weeks',
        'Use silk/satin pillowcase',
        'Apply leave-in conditioner daily',
        'Protect from sun and chlorine',
        'Use wide-tooth comb only',
        'Air dry instead of blow drying',
      ],
    },
    general: {
      food: [
        'Balanced diet rich in fruits and vegetables',
        'Stay hydrated with 8-10 glasses of water daily',
        'Include omega-3 fatty acids (fish, nuts, seeds)',
        'Eat antioxidant-rich foods (berries, dark chocolate)',
        'Consume protein for hair strength and skin repair',
      ],
      exercise: [
        '30 minutes daily exercise for overall health',
        'Yoga for stress management and circulation',
        'Regular scalp massage for hair health',
        'Facial exercises for skin tone',
      ],
      mentalHealth: [
        '7-8 hours quality sleep every night',
        'Stress management through meditation or hobbies',
        'Regular self-care routine',
        'Maintain work-life balance',
      ],
      lifestyle: [
        'Consistent morning and night skincare routine',
        'Use sunscreen SPF 50+ daily (365 days)',
        'Gentle hair care practices',
        'Regular health checkups',
        'Avoid smoking and excessive alcohol',
        'Stay hydrated throughout the day',
      ],
    },
  };

  return suggestions[concern] || suggestions.general;
};

// ============================================================================
// NATURAL REMEDIES (ENHANCED)
// ============================================================================

export const NATURAL_SKIN_REMEDIES = [
  {
    remedy: 'Aloe Vera Gel',
    use: 'Soothes irritation, deeply moisturizes, heals acne',
    application: 'Apply fresh gel directly to clean skin 2x daily',
    suitableFor: ['Dry skin', 'Acne', 'Sunburn', 'Irritation'],
  },
  {
    remedy: 'Raw Honey',
    use: 'Antibacterial, moisturizing, anti-inflammatory',
    application: 'Face mask for 15-20 mins, 2x weekly',
    suitableFor: ['Acne', 'Dry skin', 'Dull skin'],
  },
  {
    remedy: 'Turmeric + Milk',
    use: 'Anti-inflammatory, brightening, anti-aging',
    application: 'Mix powder with milk, apply 1x weekly for 10 mins',
    suitableFor: ['Pigmentation', 'Acne scars', 'Dull skin'],
  },
  {
    remedy: 'Green Tea Toner',
    use: 'Antioxidant, reduces inflammation, tightens pores',
    application: 'Brew tea, cool, use as toner daily or drink',
    suitableFor: ['Oily skin', 'Acne', 'Anti-aging'],
  },
  {
    remedy: 'Cucumber Slices',
    use: 'Cooling, de-puffing, hydrating',
    application: 'Place chilled slices on eyes/face for 10 mins',
    suitableFor: ['Puffy eyes', 'Dark circles', 'Irritated skin'],
  },
  {
    remedy: 'Rose Water',
    use: 'Balances pH, hydrates, refreshes',
    application: 'Spray or apply with cotton pad daily',
    suitableFor: ['All skin types', 'Sensitive skin'],
  },
];

export const NATURAL_HAIR_REMEDIES = [
  {
    remedy: 'Coconut Oil',
    use: 'Deep conditioning, strengthening, prevents protein loss',
    application: 'Warm oil massage into scalp and hair, leave 30-60 mins or overnight',
    suitableFor: ['Dry hair', 'Damaged hair', 'Hair growth'],
  },
  {
    remedy: 'Onion Juice',
    use: 'Promotes hair growth, increases blood circulation',
    application: 'Apply fresh juice to scalp, leave 30 mins, rinse well (2x weekly)',
    suitableFor: ['Hair loss', 'Thinning hair'],
  },
  {
    remedy: 'Fenugreek Seeds',
    use: 'Prevents hair loss, adds shine, treats dandruff',
    application: 'Soak seeds overnight, make paste, apply for 30 mins (weekly)',
    suitableFor: ['Hair fall', 'Dandruff', 'Dull hair'],
  },
  {
    remedy: 'Aloe Vera Gel',
    use: 'Conditions, reduces dandruff, soothes scalp',
    application: 'Apply fresh gel to scalp and hair, leave 1 hour, rinse',
    suitableFor: ['Dry scalp', 'Dandruff', 'Itchy scalp'],
  },
  {
    remedy: 'Egg Mask',
    use: 'Protein treatment, strengthens, adds shine',
    application: 'Beat 1-2 eggs, apply to hair 20 mins, rinse with cool water',
    suitableFor: ['Damaged hair', 'Weak hair', 'Dull hair'],
  },
  {
    remedy: 'Apple Cider Vinegar Rinse',
    use: 'Balances pH, removes buildup, adds shine',
    application: 'Dilute 1:4 with water, use as final rinse after shampooing',
    suitableFor: ['Oily scalp', 'Product buildup', 'Dull hair'],
  },
  {
    remedy: 'Castor Oil',
    use: 'Promotes hair growth, thickens hair',
    application: 'Massage into scalp, leave overnight, wash in morning (2x weekly)',
    suitableFor: ['Hair growth', 'Thin hair', 'Eyebrows/lashes'],
  },
];

// ============================================================================
// PRODUCT RECOMMENDATIONS (ENHANCED)
// ============================================================================

export const SKINCARE_INGREDIENTS_TO_LOOK_FOR = {
  acne: ['Salicylic Acid 2%', 'Benzoyl Peroxide', 'Niacinamide', 'Tea Tree Oil', 'Retinoids'],
  'dull-skin': ['Vitamin C (L-Ascorbic Acid)', 'AHA (Glycolic/Lactic Acid)', 'BHA', 'Retinol', 'Hyaluronic Acid'],
  pigmentation: ['Vitamin C', 'Niacinamide', 'Kojic Acid', 'Arbutin', 'Tranexamic Acid', 'Azelaic Acid'],
  'dry-skin': ['Hyaluronic Acid', 'Ceramides', 'Glycerin', 'Squalane', 'Shea Butter', 'Peptides'],
  'oily-skin': ['Salicylic Acid', 'Niacinamide', 'Clay Masks', 'Zinc', 'Mattifying ingredients'],
  'anti-aging': ['Retinol/Retinoids', 'Peptides', 'Vitamin C', 'Hyaluronic Acid', 'Niacinamide'],
  'sensitive-skin': ['Centella Asiatica', 'Ceramides', 'Niacinamide', 'Colloidal Oatmeal', 'Avoid fragrance'],
};

export const HAIRCARE_INGREDIENTS_TO_LOOK_FOR = {
  'hair-fall': ['Biotin', 'Keratin', 'Peptides', 'Caffeine', 'Saw Palmetto', 'Minoxidil'],
  'dry-hair': ['Argan Oil', 'Shea Butter', 'Coconut Oil', 'Glycerin', 'Hyaluronic Acid'],
  'damaged-hair': ['Keratin', 'Hydrolyzed Protein', 'Ceramides', 'Panthenol (Pro-Vitamin B5)', 'Bond repair'],
  dandruff: ['Zinc Pyrithione', 'Ketoconazole', 'Tea Tree Oil', 'Salicylic Acid', 'Coal Tar'],
  'oily-scalp': ['Tea Tree Oil', 'Charcoal', 'Clay', 'Salicylic Acid', 'Witch Hazel'],
  'color-treated': ['UV filters', 'Antioxidants', 'Protein', 'Moisture-rich ingredients', 'Sulfate-free'],
};

// ============================================================================
// LIFESTYLE FACTORS
// ============================================================================

export const LIFESTYLE_FACTORS_AFFECTING_SKIN_HAIR = [
  {
    factor: 'Sleep',
    impact: 'Affects skin repair, collagen production, and hair growth cycle',
    recommendation: '7-8 hours quality sleep, consistent schedule',
  },
  {
    factor: 'Stress',
    impact: 'Increases cortisol, worsens acne, causes hair loss',
    recommendation: 'Practice stress management, meditation, regular breaks',
  },
  {
    factor: 'Hydration',
    impact: 'Essential for skin moisture and hair strength',
    recommendation: '8-10 glasses water daily, more if exercising',
  },
  {
    factor: 'Diet',
    impact: 'Provides nutrients for skin and hair health',
    recommendation: 'Balanced diet rich in vitamins, minerals, protein',
  },
  {
    factor: 'Sun Exposure',
    impact: 'Causes premature aging, pigmentation, skin damage',
    recommendation: 'SPF 50+ daily, reapply every 2 hours, wear protective clothing',
  },
  {
    factor: 'Smoking & Alcohol',
    impact: 'Accelerates aging, damages skin and hair',
    recommendation: 'Quit smoking, limit alcohol consumption',
  },
  {
    factor: 'Exercise',
    impact: 'Improves circulation, reduces stress, promotes glow',
    recommendation: '30 minutes daily exercise, cleanse after workouts',
  },
];
