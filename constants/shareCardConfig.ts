// constants/shareCardConfig.ts
/**
 * Share Card Configuration
 * Defines metadata, dimensions, and templates for all card types
 */

import type { CardDimensions, CardLayout, ShareCardTemplate, ShareCardType } from '@/types/shareCard';
import { Colors } from './colors';

// ============================================================================
// CARD DIMENSIONS (Instagram/WhatsApp Story Format)
// ============================================================================

/**
 * Standard dimensions for share cards (9:16 aspect ratio)
 */
export const CARD_DIMENSIONS: CardDimensions = {
  width: 1080,           // Full resolution width
  height: 1920,          // Full resolution height (9:16 ratio)
  previewWidth: 270,     // Preview width (1/4 scale for screen)
  previewHeight: 480,    // Preview height (1/4 scale for screen)
};

// ============================================================================
// CARD LAYOUT CONFIGURATION
// ============================================================================

/**
 * Layout proportions for each card section
 */
export const CARD_LAYOUT: CardLayout = {
  header: {
    height: 20,          // 20% of total height
    backgroundColor: Colors.light.primary, // Peachy-coral gradient
  },
  content: {
    height: 60,          // 60% of total height
    backgroundColor: '#FFFFFF',
    padding: 40,
  },
  footer: {
    height: 20,          // 20% of total height
    backgroundColor: Colors.light.primary,
  },
};

// ============================================================================
// CARD TEMPLATES METADATA
// ============================================================================

/**
 * Template definitions for all available card types
 */
export const SHARE_CARD_TEMPLATES: Record<ShareCardType, ShareCardTemplate> = {
  'bmi': {
    type: 'bmi',
    name: 'BMI Card',
    description: 'Share your Body Mass Index with category status',
    icon: 'fitness-outline',
    requiredData: ['height', 'weight'],
    category: 'fitness',
    enabled: true,
    order: 1,
  },

  'heart-rate': {
    type: 'heart-rate',
    name: 'Heart Rate',
    description: 'Share your current heart rate and zones',
    icon: 'heart-outline',
    requiredData: ['heartRate'],
    category: 'vitals',
    enabled: true,
    order: 2,
  },

  'blood-pressure': {
    type: 'blood-pressure',
    name: 'Blood Pressure',
    description: 'Share your blood pressure readings',
    icon: 'pulse-outline',
    requiredData: ['bloodPressureSystolic', 'bloodPressureDiastolic'],
    category: 'vitals',
    enabled: true,
    order: 3,
  },

  'vitals-summary': {
    type: 'vitals-summary',
    name: 'Vitals Summary',
    description: 'Share a comprehensive overview of all your vitals',
    icon: 'medical-outline',
    requiredData: ['heartRate', 'bloodPressureSystolic'],
    category: 'vitals',
    enabled: true,
    order: 4,
  },

  'weekly-report': {
    type: 'weekly-report',
    name: 'Weekly Report',
    description: 'Share your week-long health tracking progress',
    icon: 'calendar-outline',
    requiredData: ['vitalsData'],
    category: 'vitals',
    enabled: true,
    order: 5,
  },

  'wellness-progress': {
    type: 'wellness-progress',
    name: 'Wellness Progress',
    description: 'Share your 30-day wellness challenge progress',
    icon: 'flower-outline',
    requiredData: ['wellnessModule'],
    category: 'wellness',
    enabled: true,
    order: 6,
  },

  'mother-care': {
    type: 'mother-care',
    name: 'Pregnancy Journey',
    description: 'Share your pregnancy milestone and progress',
    icon: 'woman-outline',
    requiredData: ['motherCareProfile'],
    category: 'family',
    enabled: true,
    order: 7,
  },

  'child-growth': {
    type: 'child-growth',
    name: 'Child Growth',
    description: 'Share your child\'s growth milestones',
    icon: 'people-outline',
    requiredData: ['childCareProfile'],
    category: 'family',
    enabled: true,
    order: 8,
  },

  'fitness-calculator': {
    type: 'fitness-calculator',
    name: 'Fitness Result',
    description: 'Share your fitness calculator results',
    icon: 'barbell-outline',
    requiredData: ['calculatorResult'],
    category: 'fitness',
    enabled: true,
    order: 9,
  },
  'motivational': {
  type: 'motivational',
  name: 'Daily Motivation',
  description: 'Share inspirational health quotes',
  icon: 'sparkles-outline',
  requiredData: [], // No data required
  category: 'wellness',
  enabled: true,
  order: 10,
  },

};

// ============================================================================
// MOTIVATIONAL TEXT LIBRARY
// ============================================================================

/**
 * Motivational messages for different health statuses
 */
export const MOTIVATIONAL_MESSAGES = {
  bmi: {
    underweight: "Every healthy meal counts! You're on the right track! 💪",
    normal: "You're in the healthy zone! Keep up the great work! 🌟",
    overweight: "Progress over perfection! You've got this! 💚",
    obese: "Every step forward matters! Stay committed! 🚀",
  },
  heartRate: {
    excellent: "Your heart is loving the care! Amazing work! ❤️",
    good: "Great cardiovascular health! Keep it up! 💓",
    fair: "You're making progress! Stay consistent! 💙",
    poor: "Small steps lead to big changes! Keep going! 💚",
  },
  bloodPressure: {
    normal: "Perfect pressure! Your heart thanks you! 🩺",
    elevated: "You're monitoring well! Keep tracking! 📊",
    high: "Awareness is the first step! Stay strong! 💪",
    veryHigh: "You're taking control! Keep consulting your doctor! 🏥",
    low: "Stay hydrated and nourished! You've got this! 💧",
  },
  wellness: {
    onTrack: "Crushing your wellness goals! 🔥",
    needsMotivation: "Consistency is key! Don't give up! ⭐",
    almostThere: "You're so close to your milestone! 🎯",
    completed: "Challenge completed! You're a wellness warrior! 🏆",
  },
  weekly: {
    consistent: "7 days strong! Consistency is your superpower! 🔥",
    improving: "Upward trend detected! Keep climbing! 📈",
    needsWork: "This week is a fresh start! Let's go! 🌅",
  },
};

// ============================================================================
// CARD COLOR SCHEMES
// ============================================================================

/**
 * Color schemes for different card statuses
 */
export const CARD_COLORS = {
  status: {
    excellent: Colors.light.success,     // Green
    good: Colors.light.primary,          // Peachy-coral
    fair: Colors.light.warning,          // Orange
    poor: Colors.light.error,            // Red
    normal: Colors.light.success,
    elevated: Colors.light.warning,
    high: Colors.light.error,
    veryHigh: Colors.light.error,
    low: Colors.light.warning,
  },
  gradient: {
    primary: [Colors.light.primary, Colors.light.upload.categories.vitals], // Peachy to pink
    wellness: [Colors.light.upload.analyzing, Colors.light.primary],        // Purple to peachy
    success: [Colors.light.success, '#10b981'],                             // Green gradient
    warning: [Colors.light.warning, '#f59e0b'],                             // Orange gradient
  },
};

// ============================================================================
// CARD CONTENT LIMITS
// ============================================================================

/**
 * Character limits for card text content
 */
export const CONTENT_LIMITS = {
  userName: 20,              // Max characters for user name
  motivationalText: 60,      // Max characters for motivational message
  achievementText: 40,       // Max characters per achievement
  milestoneText: 50,         // Max characters for milestone
  maxAchievements: 3,        // Max number of achievements to display
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get card template by type
 */
export function getCardTemplate(type: ShareCardType): ShareCardTemplate {
  return SHARE_CARD_TEMPLATES[type];
}

/**
 * Get all enabled card templates sorted by order
 */
export function getEnabledCardTemplates(): ShareCardTemplate[] {
  return Object.values(SHARE_CARD_TEMPLATES)
    .filter((template) => template.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get card templates by category
 */
export function getCardTemplatesByCategory(
  category: 'vitals' | 'wellness' | 'fitness' | 'family'
): ShareCardTemplate[] {
  return Object.values(SHARE_CARD_TEMPLATES)
    .filter((template) => template.category === category && template.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get motivational message based on status
 */
export function getMotivationalMessage(
  cardType: ShareCardType,
  status: string
): string {
  switch (cardType) {
    case 'bmi':
      return MOTIVATIONAL_MESSAGES.bmi[status as keyof typeof MOTIVATIONAL_MESSAGES.bmi] 
        || "You're on your health journey! Keep going! 💪";
    
    case 'heart-rate':
      return MOTIVATIONAL_MESSAGES.heartRate[status as keyof typeof MOTIVATIONAL_MESSAGES.heartRate]
        || "Your heart health matters! Keep tracking! ❤️";
    
    case 'blood-pressure':
      return MOTIVATIONAL_MESSAGES.bloodPressure[status as keyof typeof MOTIVATIONAL_MESSAGES.bloodPressure]
        || "Monitoring your health is a great step! 🩺";
    
    case 'wellness-progress':
      return MOTIVATIONAL_MESSAGES.wellness[status as keyof typeof MOTIVATIONAL_MESSAGES.wellness]
        || "Your wellness journey is inspiring! 🌟";
    
    case 'weekly-report':
      return MOTIVATIONAL_MESSAGES.weekly[status as keyof typeof MOTIVATIONAL_MESSAGES.weekly]
        || "Another week of progress! Keep it up! 📊";
    
    default:
      return "Track. Analyze. Thrive with PI HEALTH! 🚀";
  }
}

/**
 * Get status color for vitals
 */
export function getStatusColor(status: string): string {
  return CARD_COLORS.status[status.toLowerCase() as keyof typeof CARD_COLORS.status] 
    || Colors.light.textSecondary;
}

/**
 * Truncate text to fit character limit
 */
export function truncateText(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.substring(0, limit - 3) + '...';
}

/**
 * Check if user has required data for card type
 */
export function hasRequiredData(
  cardType: ShareCardType,
  userData: Record<string, any>
): { available: boolean; missingData: string[] } {
  const template = getCardTemplate(cardType);
  const missingData: string[] = [];

  for (const field of template.requiredData) {
    if (!userData[field] || userData[field] === null || userData[field] === undefined) {
      missingData.push(field);
    }
  }

  return {
    available: missingData.length === 0,
    missingData,
  };
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  CARD_DIMENSIONS,
  CARD_LAYOUT,
  SHARE_CARD_TEMPLATES,
  MOTIVATIONAL_MESSAGES,
  CARD_COLORS,
  CONTENT_LIMITS,
  getCardTemplate,
  getEnabledCardTemplates,
  getCardTemplatesByCategory,
  getMotivationalMessage,
  getStatusColor,
  truncateText,
  hasRequiredData,
};
