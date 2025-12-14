// components/wellness/WellnessModuleCard.tsx
// Card component for wellness module display on hub screen
// Last Updated: December 10, 2025

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ModuleCardData } from '../../types/wellness';

type Props = {
  module: ModuleCardData;
  onPress: () => void;
};

export default function WellnessModuleCard({ module, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: module.color + '40' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icon section */}
      <View style={[styles.iconContainer, { backgroundColor: module.color + '20' }]}>
        <Ionicons name={module.icon as any} size={32} color={module.color} />
      </View>

      {/* Content section */}
      <View style={styles.content}>
        <Text style={styles.title}>{module.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {module.description}
        </Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { 
                  width: `${module.progress}%` as any, // TypeScript workaround
                  backgroundColor: module.color 
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{module.progress}%</Text>
        </View>
      </View>

      {/* Arrow icon */}
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    minWidth: 32,
    textAlign: 'right',
  },
  arrowContainer: {
    marginLeft: 8,
  },
});
