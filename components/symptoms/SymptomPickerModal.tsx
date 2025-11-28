import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { SymptomCategory } from '../../types/symptom';

interface SymptomPickerModalProps {
  visible: boolean;
  category: SymptomCategory | null;
  selectedSymptoms: string[];
  onClose: () => void;
  onToggleSymptom: (symptom: string) => void;
  onAnalyze: () => void;
}

export default function SymptomPickerModal({
  visible,
  category,
  selectedSymptoms,
  onClose,
  onToggleSymptom,
  onAnalyze,
}: SymptomPickerModalProps) {
  if (!category) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Symptoms: {category.name}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.symptomsList}>
            {category.symptoms.map((symptom, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.symptomButton,
                  selectedSymptoms.includes(symptom) && styles.symptomButtonSelected,
                ]}
                onPress={() => onToggleSymptom(symptom)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={selectedSymptoms.includes(symptom) ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={
                    selectedSymptoms.includes(symptom)
                      ? Colors.light.primary
                      : Colors.light.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.symptomButtonText,
                    selectedSymptoms.includes(symptom) && styles.symptomButtonTextSelected,
                  ]}
                >
                  {symptom}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.analyzeButton,
              selectedSymptoms.length === 0 && styles.analyzeButtonDisabled,
            ]}
            onPress={onAnalyze}
            disabled={selectedSymptoms.length === 0}
          >
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            <Text style={styles.analyzeButtonText}>
              Analyze Symptoms ({selectedSymptoms.length} selected)
            </Text>
          </TouchableOpacity>
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
    maxHeight: '80%',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  symptomsList: {
    maxHeight: 400,
    padding: 20,
  },
  symptomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  symptomButtonSelected: {
    backgroundColor: `${Colors.light.primary}10`,
    borderColor: Colors.light.primary,
  },
  symptomButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 12,
    flex: 1,
  },
  symptomButtonTextSelected: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  analyzeButton: {
    flexDirection: 'row',
    backgroundColor: Colors.light.primary,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
