// components/wellness/PersonalizedSuggestionsCard.tsx
// Personalized AI-powered suggestions card
// Last Updated: December 10, 2025

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

type Props = {
  suggestions: {
    food: string[];
    exercise: string[];
    mentalHealth: string[];
  };
};

type Category = 'food' | 'exercise' | 'mentalHealth';

const CATEGORY_CONFIG: Record<Category, { icon: string; label: string; color: string }> = {
  food: {
    icon: 'restaurant-outline',
    label: 'Nutrition',
    color: '#FF6B6B',
  },
  exercise: {
    icon: 'fitness-outline',
    label: 'Exercise',
    color: '#4ECDC4',
  },
  mentalHealth: {
    icon: 'heart-outline',
    label: 'Mental Health',
    color: '#95E1D3',
  },
};

export default function PersonalizedSuggestionsCard({ suggestions }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>('food');

  const activeSuggestions = suggestions[activeCategory];
  const config = CATEGORY_CONFIG[activeCategory];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="bulb-outline" size={20} color={Colors.light.primary} />
        <Text style={styles.headerTitle}>Personalized for You</Text>
      </View>

      {/* Category tabs */}
      <View style={styles.tabs}>
        {(Object.keys(CATEGORY_CONFIG) as Category[]).map((category) => {
          const isActive = category === activeCategory;
          const catConfig = CATEGORY_CONFIG[category];
          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.tab,
                isActive && [styles.tabActive, { borderBottomColor: catConfig.color }],
              ]}
              onPress={() => setActiveCategory(category)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={catConfig.icon as any}
                size={18}
                color={isActive ? catConfig.color : Colors.light.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  isActive && [styles.tabTextActive, { color: catConfig.color }],
                ]}
              >
                {catConfig.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Suggestions list */}
      <View style={styles.suggestionsList}>
        {activeSuggestions.map((suggestion, index) => (
          <View key={index} style={styles.suggestionItem}>
            <View style={[styles.bulletDot, { backgroundColor: config.color }]} />
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </View>
        ))}
      </View>

      {/* Empty state */}
      {activeSuggestions.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No suggestions available yet</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginLeft: 8,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    fontWeight: '700',
  },
  suggestionsList: {
    gap: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
