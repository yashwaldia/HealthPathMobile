// components/radiology/RadiologyEmptyState.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

export function RadiologyEmptyState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="scan-outline" size={80} color={Colors.light.border} />
      <Text style={styles.emptyTitle}>No Radiology Scans Yet</Text>
      <Text style={styles.emptyText}>
        Upload your first radiology scan to get AI-powered educational analysis
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
