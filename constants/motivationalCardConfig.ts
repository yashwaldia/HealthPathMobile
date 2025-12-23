// constants/motivationalCardConfig.ts

/**
 * Motivational Card Configuration
 * Theme colors, gradients, and visual settings
 */

import type {
    CardTheme,
    GradientPreset,
    ThemeConfig,
    TimeBasedGreeting,
    TimeOfDay
} from '@/types/motivationalCard';
import { Colors } from './colors';

// ============================================================================
// GRADIENT PRESETS (with proper tuple types for expo-linear-gradient)
// ============================================================================

export const GRADIENT_PRESETS = {
  sunrise: {
    name: 'sunrise' as const,
    colors: ['#FF9A56', '#FF6B9D', '#C471ED'] as const,
  },
  ocean: {
    name: 'ocean' as const,
    colors: ['#2E3192', '#1BFFFF'] as const,
  },
  forest: {
    name: 'forest' as const,
    colors: ['#134E5E', '#71B280'] as const,
  },
  sunset: {
    name: 'sunset' as const,
    colors: ['#FF512F', '#DD2476'] as const,
  },
  midnight: {
    name: 'midnight' as const,
    colors: ['#000428', '#004e92'] as const,
  },
  lavender: {
    name: 'lavender' as const,
    colors: ['#8E2DE2', '#4A00E0'] as const,
  },
  peachy: {
    name: 'peachy' as const,
    colors: [Colors.light.primary, Colors.light.upload.categories.vitals] as const,
  },
  mint: {
    name: 'mint' as const,
    colors: ['#00F260', '#0575E6'] as const,
  },
} as const;

// ============================================================================
// THEME CONFIGURATIONS
// ============================================================================

export const THEME_CONFIGS: Record<CardTheme, ThemeConfig> = {
  light: {
    theme: 'light',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    accentColor: Colors.light.primary,
    overlayOpacity: 0.1,
  },
  dark: {
    theme: 'dark',
    backgroundColor: '#111827',
    textColor: '#F9FAFB',
    accentColor: '#FF9A56',
    overlayOpacity: 0.3,
  },
};

// ============================================================================
// TIME-BASED GREETINGS
// ============================================================================

export const TIME_GREETINGS: Record<TimeOfDay, TimeBasedGreeting> = {
  morning: {
    timeOfDay: 'morning',
    greeting: 'Good Morning',
    icon: 'sunny-outline',
    emoji: '☀️',
  },
  afternoon: {
    timeOfDay: 'afternoon',
    greeting: 'Good Afternoon',
    icon: 'partly-sunny-outline',
    emoji: '🌤️',
  },
  evening: {
    timeOfDay: 'evening',
    greeting: 'Good Evening',
    icon: 'moon-outline',
    emoji: '🌙',
  },
  night: {
    timeOfDay: 'night',
    greeting: 'Good Night',
    icon: 'moon-outline',
    emoji: '✨',
  },
};

// ============================================================================
// CARD DIMENSIONS
// ============================================================================

export const MOTIVATIONAL_CARD_DIMENSIONS = {
  width: 1080,
  height: 1920,
  previewWidth: 270,
  previewHeight: 480,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get current time of day
 */
export function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Get greeting for current time
 */
export function getCurrentGreeting(): TimeBasedGreeting {
  return TIME_GREETINGS[getCurrentTimeOfDay()];
}

/**
 * Get gradient for theme
 */
export function getGradientForTheme(theme: CardTheme): GradientPreset {
  return theme === 'dark' ? 'midnight' : 'peachy';
}

export default {
  GRADIENT_PRESETS,
  THEME_CONFIGS,
  TIME_GREETINGS,
  MOTIVATIONAL_CARD_DIMENSIONS,
  getCurrentTimeOfDay,
  getCurrentGreeting,
  getGradientForTheme,
};
