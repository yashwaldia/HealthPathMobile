// services/motivationalCardService.ts

/**
 * Motivational Card Service
 * Generates motivational card data with random quotes
 */

import {
    getCurrentTimeOfDay,
    getGradientForTheme,
    GRADIENT_PRESETS,
} from '@/constants/motivationalCardConfig';
import {
    getQuoteById,
    getQuotesByCategory,
    getRandomQuote,
    MOTIVATIONAL_QUOTES_DATABASE,
} from '@/constants/motivationalQuotes';
import type {
    CardTheme,
    GradientPreset,
    MotivationalCardData,
    MotivationalCardOptions,
    MotivationalCardResult,
    QuoteFilterCriteria,
} from '@/types/motivationalCard';
import { fetchUserProfile } from './shareCardService';

// ============================================================================
// MAIN GENERATOR FUNCTION
// ============================================================================

/**
 * Generate motivational card data
 */
export async function generateMotivationalCardData(
  options?: MotivationalCardOptions
): Promise<MotivationalCardResult> {
  try {
    // Fetch user profile for name (optional)
    const profile = options?.includeUserName ? await fetchUserProfile() : null;
    
    // Determine theme (default: light)
    const theme: CardTheme = options?.theme || 'light';
    
    // Determine gradient (default: based on theme)
    const gradient: GradientPreset = options?.gradient || getGradientForTheme(theme);
    
    // Get quote based on options
    let quote;
    if (options?.quoteId) {
      // Specific quote by ID
      quote = getQuoteById(options.quoteId);
      if (!quote) {
        throw new Error(`Quote with ID ${options.quoteId} not found`);
      }
    } else if (options?.category) {
      // Random quote from category
      const categoryQuotes = getQuotesByCategory(options.category);
      const randomIndex = Math.floor(Math.random() * categoryQuotes.length);
      quote = categoryQuotes[randomIndex];
    } else {
      // Completely random quote
      quote = getRandomQuote();
    }
    
    // Get time of day
    const timeOfDay = getCurrentTimeOfDay();
    
    // Build card data
    const cardData: MotivationalCardData = {
      cardType: 'motivational',
      userName: profile?.profile.fullName || profile?.displayName,
      date: new Date().toISOString(),
      generatedAt: new Date(),
      quote,
      theme,
      gradient,
      showAppBranding: true,
      showDate: options?.includeTimeGreeting !== false,
      showTime: options?.includeTimeGreeting !== false,
      timeOfDay,
    };
    
    return {
      success: true,
      data: cardData,
    };
  } catch (error) {
    console.error('Error generating motivational card:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// QUOTE FILTERING
// ============================================================================

/**
 * Get filtered quotes based on criteria
 */
export function getFilteredQuotes(criteria: QuoteFilterCriteria) {
  let quotes = [...MOTIVATIONAL_QUOTES_DATABASE];
  
  // Filter by category
  if (criteria.category) {
    quotes = quotes.filter(q => q.category === criteria.category);
  }
  
  // Filter by tags
  if (criteria.tags && criteria.tags.length > 0) {
    quotes = quotes.filter(q => 
      criteria.tags!.some(tag => q.tags.includes(tag))
    );
  }
  
  // Filter by length
  if (criteria.length) {
    quotes = quotes.filter(q => q.length === criteria.length);
  }
  
  // Exclude specific IDs
  if (criteria.excludeIds && criteria.excludeIds.length > 0) {
    quotes = quotes.filter(q => !criteria.excludeIds!.includes(q.id));
  }
  
  return quotes;
}

// ============================================================================
// THEME SELECTION
// ============================================================================

/**
 * Get random theme
 */
export function getRandomTheme(): CardTheme {
  return Math.random() > 0.5 ? 'light' : 'dark';
}

/**
 * Get random gradient
 */
export function getRandomGradient(): GradientPreset {
  const gradients = Object.keys(GRADIENT_PRESETS) as GradientPreset[];
  const randomIndex = Math.floor(Math.random() * gradients.length);
  return gradients[randomIndex];
}

// ============================================================================
// TIME-BASED RECOMMENDATIONS
// ============================================================================

/**
 * Get recommended category based on time of day
 */
export function getRecommendedCategory() {
  const timeOfDay = getCurrentTimeOfDay();
  
  switch (timeOfDay) {
    case 'morning':
      return 'morning';
    case 'evening':
    case 'night':
      return 'evening';
    default:
      return 'general';
  }
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export const motivationalCardService = {
  generateMotivationalCardData,
  getFilteredQuotes,
  getRandomTheme,
  getRandomGradient,
  getRecommendedCategory,
};

export default motivationalCardService;
