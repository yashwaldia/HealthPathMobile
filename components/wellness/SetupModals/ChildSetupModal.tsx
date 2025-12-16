// components/wellness/SetupModals/ChildSetupModal.tsx
// Modal for adding/editing child profile with hybrid birthdate/age input
// Last Updated: December 16, 2025 - Added optional birth weight field

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';

type Props = {
  visible: boolean;
  onConfirm: (data: {
    childName: string;
    birthDate?: string;
    ageInMonths?: number;
    gender?: 'male' | 'female';
    birthWeightKg?: string;
  }) => void;
  onCancel: () => void;
  editMode?: boolean;
  initialData?: {
    childName: string;
    gender?: 'male' | 'female';
    birthWeightKg?: string;
  };
};

type SetupMode = 'birthdate' | 'manual';

export default function ChildSetupModal({
  visible,
  onConfirm,
  onCancel,
  editMode = false,
  initialData,
}: Props) {
  const [mode, setMode] = useState<SetupMode>('birthdate');
  const [childName, setChildName] = useState(initialData?.childName || '');
  const [gender, setGender] = useState<'male' | 'female' | undefined>(initialData?.gender);
  const [birthWeightKg, setBirthWeightKg] = useState(initialData?.birthWeightKg || '');

  // Birthdate mode
  const [birthDate, setBirthDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Manual age mode
  const [ageInMonths, setAgeInMonths] = useState('');

  const handleConfirm = () => {
    // Validate child name
    if (!childName || childName.trim().length === 0) {
      Alert.alert('Required', "Please enter your child's name");
      return;
    }

    // Basic validation for birth weight (if provided)
    const trimmedWeight = birthWeightKg.trim();
    if (trimmedWeight.length > 0) {
      const numericWeight = parseFloat(trimmedWeight.replace(',', '.'));
      if (isNaN(numericWeight) || numericWeight <= 0 || numericWeight > 10) {
        Alert.alert(
          'Invalid Birth Weight',
          'Please enter a valid birth weight in kilograms (e.g., 3.2).'
        );
        return;
      }
    }

    if (mode === 'birthdate') {
      // Validate birthdate is not in future
      const today = new Date();
      if (birthDate > today) {
        Alert.alert('Invalid Date', 'Birth date cannot be in the future');
        return;
      }

      // Validate not more than 10 years old
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      if (birthDate < tenYearsAgo) {
        Alert.alert(
          'Invalid Date',
          'This module is designed for children up to 10 years old'
        );
        return;
      }

      const formattedDate = birthDate.toISOString().split('T')[0];
      onConfirm({
        childName: childName.trim(),
        birthDate: formattedDate,
        gender,
        birthWeightKg: trimmedWeight || undefined,
      });
    } else {
      // Manual age mode
      const age = parseInt(ageInMonths, 10);

      if (isNaN(age) || age < 0 || age > 120) {
        Alert.alert(
          'Invalid Age',
          'Please enter a valid age (0-120 months / 0-10 years)'
        );
        return;
      }

      onConfirm({
        childName: childName.trim(),
        ageInMonths: age,
        gender,
        birthWeightKg: trimmedWeight || undefined,
      });
    }
  };

  const handleCancel = () => {
    setChildName(initialData?.childName || '');
    setGender(initialData?.gender);
    setBirthWeightKg(initialData?.birthWeightKg || '');
    setBirthDate(new Date());
    setAgeInMonths('');
    setMode('birthdate');
    setShowDatePicker(false);
    onCancel();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const handleDatePickerDone = () => {
    setShowDatePicker(false);
  };

  const formatDateForDisplay = (date: Date): string => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardAvoid}
        >
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Edit Child Profile' : 'Add Child Profile'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {editMode
                  ? "Update your child's information"
                  : "Let's track your child's growth"}
              </Text>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Child Name Input */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Child's Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Emma"
                  placeholderTextColor={Colors.light.textSecondary + '80'}
                  value={childName}
                  onChangeText={setChildName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              {/* Gender Selection (Optional) */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Gender (Optional)</Text>
                <View style={styles.genderSelector}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      gender === 'male' && styles.genderButtonActive,
                    ]}
                    onPress={() =>
                      setGender(gender === 'male' ? undefined : 'male')
                    }
                  >
                    <Ionicons
                      name="male"
                      size={24}
                      color={
                        gender === 'male'
                          ? Colors.light.primary
                          : Colors.light.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === 'male' && styles.genderButtonTextActive,
                      ]}
                    >
                      Boy
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      gender === 'female' && styles.genderButtonActive,
                    ]}
                    onPress={() =>
                      setGender(gender === 'female' ? undefined : 'female')
                    }
                  >
                    <Ionicons
                      name="female"
                      size={24}
                      color={
                        gender === 'female'
                          ? Colors.light.primary
                          : Colors.light.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === 'female' && styles.genderButtonTextActive,
                      ]}
                    >
                      Girl
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Birth Weight (Optional) */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Birth Weight (Optional)</Text>
                <Text style={styles.inputHint}>
                  Enter birth weight in kilograms (e.g., 3.2)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 3.2"
                  placeholderTextColor={Colors.light.textSecondary + '80'}
                  value={birthWeightKg}
                  onChangeText={setBirthWeightKg}
                  keyboardType="decimal-pad"
                />
              </View>

              {!editMode && (
                <>
                  <View style={styles.divider} />

                  {/* Mode Selection */}
                  <Text style={styles.sectionTitle}>Child's Age</Text>
                  <View style={styles.modeSelector}>
                    <TouchableOpacity
                      style={[
                        styles.modeButton,
                        mode === 'birthdate' && styles.modeButtonActive,
                      ]}
                      onPress={() => setMode('birthdate')}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={24}
                        color={
                          mode === 'birthdate'
                            ? Colors.light.primary
                            : Colors.light.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.modeButtonText,
                          mode === 'birthdate' && styles.modeButtonTextActive,
                        ]}
                      >
                        Birth Date
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.modeButton,
                        mode === 'manual' && styles.modeButtonActive,
                      ]}
                      onPress={() => setMode('manual')}
                    >
                      <Ionicons
                        name="create-outline"
                        size={24}
                        color={
                          mode === 'manual'
                            ? Colors.light.primary
                            : Colors.light.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.modeButtonText,
                          mode === 'manual' && styles.modeButtonTextActive,
                        ]}
                      >
                        Age in Months
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Birthdate Mode */}
                  {mode === 'birthdate' ? (
                    <View style={styles.inputSection}>
                      <Text style={styles.inputLabel}>Date of Birth</Text>
                      <Text style={styles.inputHint}>
                        Select your child's birth date
                      </Text>

                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <View style={styles.datePickerContent}>
                          <Ionicons
                            name="calendar"
                            size={20}
                            color={Colors.light.primary}
                          />
                          <Text style={styles.datePickerText}>
                            {formatDateForDisplay(birthDate)}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color={Colors.light.textSecondary}
                        />
                      </TouchableOpacity>

                      {showDatePicker && (
                        <>
                          {Platform.OS === 'ios' ? (
                            <View style={styles.iosDatePickerContainer}>
                              <View style={styles.iosDatePickerHeader}>
                                <TouchableOpacity onPress={handleDatePickerDone}>
                                  <Text style={styles.datePickerDoneButton}>
                                    Done
                                  </Text>
                                </TouchableOpacity>
                              </View>
                              <DateTimePicker
                                value={birthDate}
                                mode="date"
                                display="spinner"
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                                textColor={Colors.light.text}
                              />
                            </View>
                          ) : (
                            <DateTimePicker
                              value={birthDate}
                              mode="date"
                              display="default"
                              onChange={handleDateChange}
                              maximumDate={new Date()}
                            />
                          )}
                        </>
                      )}

                      <View style={styles.infoBox}>
                        <Ionicons
                          name="information-circle"
                          size={16}
                          color={Colors.light.primary}
                        />
                        <Text style={styles.infoText}>
                          For children up to 10 years old
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.inputSection}>
                      <Text style={styles.inputLabel}>Age in Months</Text>
                      <Text style={styles.inputHint}>
                        Enter your child's current age in months (e.g., 14)
                      </Text>

                      <TextInput
                        style={styles.ageInput}
                        placeholder="14"
                        placeholderTextColor={Colors.light.textSecondary + '80'}
                        value={ageInMonths}
                        onChangeText={setAgeInMonths}
                        keyboardType="number-pad"
                        maxLength={3}
                      />

                      <View style={styles.exampleBox}>
                        <Ionicons
                          name="bulb-outline"
                          size={16}
                          color={Colors.light.primary}
                        />
                        <Text style={styles.exampleText}>
                          1 year = 12 months | 2 years = 24 months | 5 years = 60
                          months
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={handleCancel}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleConfirm}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {editMode ? 'Save Changes' : 'Add Child'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboardAvoid: {
    width: '100%',
    maxWidth: 440,
  },
  modalContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 24,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  modalBody: {
    padding: 24,
    maxHeight: 500,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 20,
  },
  inputSection: {
    gap: 8,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  inputHint: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 2,
    borderColor: Colors.light.border,
    marginTop: 4,
  },
  ageInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    borderWidth: 2,
    borderColor: Colors.light.border,
    marginTop: 4,
    textAlign: 'center',
  },
  genderSelector: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    gap: 8,
  },
  genderButtonActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  genderButtonTextActive: {
    color: Colors.light.primary,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    gap: 8,
  },
  modeButtonActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  modeButtonTextActive: {
    color: Colors.light.primary,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    marginTop: 4,
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  datePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  iosDatePickerContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  datePickerDoneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.primary + '10',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  exampleBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.primary + '10',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  exampleText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
