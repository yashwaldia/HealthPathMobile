// utils/shareCardHelpers.ts
/**
 * Share Card Helper Functions
 * Utility functions for formatting, validation, and data transformation
 */

import type { VitalStatus } from '@/types/vitals';
import type { ShareCardType, CardAvailability } from '@/types/shareCard';
import { CONTENT_LIMITS } from '@/constants/shareCardConfig';

// ============================================================================
// DATE & TIME FORMATTING
// ============================================================================

/**
 * Format date for card display
 * @param date - ISO date string or Date object
 * @returns Formatted date string (e.g., "Dec 22, 2025")
 */
export function formatCardDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get relative time string
 * @param date - ISO date string or Date object
 * @returns Relative time (e.g., "2 hours ago", "Just now")
 */
export function getRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatCardDate(dateObj);
}

/**
 * Format date range for weekly reports
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted range (e.g., "Dec 16 - Dec 22")
 */
export function formatDateRange(startDate: string | Date, endDate: string | Date): {
  start: string;
  end: string;
} {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const formatShort = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    start: formatShort(start),
    end: formatShort(end),
  };
}

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Format number with commas
 * @param num - Number to format
 * @returns Formatted string (e.g., "2,450")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format decimal to one place
 * @param num - Number to format
 * @returns Formatted string (e.g., "22.4")
 */
export function formatDecimal(num: number, decimals: number = 1): string {
  return num.toFixed(decimals);
}

/**
 * Format percentage
 * @param value - Value between 0 and 1
 * @returns Formatted percentage (e.g., "75%")
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * Format change with sign
 * @param change - Positive or negative number
 * @returns Formatted string with sign (e.g., "+0.5 kg", "-1.2 kg")
 */
export function formatChange(change: number, unit: string = ''): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${formatDecimal(change)} ${unit}`.trim();
}

// ============================================================================
// TEXT FORMATTING
// ============================================================================

/**
 * Truncate text to fit character limit
 * @param text - Text to truncate
 * @param limit - Character limit
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, limit: number = CONTENT_LIMITS.userName): string {
  if (!text) return '';
  if (text.length <= limit) return text;
  return text.substring(0, limit - 3) + '...';
}

/**
 * Capitalize first letter of each word
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format user name for privacy
 * @param name - User's full name
 * @param showFullName - Whether to show full name or anonymize
 * @returns Formatted name
 */
export function formatUserName(name: string, showFullName: boolean = true): string {
  if (!name) return 'User';
  if (showFullName) return truncateText(name, CONTENT_LIMITS.userName);
  
  // Anonymize: "John Doe" -> "John D."
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

// ============================================================================
// HEALTH DATA FORMATTING
// ============================================================================

/**
 * Format blood pressure reading
 * @param systolic - Systolic pressure
 * @param diastolic - Diastolic pressure
 * @returns Formatted BP (e.g., "120/80")
 */
export function formatBloodPressure(systolic: number, diastolic: number): string {
  return `${Math.round(systolic)}/${Math.round(diastolic)}`;
}

/**
 * Format heart rate
 * @param bpm - Beats per minute
 * @returns Formatted HR (e.g., "72 BPM")
 */
export function formatHeartRate(bpm: number): string {
  return `${Math.round(bpm)} BPM`;
}

/**
 * Format BMI value
 * @param bmi - BMI number
 * @returns Formatted BMI (e.g., "22.4")
 */
export function formatBMI(bmi: number): string {
  return formatDecimal(bmi, 1);
}

/**
 * Format weight
 * @param kg - Weight in kilograms
 * @returns Formatted weight (e.g., "68 kg")
 */
export function formatWeight(kg: number): string {
  return `${formatDecimal(kg, 1)} kg`;
}

/**
 * Format height
 * @param cm - Height in centimeters
 * @returns Formatted height (e.g., "175 cm")
 */
export function formatHeight(cm: number): string {
  return `${Math.round(cm)} cm`;
}

/**
 * Format blood sugar
 * @param mgdl - Blood sugar in mg/dL
 * @returns Formatted blood sugar (e.g., "95 mg/dL")
 */
export function formatBloodSugar(mgdl: number): string {
  return `${Math.round(mgdl)} mg/dL`;
}

/**
 * Format temperature
 * @param celsius - Temperature in Celsius
 * @returns Formatted temperature (e.g., "98.6°F")
 */
export function formatTemperature(celsius: number): string {
  const fahrenheit = (celsius * 9) / 5 + 32;
  return `${formatDecimal(fahrenheit, 1)}°F`;
}

/**
 * Format oxygen saturation
 * @param percentage - SpO2 percentage
 * @returns Formatted SpO2 (e.g., "98%")
 */
export function formatOxygenSaturation(percentage: number): string {
  return `${Math.round(percentage)}%`;
}

// ============================================================================
// STATUS DETERMINATION
// ============================================================================

/**
 * Get BMI category from value
 * @param bmi - BMI value
 * @returns BMI category
 */
export function getBMICategory(bmi: number): 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese' {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Get blood pressure status
 * @param systolic - Systolic pressure
 * @param diastolic - Diastolic pressure
 * @returns BP status
 */
export function getBloodPressureStatus(
  systolic: number,
  diastolic: number
): 'Normal' | 'Elevated' | 'High' | 'Very High' | 'Low' {
  if (systolic < 90 || diastolic < 60) return 'Low';
  if (systolic < 120 && diastolic < 80) return 'Normal';
  if (systolic < 130 && diastolic < 80) return 'Elevated';
  if (systolic < 140 || diastolic < 90) return 'High';
  return 'Very High';
}

/**
 * Get heart rate status
 * @param bpm - Beats per minute
 * @param age - User's age (optional)
 * @returns HR status
 */
export function getHeartRateStatus(bpm: number, age?: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  // Resting heart rate assessment for adults
  if (bpm < 60) return 'Excellent';
  if (bpm < 70) return 'Good';
  if (bpm < 80) return 'Fair';
  return 'Poor';
}

/**
 * Get overall health status from multiple vitals
 * @param vitalsCount - Number of vitals tracked
 * @param normalCount - Number of vitals in normal range
 * @returns Overall status
 */
export function getOverallHealthStatus(
  vitalsCount: number,
  normalCount: number
): 'Excellent' | 'Good' | 'Fair' | 'Needs Attention' {
  const percentage = normalCount / vitalsCount;
  if (percentage >= 0.9) return 'Excellent';
  if (percentage >= 0.7) return 'Good';
  if (percentage >= 0.5) return 'Fair';
  return 'Needs Attention';
}

// ============================================================================
// TREND CALCULATION
// ============================================================================

/**
 * Calculate trend direction
 * @param current - Current value
 * @param previous - Previous value
 * @returns Trend direction
 */
export function calculateTrend(current: number, previous: number): {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
} {
  const diff = current - previous;
  const percentChange = (diff / previous) * 100;
  
  let direction: 'up' | 'down' | 'stable';
  if (Math.abs(percentChange) < 2) {
    direction = 'stable';
  } else if (diff > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }

  return {
    direction,
    percentage: Math.abs(percentChange),
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate if data is sufficient for card generation
 * @param cardType - Type of card to generate
 * @param data - User data object
 * @returns Availability check result
 */
export function validateCardData(
  cardType: ShareCardType,
  data: Record<string, any>
): CardAvailability {
  const requiredFields: Record<ShareCardType, string[]> = {
    'bmi': ['height', 'weight'],
    'heart-rate': ['heartRate'],
    'blood-pressure': ['bloodPressureSystolic', 'bloodPressureDiastolic'],
    'vitals-summary': ['heartRate', 'bloodPressureSystolic'],
    'weekly-report': ['vitalsHistory'],
    'wellness-progress': ['wellnessModule'],
    'mother-care': ['motherCareProfile'],
    'child-growth': ['childCareProfile'],
    'fitness-calculator': ['calculatorResult'],
  };

  const required = requiredFields[cardType] || [];
  const missing: string[] = [];

  for (const field of required) {
    if (!data[field] || data[field] === null || data[field] === undefined) {
      missing.push(field);
    }
  }

  const available = missing.length === 0;
  let reason: string | undefined;

  if (!available) {
    const fieldNames = missing.map((f) => f.replace(/([A-Z])/g, ' $1').trim()).join(', ');
    reason = `Missing required data: ${fieldNames}`;
  }

  return {
    type: cardType,
    available,
    missingData: missing,
    reason,
  };
}

/**
 * Check if value is a valid number
 * @param value - Value to check
 * @returns True if valid number
 */
export function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

// ============================================================================
// COLOR HELPERS
// ============================================================================

/**
 * Get color for BMI category
 * @param category - BMI category
 * @returns Hex color
 */
export function getBMICategoryColor(
  category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese'
): string {
  const colors = {
    'Underweight': '#f59e0b',  // Orange/warning
    'Normal weight': '#22c55e', // Green/success
    'Overweight': '#f59e0b',   // Orange/warning
    'Obese': '#ef4444',        // Red/error
  };
  return colors[category];
}

/**
 * Convert hex color to rgba
 * @param hex - Hex color (e.g., "#fa8a61")
 * @param alpha - Opacity (0-1)
 * @returns RGBA color string
 */
export function hexToRGBA(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Date & Time
  formatCardDate,
  getRelativeTime,
  formatDateRange,
  
  // Numbers
  formatNumber,
  formatDecimal,
  formatPercentage,
  formatChange,
  
  // Text
  truncateText,
  capitalizeWords,
  formatUserName,
  
  // Health Data
  formatBloodPressure,
  formatHeartRate,
  formatBMI,
  formatWeight,
  formatHeight,
  formatBloodSugar,
  formatTemperature,
  formatOxygenSaturation,
  
  // Status
  getBMICategory,
  getBloodPressureStatus,
  getHeartRateStatus,
  getOverallHealthStatus,
  
  // Trends
  calculateTrend,
  
  // Validation
  validateCardData,
  isValidNumber,
  
  // Colors
  getBMICategoryColor,
  hexToRGBA,
};
