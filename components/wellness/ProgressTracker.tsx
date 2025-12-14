// components/wellness/ProgressTracker.tsx
// Visual progress bar component
// Last Updated: December 10, 2025

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

type Props = {
  currentValue: number;
  totalValue: number;
  unit: string;
  label: string;
  color?: string;
};

export default function ProgressTracker({
  currentValue,
  totalValue,
  unit,
  label,
  color = Colors.light.primary,
}: Props) {
  const percentage = Math.min((currentValue / totalValue) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${percentage}%` as any, // TypeScript workaround for percentage strings
              backgroundColor: color 
            }
          ]} 
        />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {unit === 'days' || unit === 'weeks' ? (
            <>
              <Text style={styles.statsHighlight}>{unit === 'days' ? 'Day' : 'Week'} {currentValue}</Text>
              {' '}of {totalValue}
            </>
          ) : (
            <>
              {currentValue} / {totalValue} {unit}
            </>
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  percentage: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  progressTrack: {
    height: 10,
    backgroundColor: Colors.light.border,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  statsHighlight: {
    fontWeight: '700',
    color: Colors.light.text,
  },
});
