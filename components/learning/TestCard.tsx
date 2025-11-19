import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { PathologyTest } from '../../types/learning';

interface TestCardProps {
  test: PathologyTest;
  onPress: () => void;
  onToggleCompare: (testId: string) => void;
  isInComparisonList: boolean;
}

export default function TestCard({
  test,
  onPress,
  onToggleCompare,
  isInComparisonList,
}: TestCardProps) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="flask" size={24} color={Colors.light.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.testName} numberOfLines={2}>
              {test.name}
            </Text>
            <Text style={styles.category}>{test.category}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
        </View>

        <Text style={styles.purpose} numberOfLines={2}>
          {test.purpose}
        </Text>

        <View style={styles.footer}>
          {test.system && (
            <View style={styles.footerItem}>
              <Ionicons name="pulse-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.footerText}>{test.system}</Text>
            </View>
          )}
          <View style={styles.footerItem}>
            <Ionicons name="water-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.footerText}>{test.sampleType}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Compare Button */}
      <TouchableOpacity
        style={[
          styles.compareButton,
          isInComparisonList && styles.compareButtonActive,
        ]}
        onPress={() => onToggleCompare(test.id)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isInComparisonList ? 'checkbox' : 'square-outline'}
          size={20}
          color={isInComparisonList ? Colors.light.primary : Colors.light.textSecondary}
        />
        <Text
          style={[
            styles.compareButtonText,
            isInComparisonList && styles.compareButtonTextActive,
          ]}
        >
          {isInComparisonList ? 'Added to Compare' : 'Add to Compare'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '15',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  purpose: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 8,
  },
  compareButtonActive: {
    backgroundColor: Colors.light.primary + '10',
  },
  compareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  compareButtonTextActive: {
    color: Colors.light.primary,
  },
});
