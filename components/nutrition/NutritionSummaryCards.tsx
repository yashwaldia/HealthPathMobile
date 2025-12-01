// components/nutrition/NutritionSummaryCards.tsx

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { NutritionEntry } from '../../services/nutritionService';

type Props = {
  entries: NutritionEntry[];
};

export default function NutritionSummaryCards({ entries }: Props) {
  const totals = useMemo(() => {
    if (!entries || entries.length === 0) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
    }

    return entries.reduce(
      (acc, curr) => ({
        calories: acc.calories + (curr.totalCalories || 0),
        protein: acc.protein + (curr.totalProtein || 0),
        carbs: acc.carbs + (curr.totalCarbs || 0),
        fat: acc.fat + (curr.totalFats || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [entries]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="flame-outline"
            size={22}
            color={Colors.light.primary}
          />
        </View>
        <Text style={styles.label}>Calories</Text>
        <Text style={styles.value}>{totals.calories.toFixed(0)} kcal</Text>
        <Text style={styles.helper}>Today</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="fitness-outline"
            size={22}
            color={Colors.light.primary}
          />
        </View>
        <Text style={styles.label}>Protein</Text>
        <Text style={styles.value}>{totals.protein.toFixed(0)} g</Text>
        <Text style={styles.helper}>Muscle support</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="leaf-outline"
            size={22}
            color={Colors.light.primary}
          />
        </View>
        <Text style={styles.label}>Carbs</Text>
        <Text style={styles.value}>{totals.carbs.toFixed(0)} g</Text>
        <Text style={styles.helper}>Energy</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="water-outline"
            size={22}
            color={Colors.light.primary}
          />
        </View>
        <Text style={styles.label}>Fats</Text>
        <Text style={styles.value}>{totals.fat.toFixed(0)} g</Text>
        <Text style={styles.helper}>Hormones</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 105,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  value: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 20,
  },
  helper: {
    fontSize: 9,
    color: Colors.light.textSecondary,
    marginTop: 3,
    textAlign: 'center',
    lineHeight: 12,
  },
});
