// components/ShareCards/MotherCareCard.tsx
/**
 * Mother Care (Pregnancy) Share Card Component
 * Displays pregnancy week, trimester, and stats
 */

import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ShareCardWrapper from './ShareCardWrapper';
import ShareCardHeader from './ShareCardHeader';
import ShareCardFooter from './ShareCardFooter';
import type { MotherCareCardData } from '@/types/shareCard';
import { Colors } from '@/constants/colors';

// ============================================================================
// TYPES
// ============================================================================

interface MotherCareCardProps {
  data: MotherCareCardData;
}

// ============================================================================
// COMPONENT
// ============================================================================

const MotherCareCard = forwardRef<View, MotherCareCardProps>(({ data }, ref) => {
  const getTrimesterColor = (trimester: 1 | 2 | 3) => {
    const colors = {
      1: '#3b82f6', // Blue
      2: '#22c55e', // Green
      3: '#f59e0b', // Orange
    };
    return colors[trimester];
  };

  return (
    <ShareCardWrapper 
      ref={ref} 
      testID="mother-care-card"
      gradientColors={['#fbbf24', Colors.light.primary]}
    >
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
          <Ionicons name="woman" size={24} color={Colors.light.primary} />
          <Text style={styles.title}>Pregnancy Journey</Text>
        </View>

        {/* Pregnancy Week Display */}
        <View style={styles.weekContainer}>
          <Text style={styles.weekLabel}>Week</Text>
          <Text style={styles.weekNumber}>{data.pregnancy.week}</Text>
          <Text style={styles.dayLabel}>Day {data.pregnancy.day}</Text>
        </View>

        {/* Trimester Badge */}
        <View style={[
          styles.trimesterBadge,
          { backgroundColor: getTrimesterColor(data.pregnancy.trimester) }
        ]}>
          <Text style={styles.trimesterText}>
            {data.pregnancy.trimester === 1 ? '1st' : data.pregnancy.trimester === 2 ? '2nd' : '3rd'} Trimester
          </Text>
        </View>

        {/* Baby Size */}
        <View style={styles.babySizeContainer}>
          <Text style={styles.babySizeEmoji}>{data.pregnancy.babySizeEmoji}</Text>
          <View style={styles.babySizeInfo}>
            <Text style={styles.babySizeLabel}>Baby's size:</Text>
            <Text style={styles.babySizeText}>{data.pregnancy.babySize}</Text>
          </View>
        </View>

        {/* Days Until Due */}
        <View style={styles.dueContainer}>
          <Ionicons name="calendar" size={20} color={Colors.light.primary} />
          <Text style={styles.dueText}>
            <Text style={styles.dueNumber}>{data.pregnancy.daysUntilDue}</Text> days until due date
          </Text>
        </View>

        {/* Stats Grid */}
        {(data.recentStats.weight || data.recentStats.bloodPressure) && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Recent Stats</Text>
            <View style={styles.statsGrid}>
              {data.recentStats.weight && (
                <View style={styles.statCard}>
                  <Ionicons name="scale-outline" size={18} color={Colors.light.primary} />
                  <Text style={styles.statLabel}>Weight</Text>
                  <Text style={styles.statValue}>{data.recentStats.weight}</Text>
                </View>
              )}
              
              {data.recentStats.bloodPressure && (
                <View style={styles.statCard}>
                  <Ionicons name="pulse-outline" size={18} color={Colors.light.primary} />
                  <Text style={styles.statLabel}>Blood Pressure</Text>
                  <Text style={styles.statValue}>{data.recentStats.bloodPressure}</Text>
                  {data.recentStats.bloodPressureStatus && (
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: data.recentStats.bloodPressureStatus === 'normal' 
                        ? Colors.light.success 
                        : Colors.light.warning 
                      }
                    ]} />
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Milestone */}
        {data.milestone && (
          <View style={styles.milestoneBox}>
            <Ionicons name="sparkles" size={16} color={Colors.light.primary} />
            <Text style={styles.milestoneText}>{data.milestone}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <ShareCardFooter motivationalText="Growing a miracle! Keep tracking your journey! 🤰✨" />
    </ShareCardWrapper>
  );
});

MotherCareCard.displayName = 'MotherCareCard';

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
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  weekContainer: {
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  weekLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  weekNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.light.primary,
    marginVertical: 4,
  },
  dayLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  trimesterBadge: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  trimesterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  babySizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  babySizeEmoji: {
    fontSize: 36,
  },
  babySizeInfo: {
    flex: 1,
  },
  babySizeLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  babySizeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 2,
  },
  dueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.background,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  dueText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  dueNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  statsContainer: {
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  statLabel: {
    fontSize: 9,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  milestoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 12,
  },
  milestoneText: {
    flex: 1,
    fontSize: 10,
    color: Colors.light.text,
    fontStyle: 'italic',
  },
});

export default MotherCareCard;
