// components/wellness/child-care/AddGrowthRecordModal.tsx
// Modal for adding child growth records (height & weight)
// Created: December 17, 2025

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../../constants/colors';

type Props = {
  visible: boolean;
  childName: string;
  onConfirm: (heightCm: string, weightKg: string) => void;
  onCancel: () => void;
};

// Note: The parent component (IndividualChildCareScreen) will add recordId, date, and ageInMonths

export default function AddGrowthRecordModal({
  visible,
  childName,
  onConfirm,
  onCancel,
}: Props) {
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [errors, setErrors] = useState({ height: '', weight: '' });

  const validateAndSubmit = () => {
    let hasError = false;
    const newErrors = { height: '', weight: '' };

    // Validate height (reasonable range: 30-200 cm)
    const height = parseFloat(heightCm);
    if (!heightCm || isNaN(height)) {
      newErrors.height = 'Please enter height';
      hasError = true;
    } else if (height < 30 || height > 200) {
      newErrors.height = 'Height must be between 30-200 cm';
      hasError = true;
    }

    // Validate weight (reasonable range: 1-150 kg)
    const weight = parseFloat(weightKg);
    if (!weightKg || isNaN(weight)) {
      newErrors.weight = 'Please enter weight';
      hasError = true;
    } else if (weight < 1 || weight > 150) {
      newErrors.weight = 'Weight must be between 1-150 kg';
      hasError = true;
    }

    setErrors(newErrors);

    if (!hasError) {
      onConfirm(heightCm, weightKg);
      // Reset form
      setHeightCm('');
      setWeightKg('');
      setErrors({ height: '', weight: '' });
    }
  };

  const handleCancel = () => {
    setHeightCm('');
    setWeightKg('');
    setErrors({ height: '', weight: '' });
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />

        <View style={styles.modalContent}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons
                  name="fitness-outline"
                  size={24}
                  color={Colors.light.primary}
                />
                <Text style={styles.title}>Add Growth Record</Text>
              </View>
              <TouchableOpacity onPress={handleCancel}>
                <Ionicons
                  name="close"
                  size={28}
                  color={Colors.light.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>
              Record {childName}'s current measurements
            </Text>

            <View style={styles.spacing} />

            {/* Height Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="resize-outline"
                  size={20}
                  color={Colors.light.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 75.5"
                  placeholderTextColor={Colors.light.textSecondary}
                  keyboardType="decimal-pad"
                  value={heightCm}
                  onChangeText={setHeightCm}
                />
                <Text style={styles.unit}>cm</Text>
              </View>
              {errors.height ? (
                <Text style={styles.errorText}>{errors.height}</Text>
              ) : null}
            </View>

            <View style={styles.spacing} />

            {/* Weight Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="fitness-outline"
                  size={20}
                  color={Colors.light.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 9.2"
                  placeholderTextColor={Colors.light.textSecondary}
                  keyboardType="decimal-pad"
                  value={weightKg}
                  onChangeText={setWeightKg}
                />
                <Text style={styles.unit}>kg</Text>
              </View>
              {errors.weight ? (
                <Text style={styles.errorText}>{errors.weight}</Text>
              ) : null}
            </View>

            <View style={styles.spacing} />

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle"
                size={18}
                color={Colors.light.primary}
              />
              <Text style={styles.infoText}>
                Measurements will be recorded with today's date. Track regularly
                to monitor growth trends.
              </Text>
            </View>

            <View style={styles.spacing} />

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={validateAndSubmit}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>Add Record</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  spacing: {
    height: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    marginLeft: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  confirmButton: {
    backgroundColor: Colors.light.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});