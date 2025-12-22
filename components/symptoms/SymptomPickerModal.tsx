// components/symptoms/SymptomPickerModal.tsx
// ✅ UPDATED: Removed analyze button - selection only
// Last Updated: December 18, 2025

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { SymptomCategory } from '../../types/symptom';

interface SymptomPickerModalProps {
  visible: boolean;
  category: SymptomCategory | null;
  selectedSymptoms: string[];
  onClose: () => void;
  onToggleSymptom: (symptom: string) => void;
  // ❌ REMOVED: onAnalyze prop
}

export default function SymptomPickerModal({
  visible,
  category,
  selectedSymptoms,
  onClose,
  onToggleSymptom,
}: SymptomPickerModalProps) {
  if (!category) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.categoryIcon}>
                <Ionicons
                  name={category.icon as any}
                  size={24}
                  color={Colors.light.primary}
                />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.modalTitle}>{category.name}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedSymptoms.length} symptom
                  {selectedSymptoms.length !== 1 ? 's' : ''} selected
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={32} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>
          {/* Symptoms List */}
          <ScrollView 
            style={styles.symptomsList}
            showsVerticalScrollIndicator={false}
          >
            {category.symptoms.map((symptom, index) => {
              const isSelected = selectedSymptoms.includes(symptom);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.symptomButton,
                    isSelected && styles.symptomButtonSelected,
                  ]}
                  onPress={() => onToggleSymptom(symptom)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                  ]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.symptomButtonText,
                      isSelected && styles.symptomButtonTextSelected,
                    ]}
                  >
                    {symptom}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ✅ NEW: Done Button (replaces analyze button) */}
          <View style={styles.footer}>
            {selectedSymptoms.length > 0 && (
              <View style={styles.selectionBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.light.primary} />
                <Text style={styles.selectionBadgeText}>
                  {selectedSymptoms.length} selected
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  symptomsList: {
    maxHeight: 450,
    padding: 20,
  },
  symptomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  symptomButtonSelected: {
    backgroundColor: `${Colors.light.primary}10`,
    borderColor: Colors.light.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  checkboxSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  symptomButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
    marginLeft: 12,
    flex: 1,
  },
  symptomButtonTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  // ✅ NEW: Footer with selection badge + done button
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  selectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${Colors.light.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectionBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  doneButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
