// utils/motivationalMessages.ts
// Motivational toast message generator for medication tracker
// Last Updated: December 18, 2025

import { MedicationStatus, MotivationalToast, MotivationalToastType } from '../types/medication';

/**
 * Generate motivational toast message based on context
 */
export const getMotivationalToast = (
  type: MotivationalToastType,
  medicationName?: string,
  status?: MedicationStatus,
  daysRemaining?: number
): MotivationalToast => {
  const messages: Record<MotivationalToastType, string[]> = {
    'dose_taken': [
      `✅ Great job taking ${medicationName}!`,
      `✨ ${medicationName} dose completed!`,
      `🎉 Excellent! ${medicationName} taken.`,
      `💊 ${medicationName} - dose logged! You're doing great!`,
    ],
    'all_done': [
      `🎊 All medicines taken for today! Stay consistent!`,
      `🏆 Perfect! Daily doses completed 🎉`,
      `✨ Today's medication schedule complete!`,
      `✅ All done for today! Excellent adherence!`,
    ],
    'streak': [
      `🔥 You're on a roll! Keep it up!`,
      `📈 Impressive consistency!`,
      `🌟 Perfect adherence streak!`,
      `💪 Consistency is key! You're crushing it!`,
    ],
    'reminder': [
      `⏰ Time for your medication!`,
      `💊 Don't forget your dose!`,
      `🔔 Medication time approaching`,
      `📅 Your next dose is due soon`,
    ],
    'encouragement': [
      `💪 You're doing amazing! Keep going!`,
      `🌟 Great progress! Stay consistent!`,
      `✨ Every dose counts! You're on track!`,
      `🎯 Excellent adherence! Proud of you!`,
    ],
  };

  // Calculate dynamic message based on status
  let message = '';
  
  switch (type) {
    case 'dose_taken':
      message = getRandomMessage('dose_taken', medicationName);
      break;
      
    case 'all_done':
      message = getRandomMessage('all_done');
      break;
      
    case 'streak':
      if (status?.adherence === 100) {
        message = getRandomMessage('streak');
      } else {
        message = `📈 ${Math.round(status?.adherence || 0)}% adherence - Amazing work!`;
      }
      break;
      
    case 'reminder':
      message = getRandomMessage('reminder');
      break;
      
    case 'encouragement':
      if (status?.adherence && status.adherence >= 90) {
        message = '🌟 Perfect adherence! Keep it up! 💪';
      } else if (status?.adherence && status.adherence >= 75) {
        message = '📈 Excellent progress! Almost perfect! ✨';
      } else {
        message = getRandomMessage('encouragement');
      }
      break;
      
    default:
      message = 'Keep up the great work! 💊';
  }

  return {
    type,
    message,
    emoji: getEmojiForType(type),
  };
};

/**
 * Get random message from category with medication name
 */
const getRandomMessage = (type: MotivationalToastType, medicationName?: string): string => {
  const messages = getMessagesForType(type);
  const randomIndex = Math.floor(Math.random() * messages.length);
  let message = messages[randomIndex];
  
  if (medicationName) {
    message = message.replace('${medicationName}', medicationName);
  }
  
  return message;
};

/**
 * Get messages for specific toast type
 */
const getMessagesForType = (type: MotivationalToastType): string[] => {
  const allMessages: Record<MotivationalToastType, string[]> = {
    'dose_taken': [
      '✅ Great job taking ${medicationName}!',
      '✨ ${medicationName} dose completed!',
      '🎉 Excellent! ${medicationName} taken.',
      '💊 ${medicationName} - dose logged! You\'re doing great!',
      '👍 ${medicationName} checked off! Keep it up!',
    ],
    'all_done': [
      '🎊 All medicines taken for today! Stay consistent!',
      '🏆 Perfect! Daily doses completed 🎉',
      '✨ Today\'s medication schedule complete!',
      '✅ All done for today! Excellent adherence!',
      '🌟 Daily goal achieved! Amazing work!',
    ],
    'streak': [
      '🔥 You\'re on a roll! Keep it up!',
      '📈 Impressive consistency!',
      '🌟 Perfect adherence streak!',
      '💪 Consistency is key! You\'re crushing it!',
      '🎯 On fire! Keep the streak going!',
    ],
    'reminder': [
      '⏰ Time for your medication!',
      '💊 Don\'t forget your dose!',
      '🔔 Medication time approaching',
      '📅 Your next dose is due soon',
      '⚡ Quick reminder: medication time!',
    ],
    'encouragement': [
      '💪 You\'re doing amazing! Keep going!',
      '🌟 Great progress! Stay consistent!',
      '✨ Every dose counts! You\'re on track!',
      '🎯 Excellent adherence! Proud of you!',
      '📊 Making great progress! Keep it up!',
    ],
  };

  return allMessages[type] || ['Keep up the great work! 💊'];
};

/**
 * Get appropriate emoji for toast type
 */
const getEmojiForType = (type: MotivationalToastType): string => {
  const emojis: Record<MotivationalToastType, string> = {
    'dose_taken': '✅',
    'all_done': '🎊',
    'streak': '🔥',
    'reminder': '⏰',
    'encouragement': '💪',
  };
  
  return emojis[type] || '✨';
};

/**
 * Generate comprehensive daily summary toast
 */
export const getDailySummaryToast = (
  totalExpected: number,
  totalTaken: number,
  activeMedications: number
): MotivationalToast => {
  const adherence = Math.round((totalTaken / totalExpected) * 100) || 0;
  
  let message = '';
  let type: MotivationalToastType = 'encouragement';
  
  if (totalTaken >= totalExpected && totalExpected > 0) {
    message = `🎉 Perfect day! ${adherence}% adherence`;
    type = 'all_done';
  } else if (adherence >= 90) {
    message = `🌟 Excellent day! ${adherence}% adherence`;
  } else if (adherence >= 75) {
    message = `📈 Great work! ${adherence}% adherence`;
  } else if (totalTaken > 0) {
    message = `💪 Good start! ${adherence}% adherence`;
  } else {
    message = `⏰ ${activeMedications} medications waiting`;
  }
  
  return {
    type,
    message,
    emoji: adherence >= 90 ? '🌟' : '💪',
  };
};

/**
 * Generate medication completion toast
 */
export const getMedicationCompletionToast = (
  medicationName: string,
  daysRemaining: number
): MotivationalToast => {
  let message = '';
  let type: MotivationalToastType = 'encouragement';
  
  if (daysRemaining <= 0) {
    message = `🎉 ${medicationName} course completed! Great job!`;
    type = 'all_done';
  } else if (daysRemaining <= 3) {
    message = `⚡ ${medicationName} ends in ${daysRemaining} days!`;
  } else if (daysRemaining <= 7) {
    message = `📅 ${medicationName} ends in ${daysRemaining} days`;
  }
  
  return {
    type,
    message,
    emoji: daysRemaining <= 0 ? '🎉' : '⚡',
  };
};

/**
 * Generate adherence milestone toast
 */
export const getAdherenceMilestoneToast = (
  adherence: number,
  medicationName?: string
): MotivationalToast => {
  let message = '';
  let type: MotivationalToastType = 'streak';
  
  if (adherence === 100) {
    message = medicationName 
      ? `🌟 ${medicationName}: Perfect adherence!`
      : '🌟 Perfect adherence across all medications!';
  } else if (adherence >= 95) {
    message = medicationName 
      ? `📈 ${medicationName}: 95%+ adherence!`
      : '📈 Near-perfect adherence! Amazing!';
  } else if (adherence >= 85) {
    message = medicationName 
      ? `💪 ${medicationName}: Excellent adherence!`
      : '💪 Excellent adherence! Keep going!';
  }
  
  return {
    type,
    message,
    emoji: '🌟',
  };
};

/**
 * Get contextual toast for medication status
 */
export const getStatusBasedToast = (
  medication: {
    name: string;
    frequency: string;
  },
  status: MedicationStatus
): MotivationalToast => {
  if (status.isDue) {
    return {
      type: 'reminder',
      message: `⏰ Time for ${medication.name}!`,
      emoji: '⏰',
    };
  }
  
  if (status.dosesTakenToday >= status.expectedDoses && status.expectedDoses > 0) {
    return {
      type: 'dose_taken',
      message: `✅ ${medication.name} - All doses done for today!`,
      emoji: '✅',
    };
  }
  
  return {
    type: 'encouragement',
    message: `📊 ${medication.name}: ${Math.round(status.adherence)}% adherence`,
    emoji: '📊',
  };
};

/**
 * Predefined toast messages for quick use
 */
export const QUICK_TOASTS = {
  success: '✅ Action completed successfully!',
  loading: '⏳ Processing...',
  error: '❌ Something went wrong. Please try again.',
  empty: '📭 No medications found',
  saved: '💾 Medications saved successfully!',
  merged: '🔀 Medications merged successfully!',
};

/**
 * Get toast for smart import results
 */
export const getSmartImportToast = (
  addedCount: number,
  mergedCount: number
): MotivationalToast => {
  if (addedCount > 0 && mergedCount === 0) {
    return {
      type: 'dose_taken',
      message: `✨ ${addedCount} new medication${addedCount > 1 ? 's' : ''} added!`,
      emoji: '✨',
    };
  }
  
  if (mergedCount > 0) {
    return {
      type: 'dose_taken',
      message: `🔀 ${mergedCount} medication${mergedCount > 1 ? 's' : ''} updated!`,
      emoji: '🔀',
    };
  }
  
  return {
    type: 'encouragement',
    message: '📋 Import processed successfully!',
    emoji: '📋',
  };
};
