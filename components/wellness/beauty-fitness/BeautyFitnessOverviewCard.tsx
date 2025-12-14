// components/wellness/beauty-fitness/BeautyFitnessOverviewCard.tsx
// Overview card showing fitness and beauty health status
// Last Updated: December 11, 2025

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';

interface BeautyFitnessOverviewCardProps {
  fitnessStatus: string;
  statusColor: string;
  statusIcon: string;
  currentWeight?: number;
  targetWeight?: number;
  bmi?: number;
  bmiCategory?: string;
  lastWeightCheck?: string;
}

export default function BeautyFitnessOverviewCard({
  fitnessStatus,
  statusColor,
  statusIcon,
  currentWeight,
  targetWeight,
  bmi,
  bmiCategory,
  lastWeightCheck,
}: BeautyFitnessOverviewCardProps) {
  const weightDifference = targetWeight && currentWeight
    ? Math.abs(targetWeight - currentWeight)
    : null;
  const weightProgress = targetWeight && currentWeight
    ? ((Math.abs(currentWeight - targetWeight) / Math.abs(currentWeight - targetWeight)) * 100)
    : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="fitness" size={24} color={Colors.light.primary} />
        <Text style={styles.title}>Beauty & Fitness</Text>
      </View>

      <View style={styles.statusContainer}>
        {/* Main Status */}
        <View style={styles.mainStatus}>
          <View style={[styles.iconContainer, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name={statusIcon as any} size={48} color={statusColor} />
          </View>
          <Text style={styles.statusLabel}>Fitness Status</Text>
          <Text style={[styles.statusValue, { color: statusColor }]}>{fitnessStatus}</Text>
        </View>

        {/* Metrics */}
        <View style={styles.metricsContainer}>
          {currentWeight && (
            <View style={styles.metricItem}>
              <Ionicons name="fitness-outline" size={20} color={Colors.light.textSecondary} />
              <Text style={styles.metricLabel}>Current Weight</Text>
              <Text style={styles.metricValue}>{currentWeight} kg</Text>
            </View>
          )}

          {bmi && (
            <View style={styles.metricItem}>
              <Ionicons name="calculator-outline" size={20} color={Colors.light.textSecondary} />
              <Text style={styles.metricLabel}>BMI</Text>
              <Text style={styles.metricValue}>{bmi.toFixed(1)}</Text>
              {bmiCategory && (
                <Text style={styles.metricSubtext}>{bmiCategory}</Text>
              )}
            </View>
          )}
        </View>

        {/* Goal Progress */}
        {targetWeight && currentWeight && (
          <View style={styles.goalContainer}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>Goal Progress</Text>
              <Text style={styles.goalTarget}>Target: {targetWeight} kg</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(weightProgress, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {weightDifference !== null && `${weightDifference.toFixed(1)} kg to go`}
              </Text>
            </View>
          </View>
        )}
      </View>

      {lastWeightCheck && (
        <View style={styles.footer}>
          <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.footerText}>Last weigh-in: {lastWeightCheck}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.infoButton}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.light.primary} />
        <Text style={styles.infoButtonText}>View fitness plan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statusContainer: {
    marginBottom: 16,
  },
  mainStatus: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 2,
  },
  metricSubtext: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  goalContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  goalTarget: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  progressBarContainer: {
    gap: 6,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
});
