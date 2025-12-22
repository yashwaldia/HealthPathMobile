// components/symptoms/CategoryCard.tsx
// ✅ UPDATED: Shows selected symptom count badge
// Last Updated: December 18, 2025

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { SymptomCategory } from '../../types/symptom';

interface CategoryCardProps {
  category: SymptomCategory;
  isSelected: boolean;
  onPress: () => void;
  // ✅ NEW: selection info
  hasSymptoms?: boolean;
  symptomCount?: number;
}

export default function CategoryCard({
  category,
  isSelected,
  onPress,
  hasSymptoms = false,
  symptomCount = 0,
}: CategoryCardProps) {
  const showBadge = hasSymptoms && symptomCount > 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        showBadge && styles.cardWithBadge,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* ✅ NEW: Top-right badge */}
      {showBadge && (
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={14} color="#ECFEFF" />
            <Text style={styles.badgeText}>
              {symptomCount}
            </Text>
          </View>
        </View>
      )}

      <View
        style={[
          styles.iconContainer,
          isSelected && styles.iconContainerSelected,
        ]}
      >
        <Ionicons
          name={category.icon as any}
          size={28}
          color={isSelected ? '#FFFFFF' : Colors.light.primary}
        />
      </View>
      <Text
        style={[
          styles.categoryName,
          isSelected && styles.categoryNameSelected,
        ]}
        numberOfLines={2}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '31%', // 3 columns with gaps
    aspectRatio: 0.9,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  cardSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
    transform: [{ scale: 1.05 }],
  },
  cardWithBadge: {
    paddingTop: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.light.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // ✅ NEW: Badge styles
  badgeContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#0EA5E9',
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ECFEFF',
  },
});
