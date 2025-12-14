// components/wellness/gut-health/GutHealthOverviewCard.tsx
// Overview card showing digestive health status
// Last Updated: December 11, 2025

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';

interface GutHealthOverviewCardProps {
  digestiveStatus: string;
  statusColor: string;
  statusIcon: string;
  lastCheckupDate?: string;
  bowelMovement?: string;
  bloatingLevel?: number;
}

export default function GutHealthOverviewCard({
  digestiveStatus,
  statusColor,
  statusIcon,
  lastCheckupDate,
  bowelMovement,
  bloatingLevel,
}: GutHealthOverviewCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="nutrition" size={24} color={Colors.light.primary} />
        <Text style={styles.title}>Digestive Health</Text>
      </View>

      <View style={styles.statusContainer}>
        {/* Main Status */}
        <View style={styles.mainStatus}>
          <View style={[styles.iconContainer, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name={statusIcon as any} size={48} color={statusColor} />
          </View>
          <Text style={styles.statusLabel}>Overall Health</Text>
          <Text style={[styles.statusValue, { color: statusColor }]}>{digestiveStatus}</Text>
        </View>

        {/* Additional Metrics */}
        <View style={styles.metricsContainer}>
          {bowelMovement && (
            <View style={styles.metricItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.light.textSecondary} />
              <Text style={styles.metricLabel}>Bowel Movement</Text>
              <Text style={styles.metricValue}>{bowelMovement}</Text>
            </View>
          )}

          {bloatingLevel !== undefined && (
            <View style={styles.metricItem}>
              <Ionicons name="pulse" size={20} color={Colors.light.textSecondary} />
              <Text style={styles.metricLabel}>Bloating Level</Text>
              <Text style={styles.metricValue}>{bloatingLevel}/10</Text>
            </View>
          )}
        </View>
      </View>

      {lastCheckupDate && (
        <View style={styles.footer}>
          <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.footerText}>Last checkup: {lastCheckupDate}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.infoButton}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.light.primary} />
        <Text style={styles.infoButtonText}>View detailed analysis</Text>
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
