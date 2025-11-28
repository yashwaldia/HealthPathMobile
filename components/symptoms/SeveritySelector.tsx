import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SEVERITY_LEVELS } from '../../constants/symptomData';
import { Colors } from '../../constants/colors';

interface SeveritySelectorProps {
  selectedSeverity: number;
  onSelect: (severity: number) => void;
}

export default function SeveritySelector({ selectedSeverity, onSelect }: SeveritySelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Severity Level</Text>
      <View style={styles.levelsContainer}>
        {SEVERITY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.levelButton,
              selectedSeverity === level.value && {
                backgroundColor: level.color,
                borderColor: level.color,
              }
            ]}
            onPress={() => onSelect(level.value)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.levelValue,
              selectedSeverity === level.value && styles.levelValueSelected
            ]}>
              {level.value}
            </Text>
            <Text style={[
              styles.levelLabel,
              selectedSeverity === level.value && styles.levelLabelSelected
            ]}>
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  levelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelButton: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  levelValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  levelValueSelected: {
    color: '#FFFFFF',
  },
  levelLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  levelLabelSelected: {
    color: '#FFFFFF',
  },
});
