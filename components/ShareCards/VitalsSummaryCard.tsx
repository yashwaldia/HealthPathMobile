// components/ShareCards/VitalsSummaryCard.tsx
/**
 * Vitals Summary Share Card Component
 * Displays comprehensive overview of all vitals
 */

import { Colors } from '@/constants/colors';
import type { VitalsSummaryCardData } from '@/types/shareCard';
import type { VitalStatus } from '@/types/vitals';
import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ShareCardFooter from './ShareCardFooter';
import ShareCardHeader from './ShareCardHeader';
import ShareCardWrapper from './ShareCardWrapper';

// ============================================================================
// TYPES
// ============================================================================

interface VitalsSummaryCardProps {
  data: VitalsSummaryCardData;
}

// ============================================================================
// COMPONENT
// ============================================================================

const VitalsSummaryCard = forwardRef<View, VitalsSummaryCardProps>(({ data }, ref) => {
  const getStatusColor = (status: VitalStatus) => {
    switch (status) {
      case 'normal':
        return Colors.light.success;
      case 'alert':
        return Colors.light.warning;
      case 'critical':
        return Colors.light.error;
      default:
        return Colors.light.textSecondary;
    }
  };

  const getOverallStatusColor = () => {
    switch (data.overallStatus) {
      case 'Excellent': return Colors.light.success;
      case 'Good': return Colors.light.primary;
      case 'Fair': return Colors.light.warning;
      case 'Needs Attention': return Colors.light.error;
      default: return Colors.light.textSecondary;
    }
  };

  return (
    <ShareCardWrapper ref={ref} testID="vitals-summary-card">
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
          <Ionicons name="medical" size={24} color={Colors.light.primary} />
          <Text style={styles.title}>Vitals Summary</Text>
        </View>

        {/* Overall Status */}
        <View style={[styles.overallBadge, { backgroundColor: getOverallStatusColor() }]}>
          <Text style={styles.overallText}>{data.overallStatus}</Text>
        </View>

        {/* Vitals Grid */}
        <View style={styles.vitalsGrid}>
          {/* Blood Pressure */}
          {data.vitals.bloodPressure && (
            <View style={styles.vitalCard}>
              <View style={styles.vitalHeader}>
                <Ionicons 
                  name={data.vitals.bloodPressure.icon as any} 
                  size={20} 
                  color={getStatusColor(data.vitals.bloodPressure.status)} 
                />
                <Text style={styles.vitalLabel}>Blood Pressure</Text>
              </View>
              <Text style={styles.vitalValue}>
                {data.vitals.bloodPressure.systolic}/{data.vitals.bloodPressure.diastolic}
              </Text>
              <View style={[
                styles.statusDot, 
                { backgroundColor: getStatusColor(data.vitals.bloodPressure.status) }
              ]} />
            </View>
          )}

          {/* Heart Rate */}
          {data.vitals.heartRate && (
            <View style={styles.vitalCard}>
              <View style={styles.vitalHeader}>
                <Ionicons 
                  name={data.vitals.heartRate.icon as any} 
                  size={20} 
                  color={getStatusColor(data.vitals.heartRate.status)} 
                />
                <Text style={styles.vitalLabel}>Heart Rate</Text>
              </View>
              <Text style={styles.vitalValue}>{data.vitals.heartRate.value} BPM</Text>
              <View style={[
                styles.statusDot, 
                { backgroundColor: getStatusColor(data.vitals.heartRate.status) }
              ]} />
            </View>
          )}

          {/* Blood Sugar */}
          {data.vitals.bloodSugar && (
            <View style={styles.vitalCard}>
              <View style={styles.vitalHeader}>
                <Ionicons 
                  name={data.vitals.bloodSugar.icon as any} 
                  size={20} 
                  color={getStatusColor(data.vitals.bloodSugar.status)} 
                />
                <Text style={styles.vitalLabel}>Blood Sugar</Text>
              </View>
              <Text style={styles.vitalValue}>{data.vitals.bloodSugar.value} mg/dL</Text>
              <Text style={styles.vitalSubtext}>
                {data.vitals.bloodSugar.type === 'fasting' ? 'Fasting' : 'Post-meal'}
              </Text>
              <View style={[
                styles.statusDot, 
                { backgroundColor: getStatusColor(data.vitals.bloodSugar.status) }
              ]} />
            </View>
          )}

          {/* Weight */}
          {data.vitals.weight && (
            <View style={styles.vitalCard}>
              <View style={styles.vitalHeader}>
                <Ionicons 
                  name={data.vitals.weight.icon as any} 
                  size={20} 
                  color={Colors.light.primary} 
                />
                <Text style={styles.vitalLabel}>Weight</Text>
              </View>
              <Text style={styles.vitalValue}>{data.vitals.weight.value} kg</Text>
              {data.vitals.weight.change !== 0 && (
                <Text style={[
                  styles.vitalSubtext,
                  { color: data.vitals.weight.change > 0 ? Colors.light.error : Colors.light.success }
                ]}>
                  {data.vitals.weight.change > 0 ? '+' : ''}{data.vitals.weight.change.toFixed(1)} kg
                </Text>
              )}
            </View>
          )}

          {/* Temperature */}
          {data.vitals.temperature && (
            <View style={styles.vitalCard}>
              <View style={styles.vitalHeader}>
                <Ionicons 
                  name={data.vitals.temperature.icon as any} 
                  size={20} 
                  color={getStatusColor(data.vitals.temperature.status)} 
                />
                <Text style={styles.vitalLabel}>Temperature</Text>
              </View>
              <Text style={styles.vitalValue}>{data.vitals.temperature.value}°C</Text>
              <View style={[
                styles.statusDot, 
                { backgroundColor: getStatusColor(data.vitals.temperature.status) }
              ]} />
            </View>
          )}

          {/* Oxygen Saturation */}
          {data.vitals.oxygenSaturation && (
            <View style={styles.vitalCard}>
              <View style={styles.vitalHeader}>
                <Ionicons 
                  name={data.vitals.oxygenSaturation.icon as any} 
                  size={20} 
                  color={getStatusColor(data.vitals.oxygenSaturation.status)} 
                />
                <Text style={styles.vitalLabel}>SpO2</Text>
              </View>
              <Text style={styles.vitalValue}>{data.vitals.oxygenSaturation.value}%</Text>
              <View style={[
                styles.statusDot, 
                { backgroundColor: getStatusColor(data.vitals.oxygenSaturation.status) }
              ]} />
            </View>
          )}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.light.success }]} />
            <Text style={styles.legendText}>Normal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.light.warning }]} />
            <Text style={styles.legendText}>Alert</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.light.error }]} />
            <Text style={styles.legendText}>Critical</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <ShareCardFooter motivationalText="Comprehensive health tracking at your fingertips! 📊" />
    </ShareCardWrapper>
  );
});

VitalsSummaryCard.displayName = 'VitalsSummaryCard';

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  overallBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  overallText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  vitalCard: {
    width: '48%',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    position: 'relative',
  },
  vitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  vitalLabel: {
    fontSize: 9,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  vitalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  vitalSubtext: {
    fontSize: 8,
    color: Colors.light.textSecondary,
  },
  statusDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 9,
    color: Colors.light.textSecondary,
  },
});

export default VitalsSummaryCard;
