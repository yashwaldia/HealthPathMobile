// components/ShareCards/BMIShareCard.tsx
/**
 * BMI Share Card Component
 * Displays Body Mass Index with category and stats
 */

import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ShareCardWrapper from './ShareCardWrapper';
import ShareCardHeader from './ShareCardHeader';
import ShareCardFooter from './ShareCardFooter';
import type { BMICardData } from '@/types/shareCard';
import { Colors } from '@/constants/colors';
import { getBMICategoryColor } from '@/utils/shareCardHelpers';

// ============================================================================
// TYPES
// ============================================================================

interface BMIShareCardProps {
  data: BMICardData;
}

// ============================================================================
// COMPONENT
// ============================================================================

const BMIShareCard = forwardRef<View, BMIShareCardProps>(({ data }, ref) => {
  const categoryColor = getBMICategoryColor(data.bmi.category);

  return (
    <ShareCardWrapper ref={ref} testID="bmi-share-card">
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
          <Ionicons name="fitness-outline" size={24} color={Colors.light.primary} />
          <Text style={styles.title}>Body Mass Index</Text>
        </View>

        {/* BMI Value Circle */}
        <View style={[styles.bmiCircle, { borderColor: categoryColor }]}>
          <Text style={styles.bmiValue}>{data.bmi.value}</Text>
          <Text style={styles.bmiUnit}>BMI</Text>
        </View>

        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
          <Text style={styles.categoryText}>{data.bmi.category}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="scale-outline" size={20} color={Colors.light.textSecondary} />
            <Text style={styles.statLabel}>Weight</Text>
            <Text style={styles.statValue}>{data.stats.weight}</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="resize-outline" size={20} color={Colors.light.textSecondary} />
            <Text style={styles.statLabel}>Height</Text>
            <Text style={styles.statValue}>{data.stats.height}</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.light.success} />
            <Text style={styles.statLabel}>Healthy Range</Text>
            <Text style={styles.statValue}>{data.stats.healthyRange}</Text>
          </View>
        </View>

        {/* Hint */}
        <Text style={styles.hint}>{data.bmi.hint}</Text>
      </View>

      {/* Footer */}
      <ShareCardFooter motivationalText={data.motivationalText} />
    </ShareCardWrapper>
  );
});

BMIShareCard.displayName = 'BMIShareCard';

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
  bmiCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  bmiValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.light.text,
  },
  bmiUnit: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  categoryBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
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
  hint: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default BMIShareCard;
