// components/nutrition/MealTypeSelectorModal.tsx

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (mealType: MealType) => void;
  loading?: boolean; // show spinner when saving after selection
};

const MEAL_TYPES: { key: MealType; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
  {
    key: 'breakfast',
    label: 'Breakfast',
    icon: 'sunny-outline',
    description: 'Morning meal',
  },
  {
    key: 'lunch',
    label: 'Lunch',
    icon: 'partly-sunny-outline',
    description: 'Midday meal',
  },
  {
    key: 'dinner',
    label: 'Dinner',
    icon: 'moon-outline',
    description: 'Evening meal',
  },
  {
    key: 'snack',
    label: 'Snack',
    icon: 'fast-food-outline',
    description: 'Between meals',
  },
];

export default function MealTypeSelectorModal({
  visible,
  onClose,
  onSelect,
  loading = false,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrapper}>
              <Text style={styles.title}>Which meal is this?</Text>
              <Text style={styles.subtitle}>
                Choose how you want to categorize this meal. You can edit it later.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={22} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            {MEAL_TYPES.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.optionCard}
                activeOpacity={0.85}
                onPress={() => onSelect(item.key)}
                disabled={loading}
              >
                <View style={[styles.iconCircle, getIconBg(item.key)]}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={getIconColor(item.key)}
                  />
                </View>
                <View style={styles.textColumn}>
                  <Text style={styles.optionLabel}>{item.label}</Text>
                  <Text style={styles.optionDescription}>{item.description}</Text>
                </View>
                <Ionicons
                  name={Platform.OS === 'ios' ? 'chevron-forward' : 'chevron-forward-outline'}
                  size={18}
                  color={Colors.light.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.helperText}>
            This helps group your meals under Breakfast, Lunch, Dinner, and Snacks.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function getIconBg(mealType: MealType) {
  switch (mealType) {
    case 'breakfast':
      return { backgroundColor: Colors.light.primary + '15' };
    case 'lunch':
      return { backgroundColor: '#22C55E15' };
    case 'dinner':
      return { backgroundColor: '#6366F115' };
    case 'snack':
    default:
      return { backgroundColor: '#F9731615' };
  }
}

function getIconColor(mealType: MealType) {
  switch (mealType) {
    case 'breakfast':
      return Colors.light.primary;
    case 'lunch':
      return '#16A34A';
    case 'dinner':
      return '#4F46E5';
    case 'snack':
    default:
      return '#EA580C';
  }
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.light.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTextWrapper: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  optionsContainer: {
    marginTop: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: Colors.light.background,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border + '60',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textColumn: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  optionDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  helperText: {
    marginTop: 6,
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
