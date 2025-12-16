// components/wellness/child-care/GrowthChartCard.tsx
// Shows recent height/weight trend for a child
// Last Updated: December 16, 2025

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { GrowthRecord } from '../../../types/wellness';

type Props = {
  growthRecords: GrowthRecord[];
};

export default function GrowthChartCard({ growthRecords }: Props) {
  const sorted = useMemo(
    () =>
      [...growthRecords].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [growthRecords]
  );

  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  const trendText = useMemo(() => {
    if (!latest || !previous) return 'Add a few records to see trends over time.';

    const latestW = parseFloat(latest.weightKg || '0');
    const prevW = parseFloat(previous.weightKg || '0');
    const diffW = latestW - prevW;

    if (isNaN(diffW) || diffW === 0) {
      return 'Weight has been stable compared to the previous record.';
    }
    if (diffW > 0) {
      return `Weight increased by ${diffW.toFixed(1)} kg since the last record.`;
    }
    return `Weight decreased by ${Math.abs(diffW).toFixed(1)} kg since the last record.`;
  }, [latest, previous]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="stats-chart" size={20} color={Colors.light.primary} />
          <Text style={styles.title}>Growth Trend</Text>
        </View>
        <Text style={styles.badge}>
          {sorted.length} {sorted.length === 1 ? 'record' : 'records'}
        </Text>
      </View>

      {latest ? (
        <>
          <View style={styles.latestRow}>
            <View style={styles.latestItem}>
              <Text style={styles.label}>Latest Date</Text>
              <Text style={styles.value}>{latest.date}</Text>
            </View>
            <View style={styles.latestItem}>
              <Text style={styles.label}>Height</Text>
              <Text style={styles.value}>
                {latest.heightCm ? `${latest.heightCm} cm` : '—'}
              </Text>
            </View>
            <View style={styles.latestItem}>
              <Text style={styles.label}>Weight</Text>
              <Text style={styles.value}>
                {latest.weightKg ? `${latest.weightKg} kg` : '—'}
              </Text>
            </View>
          </View>

          <View style={styles.trendBox}>
            <Ionicons
              name="trending-up-outline"
              size={18}
              color={Colors.light.primary}
            />
            <Text style={styles.trendText}>{trendText}</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyBox}>
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.emptyText}>
            No growth records yet. Add your child’s height and weight to start
            tracking.
          </Text>
        </View>
      )}

      <Text style={styles.disclaimer}>
        Growth data is for educational tracking only. Always consult your
        pediatrician for medical advice.
      </Text>
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
    backgroundColor: Colors.light.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  latestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  latestItem: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  trendBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.light.primary + '10',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  trendText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  emptyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  emptyText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  disclaimer: {
    marginTop: 8,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
});

