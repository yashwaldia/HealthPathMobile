// services/shareCardService.ts
/**
 * Share Card Service
 * Handles Firebase data fetching and transformation for share cards
 */

import auth from '@/config/firebaseConfig';
import { firestore } from '@/config/firebaseConfig';
import type { VitalRecord } from '@/types/vitals';
import type { UserProfile } from '@/types/profile';
import type { 
  ShareCardData, 
  BMICardData, 
  HeartRateCardData,
  BloodPressureCardData,
  VitalsSummaryCardData,
  WeeklyReportCardData,
  WellnessProgressCardData,
  MotherCareCardData,
  ChildGrowthCardData,
  FitnessCalculatorCardData,
} from '@/types/shareCard';
import type { BmiResult, HrZonesResult } from '@/types/fitcalc';
import type { WellnessModuleProfile, MotherCareProfile, ChildCareProfile } from '@/types/wellness';
import {
  formatCardDate,
  getRelativeTime,
  formatBloodPressure,
  formatHeartRate,
  formatBMI,
  formatWeight,
  formatHeight,
  getBMICategory,
  getBloodPressureStatus,
  getHeartRateStatus,
  getOverallHealthStatus,
  calculateTrend,
  formatDateRange,
} from '@/utils/shareCardHelpers';
import { getMotivationalMessage } from '@/constants/shareCardConfig';

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

// ... (Rest of the generate functions remain the same - generateVitalsSummaryCardData, generateWeeklyReportCardData)

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
  generateBMICardData,
  generateHeartRateCardData,
  generateBloodPressureCardData,
  // generateVitalsSummaryCardData, // Uncomment when added
  // generateWeeklyReportCardData,  // Uncomment when added
};

export default shareCardService;
