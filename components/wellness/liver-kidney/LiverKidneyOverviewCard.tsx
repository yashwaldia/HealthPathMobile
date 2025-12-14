// components/wellness/liver-kidney/LiverKidneyOverviewCard.tsx
// Overview card showing liver and kidney health status
// Last Updated: December 13, 2025 - FIXED icon rendering

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';

type Props = {
  liverStatus: string;
  liverColor: string;
  liverIcon: string;
  kidneyStatus: string;
  kidneyColor: string;
  kidneyIcon: string;
  lastTestDate?: string;
};

export default function LiverKidneyOverviewCard({
  liverStatus,
  liverColor,
  liverIcon,
  kidneyStatus,
  kidneyColor,
  kidneyIcon,
  lastTestDate,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Health Overview</Text>
        {lastTestDate && (
          <Text style={styles.lastTest}>Last test: {lastTestDate}</Text>
        )}
      </View>

      {/* Organ Status Cards */}
      <View style={styles.statusGrid}>
        {/* Liver Status */}
        <View style={[styles.statusCard, { borderLeftColor: liverColor }]}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={liverIcon as any} 
              size={24} 
              color={liverColor} 
              style={styles.statusEmoji} 
            />
            <Text style={styles.statusLabel}>Liver</Text>
          </View>
          <Text style={[styles.statusValue, { color: liverColor }]}>
            {liverStatus}
          </Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: liverColor }]} />
            <Text style={styles.statusText}>Current Status</Text>
          </View>
        </View>

        {/* Kidney Status */}
        <View style={[styles.statusCard, { borderLeftColor: kidneyColor }]}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={kidneyIcon as any} 
              size={24} 
              color={kidneyColor} 
              style={styles.statusEmoji} 
            />
            <Text style={styles.statusLabel}>Kidneys</Text>
          </View>
          <Text style={[styles.statusValue, { color: kidneyColor }]}>
            {kidneyStatus}
          </Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: kidneyColor }]} />
            <Text style={styles.statusText}>Current Status</Text>
          </View>
        </View>
      </View>

      {/* Info Note */}
      <View style={styles.infoNote}>
        <Ionicons 
          name="information-circle" 
          size={20} 
          color={Colors.light.primary} 
        />
        <Text style={styles.infoText}>
          Regular monitoring helps detect issues early
        </Text>
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
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  lastTest: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statusCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusEmoji: {
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  statusValue: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 10,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
    lineHeight: 16,
  },
});
