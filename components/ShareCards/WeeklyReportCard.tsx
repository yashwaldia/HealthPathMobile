// components/ShareCards/WeeklyReportCard.tsx
/**
 * Weekly Report Share Card Component
 * Displays 7-day health tracking summary
 */

import { Colors } from '@/constants/colors';
import type { WeeklyReportCardData } from '@/types/shareCard';
import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ShareCardFooter from './ShareCardFooter';
import ShareCardHeader from './ShareCardHeader';
import ShareCardWrapper from './ShareCardWrapper';

// ============================================================================
// TYPES
// ============================================================================

interface WeeklyReportCardProps {
  data: WeeklyReportCardData;
}

// ============================================================================
// COMPONENT
// ============================================================================

const WeeklyReportCard = forwardRef<View, WeeklyReportCardProps>(({ data }, ref) => {
  const streakEmoji = data.stats.streak >= 7 ? '🔥' : data.stats.streak >= 5 ? '⭐' : '💪';

  return (
    <ShareCardWrapper ref={ref} testID="weekly-report-card">
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
          <Ionicons name="calendar" size={24} color={Colors.light.primary} />
          <Text style={styles.title}>Weekly Health Report</Text>
        </View>

        {/* Date Range */}
        <View style={styles.dateRangeBox}>
          <Text style={styles.dateRangeText}>
            {data.dateRange.start} - {data.dateRange.end}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Days Logged */}
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.light.success} />
            <Text style={styles.statValue}>{data.stats.daysLogged}/{data.stats.totalDays}</Text>
            <Text style={styles.statLabel}>Days Logged</Text>
          </View>

          {/* Streak */}
          <View style={styles.statCard}>
            <Text style={styles.streakEmoji}>{streakEmoji}</Text>
            <Text style={styles.statValue}>{data.stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.metricsTitle}>Weekly Averages</Text>

          {/* Blood Pressure */}
          {data.keyMetrics.bloodPressure && (
            <View style={styles.metricRow}>
              <View style={styles.metricIcon}>
                <Ionicons name="pulse" size={16} color={Colors.light.primary} />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>Blood Pressure</Text>
                <Text style={styles.metricValue}>{data.keyMetrics.bloodPressure.average}</Text>
              </View>
              <View style={[
                styles.metricStatus,
                { backgroundColor: data.keyMetrics.bloodPressure.status === 'normal' 
                  ? Colors.light.success 
                  : Colors.light.error 
                }
              ]}>
                <Ionicons 
                  name={data.keyMetrics.bloodPressure.status === 'normal' ? 'checkmark' : 'alert'} 
                  size={12} 
                  color="#FFFFFF" 
                />
              </View>
            </View>
          )}

          {/* Heart Rate */}
          {data.keyMetrics.heartRate && (
            <View style={styles.metricRow}>
              <View style={styles.metricIcon}>
                <Ionicons name="heart" size={16} color={Colors.light.error} />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>Heart Rate</Text>
                <Text style={styles.metricValue}>{data.keyMetrics.heartRate.average} BPM</Text>
              </View>
              <View style={[
                styles.metricStatus,
                { backgroundColor: data.keyMetrics.heartRate.status === 'normal' 
                  ? Colors.light.success 
                  : Colors.light.error 
                }
              ]}>
                <Ionicons 
                  name={data.keyMetrics.heartRate.status === 'normal' ? 'checkmark' : 'alert'} 
                  size={12} 
                  color="#FFFFFF" 
                />
              </View>
            </View>
          )}

          {/* Weight */}
          {data.keyMetrics.weight && (
            <View style={styles.metricRow}>
              <View style={styles.metricIcon}>
                <Ionicons name="scale" size={16} color={Colors.light.primary} />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>Weight</Text>
                <Text style={styles.metricValue}>
                  {data.keyMetrics.weight.current.toFixed(1)} kg
                  <Text style={[
                    styles.weightChange,
                    { color: data.keyMetrics.weight.change >= 0 
                      ? Colors.light.error 
                      : Colors.light.success 
                    }
                  ]}>
                    {' '}({data.keyMetrics.weight.change >= 0 ? '+' : ''}{data.keyMetrics.weight.change.toFixed(1)})
                  </Text>
                </Text>
              </View>
            </View>
          )}

          {/* Blood Sugar */}
          {data.keyMetrics.bloodSugar && (
            <View style={styles.metricRow}>
              <View style={styles.metricIcon}>
                <Ionicons name="water" size={16} color={Colors.light.primary} />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>Blood Sugar</Text>
                <Text style={styles.metricValue}>{data.keyMetrics.bloodSugar.average} mg/dL</Text>
              </View>
              <View style={[
                styles.metricStatus,
                { backgroundColor: data.keyMetrics.bloodSugar.status === 'normal' 
                  ? Colors.light.success 
                  : Colors.light.error 
                }
              ]}>
                <Ionicons 
                  name={data.keyMetrics.bloodSugar.status === 'normal' ? 'checkmark' : 'alert'} 
                  size={12} 
                  color="#FFFFFF" 
                />
              </View>
            </View>
          )}
        </View>

        {/* Achievements */}
        {data.achievements.length > 0 && (
          <View style={styles.achievementsContainer}>
            <Text style={styles.achievementsTitle}>🏆 Achievements</Text>
            <View style={styles.achievementsList}>
              {data.achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementBadge}>
                  <Text style={styles.achievementText}>{achievement}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Footer */}
      <ShareCardFooter motivationalText="Consistency is key to better health! Keep going! 🚀" />
    </ShareCardWrapper>
  );
});

WeeklyReportCard.displayName = 'WeeklyReportCard';

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
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  dateRangeBox: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 16,
  },
  dateRangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  streakEmoji: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  metricsContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  metricsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 9,
    color: Colors.light.textSecondary,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 2,
  },
  weightChange: {
    fontSize: 10,
  },
  metricStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementsContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
  },
  achievementsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  achievementBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achievementText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default WeeklyReportCard;
