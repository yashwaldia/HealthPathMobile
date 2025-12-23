// types/motivationalCard.ts

/**
 * Motivational Card Feature Type Definitions
 * Daily motivation quotes for health and wellness
 */

export type MotivationalCategory =
  | 'fitness'        // Workout, exercise motivation
  | 'wellness'       // Overall wellbeing
  | 'nutrition'      // Healthy eating
  | 'mental-health'  // Mindfulness, stress relief
  | 'general'        // General health motivation
  | 'morning'        // Morning-specific quotes
  | 'evening';       // Evening reflection quotes

export type CardTheme = 'light' | 'dark';

export type GradientPreset =
  | 'sunrise'        // Orange to pink
  | 'ocean'          // Blue gradient
  | 'forest'         // Green gradient
  | 'sunset'         // Purple to orange
  | 'midnight'       // Dark blue to black
  | 'lavender'       // Purple gradient
  | 'peachy'         // Peach to coral (app primary)
  | 'mint';          // Mint green

/**
 * Single motivational quote structure
 */
export interface MotivationalQuote {
  id: string;
  text: string;                    // The quote text
  author?: string;                 // Optional author attribution
  category: MotivationalCategory;  // Quote category
  tags: string[];                  // Searchable tags
  emoji?: string;                  // Optional emoji
  length: 'short' | 'medium' | 'long'; // Quote length classification
}

/**
 * Motivational Card Data (extends base share card)
 */
export interface MotivationalCardData {
  cardType: 'motivational';
  userName?: string;               // Optional user name
  date: string;                    // ISO timestamp
  generatedAt: Date;               // When card was generated
  
  // Quote Data
  quote: MotivationalQuote;
  
  // Visual Theme
  theme: CardTheme;                // Light or dark
  gradient: GradientPreset;        // Gradient style
  
  // Optional Elements
  showAppBranding: boolean;        // Show PI HEALTH branding
  showDate: boolean;               // Show current date
  showTime: boolean;               // Show "Good Morning" etc.
  timeOfDay?: TimeOfDay;           // Morning, Afternoon, Evening
}

/**
 * Time of day classification
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Time-based greeting
 */
export interface TimeBasedGreeting {
  timeOfDay: TimeOfDay;
  greeting: string;                // "Good Morning", "Good Evening", etc.
  icon: string;                    // Ionicon name
  emoji: string;                   // Emoji representation
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  theme: CardTheme;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  overlayOpacity: number;
}

/**
 * Gradient configuration
 */
export interface GradientConfig {
  name: GradientPreset;
  colors: string[];                // Array of hex colors
  angle?: number;                  // Gradient angle (optional)
}

/**
 * Card generation options
 */
export interface MotivationalCardOptions {
  category?: MotivationalCategory;  // Filter by category
  theme?: CardTheme;                // Force light/dark
  gradient?: GradientPreset;        // Force specific gradient
  includeUserName?: boolean;        // Show user name
  includeTimeGreeting?: boolean;    // Show "Good Morning" etc.
  randomQuote?: boolean;            // Random vs specific quote
  quoteId?: string;                 // Specific quote ID
}

/**
 * Quote filter criteria
 */
export interface QuoteFilterCriteria {
  category?: MotivationalCategory;
  tags?: string[];
  length?: 'short' | 'medium' | 'long';
  excludeIds?: string[];            // Exclude recently shown quotes
}

/**
 * Card generation result
 */
export interface MotivationalCardResult {
  success: boolean;
  data?: MotivationalCardData;
  error?: string;
}
