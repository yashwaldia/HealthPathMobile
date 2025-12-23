// constants/motivationalQuotes.ts

/**
 * Motivational Quotes Database
 * Curated collection of health and wellness motivation
 */

import type { MotivationalQuote } from '@/types/motivationalCard';

// ============================================================================
// FITNESS QUOTES
// ============================================================================

const FITNESS_QUOTES: MotivationalQuote[] = [
  {
    id: 'fit-001',
    text: 'Your body can stand almost anything. It\'s your mind you have to convince.',
    category: 'fitness',
    tags: ['workout', 'strength', 'mindset'],
    emoji: '💪',
    length: 'short',
  },
  {
    id: 'fit-002',
    text: 'The only bad workout is the one that didn\'t happen.',
    category: 'fitness',
    tags: ['consistency', 'workout', 'motivation'],
    emoji: '🏃‍♂️',
    length: 'short',
  },
  {
    id: 'fit-003',
    text: 'Strength doesn\'t come from what you can do. It comes from overcoming the things you once thought you couldn\'t.',
    author: 'Rikki Rogers',
    category: 'fitness',
    tags: ['strength', 'overcoming', 'growth'],
    emoji: '🔥',
    length: 'medium',
  },
  {
    id: 'fit-004',
    text: 'Take care of your body. It\'s the only place you have to live.',
    author: 'Jim Rohn',
    category: 'fitness',
    tags: ['health', 'self-care'],
    emoji: '🌟',
    length: 'short',
  },
  {
    id: 'fit-005',
    text: 'Every workout is progress. Every rep counts. Every step matters.',
    category: 'fitness',
    tags: ['progress', 'consistency', 'motivation'],
    emoji: '📈',
    length: 'short',
  },
];

// ============================================================================
// WELLNESS QUOTES
// ============================================================================

const WELLNESS_QUOTES: MotivationalQuote[] = [
  {
    id: 'well-001',
    text: 'Health is not about the weight you lose, but about the life you gain.',
    category: 'wellness',
    tags: ['health', 'life', 'perspective'],
    emoji: '💚',
    length: 'short',
  },
  {
    id: 'well-002',
    text: 'Wellness is the complete integration of body, mind, and spirit.',
    author: 'Greg Anderson',
    category: 'wellness',
    tags: ['holistic', 'balance', 'wellbeing'],
    emoji: '🧘‍♀️',
    length: 'short',
  },
  {
    id: 'well-003',
    text: 'Self-care is how you take your power back.',
    author: 'Lalah Delia',
    category: 'wellness',
    tags: ['self-care', 'empowerment'],
    emoji: '✨',
    length: 'short',
  },
  {
    id: 'well-004',
    text: 'Small daily improvements over time lead to stunning results.',
    category: 'wellness',
    tags: ['consistency', 'progress', 'growth'],
    emoji: '🌱',
    length: 'short',
  },
  {
    id: 'well-005',
    text: 'Your health is an investment, not an expense.',
    category: 'wellness',
    tags: ['investment', 'priority', 'health'],
    emoji: '💎',
    length: 'short',
  },
];

// ============================================================================
// NUTRITION QUOTES
// ============================================================================

const NUTRITION_QUOTES: MotivationalQuote[] = [
  {
    id: 'nutr-001',
    text: 'Let food be thy medicine and medicine be thy food.',
    author: 'Hippocrates',
    category: 'nutrition',
    tags: ['food', 'healing', 'nutrition'],
    emoji: '🥗',
    length: 'short',
  },
  {
    id: 'nutr-002',
    text: 'You are what you eat, so don\'t be fast, cheap, easy, or fake.',
    category: 'nutrition',
    tags: ['healthy-eating', 'quality', 'nutrition'],
    emoji: '🍎',
    length: 'short',
  },
  {
    id: 'nutr-003',
    text: 'Eat to nourish your body, not to feed your emotions.',
    category: 'nutrition',
    tags: ['mindful-eating', 'nourishment'],
    emoji: '🥑',
    length: 'short',
  },
  {
    id: 'nutr-004',
    text: 'Good nutrition creates health in all areas of our existence.',
    author: 'T. Colin Campbell',
    category: 'nutrition',
    tags: ['nutrition', 'health', 'holistic'],
    emoji: '🌿',
    length: 'short',
  },
  {
    id: 'nutr-005',
    text: 'Every time you eat is an opportunity to nourish your body.',
    category: 'nutrition',
    tags: ['mindfulness', 'nourishment', 'opportunity'],
    emoji: '🍽️',
    length: 'short',
  },
];

// ============================================================================
// MENTAL HEALTH QUOTES
// ============================================================================

const MENTAL_HEALTH_QUOTES: MotivationalQuote[] = [
  {
    id: 'ment-001',
    text: 'A healthy mind lives in a healthy body, and a healthy body in a healthy mind.',
    category: 'mental-health',
    tags: ['mind-body', 'balance', 'health'],
    emoji: '🧠',
    length: 'medium',
  },
  {
    id: 'ment-002',
    text: 'Rest and self-care are so important. When you take time to replenish your spirit, it allows you to serve others from the overflow.',
    author: 'Eleanor Brown',
    category: 'mental-health',
    tags: ['rest', 'self-care', 'recharge'],
    emoji: '🌸',
    length: 'long',
  },
  {
    id: 'ment-003',
    text: 'Your mental health is everything. Prioritize it. Make the time like your life depends on it, because it does.',
    category: 'mental-health',
    tags: ['priority', 'mental-health', 'importance'],
    emoji: '💜',
    length: 'medium',
  },
  {
    id: 'ment-004',
    text: 'Peace of mind comes from not wanting to change others.',
    author: 'Gerald Jampolsky',
    category: 'mental-health',
    tags: ['peace', 'acceptance', 'mindfulness'],
    emoji: '☮️',
    length: 'short',
  },
  {
    id: 'ment-005',
    text: 'Take a deep breath. It\'s just a bad day, not a bad life.',
    category: 'mental-health',
    tags: ['perspective', 'resilience', 'mindfulness'],
    emoji: '🌈',
    length: 'short',
  },
];

// ============================================================================
// MORNING MOTIVATION QUOTES
// ============================================================================

const MORNING_QUOTES: MotivationalQuote[] = [
  {
    id: 'morn-001',
    text: 'Every morning is a fresh start. Wake up with gratitude.',
    category: 'morning',
    tags: ['new-beginning', 'gratitude', 'morning'],
    emoji: '🌅',
    length: 'short',
  },
  {
    id: 'morn-002',
    text: 'Rise up, start fresh, see the bright opportunity in each new day.',
    category: 'morning',
    tags: ['opportunity', 'fresh-start', 'positivity'],
    emoji: '☀️',
    length: 'short',
  },
  {
    id: 'morn-003',
    text: 'Today\'s goals: Drink water, get sunlight, and crush your fitness goals.',
    category: 'morning',
    tags: ['goals', 'healthy-habits', 'motivation'],
    emoji: '💧',
    length: 'short',
  },
  {
    id: 'morn-004',
    text: 'Morning is wonderful. Its only drawback is that it comes at such an inconvenient time of day.',
    author: 'Glen Cook',
    category: 'morning',
    tags: ['humor', 'morning', 'motivation'],
    emoji: '😄',
    length: 'medium',
  },
  {
    id: 'morn-005',
    text: 'Good morning! Today, choose to be happy, healthy, and grateful.',
    category: 'morning',
    tags: ['positivity', 'choice', 'gratitude'],
    emoji: '🌻',
    length: 'short',
  },
];

// ============================================================================
// EVENING REFLECTION QUOTES
// ============================================================================

const EVENING_QUOTES: MotivationalQuote[] = [
  {
    id: 'even-001',
    text: 'End your day with gratitude. There is always something to be thankful for.',
    category: 'evening',
    tags: ['gratitude', 'reflection', 'evening'],
    emoji: '🌙',
    length: 'short',
  },
  {
    id: 'even-002',
    text: 'Rest tonight knowing you gave your best today.',
    category: 'evening',
    tags: ['rest', 'achievement', 'peace'],
    emoji: '⭐',
    length: 'short',
  },
  {
    id: 'even-003',
    text: 'Tomorrow is a new opportunity to be better than today.',
    category: 'evening',
    tags: ['growth', 'improvement', 'tomorrow'],
    emoji: '🌠',
    length: 'short',
  },
  {
    id: 'even-004',
    text: 'Before you go to sleep, think about the good things that happened today.',
    category: 'evening',
    tags: ['gratitude', 'reflection', 'positivity'],
    emoji: '💫',
    length: 'short',
  },
  {
    id: 'even-005',
    text: 'Your body repaired itself today. Honor it with rest tonight.',
    category: 'evening',
    tags: ['rest', 'recovery', 'self-care'],
    emoji: '😴',
    length: 'short',
  },
];

// ============================================================================
// GENERAL HEALTH QUOTES
// ============================================================================

const GENERAL_QUOTES: MotivationalQuote[] = [
  {
    id: 'gen-001',
    text: 'Health is the greatest gift, contentment the greatest wealth.',
    author: 'Buddha',
    category: 'general',
    tags: ['health', 'wealth', 'wisdom'],
    emoji: '🎁',
    length: 'short',
  },
  {
    id: 'gen-002',
    text: 'The groundwork of all happiness is health.',
    author: 'Leigh Hunt',
    category: 'general',
    tags: ['happiness', 'foundation', 'health'],
    emoji: '😊',
    length: 'short',
  },
  {
    id: 'gen-003',
    text: 'To keep the body in good health is a duty, otherwise we shall not be able to keep our mind strong and clear.',
    author: 'Buddha',
    category: 'general',
    tags: ['duty', 'mind-body', 'responsibility'],
    emoji: '🙏',
    length: 'long',
  },
  {
    id: 'gen-004',
    text: 'Your health account, your bank account – they\'re the same thing. The more you put in, the more you can take out.',
    author: 'Jack LaLanne',
    category: 'general',
    tags: ['investment', 'health', 'future'],
    emoji: '🏦',
    length: 'medium',
  },
  {
    id: 'gen-005',
    text: 'Track. Analyze. Thrive. Your health journey starts with small steps.',
    category: 'general',
    tags: ['journey', 'progress', 'app-specific'],
    emoji: '🚀',
    length: 'short',
  },
];

// ============================================================================
// AGGREGATED QUOTES DATABASE
// ============================================================================

export const MOTIVATIONAL_QUOTES_DATABASE: MotivationalQuote[] = [
  ...FITNESS_QUOTES,
  ...WELLNESS_QUOTES,
  ...NUTRITION_QUOTES,
  ...MENTAL_HEALTH_QUOTES,
  ...MORNING_QUOTES,
  ...EVENING_QUOTES,
  ...GENERAL_QUOTES,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get quotes by category
 */
export function getQuotesByCategory(category: string): MotivationalQuote[] {
  return MOTIVATIONAL_QUOTES_DATABASE.filter(q => q.category === category);
}

/**
 * Get quotes by tag
 */
export function getQuotesByTag(tag: string): MotivationalQuote[] {
  return MOTIVATIONAL_QUOTES_DATABASE.filter(q => q.tags.includes(tag));
}

/**
 * Get quotes by length
 */
export function getQuotesByLength(length: 'short' | 'medium' | 'long'): MotivationalQuote[] {
  return MOTIVATIONAL_QUOTES_DATABASE.filter(q => q.length === length);
}

/**
 * Get random quote
 */
export function getRandomQuote(excludeIds?: string[]): MotivationalQuote {
  let available = MOTIVATIONAL_QUOTES_DATABASE;
  
  if (excludeIds && excludeIds.length > 0) {
    available = available.filter(q => !excludeIds.includes(q.id));
  }
  
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

/**
 * Get quote by ID
 */
export function getQuoteById(id: string): MotivationalQuote | undefined {
  return MOTIVATIONAL_QUOTES_DATABASE.find(q => q.id === id);
}

export default {
  MOTIVATIONAL_QUOTES_DATABASE,
  getQuotesByCategory,
  getQuotesByTag,
  getQuotesByLength,
  getRandomQuote,
  getQuoteById,
};
