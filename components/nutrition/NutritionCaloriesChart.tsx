// components/nutrition/NutritionCaloriesChart.tsx

import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { NutritionEntry } from '../../services/nutritionService';

type Props = {
  entries: NutritionEntry[];
  selectedDate: string; // ISO YYYY-MM-DD of currently selected day
  onDayPress: (date: string) => void;
  weekStartDate: string; // ISO date of Monday of current week
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  canGoNext: boolean; // Can't go beyond current week
};

type DayData = {
  date: string;
  label: string;
  calories: number;
};

const WEEKDAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function NutritionCaloriesChart({
  entries,
  selectedDate,
  onDayPress,
  weekStartDate,
  onPreviousWeek,
  onNextWeek,
  canGoNext,
}: Props) {
  const { data, rangeLabel } = useMemo(() => {
    // Calculate all 7 days of the week starting from weekStartDate (Monday)
    const weekStart = new Date(weekStartDate);
    const allDays: DayData[] = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      const dateISO = currentDate.toISOString().split('T')[0];
      const label = WEEKDAY_ORDER[i];

      // Find calories for this date from entries
      const dayEntries = entries.filter((e) => e.date === dateISO);
      const calories = dayEntries.reduce((sum, e) => sum + (e.totalCalories || 0), 0);

      allDays.push({ date: dateISO, label, calories });
    }

    // Calculate date range label
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const range = `${weekStart.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} – ${weekEnd.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;

    return { data: allDays, rangeLabel: range };
  }, [entries, weekStartDate]);

  const maxCalories = Math.max(...data.map((d) => d.calories), 1);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Weekly Calories</Text>
          <Text style={styles.rangeText}>{rangeLabel}</Text>
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={onPreviousWeek}
            style={styles.navButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.light.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNextWeek}
            style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
            activeOpacity={0.7}
            disabled={!canGoNext}
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={canGoNext ? Colors.light.text : Colors.light.border}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chartRow}>
        {data.map((day) => {
          const heightPercent = day.calories > 0 ? Math.min(day.calories / maxCalories, 1) : 0;
          const barHeight = Math.max(80 * heightPercent, 4); // Minimum 4px for empty days
          const isSelected = day.date === selectedDate;
          const isEmpty = day.calories === 0;

          return (
            <TouchableOpacity
              key={day.date}
              style={styles.barContainer}
              activeOpacity={0.8}
              onPress={() => onDayPress(day.date)}
            >
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: isEmpty
                      ? Colors.light.border
                      : isSelected
                      ? Colors.light.primary
                      : Colors.light.primary + '40',
                  },
                ]}
              />
              <Text
                style={[
                  styles.barLabel,
                  isSelected && styles.barLabelActive,
                ]}
              >
                {day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.helper}>Tap a day to view that day&apos;s meals.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 14,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  rangeText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  navRow: {
    flexDirection: 'row',
    gap: 4,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 90,
    marginBottom: 8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 16,
    borderRadius: 7,
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  barLabelActive: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  helper: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});
