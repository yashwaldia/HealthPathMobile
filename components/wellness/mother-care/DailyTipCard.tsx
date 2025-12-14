// components/wellness/mother-care/DailyTipCard.tsx
// Daily educational tip card
// Last Updated: December 10, 2025

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';

type Props = {
  tip: string;
  category?: 'nutrition' | 'exercise' | 'health' | 'general';
};

const CATEGORY_CONFIG = {
  nutrition: {
    icon: 'restaurant-outline',
    color: '#FF6B6B',
    label: 'Nutrition Tip',
  },
  exercise: {
    icon: 'fitness-outline',
    color: '#4ECDC4',
    label: 'Exercise Tip',
  },
  health: {
    icon: 'heart-outline',
    color: '#95E1D3',
    label: 'Health Tip',
  },
  general: {
    icon: 'bulb-outline',
    color: '#FFA502',
    label: 'Daily Tip',
  },
};

export default function DailyTipCard({ tip, category = 'general' }: Props) {
  const config = CATEGORY_CONFIG[category];

  return (
    <View style={[styles.container, { borderLeftColor: config.color }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon as any} size={20} color={config.color} />
        </View>
        <Text style={[styles.categoryLabel, { color: config.color }]}>
          {config.label}
        </Text>
      </View>

      {/* Tip content */}
      <Text style={styles.tipText}>{tip}</Text>

      {/* Footer icon */}
      <View style={styles.footer}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={Colors.light.textSecondary}
        />
        <Text style={styles.footerText}>Tap for more details</Text>
      </View>
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
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.text,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
});
