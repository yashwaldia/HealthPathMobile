// components/wellness/teeth-oral/TeethOralOverviewCard.tsx
// Overview card showing dental and oral health status
// Last Updated: December 11, 2025

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';

interface TeethOralOverviewCardProps {
  dentalStatus: string;
  statusColor: string;
  statusIcon: string;
  lastDentalVisit?: string;
  morningBrushing?: boolean;
  nightBrushing?: boolean;
  flossing?: boolean;
}

export default function TeethOralOverviewCard({
  dentalStatus,
  statusColor,
  statusIcon,
  lastDentalVisit,
  morningBrushing,
  nightBrushing,
  flossing,
}: TeethOralOverviewCardProps) {
  const completedHabits = [morningBrushing, nightBrushing, flossing].filter(Boolean).length;
  const totalHabits = 3;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="medkit" size={24} color={Colors.light.primary} />
        <Text style={styles.title}>Dental Health</Text>
      </View>

      <View style={styles.statusContainer}>
        {/* Main Status */}
        <View style={styles.mainStatus}>
          <View style={[styles.iconContainer, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name={statusIcon as any} size={48} color={statusColor} />
          </View>
          <Text style={styles.statusLabel}>Oral Health</Text>
          <Text style={[styles.statusValue, { color: statusColor }]}>{dentalStatus}</Text>
        </View>

        {/* Daily Habits */}
        <View style={styles.habitsContainer}>
          <Text style={styles.habitsTitle}>Today's Habits</Text>
          <View style={styles.habitsList}>
            <View style={styles.habitItem}>
              <Ionicons
                name={morningBrushing ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={morningBrushing ? '#4CAF50' : Colors.light.border}
              />
              <Text style={styles.habitText}>Morning Brush</Text>
            </View>
            <View style={styles.habitItem}>
              <Ionicons
                name={nightBrushing ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={nightBrushing ? '#4CAF50' : Colors.light.border}
              />
              <Text style={styles.habitText}>Night Brush</Text>
            </View>
            <View style={styles.habitItem}>
              <Ionicons
                name={flossing ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={flossing ? '#4CAF50' : Colors.light.border}
              />
              <Text style={styles.habitText}>Flossing</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(completedHabits / totalHabits) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {completedHabits}/{totalHabits} habits completed
          </Text>
        </View>
      </View>

      {lastDentalVisit && (
        <View style={styles.footer}>
          <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.footerText}>Last dental visit: {lastDentalVisit}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.infoButton}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.light.primary} />
        <Text style={styles.infoButtonText}>View dental care plan</Text>
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
    marginBottom: 20,
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
  habitsContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
  },
  habitsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  habitsList: {
    gap: 8,
    marginBottom: 12,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
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
