// app/(tabs)/fitcalc.tsx

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // âœ… ADD THIS
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, AppState, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // âœ… ADD AppState
import { SafeAreaView } from 'react-native-safe-area-context';
import { FitCalcCard } from '../../components/fitcalc/FitCalcCard';
import { FitCalcChart } from '../../components/fitcalc/FitCalcChart';
import CustomToast from '../../components/ui/CustomToast';
import { Colors } from '../../constants/colors';
import { FITCALC_CONFIG } from '../../constants/fitcalcConfig';
import { useAuth } from '../../context/AuthContext';
import { deleteFitCalcHistoryEntry, FitCalcHistoryEntry, loadFitCalcHistory, saveFitCalcHistory } from '../../services/fitCalcService';
import {
  ActivityInputs, ActivityResult, BmiInputs, BmiResult, BmrInputs, BmrResult, BodyFatInputs, BodyFatResult,
  FitCalcId, FitCalcInputs, FitCalcResults, HrvInputs, HrvResult, HrZonesInputs, HrZonesResult,
  IdealWeightInputs, IdealWeightResult, MacrosInputs, MacrosResult, OneRmInputs, OneRmResult,
  ProteinInputs, ProteinResult, RatiosInputs, RatiosResult, RecoveryInputs, RecoveryResult,
  RunningInputs, RunningResult,
  SleepGraphResult,
  SleepQualityInputs, SleepQualityResult, // ✅ ADD THIS
  StressInputs, StressResult,
  TdeeInputs, TdeeResult, Vo2maxInputs, Vo2maxResult, WaterInputs, WaterResult
} from '../../types/fitcalc';

import {
  calculateElapsedTime,
  cancelSleepTimer,
  formatSleepDuration,
  getRecentSleepSessions, // ✅ ADD THIS
  getSleepTimerStatus,
  startSleepTimer,
  stopSleepTimer,
  updateSleepTimerNotification,
} from '../../services/sleepTimerService';
import { SleepTimerState } from '../../types/sleepTimer';

// ============================================================================
// CONSTANTS
// ============================================================================

type CategoryId = 'fitness' | 'heart' | 'dailyhealth' | 'biohacking';

const CATEGORIES = [
  { id: 'fitness' as CategoryId, label: 'Fitness', icon: 'barbell-outline' as const, calculators: ['bmi', 'bmr', 'tdee', 'macros', 'onerm', 'bodyfat', 'idealweight'] as FitCalcId[] },
  { id: 'heart' as CategoryId, label: 'Heart', icon: 'heart-outline' as const, calculators: ['hrzones', 'vo2max'] as FitCalcId[] },
  { id: 'dailyhealth' as CategoryId, label: 'Daily Health', icon: 'fitness-outline' as const, calculators: ['water', 'protein', 'activity', 'running', 'ratios'] as FitCalcId[] },
  { id: 'biohacking' as CategoryId, label: 'Biohacking', icon: 'flash-outline' as const, calculators: ['sleepquality', 'sleepgraph', 'recovery', 'hrv', 'stress'] as FitCalcId[] }, // ✅ ADDED sleepgraph
];


const MACRO_PRESETS = {
  balanced: { p: 0.3, c: 0.4, f: 0.3, note: 'P 30% / C 40% / F 30%', label: 'Balanced' },
  keto: { p: 0.2, c: 0.05, f: 0.75, note: 'P 20% / C 5% / F 75%', label: 'Ketogenic' },
  highp: { p: 0.35, c: 0.35, f: 0.3, note: 'P 35% / C 35% / F 30%', label: 'High Protein' },
  lowcarb: { p: 0.3, c: 0.25, f: 0.45, note: 'P 30% / C 25% / F 45%', label: 'Low Carb' },
};

// ============================================================================
// COMPUTATION FUNCTIONS
// ============================================================================

function computeBmi(inputs: BmiInputs): BmiResult | null {
  const height = parseFloat(inputs.height || '') / 100;
  const weight = parseFloat(inputs.weight || '');
  if (!height || !weight || height <= 0 || weight <= 0) return null;
  
  const bmi = weight / (height * height);
  const categories = [
    { max: 18.5, cat: 'Underweight', hint: 'Consider consulting a healthcare provider about healthy weight gain.', class: 'category-underweight' },
    { max: 25, cat: 'Normal weight', hint: 'Maintain your healthy weight with balanced nutrition and activity.', class: 'category-normal' },
    { max: 30, cat: 'Overweight', hint: 'Consider gradual lifestyle changes in diet and activity.', class: 'category-overweight' },
    { max: Infinity, cat: 'Obese', hint: 'Consult a healthcare provider for a personalized weight plan.', class: 'category-obese' },
  ];
  
  const result = categories.find(c => bmi < c.max)!;
  return { value: bmi.toFixed(1), category: result.cat as any, hint: result.hint, categoryClass: result.class as any };
}

function computeBmr(inputs: BmrInputs): BmrResult | null {
  const gender = inputs.gender ?? 'male';
  const age = parseFloat(inputs.age || '');
  const height = parseFloat(inputs.height || '');
  const weight = parseFloat(inputs.weight || '');
  const formula = inputs.formula ?? 'mifflin';
  
  if (!age || !height || !weight || age <= 0 || height <= 0 || weight <= 0) return null;
  
  let bmr: number;
  if (formula === 'mifflin') {
    bmr = gender === 'male' ? 10 * weight + 6.25 * height - 5 * age + 5 : 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = gender === 'male' ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age : 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  }
  
  return { value: Math.round(bmr) };
}

function computeTdee(inputs: TdeeInputs): TdeeResult | null {
  const bmr = parseFloat(inputs.bmr || '');
  const activity = parseFloat(inputs.activity || '1.55');
  const goal = inputs.goal ?? 'maintain';
  
  if (!bmr || bmr <= 0) return null;
  
  const tdee = Math.round(bmr * activity);
  const adjustments = { maintain: 0, lose: -500, gain: 500 };
  const target = Math.round(tdee + (adjustments[goal] || 0));
  
  return { tdee, target };
}

function computeMacros(inputs: MacrosInputs): MacrosResult | null {
  const calories = parseFloat(inputs.calories || '');
  if (!calories || calories <= 0) return null;
  
  const presetKey = inputs.preset ?? 'balanced';
  const preset = MACRO_PRESETS[presetKey];
  const pK = calories * preset.p;
  const cK = calories * preset.c;
  const fK = calories * preset.f;
  
  return {
    protein: Math.round(pK / 4), carbs: Math.round(cK / 4), fat: Math.round(fK / 9),
    ratios: { protein: preset.p, carbs: preset.c, fat: preset.f },
    kcal: { protein: Math.round(pK), carbs: Math.round(cK), fat: Math.round(fK), total: Math.round(calories) },
  };
}

function computeOneRm(inputs: OneRmInputs): OneRmResult | null {
  const weight = parseFloat(inputs.weight || '');
  const reps = parseFloat(inputs.reps || '');
  const formula = inputs.formula ?? 'epley';
  
  if (!weight || !reps || weight <= 0 || reps <= 0 || reps > 10) return null;
  
  if (reps === 1) return { value: Math.round(weight) };
  
  const formulas = {
    epley: weight * (1 + reps / 30),
    brzycki: weight * (36 / (37 - reps)),
    lombardi: weight * Math.pow(reps, 0.10)
  };
  
  return { value: Math.round(formulas[formula] || formulas.epley) };
}

function computeBodyFat(inputs: BodyFatInputs): BodyFatResult | null {
  const gender = inputs.gender ?? 'male';
  const height = parseFloat(inputs.height || '');
  const waist = parseFloat(inputs.waist || '');
  const neck = parseFloat(inputs.neck || '');
  const hip = parseFloat(inputs.hip || '');
  
  if (!height || !waist || !neck || height <= 0 || waist <= 0 || neck <= 0) return null;
  if (gender === 'female' && (!hip || hip <= 0)) return null;
  
  const bodyFat = gender === 'male'
    ? 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450
    : 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
  
  return { value: Math.max(bodyFat, 0).toFixed(1) };
}

function computeIdealWeight(inputs: IdealWeightInputs): IdealWeightResult | null {
  const gender = inputs.gender ?? 'male';
  const height = parseFloat(inputs.height || '');
  if (!height || height <= 0) return null;
  
  const inches = height / 2.54;
  const base = gender === 'male' ? [50, 52, 56.2] : [45.5, 49, 53.1];
  const mult = gender === 'male' ? [2.3, 1.9, 1.41] : [2.3, 1.7, 1.36];
  
  return {
    devine: Math.round((base[0] + mult[0] * (inches - 60)) * 10) / 10,
    robinson: Math.round((base[1] + mult[1] * (inches - 60)) * 10) / 10,
    miller: Math.round((base[2] + mult[2] * (inches - 60)) * 10) / 10,
  };
}

function computeHrZones(inputs: HrZonesInputs): HrZonesResult | null {
  const age = parseFloat(inputs.age || '');
  if (!age || age <= 0 || age > 120) return null;
  
  const maxHR = 220 - age;
  const zones = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  
  return {
    maxHR,
    zone1: `${Math.round(maxHR * zones[0])}-${Math.round(maxHR * zones[1])} bpm`,
    zone2: `${Math.round(maxHR * zones[1])}-${Math.round(maxHR * zones[2])} bpm`,
    zone3: `${Math.round(maxHR * zones[2])}-${Math.round(maxHR * zones[3])} bpm`,
    zone4: `${Math.round(maxHR * zones[3])}-${Math.round(maxHR * zones[4])} bpm`,
    zone5: `${Math.round(maxHR * zones[4])}-${Math.round(maxHR * zones[5])} bpm`,
  };
}

function computeVo2max(inputs: Vo2maxInputs): Vo2maxResult | null {
  const timeStr = inputs.time || '';
  if (!timeStr) return null;
  
  const parts = timeStr.split(':').map(p => parseFloat(p));
  const totalMinutes = parts.length === 2 ? parts[0] + parts[1] / 60 : parts.length === 3 ? parts[0] * 60 + parts[1] + parts[2] / 60 : 0;
  
  if (totalMinutes <= 0) return null;
  
  return { value: Math.max((483 / totalMinutes) + 3.5, 0).toFixed(1) };
}

function computeWater(inputs: WaterInputs): WaterResult | null {
  const weight = parseFloat(inputs.weight || '');
  const activity = inputs.activity ?? 'sedentary';
  if (!weight || weight <= 0) return null;
  
  const multipliers = { sedentary: 1.0, lightly: 1.1, moderately: 1.2, very: 1.3 };
  return { value: (weight * 0.033 * multipliers[activity]).toFixed(1) };
}

function computeProtein(inputs: ProteinInputs): ProteinResult | null {
  const weight = parseFloat(inputs.weight || '');
  const activity = inputs.activity ?? 'sedentary';
  const goal = inputs.goal ?? 'maintain';
  if (!weight || weight <= 0) return null;
  
  const baseProtein = { sedentary: 0.8, lightly: 1.0, moderately: 1.2, very: 1.4, athlete: 1.6 }[activity] || 0.8;
  const goalAdjust = { maintain: 1.0, lose: 1.2, gain: 1.3 }[goal] || 1.0;
  
  return { value: Math.round(weight * baseProtein * goalAdjust) };
}

function computeActivity(inputs: ActivityInputs): ActivityResult | null {
  const type = inputs.type ?? 'walking';
  const intensity = inputs.intensity ?? 'moderate';
  const duration = parseFloat(inputs.duration || '');
  const weight = parseFloat(inputs.weight || '');
  
  if (!duration || !weight || duration <= 0 || weight <= 0) return null;
  
  const metValues: any = {
    walking: { light: 3.0, moderate: 4.5, vigorous: 6.0 },
    running: { light: 8.0, moderate: 10.0, vigorous: 12.0 },
    cycling: { light: 6.0, moderate: 8.0, vigorous: 10.0 },
    swimming: { light: 5.0, moderate: 7.0, vigorous: 9.0 },
    weightlifting: { light: 3.0, moderate: 5.0, vigorous: 6.0 },
  };
  
  const met = metValues[type]?.[intensity] || 5.0;
  return { value: Math.round(met * weight * (duration / 60)) };
}

function computeRunning(inputs: RunningInputs): RunningResult | null {
  const distance = parseFloat(inputs.distance || '');
  const timeStr = inputs.time || '';
  if (!distance || distance <= 0 || !timeStr) return null;
  
  const parts = timeStr.split(':').map(p => parseFloat(p));
  const totalSeconds = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
  if (totalSeconds <= 0) return null;
  
  const paceSeconds = totalSeconds / distance;
  const paceMinutes = Math.floor(paceSeconds / 60);
  const paceSecondsRemainder = Math.round(paceSeconds % 60);
  const speed = (distance / totalSeconds) * 3600;
  
  return { pace: `${paceMinutes}:${paceSecondsRemainder.toString().padStart(2, '0')}`, speed: speed.toFixed(1) };
}

function computeRatios(inputs: RatiosInputs): RatiosResult | null {
  const height = parseFloat(inputs.height || '');
  const waist = parseFloat(inputs.waist || '');
  const hip = parseFloat(inputs.hip || '');
  
  if (!height || !waist || !hip || height <= 0 || waist <= 0 || hip <= 0) return null;
  
  return { whtr: (waist / height).toFixed(2), whr: (waist / hip).toFixed(2) };
}

// BIOHACKING CALCULATORS

function computeHrv(inputs: HrvInputs): HrvResult | null {
  const age = parseFloat(inputs.age || '');
  const energyLevel = parseFloat(inputs.energyLevel || '');
  const stressLevel = parseFloat(inputs.stressLevel || '');
  const exerciseFrequency = inputs.exerciseFrequency;
  
  if (!age || age <= 0 || !energyLevel || !stressLevel || !exerciseFrequency) return null;
  
  const energyScore = (energyLevel / 10) * 40;
  const stressScore = ((10 - stressLevel) / 10) * 35;
  const exerciseScores: any = { rarely: 5, sometimes: 10, often: 13, daily: 15 };
  const ageScore = age < 30 ? 10 : age < 40 ? 8 : age < 50 ? 6 : age < 60 ? 4 : 2;
  
  const score = Math.round(Math.min(energyScore + stressScore + (exerciseScores[exerciseFrequency] || 10) + ageScore, 100));
  
  const categories = [
    { min: 80, cat: 'Excellent', rec: 'Your heart health is optimal! Keep up your great lifestyle habits.' },
    { min: 60, cat: 'Good', rec: 'Solid heart health. Try to reduce stress and maintain regular exercise.' },
    { min: 40, cat: 'Fair', rec: 'Focus on improving sleep, managing stress, and exercising 3-4 times per week.' },
    { min: 0, cat: 'Needs Attention', rec: 'Prioritize stress management, get 7-9 hours of sleep, and start with light daily walks.' },
  ];
  
  const result = categories.find(c => score >= c.min)!;
  return { score, category: result.cat, recommendation: result.rec };
}

function computeRecovery(inputs: RecoveryInputs): RecoveryResult | null {
  const sleepHours = parseFloat(inputs.sleepHours || '');
  const sleepQualityRating = parseFloat(inputs.sleepQualityRating || '');
  const morningFeeling = parseFloat(inputs.morningFeeling || '');
  const muscleSoreness = inputs.muscleSoreness;
  
  if (!sleepHours || sleepHours <= 0 || !sleepQualityRating || !morningFeeling || !muscleSoreness) return null;
  
  const sleepDurationScore = sleepHours >= 7 && sleepHours <= 9 ? 30 : sleepHours >= 6 && sleepHours < 7 ? 20 : sleepHours >= 5 ? 10 : 5;
  const sleepQualityScore = (sleepQualityRating / 10) * 30;
  const morningFeelingScore = (morningFeeling / 10) * 25;
  const sorenessScores: any = { none: 15, light: 12, moderate: 8, severe: 3 };
  
  const score = Math.round(Math.min(sleepDurationScore + sleepQualityScore + morningFeelingScore + (sorenessScores[muscleSoreness] || 10), 100));
  
  const categories = [
    { min: 80, cat: 'Fully Recovered', adv: 'Great! Your body is fully recovered. You can train at full intensity today.' },
    { min: 60, cat: 'Good', adv: "You're well recovered. Normal training intensity is recommended." },
    { min: 40, cat: 'Fair', adv: 'Moderate recovery. Consider lighter training or active recovery today.' },
    { min: 0, cat: 'Poor', adv: 'Low recovery. Take a rest day or do very light activity only.' },
  ];
  
  const result = categories.find(c => score >= c.min)!;
  return { score, category: result.cat, advice: result.adv };
}

function computeSleepQuality(inputs: SleepQualityInputs): SleepQualityResult | null {
  const duration = parseFloat(inputs.duration || '');
  const sleepQualityRating = parseFloat(inputs.sleepQualityRating || '');
  const wakeUps = inputs.wakeUps;
  const morningMood = parseFloat(inputs.morningMood || '');
  
  if (!duration || duration <= 0 || !sleepQualityRating || !wakeUps || !morningMood) return null;
  
  let score = 0;
  const improvements: string[] = [];
  
  if (duration >= 7 && duration <= 9) {
    score += 30;
  } else if (duration >= 6 && duration < 7) {
    score += 20;
    improvements.push('Aim for 7-9 hours of sleep');
  } else {
    score += 10;
    improvements.push('Significantly increase sleep duration to 7-9 hours');
  }
  
  score += (sleepQualityRating / 10) * 35;
  if (sleepQualityRating < 7) improvements.push('Improve sleep quality: keep room cool, dark, and quiet');
  
  const wakeUpScores: any = { none: 20, once: 15, few: 8, many: 3 };
  score += wakeUpScores[wakeUps] || 10;
  if (wakeUps === 'few' || wakeUps === 'many') improvements.push('Reduce nighttime awakenings with better sleep hygiene');
  
  score += (morningMood / 10) * 15;
  if (morningMood < 6) improvements.push('Establish a consistent sleep schedule to improve morning mood');
  
  score = Math.round(Math.min(score, 100));
  
  const quality = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor';
  if (improvements.length === 0) improvements.push('Maintain your excellent sleep habits!');
  
  return { score, quality, improvements };
}

function computeStress(inputs: StressInputs): StressResult | null {
  const stressRating = parseFloat(inputs.stressRating || '');
  const sleepQualityLast = parseFloat(inputs.sleepQualityLast || '');
  const workload = inputs.workload;
  const physicalActivity = inputs.physicalActivity;
  
  if (!stressRating || !sleepQualityLast || !workload || !physicalActivity) return null;
  
  const stressScore = (stressRating / 10) * 40;
  const sleepScore = ((10 - sleepQualityLast) / 10) * 30;
  const workloadScores: any = { light: 2, normal: 8, heavy: 15, overwhelming: 20 };
  const activityScores: any = { none: 10, light: 7, moderate: 4, intense: 2 };
  
  const stressLevel = Math.round(Math.min(stressScore + sleepScore + (workloadScores[workload] || 10) + (activityScores[physicalActivity] || 5), 100));
  
  const categories = [
    { max: 30, cat: 'Low', tips: ['Your stress levels are well managed', 'Maintain your current lifestyle and recovery habits'] },
    { max: 50, cat: 'Moderate', tips: ['Practice relaxation techniques like deep breathing', 'Ensure adequate sleep (7-9 hours)', 'Consider meditation or yoga'] },
    { max: 70, cat: 'High', tips: ['Prioritize stress management immediately', 'Reduce workload if possible', 'Practice daily meditation or mindfulness', 'Get at least 30 minutes of physical activity daily'] },
    { max: Infinity, cat: 'Very High', tips: ['Take immediate action to reduce stress', 'Consider taking time off work', 'Seek support from healthcare professionals', 'Focus on sleep optimization and rest days'] },
  ];
  
  const result = categories.find(c => stressLevel < c.max)!;
  return { level: stressLevel, category: result.cat, tips: result.tips };
}

// ✅ NEW: Sleep Graph Calculator
async function computeSleepGraph(userId: string | undefined): Promise<SleepGraphResult | null> {
  if (!userId) return null;
  
  try {
    const sessions = await getRecentSleepSessions(userId, 30); // Last 30 days
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageDuration: 0,
        longestSleep: 0,
        shortestSleep: 0,
        last7DaysAvg: 0,
        last30DaysAvg: 0,
        consistency: 0,
        sessions: [],
      };
    }
    
    // Calculate metrics
    const durations = sessions.map(s => s.durationHours);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = totalDuration / sessions.length;
    const longestSleep = Math.max(...durations);
    const shortestSleep = Math.min(...durations);
    
    // Last 7 days average
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const last7Days = sessions.filter(s => new Date(s.startTime).getTime() >= sevenDaysAgo);
    const last7DaysAvg = last7Days.length > 0
      ? last7Days.reduce((sum, s) => sum + s.durationHours, 0) / last7Days.length
      : 0;
    
    // Last 30 days average (same as overall if <30 days of data)
    const last30DaysAvg = averageDuration;
    
    // Calculate consistency score (0-100)
    // Based on how close sleep durations are to the average
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - averageDuration, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, Math.min(100, 100 - (stdDev * 20))); // Lower std dev = higher consistency
    
    // Format sessions for chart
    const chartSessions = sessions
      .slice(0, 30) // Last 30 sessions
      .reverse() // Oldest to newest for chart
      .map(s => ({
        date: new Date(s.startTime).toISOString().split('T')[0],
        hours: parseFloat(s.durationHours.toFixed(1)),
      }));
    
    return {
      totalSessions: sessions.length,
      averageDuration: parseFloat(averageDuration.toFixed(1)),
      longestSleep: parseFloat(longestSleep.toFixed(1)),
      shortestSleep: parseFloat(shortestSleep.toFixed(1)),
      last7DaysAvg: parseFloat(last7DaysAvg.toFixed(1)),
      last30DaysAvg: parseFloat(last30DaysAvg.toFixed(1)),
      consistency: Math.round(consistency),
      sessions: chartSessions,
    };
  } catch (error) {
    console.error('Error computing sleep graph:', error);
    return null;
  }
}


// ============================================================================
// COMPUTATION ROUTER
// ============================================================================

function computeForId(id: FitCalcId, inputs: FitCalcInputs, userId?: string): any | null {
  const computations: Record<FitCalcId, (inputs: any) => any | null> = {
    bmi: computeBmi, bmr: computeBmr, tdee: computeTdee, macros: computeMacros, onerm: computeOneRm,
    bodyfat: computeBodyFat, idealweight: computeIdealWeight, hrzones: computeHrZones, vo2max: computeVo2max,
    water: computeWater, protein: computeProtein, activity: computeActivity, running: computeRunning,
    ratios: computeRatios, hrv: computeHrv, recovery: computeRecovery, sleepquality: computeSleepQuality, 
    sleepgraph: () => computeSleepGraph(userId), // ✅ ADD THIS
    stress: computeStress
  };
  
  return computations[id]?.(inputs[id] || {}) || null;
}


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FitCalcScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [activeCategory, setActiveCategory] = useState<CategoryId>('fitness');
  const [activeCalculator, setActiveCalculator] = useState<FitCalcId>('bmi');
  const [inputs, setInputs] = useState<FitCalcInputs>({});
  const [results, setResults] = useState<FitCalcResults>({});
  const [resultSaved, setResultSaved] = useState<Partial<Record<FitCalcId, boolean>>>({});
  const [history, setHistory] = useState<Partial<Record<FitCalcId, FitCalcHistoryEntry[]>>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' | 'warning' });
  
  // Sleep Timer State
  const [sleepTimerActive, setSleepTimerActive] = useState(false);
  const [sleepTimerStart, setSleepTimerStart] = useState<number | null>(null);
  const [sleepTimerElapsed, setSleepTimerElapsed] = useState('0h 0m');
  
  const activeConfig = useMemo(() => FITCALC_CONFIG[activeCalculator], [activeCalculator]);
  const calculatorsForCategory = useMemo(() => CATEGORIES.find(cat => cat.id === activeCategory)?.calculators ?? [], [activeCategory]);
  
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ visible: true, message, type });
  }, []);
  
  // Check Sleep Timer Status
  const checkSleepTimer = useCallback(async () => {
    try {
      const status: SleepTimerState | null = await getSleepTimerStatus();
      if (status?.isRunning) {
        setSleepTimerActive(true);
        setSleepTimerStart(status.startTime);
        const elapsed = calculateElapsedTime(status.startTime);
        setSleepTimerElapsed(elapsed.formatted);
      } else {
        setSleepTimerActive(false);
        setSleepTimerStart(null);
        setSleepTimerElapsed('0h 0m');
      }
    } catch (error) {
      console.error('âŒ Error checking sleep timer:', error);
    }
  }, []);
  
  // Start Sleep Timer
  const handleStartSleepTimer = useCallback(async () => {
    if (!user?.uid) {
      showToast('Please sign in to use sleep timer', 'warning');
      return;
    }
    try {
      await startSleepTimer(user.uid);
      await checkSleepTimer();
      showToast('Sleep tracking started', 'success');
    } catch (error) {
      console.error('âŒ Error starting sleep timer:', error);
      showToast('Failed to start sleep timer', 'error');
    }
  }, [user?.uid, checkSleepTimer, showToast]);
  
  // Stop Sleep Timer
  const handleStopSleepTimer = useCallback(async () => {
    try {
      const session = await stopSleepTimer();
      if (session) {
        setInputs(prev => ({
          ...prev,
          sleepquality: {
            ...(prev.sleepquality || {}),
            duration: session.durationHours.toString(),
          }
        }));
        await checkSleepTimer();
        showToast(`Sleep recorded: ${formatSleepDuration(session.duration)}`, 'success');
      }
    } catch (error: any) {
      console.error('âŒ Error stopping sleep timer:', error);
      
      // âœ… Better error messages
      if (error?.message?.includes('permission-denied')) {
        showToast('Permission error. Please check Firestore rules.', 'error');
      } else {
        showToast('Failed to stop timer', 'error');
      }
    }
  }, [checkSleepTimer, showToast]);
  
  // Cancel Sleep Timer
  const handleCancelSleepTimer = useCallback(async () => {
    Alert.alert(
      'Cancel Sleep Tracking',
      'Your sleep data will not be saved. Continue?',
      [
        { text: 'Keep Running', style: 'cancel' },
        {
          text: 'Cancel Timer',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSleepTimer();
              await checkSleepTimer();
              showToast('Sleep timer cancelled', 'info');
            } catch (error) {
              console.error('âŒ Error cancelling timer:', error);
              showToast('Failed to cancel timer', 'error');
            }
          },
        },
      ]
    );
  }, [checkSleepTimer, showToast]);
  
  const loadHistory = useCallback(async (calcId: FitCalcId) => {
    if (!user?.uid) return;
    try {
      if (!refreshing) setLoading(true);
      const entries = await loadFitCalcHistory(user.uid, calcId, 10);
      setHistory(prev => ({ ...prev, [calcId]: entries }));
    } catch (error) {
      showToast('Failed to load history', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, refreshing, showToast]);
  
  useEffect(() => {
    loadHistory(activeCalculator);
    checkSleepTimer();
    
    if (activeCalculator === 'tdee' && results.bmr && !inputs.tdee?.bmr) {
      setInputs(prev => ({ ...prev, tdee: { ...(prev.tdee || {}), bmr: results.bmr!.value.toString() } }));
    }
  }, [activeCalculator, loadHistory, checkSleepTimer, results.bmr, inputs.tdee?.bmr]);
  
  // âœ… Update timer display every minute + update notification
  useEffect(() => {
    if (!sleepTimerActive || !sleepTimerStart) return;
    
    const updateTimer = async () => {
      const elapsed = calculateElapsedTime(sleepTimerStart);
      setSleepTimerElapsed(elapsed.formatted);
      await updateSleepTimerNotification();
    };
    
    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [sleepTimerActive, sleepTimerStart]);
  
  // âœ… Update notification when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        await checkSleepTimer();
        await updateSleepTimerNotification();
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, [checkSleepTimer]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory(activeCalculator);
    await checkSleepTimer();
    setRefreshing(false);
  }, [activeCalculator, loadHistory, checkSleepTimer]);
  
  const handleInputChange = useCallback((calculatorId: FitCalcId, fieldKey: string, value: string) => {
    setInputs(prev => ({ ...prev, [calculatorId]: { ...(prev[calculatorId] || {}), [fieldKey]: value } }));
    setResultSaved(prev => ({ ...prev, [calculatorId]: false }));
  }, []);
  
  const handleFieldChange = useCallback((fieldKey: string, value: string) => {
    handleInputChange(activeCalculator, fieldKey, value);
  }, [activeCalculator, handleInputChange]);
  
const handleCalculate = useCallback(async () => {
  // ✅ Special handling for sleepgraph - auto-load data
  if (activeCalculator === 'sleepgraph') {
    const result = await computeSleepGraph(user?.uid);
    if (!result || result.totalSessions === 0) {
      showToast('No sleep data found. Start tracking with Sleep Quality tab!', 'info');
      return;
    }
    setResults(prev => ({ ...prev, sleepgraph: result }));
    return;
  }
  
  const result = computeForId(activeCalculator, inputs, user?.uid);
  
  if (!result) {
    const messages: Record<FitCalcId, string> = {
      bmi: 'Please enter height and weight', bmr: 'Please fill age, height and weight', macros: 'Please enter goal calories',
      tdee: 'Please fill BMR and activity level', onerm: 'Please enter weight and reps', bodyfat: 'Please fill all measurements',
      hrzones: 'Please enter your age', vo2max: 'Please enter time for 1.5 mile run', activity: 'Please fill all activity details',
      ratios: 'Please enter height, waist and hip', idealweight: 'Please select gender and enter height', water: 'Please enter weight and activity level',
      running: 'Please enter distance and time', protein: 'Please fill weight, activity and goal',
      hrv: 'Please fill all fields', recovery: 'Please fill all fields', sleepquality: 'Please fill all fields', 
      sleepgraph: 'No sleep data available', // ✅ ADD THIS
      stress: 'Please fill all fields'
    };
    showToast(messages[activeCalculator] || 'Please complete required fields', 'warning');
    return;
  }
  
  setResults(prev => ({ ...prev, [activeCalculator]: result }));
  setResultSaved(prev => ({ ...prev, [activeCalculator]: false }));
  
  if (activeCalculator === 'bmr') {
    setInputs(prev => ({ ...prev, tdee: { ...(prev.tdee || {}), bmr: (result as BmrResult).value.toString() } }));
  }
  if (activeCalculator === 'tdee') {
    setInputs(prev => ({ ...prev, macros: { ...(prev.macros || {}), calories: (result as TdeeResult).target.toString() } }));
  }
}, [activeCalculator, inputs, user?.uid, showToast]);

  const handleSave = useCallback(async () => {
    if (!user?.uid || !results[activeCalculator]) return;
    setSaving(true);
    try {
      await saveFitCalcHistory(user.uid, activeCalculator, inputs[activeCalculator] ?? {}, results[activeCalculator] ?? {});
      setResultSaved(prev => ({ ...prev, [activeCalculator]: true }));
      await loadHistory(activeCalculator);
      showToast('Saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }, [user?.uid, activeCalculator, inputs, results, loadHistory, showToast]);
  
  const handleDeleteHistory = useCallback(async (entryId: string) => {
    if (!user?.uid) return;
    try {
      await deleteFitCalcHistoryEntry(user.uid, entryId);
      await loadHistory(activeCalculator);
      showToast('Entry deleted', 'success');
    } catch (error) {
      showToast('Failed to delete entry', 'error');
    }
  }, [user?.uid, activeCalculator, loadHistory, showToast]);
  
  const handleCategorySelect = useCallback((categoryId: CategoryId) => {
    setActiveCategory(categoryId);
    const category = CATEGORIES.find(cat => cat.id === categoryId);
    if (category && category.calculators.length > 0) {
      setActiveCalculator(category.calculators[0]);
    }
  }, []);
  
  const handleCalculatorSelect = useCallback((calcId: FitCalcId) => setActiveCalculator(calcId), []);
  
  const renderChart = useCallback(() => {
    const r = results[activeCalculator];
    if (!r) return null;
    
    const chartProps: any = { type: activeCalculator, data: r };
    if (['bmi', 'tdee', 'bodyfat', 'idealweight', 'activity', 'protein'].includes(activeCalculator)) {
      chartProps.inputs = inputs[activeCalculator];
    }
    
    return <FitCalcChart {...chartProps} />;
  }, [activeCalculator, results, inputs]);
  
  // âœ… ENHANCED: Professional Sleep Timer UI
  const renderSleepTimerSection = useCallback(() => {
    if (activeCalculator !== 'sleepquality') return null;
    
    return (
      <View style={sleepStyles.container}>
        <LinearGradient
          colors={sleepTimerActive ? ['#6B46C1', '#8B5CF6'] : ['#F3F4F6', '#E5E7EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={sleepStyles.card}
        >
          {!sleepTimerActive ? (
            // Inactive State
            <View style={sleepStyles.inactiveContent}>
              <View style={sleepStyles.iconContainer}>
                <View style={sleepStyles.iconCircle}>
                  <Ionicons name="bed-outline" size={32} color="#6B7280" />
                </View>
              </View>
              
              <Text style={sleepStyles.title}>Sleep Tracker</Text>
              <Text style={sleepStyles.subtitle}>
                Track your sleep duration automatically
              </Text>
              
              <TouchableOpacity 
                style={sleepStyles.primaryButton} 
                onPress={handleStartSleepTimer}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#6B46C1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={sleepStyles.buttonGradient}
                >
                  <Text style={sleepStyles.primaryButtonText}>Start Tracking</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            // Active State
            <View style={sleepStyles.activeContent}>
              <View style={sleepStyles.statusBadge}>
                <View style={sleepStyles.pulseDot} />
                <Text style={sleepStyles.statusText}>TRACKING</Text>
              </View>
              
              <View style={sleepStyles.timeDisplay}>
                <Text style={sleepStyles.timeLabel}>Sleep Duration</Text>
                <Text style={sleepStyles.timeValue}>{sleepTimerElapsed}</Text>
              </View>
              
              <View style={sleepStyles.buttonRow}>
                <TouchableOpacity 
                  style={sleepStyles.stopButton} 
                  onPress={handleStopSleepTimer}
                  activeOpacity={0.85}
                >
                  <View style={sleepStyles.stopIcon} />
                  <Text style={sleepStyles.stopButtonText}>Stop & Save</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={sleepStyles.cancelButton} 
                  onPress={handleCancelSleepTimer}
                  activeOpacity={0.85}
                >
                  <Text style={sleepStyles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  }, [activeCalculator, sleepTimerActive, sleepTimerElapsed, handleStartSleepTimer, handleStopSleepTimer, handleCancelSleepTimer]);
  
  const renderResultNode = useCallback(() => {
    const r = results[activeCalculator] as any;
    if (!r) return null;
    
    // BMI with insights
    if (activeCalculator === 'bmi') {
      const bmi = r as BmiResult;
      const bmiValue = parseFloat(bmi.value);
      const insights = [
        { max: 18.5, text: 'Your BMI suggests you may be underweight. Consider consulting a nutritionist to develop a healthy weight gain plan with nutrient-dense foods.' },
        { max: 25, text: 'Great job! Your BMI is in the healthy range. Keep up your balanced diet and regular physical activity to maintain your health.' },
        { max: 30, text: 'Your BMI is slightly elevated. Small lifestyle changes like adding 30 minutes of daily activity and reducing portion sizes can help.' },
        { max: Infinity, text: 'Your BMI indicates obesity. Working with a healthcare provider can help you create a safe and effective weight management plan.' }
      ];
      const insight = insights.find(i => bmiValue < i.max)!;
      
      return (
        <>
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Your BMI</Text>
            <Text style={styles.resultValue}>{bmi.value}</Text>
            <Text style={styles.resultCategory}>{bmi.category}</Text>
            <Text style={styles.resultHint}>{bmi.hint}</Text>
          </View>
          {renderChart()}
          <View style={styles.insightBox}>
            <View style={styles.insightHeader}>
              <Ionicons name="information-circle" size={18} color={Colors.light.primary} />
              <Text style={styles.insightTitle}>What this means for you</Text>
            </View>
            <Text style={styles.insightText}>{insight.text}</Text>
          </View>
        </>
      );
    }
    
    // BMR
    if (activeCalculator === 'bmr') {
      const bmr = r as BmrResult;
      return (
        <>
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Your BMR</Text>
            <Text style={styles.resultValue}>{bmr.value} kcal/day</Text>
            <Text style={styles.resultHint}>Calories your body burns each day at rest.</Text>
          </View>
          {renderChart()}
          <View style={styles.insightBox}>
            <View style={styles.insightHeader}>
              <Ionicons name="information-circle" size={18} color={Colors.light.primary} />
              <Text style={styles.insightTitle}>What this means for you</Text>
            </View>
            <Text style={styles.insightText}>
              Your body burns {bmr.value} calories daily just to maintain basic functions like breathing and circulation. To calculate your total daily needs, multiply this by your activity level in the TDEE calculator.
            </Text>
          </View>
        </>
      );
    }
    
    // TDEE
    if (activeCalculator === 'tdee') {
      const tdee = r as TdeeResult;
      const goalText = inputs.tdee?.goal === 'lose' ? 'lose weight' : inputs.tdee?.goal === 'gain' ? 'gain weight' : 'maintain your current weight';
      return (
        <>
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Your TDEE</Text>
            <Text style={styles.resultValue}>{tdee.tdee} kcal/day</Text>
            <Text style={styles.resultHint}>Maintenance: {tdee.tdee} kcal â€¢ Goal: {tdee.target} kcal</Text>
          </View>
          {renderChart()}
          <View style={styles.insightBox}>
            <View style={styles.insightHeader}>
              <Ionicons name="information-circle" size={18} color={Colors.light.primary} />
              <Text style={styles.insightTitle}>What this means for you</Text>
            </View>
            <Text style={styles.insightText}>
              Your total daily energy expenditure is {tdee.tdee} calories. Based on your goal, you should consume {tdee.target} calories per day to {goalText}.
            </Text>
          </View>
        </>
      );
    }
    
    // Macros
    if (activeCalculator === 'macros') {
      const m = r as MacrosResult;
      const presetKey = (inputs.macros?.preset ?? 'balanced') as keyof typeof MACRO_PRESETS;
      const preset = MACRO_PRESETS[presetKey];
      const insights: any = {
        balanced: 'This balanced split works well for general health and fitness. Aim to spread your protein across 3-4 meals for optimal muscle maintenance.',
        keto: 'This ketogenic ratio pushes your body into fat-burning mode. Stay hydrated and watch for initial keto flu symptoms.',
        highp: "Extra protein supports muscle growth and recovery. Ideal if you're strength training 3+ times per week.",
        lowcarb: 'Lower carbs can help with fat loss while maintaining energy. Focus on quality fats like avocados and nuts.'
      };
      
      return (
        <>
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Your Macros</Text>
            <Text style={styles.resultPreset}>Preset: {preset.label} ({preset.note})</Text>
            <View style={styles.macroGrid}>
              <View style={styles.macroItem}>
                <Text style={styles.macroAmount}>{m.protein}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroKcal}>{m.kcal.protein} kcal</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroAmount}>{m.carbs}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroKcal}>{m.kcal.carbs} kcal</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroAmount}>{m.fat}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroKcal}>{m.kcal.fat} kcal</Text>
              </View>
            </View>
          </View>
          {renderChart()}
          <View style={styles.insightBox}>
            <View style={styles.insightHeader}>
              <Ionicons name="information-circle" size={18} color={Colors.light.primary} />
              <Text style={styles.insightTitle}>What this means for you</Text>
            </View>
            <Text style={styles.insightText}>{insights[presetKey]}</Text>
          </View>
        </>
      );
    }
    
    // Default for other calculators
    return (
      <>
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Result</Text>
          <Text style={styles.resultValue}>See chart below</Text>
        </View>
        {renderChart()}
      </>
    );
  }, [activeCalculator, results, inputs, renderChart]);
  
  const renderHistoryRow = useCallback((entry: FitCalcHistoryEntry) => {
    const dateStr = entry.savedAt?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) ?? '';
    
    const formatters: any = {
      bmi: (e: any) => {
        const i = e.inputs as BmiInputs;
        const r = e.result as BmiResult;
        return { line1: dateStr, line2: `Height: ${i?.height ?? '-'} cm, Weight: ${i?.weight ?? '-'} kg`, line3: `BMI: ${r?.value ?? '-'} â€¢ ${r?.category ?? '-'}` };
      },
      bmr: (e: any) => {
        const i = e.inputs as BmrInputs;
        const r = e.result as BmrResult;
        return { line1: dateStr, line2: `${i?.gender ?? '-'}, Age: ${i?.age ?? '-'}, ${i?.formula ?? '-'}`, line3: `BMR: ${r?.value ?? '-'} kcal/day` };
      },
      tdee: (e: any) => {
        const i = e.inputs as TdeeInputs;
        const r = e.result as TdeeResult;
        return { line1: dateStr, line2: `BMR: ${i?.bmr ?? '-'}, Activity: ${i?.activity ?? '-'}`, line3: `TDEE: ${r?.tdee ?? '-'} â€¢ Goal: ${r?.target ?? '-'} kcal` };
      },
      macros: (e: any) => {
        const i = e.inputs as MacrosInputs;
        const r = e.result as MacrosResult;
        const preset = MACRO_PRESETS[(i?.preset ?? 'balanced') as keyof typeof MACRO_PRESETS];
        return { line1: dateStr, line2: `Goal: ${i?.calories ?? '-'} kcal â€¢ Preset: ${preset?.label ?? '-'}`, line3: `P ${r?.protein ?? '-'}g â€¢ C ${r?.carbs ?? '-'}g â€¢ F ${r?.fat ?? '-'}g` };
      }
    };
    
    return formatters[activeCalculator]?.(entry) || { line1: dateStr, line2: JSON.stringify(entry.inputs ?? {}), line3: JSON.stringify(entry.result ?? {}) };
  }, [activeCalculator]);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomToast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>FitCalc</Text>
        </View>
        <View style={styles.headerRight}>
          {saving && <ActivityIndicator size="small" color={Colors.light.primary} />}
        </View>
      </View>
      
      <View style={styles.mainLayout}>
        <View style={styles.categorySidebar}>
          {CATEGORIES.map(category => {
            const isActive = category.id === activeCategory;
            return (
              <TouchableOpacity key={category.id} style={[styles.categoryTab, isActive && styles.categoryTabActive]} onPress={() => handleCategorySelect(category.id)} activeOpacity={0.7}>
                <Ionicons name={category.icon} size={24} color={isActive ? Colors.light.primary : Colors.light.textSecondary} />
                <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]} numberOfLines={1}>{category.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <View style={styles.contentArea}>
          <ScrollView horizontal style={styles.calculatorChipsScroll} contentContainerStyle={styles.calculatorChipsContent} showsHorizontalScrollIndicator={false}>
            {calculatorsForCategory.map(calcId => {
              const isActive = calcId === activeCalculator;
              const config = FITCALC_CONFIG[calcId];
              return (
                <TouchableOpacity key={calcId} style={[styles.calculatorChip, isActive && styles.calculatorChipActive]} onPress={() => handleCalculatorSelect(calcId)} activeOpacity={0.7}>
                  <Text style={[styles.calculatorChipText, isActive && styles.calculatorChipTextActive]}>{config.title}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator size="large" color={Colors.light.primary} style={styles.loader} />
            ) : (
              <FitCalcCard
                calculatorId={activeCalculator}  // ✅ ADD THIS LINE
                title={activeConfig.title}
                description={activeConfig.description}
                fields={activeConfig.fields}
                inputs={(inputs[activeCalculator] || {}) as any}
                resultNode={renderResultNode()}
                resultSaved={resultSaved[activeCalculator]}
                history={history[activeCalculator] || []}
                onChange={handleFieldChange}
                onCalculate={handleCalculate}
                onSave={handleSave}
                onDeleteHistory={handleDeleteHistory}
                renderHistoryRow={renderHistoryRow}
                sleepTimerSection={renderSleepTimerSection()}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.light.cardBackground, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.light.text },
  headerRight: { width: 60, alignItems: 'flex-end', justifyContent: 'center' },
  mainLayout: { flex: 1, flexDirection: 'row' },
  categorySidebar: { width: 90, backgroundColor: Colors.light.cardBackground, borderRightWidth: 1, borderRightColor: Colors.light.border, paddingVertical: 12 },
  categoryTab: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8, marginBottom: 8 },
  categoryTabActive: { backgroundColor: Colors.light.primary + '10', borderRightWidth: 3, borderRightColor: Colors.light.primary },
  categoryLabel: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 6, textAlign: 'center', fontWeight: '500' },
  categoryLabelActive: { color: Colors.light.primary, fontWeight: '700' },
  contentArea: { flex: 1 },
  calculatorChipsScroll: { maxHeight: 56, backgroundColor: Colors.light.cardBackground, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  calculatorChipsContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  calculatorChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.light.background, borderWidth: 1, borderColor: Colors.light.border },
  calculatorChipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  calculatorChipText: { fontSize: 13, color: Colors.light.text, fontWeight: '600' },
  calculatorChipTextActive: { color: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  loader: { marginTop: 40 },
  resultContainer: { marginTop: 0, backgroundColor: Colors.light.background, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.light.border },
  resultLabel: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary, marginBottom: 4 },
  resultValue: { fontSize: 22, fontWeight: '700', color: Colors.light.primary, marginBottom: 4 },
  resultCategory: { fontSize: 16, fontWeight: '600', color: Colors.light.text, marginBottom: 6 },
  resultHint: { fontSize: 13, color: Colors.light.textSecondary, lineHeight: 18 },
  resultPreset: { fontSize: 12, color: Colors.light.textSecondary, marginBottom: 12 },
  macroGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, marginBottom: 12 },
  macroItem: { alignItems: 'center' },
  macroAmount: { fontSize: 20, fontWeight: '700', color: Colors.light.primary },
  macroLabel: { fontSize: 12, fontWeight: '600', color: Colors.light.text, marginTop: 2 },
  macroKcal: { fontSize: 10, color: Colors.light.textSecondary, marginTop: 2 },
  insightBox: { marginTop: 16, padding: 12, backgroundColor: Colors.light.primary + '08', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: Colors.light.primary },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  insightTitle: { fontSize: 13, fontWeight: '700', color: Colors.light.primary },
  insightText: { fontSize: 12, color: Colors.light.text, lineHeight: 18 },
});

// âœ… PROFESSIONAL SLEEP TIMER STYLES
const sleepStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
  },
  
  // Inactive State
  inactiveContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  
  // Active State
  activeContent: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    letterSpacing: 1,
  },
  timeValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  buttonRow: {
    width: '100%',
    gap: 12,
  },
  stopButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
  },
  stopIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#6B46C1',
  },
  stopButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#6B46C1',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});