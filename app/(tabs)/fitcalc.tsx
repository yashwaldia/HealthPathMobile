// app/(tabs)/fitcalc.tsx

import React, { useCallback, useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import CustomToast from '../../components/ui/CustomToast';
import { FitCalcSidebar } from '../../components/fitcalc/FitCalcSidebar';
import { FitCalcCard } from '../../components/fitcalc/FitCalcCard';
import { FITCALC_CONFIG } from '../../constants/fitcalcConfig';
import {
  FitCalcId,
  FitCalcInputs,
  FitCalcResults,
  BmiInputs,
  BmiResult,
  BmrInputs,
  BmrResult,
  MacrosInputs,
  MacrosResult,
} from '../../types/fitcalc';
import {
  saveFitCalcHistory,
  loadFitCalcHistory,
  deleteFitCalcHistoryEntry,
  FitCalcHistoryEntry,
} from '../../services/fitCalcService';

// Macro presets (MacroMaster-style)
const MACRO_PRESETS: Record<
  NonNullable<MacrosInputs['preset']>,
  { p: number; c: number; f: number; note: string; label: string }
> = {
  balanced: { p: 0.3, c: 0.4, f: 0.3, note: 'P 30% / C 40% / F 30%', label: 'Balanced' },
  keto: { p: 0.2, c: 0.05, f: 0.75, note: 'P 20% / C 5% / F 75%', label: 'Ketogenic' },
  highp: { p: 0.35, c: 0.35, f: 0.3, note: 'P 35% / C 35% / F 30%', label: 'High Protein' },
  lowcarb: { p: 0.3, c: 0.25, f: 0.45, note: 'P 30% / C 25% / F 45%', label: 'Low Carb' },
};

function computeMacros(inputs: MacrosInputs): MacrosResult | null {
  const calories = parseFloat(inputs.calories || '');
  if (!calories || calories <= 0) return null;

  const presetKey: NonNullable<MacrosInputs['preset']> = inputs.preset ?? 'balanced';
  const preset = MACRO_PRESETS[presetKey];

  const pK = calories * preset.p;
  const cK = calories * preset.c;
  const fK = calories * preset.f;

  const protein = pK / 4;
  const carbs = cK / 4;
  const fat = fK / 9;

  return {
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    ratios: {
      protein: preset.p,
      carbs: preset.c,
      fat: preset.f,
    },
    kcal: {
      protein: Math.round(pK),
      carbs: Math.round(cK),
      fat: Math.round(fK),
      total: Math.round(calories),
    },
  };
}

export default function FitCalcScreen() {
  const { user } = useAuth();

  const [activeId, setActiveId] = useState<FitCalcId>('bmi');
  const [inputs, setInputs] = useState<FitCalcInputs>({});
  const [results, setResults] = useState<FitCalcResults>({});
  const [resultSaved, setResultSaved] = useState<{ [key in FitCalcId]?: boolean }>({});
  const [history, setHistory] = useState<{ [key in FitCalcId]?: FitCalcHistoryEntry[] }>({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info'
  ) => setToast({ visible: true, message, type });

  const loadHistory = useCallback(
    async (calcId: FitCalcId) => {
      if (!user?.uid) return;
      try {
        if (!refreshing) setLoading(true);
        const entries = await loadFitCalcHistory(user.uid, calcId, 10);
        setHistory((prev) => ({ ...prev, [calcId]: entries }));
      } catch (error) {
        console.error('loadFitCalcHistory error:', error);
        showToast('Failed to load history', 'error');
      } finally {
        setLoading(false);
      }
    },
    [user?.uid, refreshing]
  );

  useEffect(() => {
    loadHistory(activeId);
  }, [activeId, loadHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory(activeId);
    setRefreshing(false);
  }, [activeId, loadHistory]);

  const handleInputChange = (calculatorId: FitCalcId, fieldKey: string, value: string) => {
    setInputs((prev) => ({
      ...prev,
      [calculatorId]: {
        ...(prev[calculatorId] || {}),
        [fieldKey]: value,
      },
    }));
    setResultSaved((prev) => ({ ...prev, [calculatorId]: false }));
  };

  // ---- Calculation helpers for BMI & BMR ----

  const computeBmi = (i: BmiInputs): BmiResult | null => {
    const height = parseFloat(i.height || '') / 100;
    const weight = parseFloat(i.weight || '');
    if (!height || !weight) return null;
    const bmi = weight / (height * height);

    let category: string;
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

    return {
      value: bmi.toFixed(1),
      category,
      hint,
      categoryClass,
    };
  };

  const computeBmr = (i: BmrInputs): BmrResult | null => {
    const gender = i.gender ?? 'male';
    const age = parseFloat(i.age || '');
    const height = parseFloat(i.height || '');
    const weight = parseFloat(i.weight || '');
    const formula = i.formula ?? 'mifflin';

    if (!age || !height || !weight) return null;

    let bmr: number;
    if (formula === 'mifflin') {
      if (gender === 'male') bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      else bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    } else {
      if (gender === 'male') {
        bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
      } else {
        bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
      }
    }

    return { value: Math.round(bmr) };
  };

  // ---- Generic compute map (BMI, BMR, Macros) ----

  const computeForId = (id: FitCalcId): any | null => {
    if (id === 'bmi') {
      return computeBmi((inputs.bmi || {}) as BmiInputs);
    }
    if (id === 'bmr') {
      return computeBmr((inputs.bmr || {}) as BmrInputs);
    }
    if (id === 'macros') {
      return computeMacros((inputs.macros || {}) as MacrosInputs);
    }
    // TODO: add other calculators here
    return null;
  };

  const handleCalculate = async () => {
    const r = computeForId(activeId);
    if (!r) {
      if (activeId === 'bmi') {
        showToast('Please enter height and weight', 'warning');
      } else if (activeId === 'bmr') {
        showToast('Please fill age, height and weight', 'warning');
      } else if (activeId === 'macros') {
        showToast('Please enter goal calories', 'warning');
      } else {
        showToast('Please complete required fields', 'warning');
      }
      return;
    }

    setResults((prev) => ({ ...prev, [activeId]: r }));
    setResultSaved((prev) => ({ ...prev, [activeId]: false }));

    // Side effects between calculators (e.g., BMR -> TDEE BMR field)
    if (activeId === 'bmr') {
      const value = (r as BmrResult).value.toString();
      setInputs((prev) => ({
        ...prev,
        tdee: { ...(prev.tdee || {}), bmr: value },
      }));
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    const calculatorInputs = inputs[activeId] ?? {};
    const calculatorResult = results[activeId] ?? {};
    if (!results[activeId]) return;

    setSaving(true);
    try {
      await saveFitCalcHistory(user.uid, activeId, calculatorInputs, calculatorResult);
      setResultSaved((prev) => ({ ...prev, [activeId]: true }));
      await loadHistory(activeId);
      showToast('Saved successfully', 'success');
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHistory = async (entryId: string) => {
    if (!user?.uid) return;
    try {
      await deleteFitCalcHistoryEntry(user.uid, entryId);
      await loadHistory(activeId);
      showToast('Entry deleted', 'success');
    } catch {
      showToast('Failed to delete entry', 'error');
    }
  };

  // ---- Result + history formatting per calculator ----

  const renderResultNode = () => {
    const r = results[activeId] as any;
    if (!r) return null;

    if (activeId === 'bmi') {
      const bmi = r as BmiResult;
      return (
        <View
          style={{
            marginTop: 0,
            backgroundColor: Colors.light.background,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: Colors.light.border,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.light.text }}>
            Your BMI
          </Text>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: Colors.light.primary,
            }}
          >
            {bmi.value}
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 14,
              fontWeight: '600',
              color: Colors.light.text,
            }}
          >
            {bmi.category}
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 12,
              color: Colors.light.textSecondary,
            }}
          >
            {bmi.hint}
          </Text>
        </View>
      );
    }

    if (activeId === 'bmr') {
      const bmr = r as BmrResult;
      return (
        <View
          style={{
            marginTop: 0,
            backgroundColor: Colors.light.background,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: Colors.light.border,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.light.text }}>
            Your BMR
          </Text>
          <Text
            style={{
              fontSize: 26,
              fontWeight: '700',
              color: Colors.light.primary,
            }}
          >
            {bmr.value} kcal/day
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 12,
              color: Colors.light.textSecondary,
            }}
          >
            Calories your body burns each day at rest.
          </Text>
        </View>
      );
    }

    if (activeId === 'macros') {
      const m = r as MacrosResult;
      const presetKey = (inputs.macros?.preset ?? 'balanced') as keyof typeof MACRO_PRESETS;
      const preset = MACRO_PRESETS[presetKey];
      return (
        <View
          style={{
            marginTop: 0,
            backgroundColor: Colors.light.background,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: Colors.light.border,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.light.text }}>
            Your Macros
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 12,
              color: Colors.light.textSecondary,
            }}
          >
            Preset: {preset.label} ({preset.note})
          </Text>

          <View style={{ marginTop: 10, gap: 6 }}>
            <Text style={{ fontSize: 13, color: Colors.light.text }}>
              Protein:{' '}
              <Text style={{ fontWeight: '700', color: Colors.light.primary }}>
                {m.protein} g
              </Text>{' '}
              ({m.kcal.protein} kcal)
            </Text>
            <Text style={{ fontSize: 13, color: Colors.light.text }}>
              Carbs:{' '}
              <Text style={{ fontWeight: '700', color: Colors.light.primary }}>
                {m.carbs} g
              </Text>{' '}
              ({m.kcal.carbs} kcal)
            </Text>
            <Text style={{ fontSize: 13, color: Colors.light.text }}>
              Fat:{' '}
              <Text style={{ fontWeight: '700', color: Colors.light.primary }}>
                {m.fat} g
              </Text>{' '}
              ({m.kcal.fat} kcal)
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontSize: 12,
                color: Colors.light.textSecondary,
              }}
            >
              Total: {m.kcal.total} kcal/day
            </Text>
          </View>
        </View>
      );
    }

    // TODO: other calculators
    return null;
  };

  const renderHistoryRow = (entry: FitCalcHistoryEntry) => {
    const dateStr = entry.savedAt
      ? entry.savedAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '';

    if (activeId === 'bmi') {
      const height = entry.inputs?.height ?? '-';
      const weight = entry.inputs?.weight ?? '-';
      const value = entry.result?.value ?? '-';
      const category = entry.result?.category ?? '-';
      return {
        line1: dateStr,
        line2: `Height: ${height} cm, Weight: ${weight} kg`,
        line3: `BMI: ${value} • ${category}`,
      };
    }

    if (activeId === 'bmr') {
      const gender = entry.inputs?.gender ?? '-';
      const age = entry.inputs?.age ?? '-';
      const formula = entry.inputs?.formula ?? '-';
      const value = entry.result?.value ?? '-';
      return {
        line1: dateStr,
        line2: `${gender}, Age: ${age}, ${formula}`,
        line3: `BMR: ${value} kcal/day`,
      };
    }

    if (activeId === 'macros') {
      const calories = entry.inputs?.calories ?? '-';
      const presetKey = (entry.inputs?.preset ?? 'balanced') as keyof typeof MACRO_PRESETS;
      const preset = MACRO_PRESETS[presetKey];
      const protein = entry.result?.protein ?? '-';
      const carbs = entry.result?.carbs ?? '-';
      const fat = entry.result?.fat ?? '-';
      return {
        line1: dateStr,
        line2: `Goal: ${calories} kcal • Preset: ${preset?.label ?? presetKey}`,
        line3: `P ${protein} g • C ${carbs} g • F ${fat} g`,
      };
    }

    // Default generic formatting with safety
    return {
      line1: dateStr,
      line2: JSON.stringify(entry.inputs ?? {}),
      line3: JSON.stringify(entry.result ?? {}),
    };
  };

  // ---- Render active calculator via generic card ----

  const activeConfig = FITCALC_CONFIG[activeId];

  const renderBody = () => {
    const inputForActive = ((inputs[activeId] || {}) as any) ?? {};
    const historyForActive = history[activeId] || [];
    const resultNode = renderResultNode();

    return (
      <FitCalcCard
        title={activeConfig.title}
        description={activeConfig.description}
        fields={activeConfig.fields}
        inputs={inputForActive}
        resultNode={resultNode}
        resultSaved={resultSaved[activeId]}
        history={historyForActive}
        onChange={(fieldKey, value) => handleInputChange(activeId, fieldKey, value)}
        onCalculate={handleCalculate}
        onSave={handleSave}
        onDeleteHistory={handleDeleteHistory}
        renderHistoryRow={renderHistoryRow}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <FitCalcSidebar
        visible={sidebarVisible}
        activeId={activeId}
        onSelect={setActiveId}
        onClose={() => setSidebarVisible(false)}
      />

      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>FitCalc</Text>
        </View>
        <View style={styles.headerRight}>
          {saving && <ActivityIndicator size="small" color={Colors.light.primary} />}
          <TouchableOpacity
            onPress={() => setSidebarVisible(true)}
            style={styles.menuButton}
          >
            <Ionicons name="menu-outline" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color={Colors.light.primary}
            style={{ marginTop: 40 }}
          />
        ) : (
          renderBody()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
  headerLeft: {
    width: 40,
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
  headerSubtitle: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    justifyContent: 'flex-end',
  },
  menuButton: {
    paddingLeft: 12,
    paddingVertical: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
