// components/symptoms/SelectedSymptomsBar.tsx
// ✅ UPDATED: Grouped by category with clear/remove actions
// Last Updated: December 18, 2025

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import SymptomChip from './SymptomChip';

// Same structure used in symptoms.tsx
export interface CategorizedSymptoms {
  [categoryId: string]: {
    categoryName: string;
    symptoms: string[];
  };
}

interface SelectedSymptomsBarProps {
  categorizedSymptoms: CategorizedSymptoms;
  onRemoveSymptom: (categoryId: string, symptom: string) => void;
  onClearCategory: (categoryId: string) => void;
}

export default function SelectedSymptomsBar({
  categorizedSymptoms,
  onRemoveSymptom,
  onClearCategory,
}: SelectedSymptomsBarProps) {
  const categoryEntries = Object.entries(categorizedSymptoms);

  if (categoryEntries.length === 0) {
    return null;
  }

  const totalCount = categoryEntries.reduce(
    (sum, [, data]) => sum + data.symptoms.length,
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          Selected Symptoms ({totalCount})
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categoryEntries.map(([categoryId, data]) => (
          <View key={categoryId} style={styles.categoryBlock}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>
                {data.categoryName}
              </Text>
              <TouchableOpacity
                onPress={() => onClearCategory(categoryId)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chipsRow}>
              {data.symptoms.map((symptom, index) => (
                <SymptomChip
                  key={`${categoryId}-${symptom}-${index}`}
                  symptom={symptom}
                  onRemove={() => onRemoveSymptom(categoryId, symptom)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingRight: 8,
  },
  categoryBlock: {
    marginRight: 12,
    paddingRight: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
  },
  clearText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
