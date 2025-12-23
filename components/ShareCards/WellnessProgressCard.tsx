// components/ShareCards/WellnessProgressCard.tsx
/**
 * Wellness Progress Share Card Component
 * Displays 30-day wellness challenge progress
 */

import { Colors } from '@/constants/colors';
import type { WellnessProgressCardData } from '@/types/shareCard';
import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ShareCardFooter from './ShareCardFooter';
import ShareCardHeader from './ShareCardHeader';
import ShareCardWrapper from './ShareCardWrapper';

// ============================================================================
// TYPES
// ============================================================================

interface WellnessProgressCardProps {
  data: WellnessProgressCardData;
}

// ============================================================================
// COMPONENT
// ============================================================================

const WellnessProgressCard = forwardRef<View, WellnessProgressCardProps>(({ data }, ref) => {
  const progressPercentage = data.progress.percentage;
  const circumference = 2 * Math.PI * 50; // radius = 50
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <ShareCardWrapper 
      ref={ref} 
      testID="wellness-progress-card"
      gradientColors={[data.module.color, Colors.light.primary]}
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
        {/* Module Header */}
        <View style={styles.moduleHeader}>
          <View style={[styles.moduleIconContainer, { backgroundColor: data.module.color }]}>
            <Ionicons name={data.module.icon as any} size={28} color="#FFFFFF" />
          </View>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleType}>{data.module.type.toUpperCase()}</Text>
            <Text style={styles.moduleName}>{data.module.name}</Text>
          </View>
        </View>

        {/* Progress Circle */}
        <View style={styles.progressContainer}>
          <View style={styles.progressCircle}>
            {/* Background Circle */}
            <View style={styles.circleBackground}>
              <View style={[styles.circleFill, { 
                width: `${progressPercentage}%`,
                backgroundColor: data.module.color,
              }]} />
            </View>
            
            {/* Progress Text */}
            <View style={styles.progressText}>
              <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
              <Text style={styles.progressLabel}>Complete</Text>
            </View>
          </View>

          {/* Days Progress */}
          <View style={styles.daysContainer}>
            <Text style={styles.daysText}>
              Day <Text style={styles.daysHighlight}>{data.progress.currentDay}</Text> of {data.progress.totalDays}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Tasks Completed */}
          <View style={styles.statBox}>
            <Ionicons name="checkmark-done" size={20} color={data.module.color} />
            <Text style={styles.statValue}>{data.progress.tasksCompleted}/{data.progress.totalTasks}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>

          {/* Streak */}
          <View style={styles.statBox}>
            <Text style={styles.streakIcon}>{data.streak.icon}</Text>
            <Text style={styles.statValue}>{data.streak.current}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Next Milestone */}
        {data.nextMilestone && (
          <View style={styles.milestoneContainer}>
            <View style={styles.milestoneIcon}>
              <Ionicons name="flag" size={16} color={data.module.color} />
            </View>
            <View style={styles.milestoneInfo}>
              <Text style={styles.milestoneTitle}>Next Milestone: Day {data.nextMilestone.day}</Text>
              <Text style={styles.milestoneDescription}>{data.nextMilestone.description}</Text>
            </View>
          </View>
        )}

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[
              styles.progressBarFill,
              { width: `${progressPercentage}%`, backgroundColor: data.module.color }
            ]} />
          </View>
          <Text style={styles.progressBarText}>{data.progress.currentDay} / {data.progress.totalDays} days</Text>
        </View>
      </View>

      {/* Footer */}
      <ShareCardFooter motivationalText={data.motivationalText} />
    </ShareCardWrapper>
  );
});

WellnessProgressCard.displayName = 'WellnessProgressCard';

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
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  moduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleType: {
    fontSize: 9,
    color: Colors.light.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 2,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressCircle: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circleBackground: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.background,
    overflow: 'hidden',
  },
  circleFill: {
    height: '100%',
    borderRadius: 60,
  },
  progressText: {
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
  },
  progressLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  daysContainer: {
    marginTop: 12,
  },
  daysText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  daysHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  streakIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.light.textSecondary,
  },
  milestoneContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  milestoneIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 9,
    color: Colors.light.textSecondary,
    lineHeight: 12,
  },
  progressBarContainer: {
    gap: 6,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarText: {
    fontSize: 9,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});

export default WellnessProgressCard;
