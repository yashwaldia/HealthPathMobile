// components/ShareCards/BloodPressureShareCard.tsx
/**
 * Blood Pressure Share Card Component
 * Displays blood pressure with status and averages
 */

import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ShareCardWrapper from './ShareCardWrapper';
import ShareCardHeader from './ShareCardHeader';
import ShareCardFooter from './ShareCardFooter';
import type { BloodPressureCardData } from '@/types/shareCard';
import { Colors } from '@/constants/colors';

// ============================================================================
// TYPES
// ============================================================================

interface BloodPressureShareCardProps {
  data: BloodPressureCardData;
}

// ============================================================================
// COMPONENT
// ============================================================================

const BloodPressureShareCard = forwardRef<View, BloodPressureShareCardProps>(({ data }, ref) => {
  return (
    <ShareCardWrapper ref={ref} testID="blood-pressure-share-card">
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
          <Ionicons name="pulse" size={24} color={Colors.light.primary} />
          <Text style={styles.title}>Blood Pressure</Text>
        </View>

        {/* BP Display */}
        <View style={[styles.bpContainer, { borderColor: data.bloodPressure.statusColor }]}>
          <View style={styles.bpValues}>
            <View style={styles.bpValueBox}>
              <Text style={styles.bpValue}>{data.bloodPressure.systolic}</Text>
              <Text style={styles.bpLabel}>SYS</Text>
            </View>
            <Text style={styles.bpSlash}>/</Text>
            <View style={styles.bpValueBox}>
              <Text style={styles.bpValue}>{data.bloodPressure.diastolic}</Text>
              <Text style={styles.bpLabel}>DIA</Text>
            </View>
          </View>
          <Text style={styles.bpUnit}>mmHg</Text>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: data.bloodPressure.statusColor }]}>
          <Text style={styles.statusText}>{data.bloodPressure.status}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Pulse */}
          {data.pulse && (
            <View style={styles.statBox}>
              <Ionicons name="heart-outline" size={20} color={Colors.light.error} />
              <Text style={styles.statLabel}>Pulse</Text>
              <Text style={styles.statValue}>{data.pulse} BPM</Text>
            </View>
          )}

          {/* 7-Day Average */}
          {data.sevenDayAverage && (
            <View style={styles.statBox}>
              <Ionicons name="analytics-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.statLabel}>7-Day Avg</Text>
              <Text style={styles.statValue}>
                {data.sevenDayAverage.systolic}/{data.sevenDayAverage.diastolic}
              </Text>
            </View>
          )}

          {/* Last Checked */}
          <View style={styles.statBox}>
            <Ionicons name="time-outline" size={20} color={Colors.light.textSecondary} />
            <Text style={styles.statLabel}>Last Checked</Text>
            <Text style={styles.statValue}>{data.lastChecked}</Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.light.primary} />
          <Text style={styles.infoText}>
            Normal BP: Less than 120/80 mmHg
          </Text>
        </View>
      </View>

      {/* Footer */}
      <ShareCardFooter motivationalText={data.motivationalText} />
    </ShareCardWrapper>
  );
});

BloodPressureShareCard.displayName = 'BloodPressureShareCard';

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
  bpContainer: {
    borderWidth: 4,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  bpValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bpValueBox: {
    alignItems: 'center',
  },
  bpValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.light.text,
  },
  bpSlash: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.light.textSecondary,
  },
  bpLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  bpUnit: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 8,
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
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 9,
    color: Colors.light.textSecondary,
  },
});

export default BloodPressureShareCard;
