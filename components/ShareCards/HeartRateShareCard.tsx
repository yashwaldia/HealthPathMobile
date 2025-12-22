// components/ShareCards/HeartRateShareCard.tsx
/**
 * Heart Rate Share Card Component
 * Displays heart rate with trend and zones
 */

import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ShareCardWrapper from './ShareCardWrapper';
import ShareCardHeader from './ShareCardHeader';
import ShareCardFooter from './ShareCardFooter';
import type { HeartRateCardData } from '@/types/shareCard';
import { Colors } from '@/constants/colors';

// ============================================================================
// TYPES
// ============================================================================

interface HeartRateShareCardProps {
  data: HeartRateCardData;
}

// ============================================================================
// COMPONENT
// ============================================================================

const HeartRateShareCard = forwardRef<View, HeartRateShareCardProps>(({ data }, ref) => {
  const statusColors = {
    'Excellent': Colors.light.success,
    'Good': Colors.light.primary,
    'Fair': Colors.light.warning,
    'Poor': Colors.light.error,
  };

  const statusColor = statusColors[data.heartRate.status];

  const getTrendIcon = () => {
    if (data.heartRate.trend === 'up') return 'trending-up';
    if (data.heartRate.trend === 'down') return 'trending-down';
    return 'remove';
  };

  return (
    <ShareCardWrapper ref={ref} testID="heart-rate-share-card">
      {/* Header */}
      <ShareCardHeader
        userName={data.userName}
        date={new Date(data.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Ionicons name="heart" size={24} color={Colors.light.error} />
          <Text style={styles.title}>Heart Rate</Text>
        </View>

        {/* Main Heart Rate */}
        <View style={[styles.hrCircle, { borderColor: statusColor }]}>
          <Ionicons name="heart" size={32} color={statusColor} />
          <Text style={styles.hrValue}>{data.heartRate.current}</Text>
          <Text style={styles.hrUnit}>BPM</Text>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{data.heartRate.status}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* 7-Day Average */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>7-Day Avg</Text>
            <Text style={styles.statValue}>{data.heartRate.sevenDayAverage} BPM</Text>
          </View>

          {/* Trend */}
          {data.heartRate.trend && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Trend</Text>
              <View style={styles.trendContainer}>
                <Ionicons 
                  name={getTrendIcon()} 
                  size={16} 
                  color={
                    data.heartRate.trend === 'up' 
                      ? Colors.light.error 
                      : data.heartRate.trend === 'down'
                      ? Colors.light.success
                      : Colors.light.textSecondary
                  } 
                />
                <Text style={styles.statValue}>
                  {data.heartRate.trendPercentage?.toFixed(1)}%
                </Text>
              </View>
            </View>
          )}

          {/* Resting HR */}
          {data.heartRate.resting && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Resting</Text>
              <Text style={styles.statValue}>{data.heartRate.resting} BPM</Text>
            </View>
          )}
        </View>

        {/* HR Zones (if available) */}
        {data.zones && (
          <View style={styles.zonesContainer}>
            <Text style={styles.zonesTitle}>Training Zones</Text>
            <View style={styles.zonesList}>
              {Object.entries(data.zones)
                .filter(([key]) => key.startsWith('zone'))
                .map(([key, value], index) => (
                  <View key={key} style={styles.zoneItem}>
                    <View style={[styles.zoneDot, { backgroundColor: getZoneColor(index) }]} />
                    <Text style={styles.zoneText}>
                      Zone {index + 1}: {value} BPM
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}
      </View>

      {/* Footer */}
      <ShareCardFooter motivationalText={data.motivationalText} />
    </ShareCardWrapper>
  );
});

HeartRateShareCard.displayName = 'HeartRateShareCard';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getZoneColor(index: number): string {
  const colors = [
    '#9ca3af', // Zone 1 - Gray
    '#3b82f6', // Zone 2 - Blue
    '#22c55e', // Zone 3 - Green
    '#f59e0b', // Zone 4 - Orange
    '#ef4444', // Zone 5 - Red
  ];
  return colors[index] || colors[0];
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  titleContainer: {
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
  hrCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  hrValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 4,
  },
  hrUnit: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zonesContainer: {
    width: '100%',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
  },
  zonesTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  zonesList: {
    gap: 6,
  },
  zoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  zoneText: {
    fontSize: 9,
    color: Colors.light.textSecondary,
  },
});

export default HeartRateShareCard;
