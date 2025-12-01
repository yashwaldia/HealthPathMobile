// components/nutrition/ManualFoodModal.tsx

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { NutritionEntry, NutritionFoodItem } from '../../services/nutritionService';
import { analyzeManualFoods } from '../../services/nutritionAIService';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

type ManualFoodModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: {
    date: string;
    time: string;
    mealType: MealType;
    foods: NutritionFoodItem[];
    notes?: string;
  }) => Promise<void>;
  dateISO: string;
  initialEntry?: NutritionEntry | null;
};

type EditableFood = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
};

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function ManualFoodModal({
  visible,
  onClose,
  onSave,
  dateISO,
  initialEntry,
}: ManualFoodModalProps) {
  const isEdit = !!initialEntry;

  const [mealType, setMealType] = useState<MealType>('lunch');
  const [time, setTime] = useState<Date>(new Date());
  const [foods, setFoods] = useState<EditableFood[]>([]);
  const [notes, setNotes] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (!visible) return;

    if (initialEntry) {
      setMealType(initialEntry.mealType);
      const [h, m] = initialEntry.time.split(':').map((v) => parseInt(v, 10));
      const base = new Date();
      base.setHours(h || 12, m || 0, 0, 0);
      setTime(base);
      setNotes(initialEntry.notes || '');
      setFoods(
        initialEntry.foods.map((f, idx) => ({
          id: `${idx}`,
          name: f.name,
          quantity: String(f.quantity || ''),
          unit: f.unit || 'g',
        })),
      );
    } else {
      const now = new Date();
      setTime(now);
      setMealType('lunch');
      setNotes('');
      setFoods([
        {
          id: '0',
          name: '',
          quantity: '',
          unit: 'g',
        },
      ]);
    }
    setError(null);
    setSaving(false);
  }, [visible, initialEntry, dateISO]);

  const handleChangeFood = (id: string, field: keyof EditableFood, value: string) => {
    setFoods((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const handleAddFoodRow = () => {
    setFoods((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: '',
        quantity: '',
        unit: 'g',
      },
    ]);
  };

  const handleRemoveFoodRow = (id: string) => {
    setFoods((prev) => (prev.length === 1 ? prev : prev.filter((f) => f.id !== id)));
  };

  const formatTime = (d: Date) => {
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const minimalFoods = foods
        .map((f) => ({
          name: f.name.trim(),
          quantity: Number(f.quantity) || 0,
          unit: f.unit.trim() || 'g',
        }))
        .filter((f) => f.name && f.quantity > 0);

      if (minimalFoods.length === 0) {
        setError('Please add at least one food with a name and quantity.');
        setSaving(false);
        return;
      }

      const analysis = await analyzeManualFoods(minimalFoods);

      const cleanedFoods: NutritionFoodItem[] = analysis.foods.map((f) => ({
        name: f.name,
        quantity: f.quantity,
        unit: f.unit || 'g',
        calories: f.calories || 0,
        protein: f.protein || 0,
        carbs: f.carbs || 0,
        fat: f.fat || 0,
        sugar: f.sugar || 0,
        sodium: f.sodium || 0,
      }));

      await onSave({
        date: dateISO,
        time: formatTime(time),
        mealType,
        foods: cleanedFoods,
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (e: any) {
      console.error('ManualFoodModal save error:', e);
      setError(e.message || 'Failed to save meal.');
    } finally {
      setSaving(false);
    }
  };

  const onTimeChange = (_: any, selected?: Date) => {
    if (Platform.OS !== 'ios') setShowTimePicker(false);
    if (selected) setTime(selected);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.modal}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{isEdit ? 'Edit Meal' : 'Add Meal Manually'}</Text>
            <TouchableOpacity onPress={onClose} disabled={saving}>
              <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Meal type selector */}
            <Text style={styles.label}>Meal type</Text>
            <View style={styles.chipRow}>
              {MEAL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mealChip,
                    mealType === type && styles.mealChipActive,
                  ]}
                  onPress={() => setMealType(type)}
                >
                  <Text
                    style={[
                      styles.mealChipText,
                      mealType === type && styles.mealChipTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time picker */}
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.timeText}>{formatTime(time)}</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                mode="time"
                value={time}
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}

            {/* Foods */}
            <Text style={[styles.label, { marginTop: 12 }]}>Foods</Text>
            {foods.map((food) => (
              <View key={food.id} style={styles.foodCard}>
                <View style={styles.foodHeader}>
                  <Text style={styles.foodTitle}>{food.name || 'Food item'}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFoodRow(food.id)}>
                    <Ionicons
                      name="remove-circle-outline"
                      size={20}
                      color={foods.length === 1 ? Colors.light.border : Colors.light.error}
                    />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Name (e.g., Grilled chicken)"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={food.name}
                  onChangeText={(text) => handleChangeFood(food.id, 'name', text)}
                />

                <View style={styles.row}>
                  <View style={[styles.flex, { marginRight: 6 }]}>
                    <Text style={styles.smallLabel}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="150"
                      placeholderTextColor={Colors.light.textSecondary}
                      value={food.quantity}
                      onChangeText={(text) =>
                        handleChangeFood(food.id, 'quantity', text)
                      }
                    />
                  </View>
                  <View style={[styles.flex, { marginLeft: 6 }]}>
                    <Text style={styles.smallLabel}>Unit</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="g / ml / piece"
                      placeholderTextColor={Colors.light.textSecondary}
                      value={food.unit}
                      onChangeText={(text) => handleChangeFood(food.id, 'unit', text)}
                    />
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addFoodButton} onPress={handleAddFoodRow}>
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={Colors.light.primary}
              />
              <Text style={styles.addFoodText}>Add another food</Text>
            </TouchableOpacity>

            {/* Notes */}
            <Text style={[styles.label, { marginTop: 10 }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Any notes about this meal..."
              placeholderTextColor={Colors.light.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          {/* Footer buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerButton, styles.footerCancel]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.footerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.footerSave]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.footerSaveText}>
                {saving ? 'Analyzing…' : isEdit ? 'Save changes' : 'Add meal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  modal: {
    height: '85%',
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 8,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  mealChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  mealChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  mealChipText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  mealChipTextActive: {
    color: '#fff',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  timeText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  foodCard: {
    marginTop: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 8,
    backgroundColor: Colors.light.background,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flex: {
    flex: 1,
  },
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  addFoodText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.light.error,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  footerButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  footerCancel: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  footerSave: {
    backgroundColor: Colors.light.primary,
  },
  footerCancelText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  footerSaveText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
});