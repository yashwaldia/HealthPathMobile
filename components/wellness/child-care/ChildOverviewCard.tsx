// components/wellness/child-care/ChildOverviewCard.tsx
// Overview card for child care module showing age and milestones
// Last Updated: December 12, 2025 - Added personalization with child's name

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';

type Props = {
  childName: string;              // ⭐ NEW: Child's name
  ageInMonths: number;
  ageInDays?: number;
  developmentalStage: string;
  milestoneText: string;
  gender?: 'male' | 'female';     // ⭐ NEW: Optional gender
};

export default function ChildOverviewCard({
  childName,
  ageInMonths,
  ageInDays,
  developmentalStage,
  milestoneText,
  gender,
}: Props) {
  // Format age display
  const formatAge = () => {
    if (ageInDays !== undefined && ageInDays < 60) {
      // For newborns, show days
      return `${ageInDays} day${ageInDays !== 1 ? 's' : ''} old`;
    }

    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;

    if (years > 0) {
      if (months > 0) {
        return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
      }
      return `${years} year${years > 1 ? 's' : ''} old`;
    }

    return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''} old`;
  };

  // Get icon based on age and gender
  const getIcon = () => {
    if (ageInMonths < 3) return 'gift-outline'; // Newborn
    if (ageInMonths < 12) return 'happy-outline'; // Baby
    if (ageInMonths < 36) return 'balloon-outline'; // Toddler
    return 'school-outline'; // Preschool
  };

  return (
    <View style={styles.card}>
      {/* Header with name */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name={getIcon()} size={32} color={Colors.light.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Tracking {childName}'s Growth</Text>
          {gender && (
            <View style={styles.genderBadge}>
              <Ionicons 
                name={gender === 'male' ? 'male' : 'female'} 
                size={12} 
                color={Colors.light.primary} 
              />
              <Text style={styles.genderText}>
                {gender === 'male' ? 'Boy' : 'Girl'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Age Display */}
      <View style={styles.ageSection}>
        <Text style={styles.ageLabel}>Current Age</Text>
        <Text style={styles.ageValue}>{formatAge()}</Text>
      </View>

      {/* Developmental Stage */}
      <View style={styles.stageSection}>
        <View style={styles.stageBadge}>
          <Ionicons name="fitness-outline" size={16} color={Colors.light.primary} />
          <Text style={styles.stageText}>{developmentalStage}</Text>
        </View>
      </View>

      {/* Milestone */}
      <View style={styles.milestoneSection}>
        <View style={styles.milestoneHeader}>
          <Ionicons name="trophy-outline" size={18} color="#FFB020" />
          <Text style={styles.milestoneTitle}>Current Milestone</Text>
        </View>
        <Text style={styles.milestoneText}>{milestoneText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.primary + '30',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: Colors.light.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  ageSection: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  ageValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  stageSection: {
    marginBottom: 16,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: Colors.light.primary + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
  },
  stageText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  milestoneSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFB020' + '30',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFB020',
  },
  milestoneText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 20,
  },
});
