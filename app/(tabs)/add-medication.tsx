// app/add-medication.tsx
// ✅ Stable duration logic + All TypeScript errors resolved
// Last Updated: December 18, 2025

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CameraScanModal from '../../components/medication/CameraScanModal';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { addMedication } from '../../services/medicationService';
import {
  DosageForm,
  ExtractedMedication,
  FrequencyType,
  MealRelation,
} from '../../types/medication';
import {
  calculateDurationDays,
  calculateEndDate,
  isValidDateString,
} from '../../utils/dateHelpers';

export default function AddMedicationScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Form State
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [dosageForm, setDosageForm] = useState<DosageForm>('Tablet');
  const [frequency, setFrequency] = useState<FrequencyType>('Once a day');
  const [mealRelation, setMealRelation] = useState<MealRelation>('After meals');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [durationDays, setDurationDays] = useState('');
  const [endDate, setEndDate] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');
  const [purpose, setPurpose] = useState('');
  const [instructions, setInstructions] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // Modal States
  const [showCameraScan, setShowCameraScan] = useState(false);

  // Dropdown Options
  const dosageForms: DosageForm[] = [
    'Tablet',
    'Capsule',
    'Syrup',
    'Injection',
    'Cream',
    'Ointment',
    'Drops',
    'Inhaler',
    'Patch',
    'Suppository',
    'Other',
  ];
  const frequencies: FrequencyType[] = [
    'Once a day',
    'Twice a day',
    'Thrice a day',
    'Four times a day',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'As needed',
    'Weekly',
    'Custom',
  ];
  const mealRelations: MealRelation[] = [
    'Before meals',
    'After meals',
    'With meals',
    'Empty stomach',
    'Any time',
  ];

  /**
   * When user finishes editing duration (onBlur) calculate end date once.
   * Handles edge cases: empty, non-numeric, zero, invalid start date.
   */
  const handleDurationBlur = () => {
    if (!durationDays.trim()) {
      setEndDate('');
      return;
    }

    const days = parseInt(durationDays, 10);
    if (isNaN(days) || days <= 0) {
      setEndDate('');
      return;
    }

    if (!isValidDateString(startDate)) {
      // Do not overwrite; user may fix the date later
      return;
    }

    const calculatedEndDate = calculateEndDate(startDate, days);
    setEndDate(calculatedEndDate);
  };

  /**
   * When user finishes editing end date (future: if you add editable end date),
   * this can be used to recalculate duration.
   */
  const handleEndDateBlur = () => {
    if (
      !endDate.trim() ||
      !isValidDateString(startDate) ||
      !isValidDateString(endDate)
    ) {
      return;
    }

    const calculatedDays = calculateDurationDays(startDate, endDate);
    if (calculatedDays > 0) {
      setDurationDays(calculatedDays.toString());
    }
  };

  /**
   * Handle AI Quick Scan Result
   */
  const handleAiScanResult = (extractedMed: ExtractedMedication) => {
    setName(extractedMed.name || '');
    setStrength(extractedMed.strength || '');

    // Type-safe enum assignment
    if (
      extractedMed.dosageForm &&
      dosageForms.includes(extractedMed.dosageForm as DosageForm)
    ) {
      setDosageForm(extractedMed.dosageForm as DosageForm);
    }
    if (
      extractedMed.frequency &&
      frequencies.includes(extractedMed.frequency as FrequencyType)
    ) {
      setFrequency(extractedMed.frequency as FrequencyType);
    }
    if (
      extractedMed.mealRelation &&
      mealRelations.includes(extractedMed.mealRelation as MealRelation)
    ) {
      setMealRelation(extractedMed.mealRelation as MealRelation);
    }

    setPrescribedBy(extractedMed.prescribedBy || '');
    setInstructions(extractedMed.instructions || '');
    setPurpose(extractedMed.purpose || '');

    // Parse duration like "5 days", "2 weeks", etc.
    if (extractedMed.duration) {
      const days = parseDurationToDays(extractedMed.duration);
      if (days > 0) {
        setDurationDays(days.toString());
        // Also compute endDate based on extracted duration
        if (isValidDateString(startDate)) {
          const calculatedEndDate = calculateEndDate(startDate, days);
          setEndDate(calculatedEndDate);
        }
      }
    }
  };

  /**
   * Parse duration string to days
   */
  const parseDurationToDays = (duration: string): number => {
    const durationLower = duration.toLowerCase().trim();
    const match = durationLower.match(/(\d+)\s*(day|week|month)s?/i);
    if (!match) return 0;
    const value = parseInt(match[1], 10);
    if (isNaN(value) || value <= 0) return 0;
    const unit = match[2].toLowerCase();
    switch (unit) {
      case 'day':
        return value;
      case 'week':
        return value * 7;
      case 'month':
        return value * 30;
      default:
        return 0;
    }
  };

  /**
   * Type-safe dropdown handlers
   */
  const handleDosageFormSelect = (value: string) => {
    if (dosageForms.includes(value as DosageForm)) {
      setDosageForm(value as DosageForm);
    }
  };

  const handleFrequencySelect = (value: string) => {
    if (frequencies.includes(value as FrequencyType)) {
      setFrequency(value as FrequencyType);
    }
  };

  const handleMealRelationSelect = (value: string) => {
    if (mealRelations.includes(value as MealRelation)) {
      setMealRelation(value as MealRelation);
    }
  };

  /**
   * Handle regular image picker
   */
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant camera roll permissions.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPrescriptionImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter medication name');
      return false;
    }
    if (!strength.trim()) {
      Alert.alert(
        'Validation Error',
        'Please enter medication strength (e.g., 500mg)'
      );
      return false;
    }

    if (startDate && !isValidDateString(startDate)) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid start date (YYYY-MM-DD)'
      );
      return false;
    }

    if (durationDays) {
      const days = parseInt(durationDays, 10);
      if (isNaN(days) || days <= 0) {
        Alert.alert(
          'Validation Error',
          'Duration must be a positive number of days'
        );
        return false;
      }
    }

    return true;
  };

  /**
   * Handle save medication
   */
  const handleSave = async () => {
    if (!validateForm() || !user?.uid) return;

    try {
      setLoading(true);

      const durationDaysNum =
        durationDays.trim() !== '' ? parseInt(durationDays, 10) : undefined;

      await addMedication(user.uid, {
        name: name.trim(),
        strength: strength.trim(),
        dosageForm,
        frequency,
        mealRelation,
        startDate,
        durationDays: durationDaysNum,
        endDate: endDate || undefined,
        prescribedBy: prescribedBy.trim() || undefined,
        purpose: purpose.trim() || undefined,
        instructions: instructions.trim() || undefined,
        reminderEnabled,
        prescriptionImage: prescriptionImage || undefined,
        isActive: true,
      });

      Alert.alert('Success!', 'Medication added successfully ✅', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving medication:', error);
      Alert.alert('Error', 'Failed to save medication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Dropdown renderer
   */
  const renderDropdown = (
    label: string,
    value: string,
    options: string[],
    onSelect: (value: string) => void
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dropdownContainer}
      >
        {options.map(option => (
          <TouchableOpacity
            key={option}
            style={[
              styles.dropdownOption,
              value === option && styles.dropdownOptionSelected,
            ]}
            onPress={() => onSelect(option)}
          >
            <Text
              style={[
                styles.dropdownText,
                value === option && styles.dropdownTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Medication</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ✨ QUICK AI SCAN SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Quick AI Scan</Text>
            <TouchableOpacity
              style={styles.aiScanButton}
              onPress={() => setShowCameraScan(true)}
            >
              <Ionicons name="scan-circle-outline" size={24} color="white" />
              <Text style={styles.aiScanButtonText}>Scan Medication Label</Text>
            </TouchableOpacity>
            <Text style={styles.aiScanSubtitle}>
              AI will auto-fill the form from your photo
            </Text>
          </View>

          {/* Basic Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medication Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Paracetamol"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Strength/Dosage *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 500mg"
                value={strength}
                onChangeText={setStrength}
              />
            </View>

            {renderDropdown(
              'Dosage Form',
              dosageForm,
              dosageForms.map(String),
              handleDosageFormSelect
            )}
          </View>

          {/* Schedule Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>

            {renderDropdown(
              'Frequency',
              frequency,
              frequencies.map(String),
              handleFrequencySelect
            )}
            {renderDropdown(
              'Meal Relation',
              mealRelation,
              mealRelations.map(String),
              handleMealRelationSelect
            )}

            <View style={styles.dateRow}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Duration (days)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 7"
                  value={durationDays}
                  onChangeText={setDurationDays}
                  onBlur={handleDurationBlur}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* 📅 END DATE DISPLAY */}
            {endDate ? (
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.infoText}>Ends on: {endDate}</Text>
              </View>
            ) : null}
          </View>

          {/* Additional Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prescribed By</Text>
              <TextInput
                style={styles.input}
                placeholder="Doctor's name"
                value={prescribedBy}
                onChangeText={setPrescribedBy}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purpose</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., For fever"
                value={purpose}
                onChangeText={setPurpose}
                autoCapitalize="sentences"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any special instructions..."
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Prescription Image */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prescription Image (Optional)</Text>

            {prescriptionImage ? (
              <View style={styles.imagePreview}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.imageText}>✓ Image selected</Text>
                <TouchableOpacity onPress={() => setPrescriptionImage(null)}>
                  <Text style={styles.removeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.imageButton}
                onPress={handlePickImage}
              >
                <Ionicons
                  name="image-outline"
                  size={24}
                  color={Colors.light.primary}
                />
                <Text style={styles.imageButtonText}>
                  Upload Prescription Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Reminder Toggle */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.reminderToggle}
              onPress={() => setReminderEnabled(!reminderEnabled)}
            >
              <View>
                <Text style={styles.reminderTitle}>Enable Reminders</Text>
                <Text style={styles.reminderSubtitle}>
                  Get notified when it's time to take your medication
                </Text>
              </View>
              <View
                style={[styles.toggle, reminderEnabled && styles.toggleActive]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    reminderEnabled && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Medication</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* AI CAMERA SCAN MODAL */}
      <CameraScanModal
        visible={showCameraScan}
        onClose={() => setShowCameraScan(false)}
        onMedicationExtracted={handleAiScanResult}
      />
    </SafeAreaView>
  );
}

// STYLES (unchanged)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  aiScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aiScanButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  aiScanSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  dropdownContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dropdownOptionSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dropdownText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  dropdownTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  infoText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    gap: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.success,
  },
  imageText: {
    fontSize: 14,
    color: Colors.light.success,
    fontWeight: '600',
  },
  removeImageText: {
    fontSize: 14,
    color: Colors.light.error,
    fontWeight: '600',
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  reminderSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.border,
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: Colors.light.success,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
