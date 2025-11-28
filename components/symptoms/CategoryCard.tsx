import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SymptomCategory } from '../../types/symptom';
import { Colors } from '../../constants/colors';

interface CategoryCardProps {
  category: SymptomCategory;
  isSelected: boolean;
  onPress: () => void;
}

export default function CategoryCard({ category, isSelected, onPress }: CategoryCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        isSelected && styles.iconContainerSelected
      ]}>
        <Ionicons
          name={category.icon as any}
          size={28}
          color={isSelected ? '#FFFFFF' : Colors.light.primary}
        />
      </View>
      <Text style={[
        styles.categoryName,
        isSelected && styles.categoryNameSelected
      ]}>
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
  },
  cardSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
    transform: [{ scale: 1.05 }],
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
});
