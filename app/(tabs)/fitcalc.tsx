// app/(tabs)/fitcalc.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FitCalcCard } from '../../components/fitcalc/FitCalcCard';
import { FitCalcChart } from '../../components/fitcalc/FitCalcChart';
import CustomToast from '../../components/ui/CustomToast';
import { Colors } from '../../constants/colors';
import { FITCALC_CONFIG } from '../../constants/fitcalcConfig';
import { useAuth } from '../../context/AuthContext';
import {
  deleteFitCalcHistoryEntry,
  FitCalcHistoryEntry,
  loadFitCalcHistory,
  saveFitCalcHistory,
} from '../../services/fitCalcService';
import {
  ActivityInputs,
  ActivityResult,
  BmiInputs,
  BmiResult,
  BmrInputs,
  BmrResult,
  BodyFatInputs,
  BodyFatResult,
  FitCalcId,
  FitCalcInputs,
  FitCalcResults,
  HrZonesInputs,
  HrZonesResult,
  IdealWeightInputs,
  IdealWeightResult,
  MacrosInputs,
  MacrosResult,
  OneRmInputs,
  OneRmResult,
  ProteinInputs,
  ProteinResult,
  RatiosInputs,
  RatiosResult,
  RunningInputs,
  RunningResult,
  TdeeInputs,
  TdeeResult,
  Vo2maxInputs,
  Vo2maxResult,
  WaterInputs,
  WaterResult,
} from '../../types/fitcalc';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type CategoryId = 'fitness' | 'heart' | 'dailyhealth';

type Category = {
  id: CategoryId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  calculators: FitCalcId[];
};

const CATEGORIES: Category[] = [
  {
    id: 'fitness',
    label: 'Fitness',
    icon: 'barbell-outline',
    calculators: ['bmi', 'bmr', 'tdee', 'macros', 'onerm', 'bodyfat', 'idealweight'],
  },
  {
    id: 'heart',
    label: 'Heart',
    icon: 'heart-outline',
    calculators: ['hrzones', 'vo2max'],
  },
  {
    id: 'dailyhealth',
    label: 'Daily Health',
    icon: 'fitness-outline',
    calculators: ['water', 'protein', 'activity', 'running', 'ratios'],
  },
];

// Macro presets
const MACRO_PRESETS: Record<
  NonNullable<MacrosInputs['preset']>,
  { p: number; c: number; f: number; note: string; label: string }
> = {
  balanced: { p: 0.3, c: 0.4, f: 0.3, note: 'P 30% / C 40% / F 30%', label: 'Balanced' },
  keto: { p: 0.2, c: 0.05, f: 0.75, note: 'P 20% / C 5% / F 75%', label: 'Ketogenic' },
  highp: { p: 0.35, c: 0.35, f: 0.3, note: 'P 35% / C 35% / F 30%', label: 'High Protein' },
  lowcarb: { p: 0.3, c: 0.25, f: 0.45, note: 'P 30% / C 25% / F 45%', label: 'Low Carb' },
};

// ============================================================================
// COMPUTATION FUNCTIONS
// ============================================================================

// ✅ 1. BMI Calculator
function computeBmi(inputs: BmiInputs): BmiResult | null {
  const height = parseFloat(inputs.height || '') / 100;
  const weight = parseFloat(inputs.weight || '');
  
  if (!height || !weight || height <= 0 || weight <= 0) return null;
  
  const bmi = weight / (height * height);
  let category: BmiResult['category'];
  let hint: string;
  let categoryClass: BmiResult['categoryClass'];

  if (bmi < 18.5) {
    category = 'Underweight';
    hint = 'Consider consulting a healthcare provider about healthy weight gain.';
    categoryClass = 'category-underweight';
  } else if (bmi < 25) {
    category = 'Normal weight';
    hint = 'Maintain your healthy weight with balanced nutrition and activity.';
    categoryClass = 'category-normal';
  } else if (bmi < 30) {
    category = 'Overweight';
    hint = 'Consider gradual lifestyle changes in diet and activity.';
    categoryClass = 'category-overweight';
  } else {
    category = 'Obese';
    hint = 'Consult a healthcare provider for a personalized weight plan.';
    categoryClass = 'category-obese';
  }

  return { value: bmi.toFixed(1), category, hint, categoryClass };
}

// ✅ 2. BMR Calculator
function computeBmr(inputs: BmrInputs): BmrResult | null {
  const gender = inputs.gender ?? 'male';
  const age = parseFloat(inputs.age || '');
  const height = parseFloat(inputs.height || '');
  const weight = parseFloat(inputs.weight || '');
  const formula = inputs.formula ?? 'mifflin';

  if (!age || !height || !weight || age <= 0 || height <= 0 || weight <= 0) return null;

  let bmr: number;
  if (formula === 'mifflin') {
    bmr = gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = gender === 'male'
      ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
      : 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  }

  return { value: Math.round(bmr) };
}

// ✅ 3. TDEE Calculator
function computeTdee(inputs: TdeeInputs): TdeeResult | null {
  const bmr = parseFloat(inputs.bmr || '');
  const activity = parseFloat(inputs.activity || '1.55');
  const goal = inputs.goal ?? 'maintain';

  if (!bmr || bmr <= 0) return null;

  const tdee = Math.round(bmr * activity);
  let target = tdee;

  if (goal === 'lose') {
    target = Math.round(tdee - 500);
  } else if (goal === 'gain') {
    target = Math.round(tdee + 500);
  }

  return { tdee, target };
}

// ✅ 4. Macros Calculator
function computeMacros(inputs: MacrosInputs): MacrosResult | null {
  const calories = parseFloat(inputs.calories || '');
  if (!calories || calories <= 0) return null;

  const presetKey: NonNullable<MacrosInputs['preset']> = inputs.preset ?? 'balanced';
  const preset = MACRO_PRESETS[presetKey];

  const pK = calories * preset.p;
  const cK = calories * preset.c;
  const fK = calories * preset.f;

  return {
    protein: Math.round(pK / 4),
    carbs: Math.round(cK / 4),
    fat: Math.round(fK / 9),
    ratios: { protein: preset.p, carbs: preset.c, fat: preset.f },
    kcal: {
      protein: Math.round(pK),
      carbs: Math.round(cK),
      fat: Math.round(fK),
      total: Math.round(calories),
    },
  };
}

// ✅ 5. One Rep Max Calculator
function computeOneRm(inputs: OneRmInputs): OneRmResult | null {
  const weight = parseFloat(inputs.weight || '');
  const reps = parseFloat(inputs.reps || '');
  const formula = inputs.formula ?? 'epley';

  if (!weight || !reps || weight <= 0 || reps <= 0 || reps > 10) return null;

  let oneRm: number;
  
  if (reps === 1) {
    oneRm = weight;
  } else {
    switch (formula) {
      case 'epley':
        oneRm = weight * (1 + reps / 30);
        break;
      case 'brzycki':
        oneRm = weight * (36 / (37 - reps));
        break;
      case 'lombardi':
        oneRm = weight * Math.pow(reps, 0.10);
        break;
      default:
        oneRm = weight * (1 + reps / 30);
    }
  }

  return { value: Math.round(oneRm) };
}

// ✅ 6. Body Fat Calculator
function computeBodyFat(inputs: BodyFatInputs): BodyFatResult | null {
  const gender = inputs.gender ?? 'male';
  const height = parseFloat(inputs.height || '');
  const waist = parseFloat(inputs.waist || '');
  const neck = parseFloat(inputs.neck || '');
  const hip = parseFloat(inputs.hip || '');

  if (!height || !waist || !neck || height <= 0 || waist <= 0 || neck <= 0) return null;
  
  if (gender === 'female' && (!hip || hip <= 0)) return null;

  let bodyFat: number;

  if (gender === 'male') {
    // US Navy formula for males
    bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
  } else {
    // US Navy formula for females
    bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
  }

  return { value: Math.max(bodyFat, 0).toFixed(1) };
}

// ✅ 7. Ideal Weight Calculator
function computeIdealWeight(inputs: IdealWeightInputs): IdealWeightResult | null {
  const gender = inputs.gender ?? 'male';
  const height = parseFloat(inputs.height || '');

  if (!height || height <= 0) return null;

  const heightInInches = height / 2.54;
  
  // Devine Formula
  let devine: number;
  if (gender === 'male') {
    devine = 50 + 2.3 * (heightInInches - 60);
  } else {
    devine = 45.5 + 2.3 * (heightInInches - 60);
  }

  // Robinson Formula
  let robinson: number;
  if (gender === 'male') {
    robinson = 52 + 1.9 * (heightInInches - 60);
  } else {
    robinson = 49 + 1.7 * (heightInInches - 60);
  }

  // Miller Formula
  let miller: number;
  if (gender === 'male') {
    miller = 56.2 + 1.41 * (heightInInches - 60);
  } else {
    miller = 53.1 + 1.36 * (heightInInches - 60);
  }

  return {
    devine: Math.round(devine * 10) / 10,
    robinson: Math.round(robinson * 10) / 10,
    miller: Math.round(miller * 10) / 10,
  };
}

// ✅ 8. Heart Rate Zones Calculator
function computeHrZones(inputs: HrZonesInputs): HrZonesResult | null {
  const age = parseFloat(inputs.age || '');
  
  if (!age || age <= 0 || age > 120) return null;

  // Calculate max heart rate (220 - age)
  const maxHR = 220 - age;

  return {
    maxHR,
    zone1: `${Math.round(maxHR * 0.5)}-${Math.round(maxHR * 0.6)} bpm`,
    zone2: `${Math.round(maxHR * 0.6)}-${Math.round(maxHR * 0.7)} bpm`,
    zone3: `${Math.round(maxHR * 0.7)}-${Math.round(maxHR * 0.8)} bpm`,
    zone4: `${Math.round(maxHR * 0.8)}-${Math.round(maxHR * 0.9)} bpm`,
    zone5: `${Math.round(maxHR * 0.9)}-${Math.round(maxHR)} bpm`,
  };
}

// ✅ 9. VO2 Max Calculator
function computeVo2max(inputs: Vo2maxInputs): Vo2maxResult | null {
  const timeStr = inputs.time || '';
  if (!timeStr) return null;

  // Parse time format (mm:ss or hh:mm:ss)
  const parts = timeStr.split(':').map(p => parseFloat(p));
  let totalMinutes: number;

  if (parts.length === 2) {
    // mm:ss format
    totalMinutes = parts[0] + parts[1] / 60;
  } else if (parts.length === 3) {
    // hh:mm:ss format
    totalMinutes = parts[0] * 60 + parts[1] + parts[2] / 60;
  } else {
    return null;
  }

  if (totalMinutes <= 0) return null;

  // Cooper 1.5 mile run test formula
  const vo2max = (483 / totalMinutes) + 3.5;

  return { value: Math.max(vo2max, 0).toFixed(1) };
}

// ✅ 10. Water Intake Calculator
function computeWater(inputs: WaterInputs): WaterResult | null {
  const weight = parseFloat(inputs.weight || '');
  const activity = inputs.activity ?? 'sedentary';

  if (!weight || weight <= 0) return null;

  // Base water intake: 30-35ml per kg
  let liters = (weight * 0.033);

  // Adjust for activity level
  const activityMultipliers = {
    sedentary: 1.0,
    lightly: 1.1,
    moderately: 1.2,
    very: 1.3,
  };

  liters *= activityMultipliers[activity];

  return { value: liters.toFixed(1) };
}

// ✅ 11. Protein Intake Calculator
function computeProtein(inputs: ProteinInputs): ProteinResult | null {
  const weight = parseFloat(inputs.weight || '');
  const activity = inputs.activity ?? 'sedentary';
  const goal = inputs.goal ?? 'maintain';

  if (!weight || weight <= 0) return null;

  // Base protein per kg based on activity
  let proteinPerKg: number;
  
  switch (activity) {
    case 'sedentary':
      proteinPerKg = 0.8;
      break;
    case 'lightly':
      proteinPerKg = 1.0;
      break;
    case 'moderately':
      proteinPerKg = 1.2;
      break;
    case 'very':
      proteinPerKg = 1.4;
      break;
    case 'athlete':
      proteinPerKg = 1.6;
      break;
    default:
      proteinPerKg = 0.8;
  }

  // Adjust for goal
  if (goal === 'lose') {
    proteinPerKg *= 1.2; // Higher protein during weight loss
  } else if (goal === 'gain') {
    proteinPerKg *= 1.3; // Higher protein for muscle gain
  }

  const protein = weight * proteinPerKg;

  return { value: Math.round(protein) };
}

// ✅ 12. Activity Calories Calculator
function computeActivity(inputs: ActivityInputs): ActivityResult | null {
  const type = inputs.type ?? 'walking';
  const intensity = inputs.intensity ?? 'moderate';
  const duration = parseFloat(inputs.duration || '');
  const weight = parseFloat(inputs.weight || '');

  if (!duration || !weight || duration <= 0 || weight <= 0) return null;

  // MET values (Metabolic Equivalent of Task)
  const metValues: Record<string, Record<string, number>> = {
    walking: { light: 3.0, moderate: 4.5, vigorous: 6.0 },
    running: { light: 8.0, moderate: 10.0, vigorous: 12.0 },
    cycling: { light: 6.0, moderate: 8.0, vigorous: 10.0 },
    swimming: { light: 5.0, moderate: 7.0, vigorous: 9.0 },
    weightlifting: { light: 3.0, moderate: 5.0, vigorous: 6.0 },
  };

  const met = metValues[type]?.[intensity] || 5.0;
  
  // Calories = MET × weight(kg) × duration(hours)
  const calories = met * weight * (duration / 60);

  return { value: Math.round(calories) };
}

// ✅ 13. Running Pace Calculator
function computeRunning(inputs: RunningInputs): RunningResult | null {
  const distance = parseFloat(inputs.distance || '');
  const timeStr = inputs.time || '';

  if (!distance || distance <= 0 || !timeStr) return null;

  // Parse time format (hh:mm:ss)
  const parts = timeStr.split(':').map(p => parseFloat(p));
  let totalSeconds: number;

  if (parts.length === 3) {
    totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    totalSeconds = parts[0] * 60 + parts[1];
  } else {
    return null;
  }

  if (totalSeconds <= 0) return null;

  // Calculate pace (seconds per km)
  const paceSeconds = totalSeconds / distance;
  const paceMinutes = Math.floor(paceSeconds / 60);
  const paceSecondsRemainder = Math.round(paceSeconds % 60);

  // Calculate speed (km/h)
  const speed = (distance / totalSeconds) * 3600;

  return {
    pace: `${paceMinutes}:${paceSecondsRemainder.toString().padStart(2, '0')}`,
    speed: speed.toFixed(1),
  };
}

// ✅ 14. Body Ratios Calculator
function computeRatios(inputs: RatiosInputs): RatiosResult | null {
  const height = parseFloat(inputs.height || '');
  const waist = parseFloat(inputs.waist || '');
  const hip = parseFloat(inputs.hip || '');

  if (!height || !waist || !hip || height <= 0 || waist <= 0 || hip <= 0) return null;

  // Waist-to-Height Ratio
  const whtr = waist / height;

  // Waist-to-Hip Ratio
  const whr = waist / hip;

  return {
    whtr: whtr.toFixed(2),
    whr: whr.toFixed(2),
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FitCalcScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // State
  const [activeCategory, setActiveCategory] = useState<CategoryId>('fitness');
  const [activeCalculator, setActiveCalculator] = useState<FitCalcId>('bmi');
  const [inputs, setInputs] = useState<FitCalcInputs>({});
  const [results, setResults] = useState<FitCalcResults>({});
  const [resultSaved, setResultSaved] = useState<Partial<Record<FitCalcId, boolean>>>({});
  const [history, setHistory] = useState<Partial<Record<FitCalcId, FitCalcHistoryEntry[]>>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });

  // Memoized values
  const activeConfig = useMemo(
    () => FITCALC_CONFIG[activeCalculator],
    [activeCalculator]
  );

  const calculatorsForCategory = useMemo(
    () => CATEGORIES.find(cat => cat.id === activeCategory)?.calculators ?? [],
    [activeCategory]
  );

  // Toast handler
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
      setToast({ visible: true, message, type });
    },
    []
  );

  // Load history
  const loadHistory = useCallback(
    async (calcId: FitCalcId) => {
      if (!user?.uid) return;
      
      try {
        if (!refreshing) setLoading(true);
        const entries = await loadFitCalcHistory(user.uid, calcId, 10);
        setHistory(prev => ({ ...prev, [calcId]: entries }));
      } catch (error) {
        console.error('Failed to load history:', error);
        showToast('Failed to load history', 'error');
      } finally {
        setLoading(false);
      }
    },
    [user?.uid, refreshing, showToast]
  );

  // Auto-populate TDEE when switching to it
  useEffect(() => {
    loadHistory(activeCalculator);
    
    // Auto-fill TDEE with latest BMR
    if (activeCalculator === 'tdee' && results.bmr && !inputs.tdee?.bmr) {
      setInputs(prev => ({
        ...prev,
        tdee: {
          ...(prev.tdee || {}),
          bmr: results.bmr!.value.toString(),
        },
      }));
    }
  }, [activeCalculator, loadHistory, results.bmr, inputs.tdee?.bmr]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory(activeCalculator);
    setRefreshing(false);
  }, [activeCalculator, loadHistory]);

  // Input change handler
  const handleInputChange = useCallback(
    (calculatorId: FitCalcId, fieldKey: string, value: string) => {
      setInputs(prev => ({
        ...prev,
        [calculatorId]: {
          ...(prev[calculatorId] || {}),
          [fieldKey]: value,
        },
      }));
      setResultSaved(prev => ({ ...prev, [calculatorId]: false }));
    },
    []
  );

  // 🔧 FIX: Stable onChange handler for FitCalcCard
  const handleFieldChange = useCallback(
    (fieldKey: string, value: string) => {
      handleInputChange(activeCalculator, fieldKey, value);
    },
    [activeCalculator, handleInputChange]
  );

  // ✅ FIXED: Computation router with ALL 14 calculators
  const computeForId = useCallback((id: FitCalcId): any | null => {
    if (id === 'bmi') return computeBmi((inputs.bmi || {}) as BmiInputs);
    if (id === 'bmr') return computeBmr((inputs.bmr || {}) as BmrInputs);
    if (id === 'tdee') return computeTdee((inputs.tdee || {}) as TdeeInputs);
    if (id === 'macros') return computeMacros((inputs.macros || {}) as MacrosInputs);
    if (id === 'onerm') return computeOneRm((inputs.onerm || {}) as OneRmInputs);
    if (id === 'bodyfat') return computeBodyFat((inputs.bodyfat || {}) as BodyFatInputs);
    if (id === 'idealweight') return computeIdealWeight((inputs.idealweight || {}) as IdealWeightInputs);
    if (id === 'hrzones') return computeHrZones((inputs.hrzones || {}) as HrZonesInputs);
    if (id === 'vo2max') return computeVo2max((inputs.vo2max || {}) as Vo2maxInputs);
    if (id === 'water') return computeWater((inputs.water || {}) as WaterInputs);
    if (id === 'protein') return computeProtein((inputs.protein || {}) as ProteinInputs);
    if (id === 'activity') return computeActivity((inputs.activity || {}) as ActivityInputs);
    if (id === 'running') return computeRunning((inputs.running || {}) as RunningInputs);
    if (id === 'ratios') return computeRatios((inputs.ratios || {}) as RatiosInputs);
    return null;
  }, [inputs]);

  // Calculate handler
  const handleCalculate = useCallback(async () => {
    const result = computeForId(activeCalculator);
    
    if (!result) {
      const messages: Record<FitCalcId, string> = {
        bmi: 'Please enter height and weight',
        bmr: 'Please fill age, height and weight',
        macros: 'Please enter goal calories',
        tdee: 'Please fill BMR and activity level',
        onerm: 'Please enter weight and reps',
        bodyfat: 'Please fill all measurements',
        hrzones: 'Please enter your age',
        vo2max: 'Please enter time for 1.5 mile run',
        activity: 'Please fill all activity details',
        ratios: 'Please enter height, waist and hip',
        idealweight: 'Please select gender and enter height',
        water: 'Please enter weight and activity level',
        running: 'Please enter distance and time',
        protein: 'Please fill weight, activity and goal',
      };
      showToast(messages[activeCalculator] || 'Please complete required fields', 'warning');
      return;
    }

    setResults(prev => ({ ...prev, [activeCalculator]: result }));
    setResultSaved(prev => ({ ...prev, [activeCalculator]: false }));

    // Side effects - Auto-populate related calculators
    if (activeCalculator === 'bmr') {
      const bmrValue = (result as BmrResult).value.toString();
      setInputs(prev => ({
        ...prev,
        tdee: { ...(prev.tdee || {}), bmr: bmrValue },
      }));
    }

    if (activeCalculator === 'tdee') {
      const targetCal = (result as TdeeResult).target.toString();
      setInputs(prev => ({
        ...prev,
        macros: { ...(prev.macros || {}), calories: targetCal },
      }));
    }
  }, [activeCalculator, computeForId, showToast]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!user?.uid || !results[activeCalculator]) return;

    setSaving(true);
    try {
      await saveFitCalcHistory(
        user.uid,
        activeCalculator,
        inputs[activeCalculator] ?? {},
        results[activeCalculator] ?? {}
      );
      setResultSaved(prev => ({ ...prev, [activeCalculator]: true }));
      await loadHistory(activeCalculator);
      showToast('Saved successfully', 'success');
    } catch (error) {
      console.error('Save failed:', error);
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }, [user?.uid, activeCalculator, inputs, results, loadHistory, showToast]);

  // Delete history handler
  const handleDeleteHistory = useCallback(
    async (entryId: string) => {
      if (!user?.uid) return;
      
      try {
        await deleteFitCalcHistoryEntry(user.uid, entryId);
        await loadHistory(activeCalculator);
        showToast('Entry deleted', 'success');
      } catch (error) {
        console.error('Delete failed:', error);
        showToast('Failed to delete entry', 'error');
      }
    },
    [user?.uid, activeCalculator, loadHistory, showToast]
  );

  // Category selection handler
  const handleCategorySelect = useCallback((categoryId: CategoryId) => {
    setActiveCategory(categoryId);
    const category = CATEGORIES.find(cat => cat.id === categoryId);
    if (category && category.calculators.length > 0) {
      setActiveCalculator(category.calculators[0]);
    }
  }, []);

  // Calculator selection handler
  const handleCalculatorSelect = useCallback((calcId: FitCalcId) => {
    setActiveCalculator(calcId);
  }, []);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  // Render chart for current calculator
  const renderChart = useCallback(() => {
    const r = results[activeCalculator];
    if (!r) return null;

    // Build chart props based on calculator type
    const chartProps: any = {
      type: activeCalculator,
      data: r,
    };

    // Add inputs for calculators that need them in their charts
    if (activeCalculator === 'bmi' && inputs.bmi) {
      chartProps.inputs = inputs.bmi;
    } else if (activeCalculator === 'tdee' && inputs.tdee) {
      chartProps.inputs = inputs.tdee;
    } else if (activeCalculator === 'bodyfat' && inputs.bodyfat) {
      chartProps.inputs = inputs.bodyfat;
    } else if (activeCalculator === 'idealweight' && inputs.idealweight) {
      chartProps.inputs = inputs.idealweight;
    } else if (activeCalculator === 'activity' && inputs.activity) {
      chartProps.inputs = inputs.activity;
    } else if (activeCalculator === 'protein' && inputs.protein) {
      chartProps.inputs = inputs.protein;
    }

    return <FitCalcChart {...chartProps} />;
  }, [activeCalculator, results, inputs]);

  const renderResultNode = useCallback(() => {
    const r = results[activeCalculator] as any;
    if (!r) return null;

    if (activeCalculator === 'bmi') {
      const bmi = r as BmiResult;
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
            <Text style={styles.insightText}>
              {parseFloat(bmi.value) < 18.5 && 
                'Your BMI suggests you may be underweight. Consider consulting a nutritionist to develop a healthy weight gain plan with nutrient-dense foods.'}
              {parseFloat(bmi.value) >= 18.5 && parseFloat(bmi.value) < 25 && 
                'Great job! Your BMI is in the healthy range. Keep up your balanced diet and regular physical activity to maintain your health.'}
              {parseFloat(bmi.value) >= 25 && parseFloat(bmi.value) < 30 && 
                'Your BMI is slightly elevated. Small lifestyle changes like adding 30 minutes of daily activity and reducing portion sizes can help.'}
              {parseFloat(bmi.value) >= 30 && 
                'Your BMI indicates obesity. Working with a healthcare provider can help you create a safe and effective weight management plan.'}
            </Text>
          </View>
        </>
      );
    }

    if (activeCalculator === 'bmr') {
      const bmr = r as BmrResult;
      return (
        <>
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Your BMR</Text>
            <Text style={styles.resultValue}>{bmr.value} kcal/day</Text>
            <Text style={styles.resultHint}>
              Calories your body burns each day at rest.
            </Text>
          </View>
          
          {renderChart()}
          
          <View style={styles.insightBox}>
            <View style={styles.insightHeader}>
              <Ionicons name="information-circle" size={18} color={Colors.light.primary} />
              <Text style={styles.insightTitle}>What this means for you</Text>
            </View>
            <Text style={styles.insightText}>
              Your body burns {bmr.value} calories daily just to maintain basic functions like breathing and circulation. 
              To calculate your total daily needs, multiply this by your activity level in the TDEE calculator.
            </Text>
          </View>
        </>
      );
    }

    if (activeCalculator === 'tdee') {
      const tdee = r as TdeeResult;
      return (
        <>
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Your TDEE</Text>
            <Text style={styles.resultValue}>{tdee.tdee} kcal/day</Text>
            <Text style={styles.resultHint}>
              Maintenance: {tdee.tdee} kcal • Goal: {tdee.target} kcal
            </Text>
          </View>
          
          {renderChart()}
          
          <View style={styles.insightBox}>
            <View style={styles.insightHeader}>
              <Ionicons name="information-circle" size={18} color={Colors.light.primary} />
              <Text style={styles.insightTitle}>What this means for you</Text>
            </View>
            <Text style={styles.insightText}>
              Your total daily energy expenditure is {tdee.tdee} calories. Based on your goal, 
              you should consume {tdee.target} calories per day to {inputs.tdee?.goal === 'lose' ? 'lose weight' : inputs.tdee?.goal === 'gain' ? 'gain weight' : 'maintain your current weight'}.
            </Text>
          </View>
        </>
      );
    }

    if (activeCalculator === 'macros') {
      const m = r as MacrosResult;
      const presetKey = (inputs.macros?.preset ?? 'balanced') as keyof typeof MACRO_PRESETS;
      const preset = MACRO_PRESETS[presetKey];
      
      return (
        <>
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Your Macros</Text>
            <Text style={styles.resultPreset}>
              Preset: {preset.label} ({preset.note})
            </Text>

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
            <Text style={styles.insightText}>
              {presetKey === 'balanced' && 
                'This balanced split works well for general health and fitness. Aim to spread your protein across 3-4 meals for optimal muscle maintenance.'}
              {presetKey === 'keto' && 
                'This ketogenic ratio pushes your body into fat-burning mode. Stay hydrated and watch for initial keto flu symptoms.'}
              {presetKey === 'highp' && 
                'Extra protein supports muscle growth and recovery. Ideal if you\'re strength training 3+ times per week.'}
              {presetKey === 'lowcarb' && 
                'Lower carbs can help with fat loss while maintaining energy. Focus on quality fats like avocados and nuts.'}
            </Text>
          </View>
        </>
      );
    }

    // For other calculators, just show the chart
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
    const dateStr = entry.savedAt?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) ?? '';

    if (activeCalculator === 'bmi') {
      const bmiInputs = entry.inputs as BmiInputs;
      const bmiResult = entry.result as BmiResult;
      const height = bmiInputs?.height ?? '-';
      const weight = bmiInputs?.weight ?? '-';
      const value = bmiResult?.value ?? '-';
      const category = bmiResult?.category ?? '-';
      return {
        line1: dateStr,
        line2: `Height: ${height} cm, Weight: ${weight} kg`,
        line3: `BMI: ${value} • ${category}`,
      };
    }

    if (activeCalculator === 'bmr') {
      const bmrInputs = entry.inputs as BmrInputs;
      const bmrResult = entry.result as BmrResult;
      const gender = bmrInputs?.gender ?? '-';
      const age = bmrInputs?.age ?? '-';
      const formula = bmrInputs?.formula ?? '-';
      const value = bmrResult?.value ?? '-';
      return {
        line1: dateStr,
        line2: `${gender}, Age: ${age}, ${formula}`,
        line3: `BMR: ${value} kcal/day`,
      };
    }

    if (activeCalculator === 'tdee') {
      const tdeeInputs = entry.inputs as TdeeInputs;
      const tdeeResult = entry.result as TdeeResult;
      const bmr = tdeeInputs?.bmr ?? '-';
      const activity = tdeeInputs?.activity ?? '-';
      const tdee = tdeeResult?.tdee ?? '-';
      const target = tdeeResult?.target ?? '-';
      return {
        line1: dateStr,
        line2: `BMR: ${bmr}, Activity: ${activity}`,
        line3: `TDEE: ${tdee} • Goal: ${target} kcal`,
      };
    }

    if (activeCalculator === 'macros') {
      const macrosInputs = entry.inputs as MacrosInputs;
      const macrosResult = entry.result as MacrosResult;
      const calories = macrosInputs?.calories ?? '-';
      const presetKey = (macrosInputs?.preset ?? 'balanced') as keyof typeof MACRO_PRESETS;
      const preset = MACRO_PRESETS[presetKey];
      const protein = macrosResult?.protein ?? '-';
      const carbs = macrosResult?.carbs ?? '-';
      const fat = macrosResult?.fat ?? '-';
      return {
        line1: dateStr,
        line2: `Goal: ${calories} kcal • Preset: ${preset?.label ?? presetKey}`,
        line3: `P ${protein}g • C ${carbs}g • F ${fat}g`,
      };
    }

    return {
      line1: dateStr,
      line2: JSON.stringify(entry.inputs ?? {}),
      line3: JSON.stringify(entry.result ?? {}),
    };
  }, [activeCalculator]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>FitCalc</Text>
        </View>
        
        <View style={styles.headerRight}>
          {saving && <ActivityIndicator size="small" color={Colors.light.primary} />}
        </View>
      </View>

      {/* Main Layout: Sidebar + Content */}
      <View style={styles.mainLayout}>
        {/* Left Category Sidebar */}
        <View style={styles.categorySidebar}>
          {CATEGORIES.map(category => {
            const isActive = category.id === activeCategory;
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                onPress={() => handleCategorySelect(category.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={category.icon}
                  size={24}
                  color={isActive ? Colors.light.primary : Colors.light.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    isActive && styles.categoryLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right Content Area */}
        <View style={styles.contentArea}>
          {/* Top Calculator Chips */}
          <ScrollView
            horizontal
            style={styles.calculatorChipsScroll}
            contentContainerStyle={styles.calculatorChipsContent}
            showsHorizontalScrollIndicator={false}
          >
            {calculatorsForCategory.map(calcId => {
              const isActive = calcId === activeCalculator;
              const config = FITCALC_CONFIG[calcId];
              return (
                <TouchableOpacity
                  key={calcId}
                  style={[styles.calculatorChip, isActive && styles.calculatorChipActive]}
                  onPress={() => handleCalculatorSelect(calcId)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.calculatorChipText,
                      isActive && styles.calculatorChipTextActive,
                    ]}
                  >
                    {config.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Calculator Content */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator
                size="large"
                color={Colors.light.primary}
                style={styles.loader}
              />
            ) : (
              <FitCalcCard
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
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  categorySidebar: {
    width: 90,
    backgroundColor: Colors.light.cardBackground,
    borderRightWidth: 1,
    borderRightColor: Colors.light.border,
    paddingVertical: 12,
  },
  categoryTab: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  categoryTabActive: {
    backgroundColor: Colors.light.primary + '10',
    borderRightWidth: 3,
    borderRightColor: Colors.light.primary,
  },
  categoryLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryLabelActive: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  contentArea: {
    flex: 1,
  },
  calculatorChipsScroll: {
    maxHeight: 56,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  calculatorChipsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  calculatorChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  calculatorChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  calculatorChipText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '600',
  },
  calculatorChipTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loader: {
    marginTop: 40,
  },
  resultContainer: {
    marginTop: 0,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  resultCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
  },
  resultHint: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  resultPreset: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    marginBottom: 12,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 2,
  },
  macroKcal: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  insightBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.light.primary + '08',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  insightText: {
    fontSize: 12,
    color: Colors.light.text,
    lineHeight: 18,
  },
});
