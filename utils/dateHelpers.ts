// utils/dateHelpers.ts
// ✅ ALIGNED WITH WEBSITE: Exclusive end date logic throughout
// Last Updated: December 18, 2025 - DATE CONSISTENCY ACHIEVED

/**
 * Calculate end date from start date and duration in days
 * Uses EXCLUSIVE end date (medication active from start to end-1)
 * @param startDate - Start date in YYYY-MM-DD format
 * @param durationDays - Number of days
 * @returns End date in YYYY-MM-DD format (exclusive)
 */
export const calculateEndDate = (
  startDate: string,
  durationDays: number
): string => {
  try {
    const start = new Date(startDate);
    
    if (isNaN(start.getTime())) {
      console.warn('Invalid start date:', startDate);
      return '';
    }
    
    if (durationDays <= 0 || isNaN(durationDays)) {
      return '';
    }
    
    // ✅ FIXED: Exclusive end date (no -1)
    // Example: Start Dec 1 + 7 days = End Dec 8 (active Dec 1-7)
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays);
    
    return end.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error calculating end date:', error);
    return '';
  }
};

/**
 * Calculate duration in days from start date and end date
 * Assumes EXCLUSIVE end date
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format (exclusive)
 * @returns Number of days duration
 */
export const calculateDurationDays = (
  startDate: string,
  endDate: string
): number => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Invalid dates:', { startDate, endDate });
      return 0;
    }
    
    if (end < start) {
      console.warn('End date before start date');
      return 0;
    }
    
    // ✅ FIXED: Exclusive end date calculation
    // Example: Dec 1 to Dec 8 = 7 days (Dec 1-7)
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
};

/**
 * Check if a medication is active on a given date
 * Uses EXCLUSIVE end date logic (matches website and calendar)
 * @param startDate - Medication start date in YYYY-MM-DD format
 * @param durationDays - Duration in days
 * @param checkDate - Date to check (defaults to today)
 * @returns true if medication is active on the given date
 */
export const isMedicationActive = (
  startDate: string,
  durationDays?: number,
  checkDate: Date = new Date()
): boolean => {
  try {
    const start = new Date(startDate);
    
    if (isNaN(start.getTime())) {
      return false;
    }
    
    // If no duration specified, medication is ongoing
    if (!durationDays || durationDays <= 0) {
      return checkDate >= start;
    }
    
    // ✅ FIXED: Exclusive end date (no -1)
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays);
    
    // Reset time parts for date-only comparison
    const checkDateOnly = new Date(checkDate.toDateString());
    const startDateOnly = new Date(start.toDateString());
    const endDateOnly = new Date(end.toDateString());
    
    // ✅ FIXED: Exclusive end date check (< instead of <=)
    // Active if: start <= checkDate < end
    return checkDateOnly >= startDateOnly && checkDateOnly < endDateOnly;
  } catch (error) {
    console.error('Error checking medication active status:', error);
    return false;
  }
};

/**
 * Calculate days remaining in medication course FROM TODAY
 * @param startDate - Medication start date in YYYY-MM-DD format
 * @param durationDays - Duration in days
 * @returns Number of days remaining (0 if completed or expired)
 */
export const calculateDaysRemaining = (
  startDate: string,
  durationDays?: number
): number => {
  try {
    if (!durationDays || durationDays <= 0) {
      return 0;
    }
    
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    if (isNaN(start.getTime())) {
      return 0;
    }
    
    // ✅ FIXED: Exclusive end date
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays);
    end.setHours(0, 0, 0, 0);
    
    // Last active day is end - 1 day
    const lastActiveDay = new Date(end);
    lastActiveDay.setDate(end.getDate() - 1);
    
    if (today > lastActiveDay) {
      return 0; // Medication course completed
    }
    
    // Calculate days from today to last active day (inclusive)
    const diffTime = lastActiveDay.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.max(0, daysLeft);
  } catch (error) {
    console.error('Error calculating days remaining:', error);
    return 0;
  }
};

/**
 * Format date for display
 * @param dateString - Date in YYYY-MM-DD or ISO format
 * @param format - Display format ('short', 'medium', 'long')
 * @returns Formatted date string
 */
export const formatDateForDisplay = (
  dateString: string,
  format: 'short' | 'medium' | 'long' = 'medium'
): string => {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    switch (format) {
      case 'short':
        // e.g., "12/18/25"
        return date.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: '2-digit',
        });
      
      case 'medium':
        // e.g., "Dec 18, 2025"
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      
      case 'long':
        // e.g., "December 18, 2025"
        return date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      
      default:
        return date.toLocaleDateString();
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Get relative date string (e.g., "Today", "Tomorrow", "3 days ago")
 * @param dateString - Date in YYYY-MM-DD or ISO format
 * @returns Relative date string
 */
export const getRelativeDateString = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    // Reset time parts for date-only comparison
    const dateOnly = new Date(date.toDateString());
    const todayOnly = new Date(today.toDateString());
    
    const diffTime = dateOnly.getTime() - todayOnly.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays > 1 && diffDays <= 7) {
      return `In ${diffDays} days`;
    } else if (diffDays < -1 && diffDays >= -7) {
      return `${Math.abs(diffDays)} days ago`;
    } else {
      return formatDateForDisplay(dateString, 'medium');
    }
  } catch (error) {
    console.error('Error getting relative date:', error);
    return dateString;
  }
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Today's date string
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Validate date string format
 * @param dateString - Date string to validate
 * @returns true if valid YYYY-MM-DD format
 */
export const isValidDateString = (dateString: string): boolean => {
  if (!dateString) return false;
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Add days to a date
 * @param dateString - Start date in YYYY-MM-DD format
 * @param days - Number of days to add
 * @returns New date in YYYY-MM-DD format
 */
export const addDays = (dateString: string, days: number): string => {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error adding days:', error);
    return dateString;
  }
};

/**
 * Get day of week name
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Day name (e.g., "Monday")
 */
export const getDayName = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } catch (error) {
    console.error('Error getting day name:', error);
    return '';
  }
};

/**
 * Check if date is in the past
 * @param dateString - Date in YYYY-MM-DD format
 * @returns true if date is in the past
 */
export const isDateInPast = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    
    if (isNaN(date.getTime())) {
      return false;
    }
    
    // Reset time parts
    const dateOnly = new Date(date.toDateString());
    const todayOnly = new Date(today.toDateString());
    
    return dateOnly < todayOnly;
  } catch (error) {
    console.error('Error checking if date in past:', error);
    return false;
  }
};

/**
 * Check if date is in the future
 * @param dateString - Date in YYYY-MM-DD format
 * @returns true if date is in the future
 */
export const isDateInFuture = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    
    if (isNaN(date.getTime())) {
      return false;
    }
    
    // Reset time parts
    const dateOnly = new Date(date.toDateString());
    const todayOnly = new Date(today.toDateString());
    
    return dateOnly > todayOnly;
  } catch (error) {
    console.error('Error checking if date in future:', error);
    return false;
  }
};
