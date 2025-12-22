// app/(tabs)/nutrition-tracker.tsx

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
import CustomToast from '../../components/ui/CustomToast';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import {
  NutritionEntry,
  nutritionService,
} from '../../services/nutritionService';
import { getTodayISO } from '../../utils/dateUtils';

import ManualFoodModal from '../../components/nutrition/ManualFoodModal';
import NutritionCaloriesChart from '../../components/nutrition/NutritionCaloriesChart';
import NutritionDeficiencyCard from '../../components/nutrition/NutritionDeficiencyCard';
import NutritionHeader from '../../components/nutrition/NutritionHeader';
import NutritionMealList from '../../components/nutrition/NutritionMealList';
import NutritionQuickActions from '../../components/nutrition/NutritionQuickActions';
import NutritionSummaryCards from '../../components/nutrition/NutritionSummaryCards';

// Image comparison screen
import ImageComparisonScreen from '../../components/nutrition/ImageComparisonScreen';

// Mode type
export type NutritionMode = 'dashboard' | 'image-compare';

// Helper: Get Monday of the week containing the given date
function getMondayOfWeek(dateISO: string): string {
  const d = new Date(dateISO);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days; else go to Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

// Helper: Add days to a date
function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function NutritionTrackerScreen() {
  const { user } = useAuth();

  const [todayEntries, setTodayEntries] = useState<NutritionEntry[]>([]);
  const [weekEntries, setWeekEntries] = useState<NutritionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });

  // Manual log modal state
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<NutritionEntry | null>(null);

  // Currently selected date for chart + meal list
  const [selectedDateISO, setSelectedDateISO] = useState<string>(getTodayISO());

  // Current week start (Monday)
  const [weekStartDate, setWeekStartDate] = useState<string>(
    getMondayOfWeek(getTodayISO()),
  );

  // Active mode
  const [activeMode, setActiveMode] =
    useState<NutritionMode>('dashboard'); // 'dashboard' | 'image-compare'

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning',
  ) => setToast({ visible: true, message, type });

  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const today = getTodayISO();
      const weekStart = weekStartDate;
      const weekEnd = addDays(weekStart, 6); // Sunday

      const [todayData, weekData] = await Promise.all([
        nutritionService.getForDate(user.uid, today),
        nutritionService.getInRange(user.uid, weekStart, weekEnd),
      ]);

      setTodayEntries(todayData);
      setWeekEntries(weekData);
    } catch (error) {
      console.error('Error loading nutrition data:', error);
      showToast('Failed to load nutrition data', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, weekStartDate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleEntryAdded = async () => {
    showToast('Meal logged successfully', 'success');
    await loadData();
  };

  const handleEntryDeleted = async () => {
    showToast('Entry deleted', 'success');
    await loadData();
  };

  const handleEntryUpdated = async () => {
    showToast('Meal updated', 'success');
    await loadData();
  };

  // Open modal for creating a new meal
  const openManualAddModal = () => {
    setEditingEntry(null);
    setManualModalVisible(true);
  };

  // Open modal for editing an existing meal
  const openManualEditModal = (entry: NutritionEntry) => {
    setEditingEntry(entry);
    setManualModalVisible(true);
  };

  // Save handler for ManualFoodModal (add or update)
  const handleSaveManualMeal = async (payload: {
    date: string;
    time: string;
    mealType: NutritionEntry['mealType'];
    foods: NutritionEntry['foods'];
    notes?: string;
  }) => {
    if (!user?.uid) return;

    if (editingEntry) {
      // Update existing entry
      await nutritionService.updateEntry(user.uid, editingEntry.entryId, {
        ...editingEntry,
        ...payload,
        totalCalories: payload.foods.reduce(
          (sum, f) => sum + (f.calories || 0),
          0,
        ),
        totalProtein: payload.foods.reduce(
          (sum, f) => sum + (f.protein || 0),
          0,
        ),
        totalCarbs: payload.foods.reduce(
          (sum, f) => sum + (f.carbs || 0),
          0,
        ),
        totalFats: payload.foods.reduce((sum, f) => sum + (f.fat || 0), 0),
      });
      await handleEntryUpdated();
    } else {
      // Create new entry
      const totals = payload.foods.reduce(
        (acc, f) => {
          acc.totalCalories += f.calories || 0;
          acc.totalProtein += f.protein || 0;
          acc.totalCarbs += f.carbs || 0;
          acc.totalFats += f.fat || 0;
          return acc;
        },
        {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFats: 0,
        },
      );

      await nutritionService.addEntry(user.uid, {
        date: payload.date,
        mealType: payload.mealType,
        time: payload.time,
        foods: payload.foods,
        totalCalories: totals.totalCalories,
        totalProtein: totals.totalProtein,
        totalCarbs: totals.totalCarbs,
        totalFats: totals.totalFats,
        totalSugar: 0,
        totalSodium: 0,
        images: [],
        notes: payload.notes,
      });
      await handleEntryAdded();
    }
  };

  // Week navigation
  const handlePreviousWeek = () => {
    const newWeekStart = addDays(weekStartDate, -7);
    setWeekStartDate(newWeekStart);
    setSelectedDateISO(newWeekStart); // Select Monday of previous week
  };

  const handleNextWeek = () => {
    const newWeekStart = addDays(weekStartDate, 7);
    setWeekStartDate(newWeekStart);
    setSelectedDateISO(newWeekStart); // Select Monday of next week
  };

  // Check if we can go to next week (can't go beyond current week)
  const todayMonday = getMondayOfWeek(getTodayISO());
  const canGoNext = weekStartDate < todayMonday;

  const todayISO = getTodayISO();

  // Entries to show in MealList based on selected date
  const selectedDayEntries = weekEntries.filter(
    (e) => e.date === selectedDateISO,
  );

  // Render main dashboard content (existing behavior)
  const renderDashboard = () => (
    <>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <NutritionSummaryCards entries={todayEntries} />

          <NutritionQuickActions
            onEntryAdded={handleEntryAdded}
            onPredictorRun={undefined}
            onManualLogPress={openManualAddModal}
          />

          <NutritionCaloriesChart
            entries={weekEntries}
            selectedDate={selectedDateISO}
            onDayPress={setSelectedDateISO}
            weekStartDate={weekStartDate}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
            canGoNext={canGoNext}
          />

          <NutritionDeficiencyCard />

          <NutritionMealList
            entries={selectedDayEntries}
            onEntryDeleted={handleEntryDeleted}
            onEntryUpdated={handleEntryUpdated}
          />
        </ScrollView>
      )}
    </>
  );

  // Render the new image comparison screen
  const renderImageCompare = () => (
    <ImageComparisonScreen
      onShowToast={(message, type) =>
        setToast({ visible: true, message, type })
      }
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <CustomToast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />

        {/* Header with title only */}
        <NutritionHeader />

        {/* Tab Switch Section */}
        <View style={styles.tabSwitchContainer}>
          <View style={styles.tabButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                styles.tabButtonLeft,
                activeMode === 'dashboard' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveMode('dashboard')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeMode === 'dashboard' && styles.tabButtonTextActive,
                ]}
              >
                Dashboard
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                styles.tabButtonRight,
                activeMode === 'image-compare' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveMode('image-compare')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeMode === 'image-compare' && styles.tabButtonTextActive,
                ]}
              >
                Image Analyzer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main content: switch by activeMode */}
        {activeMode === 'dashboard' ? renderDashboard() : renderImageCompare()}

        {/* Manual add/edit modal */}
        <ManualFoodModal
          visible={manualModalVisible}
          onClose={() => setManualModalVisible(false)}
          onSave={handleSaveManualMeal}
          dateISO={todayISO}
          initialEntry={editingEntry}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSwitchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: Colors.light.background,
  },
  tabButtonsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabButtonLeft: {
    marginRight: 2,
  },
  tabButtonRight: {
    marginLeft: 2,
  },
  tabButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#718096',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
});
