import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { PATHOLOGY_TESTS } from '../../../constants/learningData';
import { PathologyTest } from '../../../types/learning';

interface LearningZoneScreenProps {
  initialCompareList: string[];
  onUpdateCompareList: (list: string[]) => void;
}

export default function LearningZoneScreen({
  initialCompareList,
  onUpdateCompareList,
}: LearningZoneScreenProps) {
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialCompareList && initialCompareList.length > 0) {
      setSelectedTestIds(initialCompareList);
    } else {
      // Default selection
      setSelectedTestIds(['cbc', 'lft']);
    }
  }, [initialCompareList]);

  const handleTestSelection = (testId: string) => {
    setSelectedTestIds((prev) => {
      let newSelection: string[];

      if (prev.includes(testId)) {
        // Remove if already selected
        newSelection = prev.filter((id) => id !== testId);
      } else if (prev.length < 3) {
        // Add if less than 3 selected
        newSelection = [...prev, testId];
      } else {
        // Replace first item if already at max
        newSelection = [...prev.slice(1), testId];
      }

      // Update parent state
      onUpdateCompareList(newSelection);
      return newSelection;
    });
  };

  const selectedTests = useMemo(() => {
    return PATHOLOGY_TESTS.filter((test) => selectedTestIds.includes(test.id));
  }, [selectedTestIds]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="school" size={28} color={Colors.light.primary} />
          <Text style={styles.headerTitle}>Learning Zone</Text>
          <Text style={styles.headerSubtitle}>
            Compare up to 3 tests side by side ({selectedTestIds.length}/3)
          </Text>
        </View>

        {/* Test Selection */}
        <View style={styles.selectionSection}>
          <Text style={styles.sectionTitle}>Select Tests to Compare</Text>
          {PATHOLOGY_TESTS.map((test) => (
            <TouchableOpacity
              key={test.id}
              style={[
                styles.testCheckbox,
                selectedTestIds.includes(test.id) && styles.testCheckboxSelected,
              ]}
              onPress={() => handleTestSelection(test.id)}
              disabled={
                !selectedTestIds.includes(test.id) && selectedTestIds.length >= 3
              }
            >
              <Ionicons
                name={
                  selectedTestIds.includes(test.id) ? 'checkbox' : 'square-outline'
                }
                size={24}
                color={
                  selectedTestIds.includes(test.id)
                    ? Colors.light.primary
                    : Colors.light.textSecondary
                }
              />
              <Text
                style={[
                  styles.testCheckboxText,
                  selectedTestIds.includes(test.id) && styles.testCheckboxTextSelected,
                ]}
              >
                {test.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Comparison Table */}
        {selectedTests.length > 0 && (
          <View style={styles.comparisonSection}>
            <Text style={styles.sectionTitle}>Comparison</Text>

            {/* Purpose Row */}
            <ComparisonRow
              label="Purpose"
              icon="information-circle"
              tests={selectedTests}
              field="purpose"
            />

            {/* Detects Row */}
            <ComparisonRow
              label="Detects"
              icon="search"
              tests={selectedTests}
              field="detects"
            />

            {/* Normal Range Row */}
            <ComparisonRow
              label="Normal Range"
              icon="stats-chart"
              tests={selectedTests}
              field="normalRange"
            />

            {/* Sample Type Row */}
            <ComparisonRow
              label="Sample Type"
              icon="water"
              tests={selectedTests}
              field="sampleType"
            />

            {/* Interpretation Tips Row */}
            <ComparisonRow
              label="Interpretation Tips"
              icon="bulb"
              tests={selectedTests}
              field="interpretationTips"
            />
          </View>
        )}

        {selectedTests.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="git-compare-outline" size={64} color={Colors.light.textLight} />
            <Text style={styles.emptyStateText}>No tests selected</Text>
            <Text style={styles.emptyStateSubtext}>
              Select tests from the list above to compare
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Comparison Row Component
interface ComparisonRowProps {
  label: string;
  icon: string;
  tests: PathologyTest[];
  field: keyof PathologyTest;
}

function ComparisonRow({ label, icon, tests, field }: ComparisonRowProps) {
  return (
    <View style={styles.comparisonRow}>
      <View style={styles.comparisonLabelCell}>
        <Ionicons name={icon as any} size={18} color={Colors.light.primary} />
        <Text style={styles.comparisonLabel}>{label}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.comparisonDataRow}>
          {tests.map((test) => (
            <View key={test.id} style={styles.comparisonDataCell}>
              <Text style={styles.comparisonTestName}>{test.name}</Text>
              <Text style={styles.comparisonData}>{String(test[field])}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  selectionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  testCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  testCheckboxSelected: {
    backgroundColor: Colors.light.primary + '10',
    borderColor: Colors.light.primary,
  },
  testCheckboxText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  testCheckboxTextSelected: {
    fontWeight: '600',
    color: Colors.light.primary,
  },
  comparisonSection: {
    marginBottom: 20,
  },
  comparisonRow: {
    marginBottom: 16,
  },
  comparisonLabelCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.primary + '15',
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  comparisonDataRow: {
    flexDirection: 'row',
    gap: 12,
  },
  comparisonDataCell: {
    width: 250,
    padding: 12,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  comparisonTestName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  comparisonData: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
