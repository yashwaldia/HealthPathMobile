// components/ShareCards/ChildGrowthCard.tsx
/**
 * Child Growth Share Card Component
 * Displays child's growth milestones and vaccination status
 */

import { Colors } from '@/constants/colors';
import type { ChildGrowthCardData } from '@/types/shareCard';
import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ShareCardFooter from './ShareCardFooter';
import ShareCardHeader from './ShareCardHeader';
import ShareCardWrapper from './ShareCardWrapper';

// ============================================================================
// TYPES
// ============================================================================

interface ChildGrowthCardProps {
  data: ChildGrowthCardData;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ChildGrowthCard = forwardRef<View, ChildGrowthCardProps>(({ data }, ref) => {
  const getVaccineStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return Colors.light.success;
      case 'Missed': return Colors.light.error;
      case 'Pending': return Colors.light.warning;
      case 'Upcoming': return Colors.light.primary;
      default: return Colors.light.textSecondary;
    }
  };

  const getVaccineStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return 'checkmark-circle';
      case 'Missed': return 'close-circle';
      case 'Pending': return 'time';
      case 'Upcoming': return 'calendar';
      default: return 'information-circle';
    }
  };

  return (
    <ShareCardWrapper 
      ref={ref} 
      testID="child-growth-card"
      gradientColors={['#60a5fa', Colors.light.primary]}
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
          <Ionicons name="people" size={24} color={Colors.light.primary} />
          <Text style={styles.title}>Child Growth Tracker</Text>
        </View>

        {/* Child Info */}
        <View style={styles.childInfoContainer}>
          <View style={styles.childIconContainer}>
            <Ionicons 
              name={data.child.gender === 'male' ? 'male' : data.child.gender === 'female' ? 'female' : 'person'} 
              size={32} 
              color="#FFFFFF" 
            />
          </View>
          <View style={styles.childDetails}>
            <Text style={styles.childName}>{data.child.name}</Text>
            <Text style={styles.childAge}>{data.child.ageInMonths} months old</Text>
          </View>
        </View>

        {/* Growth Stats */}
        <View style={styles.growthGrid}>
          {/* Height */}
          <View style={styles.growthCard}>
            <Ionicons name="resize-outline" size={24} color={Colors.light.primary} />
            <Text style={styles.growthLabel}>Height</Text>
            <Text style={styles.growthValue}>{data.growth.height.value}</Text>
            {data.growth.height.percentile && (
              <Text style={styles.percentileText}>{data.growth.height.percentile}th percentile</Text>
            )}
          </View>

          {/* Weight */}
          <View style={styles.growthCard}>
            <Ionicons name="scale-outline" size={24} color={Colors.light.primary} />
            <Text style={styles.growthLabel}>Weight</Text>
            <Text style={styles.growthValue}>{data.growth.weight.value}</Text>
            {data.growth.weight.percentile && (
              <Text style={styles.percentileText}>{data.growth.weight.percentile}th percentile</Text>
            )}
          </View>
        </View>

        {/* Recent Milestone */}
        {data.recentMilestone && (
          <View style={styles.milestoneContainer}>
            <View style={styles.milestoneHeader}>
              <Ionicons name="trophy" size={18} color={Colors.light.primary} />
              <Text style={styles.milestoneTitle}>Recent Milestone</Text>
            </View>
            <Text style={styles.milestoneText}>{data.recentMilestone}</Text>
          </View>
        )}

        {/* Vaccination Status */}
        {data.vaccinationStatus && (
          <View style={styles.vaccineContainer}>
            <View style={styles.vaccineHeader}>
              <Ionicons name="medical" size={18} color={getVaccineStatusColor(data.vaccinationStatus)} />
              <Text style={styles.vaccineLabel}>Vaccinations</Text>
            </View>
            <View style={[
              styles.vaccineStatusBadge,
              { backgroundColor: getVaccineStatusColor(data.vaccinationStatus) }
            ]}>
              <Ionicons 
                name={getVaccineStatusIcon(data.vaccinationStatus) as any} 
                size={14} 
                color="#FFFFFF" 
              />
              <Text style={styles.vaccineStatusText}>{data.vaccinationStatus}</Text>
            </View>
          </View>
        )}

        {/* Next Checkup */}
        {data.nextCheckup && (
          <View style={styles.checkupContainer}>
            <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.checkupText}>
              Next checkup: <Text style={styles.checkupDate}>{data.nextCheckup}</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <ShareCardFooter motivationalText="Every milestone matters! Track your child's journey! 👶💙" />
    </ShareCardWrapper>
  );
});

ChildGrowthCard.displayName = 'ChildGrowthCard';

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
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  childInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  childIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  childAge: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  growthGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  growthCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  growthLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  growthValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  percentileText: {
    fontSize: 9,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  milestoneContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.text,
  },
  milestoneText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    lineHeight: 14,
  },
  vaccineContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  vaccineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  vaccineLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.text,
  },
  vaccineStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  vaccineStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  checkupText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  checkupDate: {
    fontWeight: '600',
    color: Colors.light.text,
  },
});

export default ChildGrowthCard;
