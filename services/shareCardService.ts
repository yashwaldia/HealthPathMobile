// services/shareCardService.ts

/**
 * Share Card Service
 * Handles Firebase data fetching and transformation for share cards
 */

import auth, { firestore } from '@/config/firebaseConfig';
import { CARD_COLORS, getMotivationalMessage } from '@/constants/shareCardConfig';
import type { BmiResult, HrZonesResult } from '@/types/fitcalc';
import type { UserProfile } from '@/types/profile';
import type {
  BMICardData,
  BloodPressureCardData,
  ChildGrowthCardData,
  FitnessCalculatorCardData,
  HeartRateCardData,
  MotherCareCardData,
  VitalsSummaryCardData,
  WeeklyReportCardData,
  WellnessProgressCardData
} from '@/types/shareCard';
import type { VitalRecord, VitalStatus } from '@/types/vitals';
import type {
  ChildCareProfile,
  DailyTracking,
  MotherCareProfile,
  WellnessModuleProfile
} from '@/types/wellness';
import {
  calculateTrend,
  formatBMI,
  formatBloodPressure,
  formatCardDate,
  formatDateRange,
  formatHeight,
  formatWeight,
  getBMICategory,
  getBloodPressureStatus,
  getHeartRateStatus,
  getOverallHealthStatus,
  getRelativeTime
} from '@/utils/shareCardHelpers';
import motivationalCardService from './motivationalCardService';

// ============================================================================
// HELPER: GET CURRENT USER ID
// ============================================================================

function getCurrentUserId(): string {
  const userId = auth().currentUser?.uid;
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}

// ============================================================================
// FETCH USER PROFILE
// ============================================================================

/**
 * Fetch user profile from Firebase
 */
export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    const userId = getCurrentUserId();
    const userDoc = await firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.warn('User profile not found');
      return null;
    }
    
    return userDoc.data() as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// ============================================================================
// FETCH VITALS DATA
// ============================================================================

/**
 * Fetch latest vital record
 */
export async function fetchLatestVitals(): Promise<VitalRecord | null> {
  try {
    const userId = getCurrentUserId();
    const vitalsSnap = await firestore()
      .collection('users')
      .doc(userId)
      .collection('vitals')
      .orderBy('date', 'desc')
      .limit(1)
      .get();
    
    if (vitalsSnap.empty) {
      console.warn('No vitals data found');
      return null;
    }
    
    return vitalsSnap.docs[0].data() as VitalRecord;
  } catch (error) {
    console.error('Error fetching latest vitals:', error);
    return null;
  }
}

/**
 * Fetch vitals for the last 7 days
 */
export async function fetchWeeklyVitals(): Promise<VitalRecord[]> {
  try {
    const userId = getCurrentUserId();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const vitalsSnap = await firestore()
      .collection('users')
      .doc(userId)
      .collection('vitals')
      .where('date', '>=', sevenDaysAgo.toISOString())
      .orderBy('date', 'desc')
      .limit(100)
      .get();
    
    return vitalsSnap.docs.map(doc => doc.data() as VitalRecord);
  } catch (error) {
    console.error('Error fetching weekly vitals:', error);
    return [];
  }
}

// ============================================================================
// FETCH WELLNESS DATA
// ============================================================================

/**
 * Fetch active wellness module profile
 */
export async function fetchWellnessModule(): Promise<WellnessModuleProfile | null> {
  try {
    const userId = getCurrentUserId();
    const wellnessSnap = await firestore()
      .collection('users')
      .doc(userId)
      .collection('wellness')
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (wellnessSnap.empty) {
      return null;
    }
    
    return wellnessSnap.docs[0].data() as WellnessModuleProfile;
  } catch (error) {
    console.error('Error fetching wellness module:', error);
    return null;
  }
}

/**
 * Fetch mother care profile
 */
export async function fetchMotherCareProfile(): Promise<MotherCareProfile | null> {
  try {
    const userId = getCurrentUserId();
    const motherCareDoc = await firestore()
      .collection('users')
      .doc(userId)
      .collection('wellness')
      .doc('mother-care')
      .get();
    
    if (!motherCareDoc.exists) {
      return null;
    }
    
    return motherCareDoc.data() as MotherCareProfile;
  } catch (error) {
    console.error('Error fetching mother care profile:', error);
    return null;
  }
}

/**
 * Fetch child care profile
 */
export async function fetchChildCareProfile(): Promise<ChildCareProfile | null> {
  try {
    const userId = getCurrentUserId();
    const childCareDoc = await firestore()
      .collection('users')
      .doc(userId)
      .collection('wellness')
      .doc('child-care')
      .get();
    
    if (!childCareDoc.exists) {
      return null;
    }
    
    return childCareDoc.data() as ChildCareProfile;
  } catch (error) {
    console.error('Error fetching child care profile:', error);
    return null;
  }
}

/**
 * Fetch daily tracking data for wellness module
 */
export async function fetchWellnessDailyTracking(moduleType: string): Promise<DailyTracking[]> {
  try {
    const userId = getCurrentUserId();
    const trackingSnap = await firestore()
      .collection('users')
      .doc(userId)
      .collection('wellness')
      .doc(moduleType)
      .collection('tracking')
      .orderBy('date', 'desc')
      .limit(30)
      .get();
    
    return trackingSnap.docs.map(doc => doc.data() as DailyTracking);
  } catch (error) {
    console.error('Error fetching wellness daily tracking:', error);
    return [];
  }
}

// ============================================================================
// GENERATE BMI CARD DATA
// ============================================================================

export async function generateBMICardData(): Promise<BMICardData | null> {
  try {
    const profile = await fetchUserProfile();
    
    if (!profile?.profile.height || !profile?.profile.weight) {
      throw new Error('Height and weight data missing');
    }
    
    const heightM = parseFloat(profile.profile.height) / 100;
    const weightKg = parseFloat(profile.profile.weight);
    const bmiValue = weightKg / (heightM * heightM);
    const category = getBMICategory(bmiValue);
    
    const bmiResult: BmiResult = {
      value: formatBMI(bmiValue),
      category,
      hint: category === 'Normal weight'
        ? 'You are within the healthy BMI range'
        : 'Consider consulting a healthcare professional',
      categoryClass: `category-${category.toLowerCase().replace(' ', '-')}` as any,
    };
    
    return {
      cardType: 'bmi',
      userName: profile.profile.fullName || profile.displayName,
      date: new Date().toISOString(),
      generatedAt: new Date(),
      bmi: bmiResult,
      stats: {
        weight: formatWeight(weightKg),
        height: formatHeight(parseFloat(profile.profile.height)),
        healthyRange: '18.5-24.9',
      },
      motivationalText: getMotivationalMessage('bmi', category.toLowerCase().replace(' ', '')),
    };
  } catch (error) {
    console.error('Error generating BMI card:', error);
    return null;
  }
}

// ============================================================================
// GENERATE HEART RATE CARD DATA
// ============================================================================

export async function generateHeartRateCardData(): Promise<HeartRateCardData | null> {
  try {
    const [profile, latestVitals, weeklyVitals] = await Promise.all([
      fetchUserProfile(),
      fetchLatestVitals(),
      fetchWeeklyVitals(),
    ]);
    
    if (!latestVitals?.heartRate) {
      throw new Error('Heart rate data missing');
    }
    
    // Calculate 7-day average
    const weeklyHRs = weeklyVitals
      .filter(v => v.heartRate)
      .map(v => v.heartRate!);
    const sevenDayAverage = weeklyHRs.length > 0
      ? weeklyHRs.reduce((a, b) => a + b, 0) / weeklyHRs.length
      : latestVitals.heartRate;
    
    // Calculate trend
    const previousHR = weeklyHRs.length > 1 ? weeklyHRs[1] : latestVitals.heartRate;
    const trend = calculateTrend(latestVitals.heartRate, previousHR);
    const status = getHeartRateStatus(latestVitals.heartRate);
    
    // Generate HR zones if age available
    let zones: HrZonesResult | undefined;
    if (profile?.profile.age) {
      const age = parseInt(profile.profile.age);
      const maxHR = 220 - age;
      zones = {
        maxHR,
        zone1: `${Math.round(maxHR * 0.5)}-${Math.round(maxHR * 0.6)}`,
        zone2: `${Math.round(maxHR * 0.6)}-${Math.round(maxHR * 0.7)}`,
        zone3: `${Math.round(maxHR * 0.7)}-${Math.round(maxHR * 0.8)}`,
        zone4: `${Math.round(maxHR * 0.8)}-${Math.round(maxHR * 0.9)}`,
        zone5: `${Math.round(maxHR * 0.9)}-${Math.round(maxHR * 1.0)}`,
      };
    }
    
    return {
      cardType: 'heart-rate',
      userName: profile?.profile.fullName || profile?.displayName || 'User',
      date: latestVitals.date,
      generatedAt: new Date(),
      heartRate: {
        current: latestVitals.heartRate,
        resting: latestVitals.pulseRate,
        sevenDayAverage: Math.round(sevenDayAverage),
        status,
        trend: trend.direction,
        trendPercentage: trend.percentage,
      },
      zones,
      motivationalText: getMotivationalMessage('heart-rate', status.toLowerCase()),
    };
  } catch (error) {
    console.error('Error generating heart rate card:', error);
    return null;
  }
}

// ============================================================================
// GENERATE BLOOD PRESSURE CARD DATA
// ============================================================================

export async function generateBloodPressureCardData(): Promise<BloodPressureCardData | null> {
  try {
    const [profile, latestVitals, weeklyVitals] = await Promise.all([
      fetchUserProfile(),
      fetchLatestVitals(),
      fetchWeeklyVitals(),
    ]);
    
    if (!latestVitals?.bloodPressureSystolic || !latestVitals?.bloodPressureDiastolic) {
      throw new Error('Blood pressure data missing');
    }
    
    const status = getBloodPressureStatus(
      latestVitals.bloodPressureSystolic,
      latestVitals.bloodPressureDiastolic
    );
    
    // Calculate 7-day average BP
    const weeklyBPs = weeklyVitals.filter(
      v => v.bloodPressureSystolic && v.bloodPressureDiastolic
    );
    
    let sevenDayAverage: { systolic: number; diastolic: number } | undefined;
    if (weeklyBPs.length > 0) {
      const avgSys = weeklyBPs.reduce((a, b) => a + b.bloodPressureSystolic!, 0) / weeklyBPs.length;
      const avgDia = weeklyBPs.reduce((a, b) => a + b.bloodPressureDiastolic!, 0) / weeklyBPs.length;
      sevenDayAverage = {
        systolic: Math.round(avgSys),
        diastolic: Math.round(avgDia),
      };
    }
    
    const statusColors: Record<string, string> = {
      'Normal': '#22c55e',
      'Elevated': '#f59e0b',
      'High': '#ef4444',
      'Very High': '#dc2626',
      'Low': '#f59e0b',
    };
    
    return {
      cardType: 'blood-pressure',
      userName: profile?.profile.fullName || profile?.displayName || 'User',
      date: latestVitals.date,
      generatedAt: new Date(),
      bloodPressure: {
        systolic: latestVitals.bloodPressureSystolic,
        diastolic: latestVitals.bloodPressureDiastolic,
        status,
        statusColor: statusColors[status] || '#6b7280',
      },
      pulse: latestVitals.heartRate || latestVitals.pulseRate,
      sevenDayAverage,
      lastChecked: getRelativeTime(latestVitals.date),
      motivationalText: getMotivationalMessage('blood-pressure', status.toLowerCase().replace(' ', '')),
    };
  } catch (error) {
    console.error('Error generating blood pressure card:', error);
    return null;
  }
}

// ============================================================================
// GENERATE VITALS SUMMARY CARD DATA
// ============================================================================

export async function generateVitalsSummaryCardData(): Promise<VitalsSummaryCardData | null> {
  try {
    const [profile, latestVitals, weeklyVitals] = await Promise.all([
      fetchUserProfile(),
      fetchLatestVitals(),
      fetchWeeklyVitals(),
    ]);
    
    if (!latestVitals) {
      throw new Error('No vitals data available');
    }
    
    const vitalsData: VitalsSummaryCardData['vitals'] = {};
    let normalCount = 0;
    let totalCount = 0;
    
    // Blood Pressure
    if (latestVitals.bloodPressureSystolic && latestVitals.bloodPressureDiastolic) {
      const bpStatus = getBloodPressureStatus(
        latestVitals.bloodPressureSystolic,
        latestVitals.bloodPressureDiastolic
      );
      const vitalStatus: VitalStatus = bpStatus === 'Normal' ? 'normal' : 
                                       bpStatus === 'Elevated' ? 'alert' : 'critical';
      vitalsData.bloodPressure = {
        systolic: latestVitals.bloodPressureSystolic,
        diastolic: latestVitals.bloodPressureDiastolic,
        status: vitalStatus,
        icon: 'pulse-outline',
      };
      totalCount++;
      if (vitalStatus === 'normal') normalCount++;
    }
    
    // Heart Rate
    if (latestVitals.heartRate) {
      const hrStatus = getHeartRateStatus(latestVitals.heartRate);
      const vitalStatus: VitalStatus = hrStatus === 'Excellent' || hrStatus === 'Good' ? 'normal' :
                                       hrStatus === 'Fair' ? 'alert' : 'critical';
      vitalsData.heartRate = {
        value: latestVitals.heartRate,
        status: vitalStatus,
        icon: 'heart-outline',
      };
      totalCount++;
      if (vitalStatus === 'normal') normalCount++;
    }
    
    // Blood Sugar
    if (latestVitals.bloodSugarFasting || latestVitals.bloodSugarPostMeal) {
      const bsValue = latestVitals.bloodSugarFasting || latestVitals.bloodSugarPostMeal!;
      const type = latestVitals.bloodSugarFasting ? 'fasting' : 'postmeal';
      const normalRange = type === 'fasting' ? [70, 100] : [70, 140];
      const vitalStatus: VitalStatus = bsValue >= normalRange[0] && bsValue <= normalRange[1] ? 'normal' :
                                       bsValue > normalRange[1] + 40 ? 'critical' : 'alert';
      vitalsData.bloodSugar = {
        value: bsValue,
        type,
        status: vitalStatus,
        icon: 'water-outline',
      };
      totalCount++;
      if (vitalStatus === 'normal') normalCount++;
    }
    
    // Weight
    if (latestVitals.weightKg) {
      const previousWeight = weeklyVitals.length > 1 ? weeklyVitals[1].weightKg : latestVitals.weightKg;
      const change = previousWeight ? latestVitals.weightKg - previousWeight : 0;
      vitalsData.weight = {
        value: latestVitals.weightKg,
        change,
        icon: 'scale-outline',
      };
    }
    
    // Temperature
    if (latestVitals.temperature) {
      const vitalStatus: VitalStatus = latestVitals.temperature >= 36.1 && latestVitals.temperature <= 37.2 ? 'normal' :
                                       latestVitals.temperature > 38.5 ? 'critical' : 'alert';
      vitalsData.temperature = {
        value: latestVitals.temperature,
        status: vitalStatus,
        icon: 'thermometer-outline',
      };
      totalCount++;
      if (vitalStatus === 'normal') normalCount++;
    }
    
    // Oxygen Saturation
    if (latestVitals.oxygenSaturation) {
      const vitalStatus: VitalStatus = latestVitals.oxygenSaturation >= 95 ? 'normal' :
                                       latestVitals.oxygenSaturation < 90 ? 'critical' : 'alert';
      vitalsData.oxygenSaturation = {
        value: latestVitals.oxygenSaturation,
        status: vitalStatus,
        icon: 'fitness-outline',
      };
      totalCount++;
      if (vitalStatus === 'normal') normalCount++;
    }
    
    const overallStatus = getOverallHealthStatus(totalCount, normalCount);
    
    return {
      cardType: 'vitals-summary',
      userName: profile?.profile.fullName || profile?.displayName || 'User',
      date: latestVitals.date,
      generatedAt: new Date(),
      vitals: vitalsData,
      overallStatus,
    };
  } catch (error) {
    console.error('Error generating vitals summary card:', error);
    return null;
  }
}

// ============================================================================
// GENERATE WEEKLY REPORT CARD DATA
// ============================================================================

export async function generateWeeklyReportCardData(): Promise<WeeklyReportCardData | null> {
  try {
    const [profile, weeklyVitals] = await Promise.all([
      fetchUserProfile(),
      fetchWeeklyVitals(),
    ]);
    
    if (weeklyVitals.length === 0) {
      throw new Error('No weekly vitals data available');
    }
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const dateRangeFormatted = formatDateRange(startDate, endDate);
    
    // Calculate stats
    const daysLogged = new Set(weeklyVitals.map(v => v.date.split('T')[0])).size;
    const streak = daysLogged; // Simplified streak calculation
    
    // Calculate averages
    const keyMetrics: WeeklyReportCardData['keyMetrics'] = {};
    
    // Blood Pressure Average
    const bpReadings = weeklyVitals.filter(v => v.bloodPressureSystolic && v.bloodPressureDiastolic);
    if (bpReadings.length > 0) {
      const avgSys = Math.round(bpReadings.reduce((a, b) => a + b.bloodPressureSystolic!, 0) / bpReadings.length);
      const avgDia = Math.round(bpReadings.reduce((a, b) => a + b.bloodPressureDiastolic!, 0) / bpReadings.length);
      const bpStatus = getBloodPressureStatus(avgSys, avgDia);
      const vitalStatus: VitalStatus = bpStatus === 'Normal' ? 'normal' : 
                                       bpStatus === 'Elevated' ? 'alert' : 'critical';
      keyMetrics.bloodPressure = {
        average: formatBloodPressure(avgSys, avgDia),
        status: vitalStatus,
      };
    }
    
    // Heart Rate Average
    const hrReadings = weeklyVitals.filter(v => v.heartRate);
    if (hrReadings.length > 0) {
      const avgHR = Math.round(hrReadings.reduce((a, b) => a + b.heartRate!, 0) / hrReadings.length);
      const hrStatus = getHeartRateStatus(avgHR);
      const vitalStatus: VitalStatus = hrStatus === 'Excellent' || hrStatus === 'Good' ? 'normal' :
                                       hrStatus === 'Fair' ? 'alert' : 'critical';
      keyMetrics.heartRate = {
        average: avgHR,
        status: vitalStatus,
      };
    }
    
    // Weight Tracking
    const weightReadings = weeklyVitals.filter(v => v.weightKg).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    if (weightReadings.length > 0) {
      const currentWeight = weightReadings[weightReadings.length - 1].weightKg!;
      const startWeight = weightReadings[0].weightKg!;
      const change = currentWeight - startWeight;
      keyMetrics.weight = {
        current: currentWeight,
        change,
      };
    }
    
    // Blood Sugar Average
    const bsReadings = weeklyVitals.filter(v => v.bloodSugarFasting || v.bloodSugarPostMeal);
    if (bsReadings.length > 0) {
      const avgBS = Math.round(bsReadings.reduce((a, b) => 
        a + (b.bloodSugarFasting || b.bloodSugarPostMeal!), 0
      ) / bsReadings.length);
      const vitalStatus: VitalStatus = avgBS >= 70 && avgBS <= 120 ? 'normal' :
                                       avgBS > 180 ? 'critical' : 'alert';
      keyMetrics.bloodSugar = {
        average: avgBS,
        status: vitalStatus,
      };
    }
    
    // Achievements
    const achievements: string[] = [];
    if (daysLogged >= 7) achievements.push('🔥 Perfect week! Logged all 7 days');
    if (daysLogged >= 5) achievements.push('⭐ Great consistency');
    if (keyMetrics.bloodPressure?.status === 'normal') achievements.push('💚 Healthy BP all week');
    if (keyMetrics.weight?.change && keyMetrics.weight.change < 0) achievements.push('📉 Weight trending down');
    
    return {
      cardType: 'weekly-report',
      userName: profile?.profile.fullName || profile?.displayName || 'User',
      date: endDate.toISOString(),
      generatedAt: new Date(),
      dateRange: dateRangeFormatted,
      stats: {
        daysLogged,
        totalDays: 7,
        streak,
      },
      keyMetrics,
      achievements: achievements.slice(0, 3),
    };
  } catch (error) {
    console.error('Error generating weekly report card:', error);
    return null;
  }
}

// ============================================================================
// GENERATE WELLNESS PROGRESS CARD DATA
// ============================================================================

export async function generateWellnessProgressCardData(): Promise<WellnessProgressCardData | null> {
  try {
    const [profile, wellnessModule] = await Promise.all([
      fetchUserProfile(),
      fetchWellnessModule(),
    ]);
    
    if (!wellnessModule) {
      throw new Error('No active wellness module found');
    }
    
    // Fetch tracking data
    const trackingData = await fetchWellnessDailyTracking(wellnessModule.moduleType);
    
    // Calculate progress
    const completedTasks = trackingData
      .flatMap(day => day.tasks.filter(t => t.completed))
      .length;
    const totalTasks = trackingData.flatMap(day => day.tasks).length;
    
    const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculate streak
    let currentStreak = 0;
    const sortedDays = trackingData.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    for (const day of sortedDays) {
      if (day.overallCompletion >= 80) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Determine module metadata
    const moduleNames: Record<string, string> = {
      'mother-care': '30-Day Pregnancy Care',
      'child-care': '30-Day Child Wellness',
      'liver-kidney': '30-Day Liver & Kidney Detox',
      'skin-hair': '30-Day Skin & Hair Care',
      'gut-health': '30-Day Gut Health',
      'bone-joint': '30-Day Bone & Joint Care',
      'teeth-oral': '30-Day Oral Hygiene',
      'beauty-fitness': '30-Day Beauty & Fitness',
    };
    
    const moduleIcons: Record<string, string> = {
      'mother-care': 'woman-outline',
      'child-care': 'people-outline',
      'liver-kidney': 'fitness-outline',
      'skin-hair': 'sparkles-outline',
      'gut-health': 'nutrition-outline',
      'bone-joint': 'body-outline',
      'teeth-oral': 'happy-outline',
      'beauty-fitness': 'barbell-outline',
    };
    
    // Next milestone
    let nextMilestone;
    if (wellnessModule.currentDay < wellnessModule.programDuration) {
      const milestoneDays = [7, 14, 21, wellnessModule.programDuration];
      const upcomingMilestone = milestoneDays.find(day => day > wellnessModule.currentDay);
      if (upcomingMilestone) {
        nextMilestone = {
          day: upcomingMilestone,
          description: upcomingMilestone === wellnessModule.programDuration 
            ? 'Complete the program!' 
            : `Week ${Math.ceil(upcomingMilestone / 7)} milestone`,
        };
      }
    }
    
    const streakIcon = currentStreak >= 7 ? '🔥' : currentStreak >= 5 ? '⭐' : '💪';
    
    return {
      cardType: 'wellness-progress',
      userName: profile?.profile.fullName || profile?.displayName || 'User',
      date: new Date().toISOString(),
      generatedAt: new Date(),
      module: {
        type: wellnessModule.moduleType,
        name: moduleNames[wellnessModule.moduleType] || 'Wellness Program',
        icon: moduleIcons[wellnessModule.moduleType] || 'heart-outline',
        color: CARD_COLORS.gradient.wellness[0],
      },
      progress: {
        currentDay: wellnessModule.currentDay,
        totalDays: wellnessModule.programDuration,
        percentage: Math.round(percentage),
        tasksCompleted: completedTasks,
        totalTasks: totalTasks > 0 ? totalTasks : 1,
      },
      streak: {
        current: currentStreak,
        icon: streakIcon,
      },
      nextMilestone,
      motivationalText: getMotivationalMessage('wellness-progress', 'onTrack'),
    };
  } catch (error) {
    console.error('Error generating wellness progress card:', error);
    return null;
  }
}

// ============================================================================
// GENERATE MOTHER CARE CARD DATA
// ============================================================================

export async function generateMotherCareCardData(): Promise<MotherCareCardData | null> {
  try {
    const [profile, motherCareProfile, latestVitals] = await Promise.all([
      fetchUserProfile(),
      fetchMotherCareProfile(),
      fetchLatestVitals(),
    ]);
    
    if (!motherCareProfile) {
      throw new Error('No mother care profile found');
    }
    
    // Calculate days until due
    const dueDate = new Date(motherCareProfile.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get baby size emoji and description
    const babySizeData: Record<number, { emoji: string; size: string }> = {
      4: { emoji: '🫘', size: 'Poppy seed' },
      5: { emoji: '🫘', size: 'Sesame seed' },
      6: { emoji: '🫘', size: 'Lentil' },
      7: { emoji: '🫘', size: 'Blueberry' },
      8: { emoji: '🫐', size: 'Raspberry' },
      9: { emoji: '🍇', size: 'Grape' },
      10: { emoji: '🍓', size: 'Strawberry' },
      11: { emoji: '🍋', size: 'Lime' },
      12: { emoji: '🍈', size: 'Plum' },
      13: { emoji: '🍋', size: 'Lemon' },
      14: { emoji: '🍑', size: 'Peach' },
      15: { emoji: '🍎', size: 'Apple' },
      16: { emoji: '🍊', size: 'Orange' },
      17: { emoji: '🥑', size: 'Avocado' },
      18: { emoji: '🍠', size: 'Sweet potato' },
      19: { emoji: '🍌', size: 'Banana' },
      20: { emoji: '🥭', size: 'Mango' },
      24: { emoji: '🌽', size: 'Corn' },
      28: { emoji: '🍆', size: 'Eggplant' },
      32: { emoji: '🥥', size: 'Coconut' },
      36: { emoji: '🍈', size: 'Honeydew melon' },
      40: { emoji: '🍉', size: 'Watermelon' },
    };
    
    const week = motherCareProfile.currentWeekOfPregnancy;
    const babySizeKey = Object.keys(babySizeData)
      .map(Number)
      .sort((a, b) => a - b)
      .reverse()
      .find(w => week >= w) || 4;
    
    const babyData = babySizeData[babySizeKey];
    
    // Recent stats
    const recentStats: MotherCareCardData['recentStats'] = {};
    
    if (latestVitals?.weightKg) {
      recentStats.weight = `${latestVitals.weightKg.toFixed(1)} kg`;
    }
    
    if (latestVitals?.bloodPressureSystolic && latestVitals?.bloodPressureDiastolic) {
      recentStats.bloodPressure = formatBloodPressure(
        latestVitals.bloodPressureSystolic,
        latestVitals.bloodPressureDiastolic
      );
      const bpStatus = getBloodPressureStatus(
        latestVitals.bloodPressureSystolic,
        latestVitals.bloodPressureDiastolic
      );
      recentStats.bloodPressureStatus = bpStatus === 'Normal' ? 'normal' :
                                        bpStatus === 'Elevated' ? 'alert' : 'critical';
    }
    
    // Milestone message
    let milestone: string | undefined;
    if (week === 12) milestone = 'Baby can now make facial expressions!';
    else if (week === 20) milestone = 'Baby can hear your voice!';
    else if (week === 24) milestone = 'Baby\'s lungs are developing!';
    else if (week === 28) milestone = 'Baby can open and close eyes!';
    else if (week === 32) milestone = 'Baby is practicing breathing!';
    else if (week === 36) milestone = 'Baby is getting ready for birth!';
    else if (week >= 37) milestone = 'Full term - baby can arrive anytime!';
    
    return {
      cardType: 'mother-care',
      userName: profile?.profile.fullName || profile?.displayName || 'User',
      date: new Date().toISOString(),
      generatedAt: new Date(),
      pregnancy: {
        week: motherCareProfile.currentWeekOfPregnancy,
        day: motherCareProfile.currentDayOfPregnancy,
        trimester: motherCareProfile.trimester,
        babySize: babyData.size,
        babySizeEmoji: babyData.emoji,
        daysUntilDue,
      },
      recentStats,
      milestone,
    };
  } catch (error) {
    console.error('Error generating mother care card:', error);
    return null;
  }
}

// ============================================================================
// GENERATE CHILD GROWTH CARD DATA
// ============================================================================

export async function generateChildGrowthCardData(): Promise<ChildGrowthCardData | null> {
  try {
    const [profile, childCareProfile] = await Promise.all([
      fetchUserProfile(),
      fetchChildCareProfile(),
    ]);
    
    if (!childCareProfile) {
      throw new Error('No child care profile found');
    }
    
    // Get latest growth record
    const latestGrowth = childCareProfile.growthRecords && childCareProfile.growthRecords.length > 0
      ? childCareProfile.growthRecords[childCareProfile.growthRecords.length - 1]
      : null;
    
    if (!latestGrowth) {
      throw new Error('No growth records found');
    }
    
    // Calculate percentiles (simplified - in production, use WHO growth charts)
    const calculatePercentile = (value: number, age: number, type: 'height' | 'weight'): number => {
      // This is a simplified calculation. In production, use WHO/CDC growth charts
      if (type === 'height') {
        return Math.min(99, Math.max(1, 50 + ((value - 75) / 2)));
      } else {
        return Math.min(99, Math.max(1, 50 + ((value - 10) / 0.5)));
      }
    };
    
    const heightValue = parseFloat(latestGrowth.heightCm);
    const weightValue = parseFloat(latestGrowth.weightKg);
    
    // Determine vaccination status
    let vaccinationStatus: 'Completed' | 'Missed' | 'Pending' | 'Upcoming' = 'Pending';
    if (childCareProfile.vaccinations) {
      const statusValues = Object.values(childCareProfile.vaccinations);
      if (statusValues.every(s => s === 'Completed')) {
        vaccinationStatus = 'Completed';
      } else if (statusValues.some(s => s === 'Missed')) {
        vaccinationStatus = 'Missed';
      } else if (statusValues.some(s => s === 'Upcoming')) {
        vaccinationStatus = 'Upcoming';
      }
    }
    
    // Recent milestone based on age
    let recentMilestone: string | undefined;
    const ageMonths = childCareProfile.ageInMonths;
    if (ageMonths >= 12) recentMilestone = 'Walking independently';
    else if (ageMonths >= 9) recentMilestone = 'Crawling and cruising';
    else if (ageMonths >= 6) recentMilestone = 'Sitting without support';
    else if (ageMonths >= 4) recentMilestone = 'Rolling over';
    else if (ageMonths >= 2) recentMilestone = 'Social smiling';
    
    // Next checkup (usually every 2-3 months for infants)
    const nextCheckupDate = new Date();
    nextCheckupDate.setMonth(nextCheckupDate.getMonth() + 2);
    
    return {
      cardType: 'child-growth',
      userName: profile?.profile.fullName || profile?.displayName || 'User',
      date: latestGrowth.date,
      generatedAt: new Date(),
      child: {
        name: childCareProfile.childName || 'My Baby',
        ageInMonths: childCareProfile.ageInMonths,
        gender: childCareProfile.gender,
      },
      growth: {
        height: {
          value: `${heightValue} cm`,
          percentile: Math.round(calculatePercentile(heightValue, ageMonths, 'height')),
        },
        weight: {
          value: `${weightValue} kg`,
          percentile: Math.round(calculatePercentile(weightValue, ageMonths, 'weight')),
        },
      },
      recentMilestone,
      vaccinationStatus,
      nextCheckup: formatCardDate(nextCheckupDate),
    };
  } catch (error) {
    console.error('Error generating child growth card:', error);
    return null;
  }
}

// ============================================================================
// GENERATE FITNESS CALCULATOR CARD DATA
// ============================================================================

export async function generateFitnessCalculatorCardData(
  calculatorType: 'bmi' | 'bmr' | 'tdee' | 'vo2max' | 'hr-zones' | 'macros',
  calculatorResult: any
): Promise<FitnessCalculatorCardData | null> {
  try {
    const profile = await fetchUserProfile();
    
    const calculatorNames: Record<string, string> = {
      'bmi': 'Body Mass Index',
      'bmr': 'Basal Metabolic Rate',
      'tdee': 'Daily Energy Expenditure',
      'vo2max': 'VO₂ Max',
      'hr-zones': 'Heart Rate Zones',
      'macros': 'Macro Calculator',
    };
    
    const calculatorIcons: Record<string, string> = {
      'bmi': 'fitness-outline',
      'bmr': 'flame-outline',
      'tdee': 'analytics-outline',
      'vo2max': 'speedometer-outline',
      'hr-zones': 'heart-outline',
      'macros': 'nutrition-outline',
    };
    
    let mainValue: string = '';
    let status: string | undefined;
    let breakdown: { label: string; value: string }[] | undefined;
    
    // Format result based on calculator type
    switch (calculatorType) {
      case 'bmi':
        mainValue = `${calculatorResult.value} BMI`;
        status = calculatorResult.category;
        break;
      
      case 'bmr':
        mainValue = `${calculatorResult.value} kcal/day`;
        status = 'Your base metabolic rate';
        break;
      
      case 'tdee':
        mainValue = `${calculatorResult.target} kcal/day`;
        status = 'Your daily calorie target';
        breakdown = [
          { label: 'Maintenance', value: `${calculatorResult.tdee} kcal` },
        ];
        break;
      
      case 'vo2max':
        mainValue = `${calculatorResult.value} ml/kg/min`;
        const vo2Status = parseFloat(calculatorResult.value) > 45 ? 'Excellent' :
                         parseFloat(calculatorResult.value) > 35 ? 'Good' :
                         parseFloat(calculatorResult.value) > 25 ? 'Fair' : 'Needs Improvement';
        status = vo2Status;
        break;
      
      case 'hr-zones':
        mainValue = `Max HR: ${calculatorResult.maxHR} BPM`;
        breakdown = [
          { label: 'Zone 1 (Recovery)', value: calculatorResult.zone1 },
          { label: 'Zone 2 (Endurance)', value: calculatorResult.zone2 },
          { label: 'Zone 3 (Aerobic)', value: calculatorResult.zone3 },
          { label: 'Zone 4 (Anaerobic)', value: calculatorResult.zone4 },
          { label: 'Zone 5 (Max)', value: calculatorResult.zone5 },
        ];
        break;
      
      case 'macros':
        mainValue = `${calculatorResult.kcal.total} kcal/day`;
        breakdown = [
          { label: 'Protein', value: `${calculatorResult.protein}g` },
          { label: 'Carbs', value: `${calculatorResult.carbs}g` },
          { label: 'Fat', value: `${calculatorResult.fat}g` },
        ];
        break;
    }
    
    return {
      cardType: 'fitness-calculator',
      userName: profile?.profile.fullName || profile?.displayName || 'User',
      date: new Date().toISOString(),
      generatedAt: new Date(),
      calculator: {
        type: calculatorType,
        name: calculatorNames[calculatorType],
        icon: calculatorIcons[calculatorType],
      },
      result: {
        mainValue,
        unit: '',
        status,
      },
      breakdown,
      motivationalText: 'Track. Analyze. Thrive with PI HEALTH! 🚀',
    };
  } catch (error) {
    console.error('Error generating fitness calculator card:', error);
    return null;
  }
}

// ============================================================================
// EXPORT ALL GENERATORS
// ============================================================================

export const shareCardService = {
  fetchUserProfile,
  fetchLatestVitals,
  fetchWeeklyVitals,
  fetchWellnessModule,
  fetchMotherCareProfile,
  fetchChildCareProfile,
  fetchWellnessDailyTracking,
  generateBMICardData,
  generateHeartRateCardData,
  generateBloodPressureCardData,
  generateVitalsSummaryCardData,
  generateWeeklyReportCardData,
  generateWellnessProgressCardData,
  generateMotherCareCardData,
  generateChildGrowthCardData,
  generateFitnessCalculatorCardData,
  motivationalCardService,
};

export default shareCardService;
