// components/wellness/WeeklyMilestoneCard.tsx
// Weekly milestone and baby development card
// Last Updated: December 10, 2025

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

type Props = {
  weekNumber: number;
  title: string;
  emoji?: string;
  developmentText: string;
  milestones?: string[];
  color?: string;
};

export default function WeeklyMilestoneCard({
  weekNumber,
  title,
  emoji,
  developmentText,
  milestones = [],
  color = Colors.light.primary,
}: Props) {
  return (
    <View style={[styles.container, { borderLeftColor: color }]}>
      {/* Header */}
      <View style={styles.header}>
        {emoji && <Text style={styles.emoji}>{emoji}</Text>}
        <View style={styles.headerText}>
          <Text style={styles.weekLabel}>Week {weekNumber}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>

      {/* Development text */}
      <Text style={styles.developmentText}>{developmentText}</Text>

      {/* Milestones list */}
      {milestones.length > 0 && (
        <View style={styles.milestonesList}>
          {milestones.map((milestone, index) => (
            <View key={index} style={styles.milestoneItem}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={color}
                style={styles.milestoneIcon}
              />
              <Text style={styles.milestoneText}>{milestone}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 40,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 2,
  },
  developmentText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
    marginBottom: 12,
  },
  milestonesList: {
    gap: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  milestoneIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  milestoneText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textSecondary,
  },
});
