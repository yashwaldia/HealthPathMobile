// components/radiology/RadiologyStatsBar.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { RadiologyAnalysis, getUrgencyColor } from '../../types/radiology';

type StatsBarProps = {
  analyses: RadiologyAnalysis[];
};

export function RadiologyStatsBar({ analyses }: StatsBarProps) {
  if (!analyses.length) return null;

  const total = analyses.length;
  const routine = analyses.filter((a) => a.urgencyLevel === 'routine').length;
  const followUp = analyses.filter((a) => a.urgencyLevel === 'follow-up-needed').length;

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Ionicons 
          name="document-text" 
          size={20} 
          color={Colors.light.primary} 
          style={styles.statIcon}
        />
        <Text style={styles.statValue}>{total}</Text>
        <Text style={styles.statLabel}>Total Scans</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Ionicons 
          name="checkmark-circle" 
          size={20} 
          color={getUrgencyColor('routine')} 
          style={styles.statIcon}
        />
        <Text style={[styles.statValue, { color: getUrgencyColor('routine') }]}>
          {routine}
        </Text>
        <Text style={styles.statLabel}>Normal</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Ionicons 
          name="alert-circle" 
          size={20} 
          color={getUrgencyColor('follow-up-needed')} 
          style={styles.statIcon}
        />
        <Text style={[styles.statValue, { color: getUrgencyColor('follow-up-needed') }]}>
          {followUp}
        </Text>
        <Text style={styles.statLabel}>Needs Review</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
    marginHorizontal: 8,
  },
});
