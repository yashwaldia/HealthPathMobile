// components/wellness/child-care/ChildProfileCard.tsx
// Card component for displaying child profile in list view
// Last Updated: December 12, 2025 - Gender-based emoji icons

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { ChildProfileSummary } from '../../../types/wellness';

type Props = {
  profile: ChildProfileSummary;
  onPress: () => void;
  onLongPress?: () => void;
};

export default function ChildProfileCard({ profile, onPress, onLongPress }: Props) {
  // ⭐ Get emoji based on age and gender
  const getAgeEmoji = () => {
    const isBoy = profile.gender === 'male';
    const isGirl = profile.gender === 'female';
    
    // 0-12 months: Baby (gender neutral)
    if (profile.ageInMonths < 12) {
      return '👶';
    }
    
    // 1-2 years: Toddler
    if (profile.ageInMonths < 24) {
      if (isBoy) return '👶🏻'; // Baby boy skin tone
      if (isGirl) return '👶🏻'; // Baby girl skin tone
      return '👶'; // Neutral baby
    }
    
    // 2-5 years: Young child
    if (profile.ageInMonths < 60) {
      if (isBoy) return '👦';
      if (isGirl) return '👧';
      return '🧒'; // Neutral child
    }
    
    // 5+ years: School age
    if (isBoy) return '👦';
    if (isGirl) return '👧';
    return '🧒'; // Neutral child
  };

  // Format last tracked date
  const formatLastTracked = () => {
    if (!profile.lastTrackedDate) {
      return 'Never tracked';
    }

    const lastTracked = new Date(profile.lastTrackedDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastTracked.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {/* Left: Avatar Emoji */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.emojiIcon}>{getAgeEmoji()}</Text>
          </View>
        </View>

        {/* Center: Child Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.childName}>{profile.childName}</Text>
          <Text style={styles.ageText}>{profile.ageDisplay}</Text>
          <View style={styles.trackingInfo}>
            <Ionicons name="time-outline" size={14} color={Colors.light.textSecondary} />
            <Text style={styles.lastTrackedText}>{formatLastTracked()}</Text>
          </View>
        </View>

        {/* Right: Progress & Arrow */}
        <View style={styles.rightSection}>
          {/* Progress Circle */}
          {profile.completionRate > 0 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>{Math.round(profile.completionRate)}%</Text>
            </View>
          )}
          
          {/* Arrow */}
          <Ionicons name="chevron-forward" size={24} color={Colors.light.textSecondary} />
        </View>
      </View>

      {/* Completion Progress Bar */}
      {profile.completionRate > 0 && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${Math.min(profile.completionRate, 100)}%` }
              ]} 
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.primary + '30',
  },
  emojiIcon: {
    fontSize: 36,
  },
  infoContainer: {
    flex: 1,
    gap: 4,
  },
  childName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  ageText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  lastTrackedText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  progressBarContainer: {
    marginTop: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
});
