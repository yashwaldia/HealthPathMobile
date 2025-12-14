// components/wellness/mother-care/PregnancyOverviewCard.tsx
// Pregnancy overview card with week/day/trimester info
// Last Updated: December 12, 2025 - Added validation and error handling

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';

type Props = {
  currentWeek: number;
  currentDay: number;
  trimester: 1 | 2 | 3;
  dueDate: string;
  babySize?: string;
  babySizeEmoji?: string;
};

const TRIMESTER_COLORS = {
  1: '#FFB6C1',
  2: '#FF69B4',
  3: '#FF1493',
};

export default function PregnancyOverviewCard({
  currentWeek,
  currentDay,
  trimester,
  dueDate,
  babySize,
  babySizeEmoji,
}: Props) {
  // ⭐ Validate week and day numbers
  const validWeek = !isNaN(currentWeek) && currentWeek > 0 ? currentWeek : 0;
  const validDay = !isNaN(currentDay) && currentDay >= 0 ? currentDay : 0;

  // ⭐ Validate and parse due date
  const today = new Date();
  const due = new Date(dueDate);
  const isValidDate = !isNaN(due.getTime()) && dueDate && dueDate.length > 0;

  // Calculate days remaining only if date is valid
  let daysRemaining = 0;
  let formattedDueDate = 'Calculating...';

  if (isValidDate) {
    const diffTime = due.getTime() - today.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    formattedDueDate = due.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // ⭐ Validate baby size data
  const hasBabySize = babySize && babySize !== 'developing' && babySizeEmoji;

  return (
    <View style={[styles.container, { borderTopColor: TRIMESTER_COLORS[trimester] }]}>
      {/* Top section - Week and Day */}
      <View style={styles.topSection}>
        <View style={styles.mainInfo}>
          <Text style={styles.weekLabel}>Week</Text>
          <Text style={styles.weekNumber}>{validWeek}</Text>
          <Text style={styles.dayLabel}>Day {validDay}</Text>
        </View>

        {/* Baby size */}
        {hasBabySize ? (
          <View style={styles.babySizeContainer}>
            <Text style={styles.babySizeEmoji}>{babySizeEmoji}</Text>
            <Text style={styles.babySizeText}>Size of a {babySize}</Text>
          </View>
        ) : (
          <View style={styles.babySizeContainer}>
            <Text style={styles.babySizeEmoji}>👶</Text>
            <Text style={styles.babySizeText}>Growing</Text>
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom section - Trimester and Due Date */}
      <View style={styles.bottomSection}>
        {/* Trimester badge */}
        <View style={styles.infoItem}>
          <View
            style={[
              styles.trimesterBadge,
              { backgroundColor: TRIMESTER_COLORS[trimester] + '30' },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={TRIMESTER_COLORS[trimester]}
            />
            <Text
              style={[styles.trimesterText, { color: TRIMESTER_COLORS[trimester] }]}
            >
              Trimester {trimester}
            </Text>
          </View>
        </View>

        {/* Due date info */}
        <View style={styles.infoItem}>
          <View style={styles.dueDateContainer}>
            <Ionicons
              name="heart"
              size={14}
              color={Colors.light.primary}
              style={styles.heartIcon}
            />
            <View>
              <Text style={styles.dueDateLabel}>Due Date</Text>
              <Text style={styles.dueDateText}>
                {isValidDate ? formattedDueDate : 'Not set'}
              </Text>
              {isValidDate && daysRemaining > 0 && (
                <Text style={styles.daysRemainingText}>
                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} to go
                </Text>
              )}
              {isValidDate && daysRemaining === 0 && (
                <Text style={styles.dueTodayText}>Due today! 🎉</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderTopWidth: 4,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainInfo: {
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weekNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.light.text,
    lineHeight: 56,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  babySizeContainer: {
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  babySizeEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  babySizeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 16,
  },
  bottomSection: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trimesterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  trimesterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartIcon: {
    marginRight: 8,
  },
  dueDateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  dueDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 2,
  },
  daysRemainingText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  // ⭐ NEW: Due today style
  dueTodayText: {
    fontSize: 12,
    color: '#FF1493',
    fontWeight: '700',
    marginTop: 2,
  },
});
