// components/nutrition/NutritionMealList.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NutritionEntry, nutritionService } from '../../services/nutritionService';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

// Helper to group by mealType and sort
function getGrouped(entries: NutritionEntry[]) {
  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
  const groups: { [meal: string]: NutritionEntry[] } = {};
  entries.forEach((e) => {
    if (!groups[e.mealType]) groups[e.mealType] = [];
    groups[e.mealType].push(e);
  });
  
  // Sort entries within each meal by time
  Object.keys(groups).forEach((meal) => {
    groups[meal].sort((a, b) => a.time.localeCompare(b.time));
  });
  
  return mealOrder.map((meal) => ({
    mealType: meal,
    entries: groups[meal] || [],
  }));
}

type Props = {
  entries: NutritionEntry[];
  onEntryDeleted: () => void;
  onEntryUpdated?: () => void;
};

export default function NutritionMealList({ entries, onEntryDeleted, onEntryUpdated }: Props) {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!entries?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="restaurant-outline" size={48} color={Colors.light.textSecondary} />
        <Text style={styles.emptyText}>No meals logged yet</Text>
        <Text style={styles.emptySubtext}>Start by scanning or manually logging a meal</Text>
      </View>
    );
  }

  const grouped = getGrouped(entries);

  /**
   * Delete meal entry with confirmation
   */
  const handleDelete = (entry: NutritionEntry) => {
    const foodNames = entry.foods.map((f) => f.name).join(', ') || 'this meal';
    
    Alert.alert(
      'Delete Meal',
      `Delete ${foodNames} (${entry.totalCalories} kcal)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await performDelete(entry);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const performDelete = async (entry: NutritionEntry) => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setDeletingId(entry.entryId);
      
      await nutritionService.deleteEntry(user.uid, entry.entryId);
      
      console.log('✅ Entry deleted:', entry.entryId);
      onEntryDeleted();
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      Alert.alert('Delete Failed', error.message || 'Could not delete entry. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Edit meal type (simple example - just change breakfast/lunch/dinner/snack)
   */
  const handleEditMealType = (entry: NutritionEntry) => {
    const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = [
      'breakfast',
      'lunch',
      'dinner',
      'snack',
    ];

    Alert.alert(
      'Change Meal Type',
      `Current: ${entry.mealType}`,
      [
        ...mealTypes.map((type) => ({
          text: type.charAt(0).toUpperCase() + type.slice(1),
          onPress: async () => {
            if (type !== entry.mealType) {
              await updateMealType(entry, type);
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const updateMealType = async (
    entry: NutritionEntry,
    newMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ) => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      await nutritionService.updateEntry(user.uid, entry.entryId, {
        mealType: newMealType,
      });

      console.log('✅ Meal type updated:', entry.entryId);
      
      if (onEntryUpdated) {
        onEntryUpdated();
      } else {
        onEntryDeleted(); // Fallback to refresh
      }
    } catch (error: any) {
      console.error('❌ Update error:', error);
      Alert.alert('Update Failed', error.message || 'Could not update meal type.');
    }
  };

  /**
   * View meal details (notes, images, full nutrition breakdown)
   */
  const handleViewDetails = (entry: NutritionEntry) => {
    const foodList = entry.foods
      .map((f) => `• ${f.name} (${f.quantity}${f.unit}): ${f.calories} kcal`)
      .join('\n');

    const details = `
${foodList}

Total Nutrition:
• Calories: ${entry.totalCalories} kcal
• Protein: ${entry.totalProtein}g
• Carbs: ${entry.totalCarbs}g
• Fat: ${entry.totalFats}g
${entry.totalSugar ? `• Sugar: ${entry.totalSugar}g` : ''}
${entry.totalSodium ? `• Sodium: ${entry.totalSodium}mg` : ''}

${entry.notes ? `Notes: ${entry.notes}` : ''}
${entry.images?.length ? `\n📷 ${entry.images.length} image(s) attached` : ''}
    `.trim();

    Alert.alert('Meal Details', details, [{ text: 'OK' }]);
  };

  /**
   * Show options menu for a meal
   */
  const handleMealPress = (entry: NutritionEntry) => {
    Alert.alert(
      'Meal Options',
      entry.foods.map((f) => f.name).join(', '),
      [
        {
          text: 'View Details',
          onPress: () => handleViewDetails(entry),
        },
        {
          text: 'Change Meal Type',
          onPress: () => handleEditMealType(entry),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(entry),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today's Meals</Text>
      
      {grouped.map(({ mealType, entries: mealEntries }) =>
        mealEntries.length > 0 ? (
          <View style={styles.mealGroup} key={mealType}>
            <View style={styles.mealTypeRow}>
              <Ionicons
                name={
                  mealType === 'breakfast'
                    ? 'sunny-outline'
                    : mealType === 'lunch'
                    ? 'partly-sunny-outline'
                    : mealType === 'dinner'
                    ? 'moon-outline'
                    : 'fast-food-outline'
                }
                size={16}
                color={Colors.light.primary}
              />
              <Text style={styles.mealType}>
                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </Text>
              <View style={styles.mealCount}>
                <Text style={styles.mealCountText}>{mealEntries.length}</Text>
              </View>
            </View>

            {mealEntries.map((entry) => (
              <TouchableOpacity
                key={entry.entryId}
                style={[
                  styles.mealItem,
                  deletingId === entry.entryId && styles.mealItemDeleting,
                ]}
                onPress={() => handleMealPress(entry)}
                activeOpacity={0.7}
              >
                <View style={styles.mealInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {entry.foods.map((f) => f.name).join(', ') || 'Meal'}
                    </Text>
                    {entry.images?.length ? (
                      <Ionicons name="image" size={14} color={Colors.light.primary} />
                    ) : null}
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={12} color={Colors.light.textSecondary} />
                    <Text style={styles.time}>{entry.time}</Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.macros}>
                      {entry.totalCalories} kcal
                    </Text>
                  </View>
                  <Text style={styles.macroDetail}>
                    P: {entry.totalProtein}g | C: {entry.totalCarbs}g | F: {entry.totalFats}g
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(entry)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={deletingId === entry.entryId ? 'hourglass-outline' : 'trash-outline'}
                    size={18}
                    color={Colors.light.error}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : null
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  mealGroup: {
    marginBottom: 16,
  },
  mealTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  mealType: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  mealCount: {
    backgroundColor: Colors.light.primary + '20',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  mealCountText: {
    fontSize: 11,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.light.border + '40',
  },
  mealItemDeleting: {
    opacity: 0.5,
  },
  mealInfo: {
    flex: 1,
    gap: 4,
    paddingRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  separator: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  macros: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  macroDetail: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});
