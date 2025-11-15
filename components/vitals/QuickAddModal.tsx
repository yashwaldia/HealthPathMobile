import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { VitalRecord } from '../../types/vitals';

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<VitalRecord>) => Promise<void>;
  currentVitals?: Partial<VitalRecord>;
}

export default function QuickAddModal({ 
  visible, 
  onClose, 
  onSave,
  currentVitals = {},
}: QuickAddModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
    bloodSugarFasting: '',
    weightKg: '',
    notes: '',
  });

  // --- ANIMATION VALUES ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Track if we've already initialized for this modal session
  const modalSessionId = useRef(0);
  const initializedSessionId = useRef(-1);

  // Create a stable reference to currentVitals to prevent unnecessary re-renders
  const stableCurrentVitals = useMemo(() => currentVitals, [
    currentVitals?.bloodPressureSystolic,
    currentVitals?.bloodPressureDiastolic,
    currentVitals?.heartRate,
    currentVitals?.temperature,
    currentVitals?.oxygenSaturation,
    currentVitals?.bloodSugarFasting,
    currentVitals?.weightKg,
    currentVitals?.notes,
  ]);

  // Initialize form data and trigger animation when modal opens
  useEffect(() => {
    if (visible) {
      // Reset and start animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Increment session ID when modal opens
      if (initializedSessionId.current !== modalSessionId.current) {
        modalSessionId.current += 1;
        
        // Initialize form with current vitals
        setFormData({
          bloodPressureSystolic: stableCurrentVitals?.bloodPressureSystolic?.toString() || '',
          bloodPressureDiastolic: stableCurrentVitals?.bloodPressureDiastolic?.toString() || '',
          heartRate: stableCurrentVitals?.heartRate?.toString() || '',
          temperature: stableCurrentVitals?.temperature?.toString() || '',
          oxygenSaturation: stableCurrentVitals?.oxygenSaturation?.toString() || '',
          bloodSugarFasting: stableCurrentVitals?.bloodSugarFasting?.toString() || '',
          weightKg: stableCurrentVitals?.weightKg?.toString() || '',
          notes: stableCurrentVitals?.notes || '',
        });
        
        initializedSessionId.current = modalSessionId.current;
      }
    } else {
      // Reset session tracking when modal closes
      initializedSessionId.current = -1;
    }
  }, [visible]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const hasValue = Object.values(formData).some(val => val.trim() !== '');
    if (!hasValue) {
      Alert.alert('Error', 'Please enter at least one vital sign.');
      return false;
    }

    const numericFields = [
      'bloodPressureSystolic',
      'bloodPressureDiastolic',
      'heartRate',
      'temperature',
      'oxygenSaturation',
      'bloodSugarFasting',
      'weightKg',
    ];

    for (const field of numericFields) {
      const value = formData[field as keyof typeof formData];
      if (value && isNaN(Number(value))) {
        Alert.alert('Error', `${field.replace(/([A-Z])/g, ' $1')} must be a number.`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const dataToSave: Partial<VitalRecord> = {};

      if (formData.bloodPressureSystolic) {
        dataToSave.bloodPressureSystolic = Number(formData.bloodPressureSystolic);
      }
      if (formData.bloodPressureDiastolic) {
        dataToSave.bloodPressureDiastolic = Number(formData.bloodPressureDiastolic);
      }
      if (formData.heartRate) {
        dataToSave.heartRate = Number(formData.heartRate);
      }
      if (formData.temperature) {
        dataToSave.temperature = Number(formData.temperature);
      }
      if (formData.oxygenSaturation) {
        dataToSave.oxygenSaturation = Number(formData.oxygenSaturation);
      }
      if (formData.bloodSugarFasting) {
        dataToSave.bloodSugarFasting = Number(formData.bloodSugarFasting);
      }
      if (formData.weightKg) {
        dataToSave.weightKg = Number(formData.weightKg);
      }
      if (formData.notes) {
        dataToSave.notes = formData.notes;
      }

      await onSave(dataToSave);

      // Reset form
      setFormData({
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        heartRate: '',
        temperature: '',
        oxygenSaturation: '',
        bloodSugarFasting: '',
        weightKg: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error saving vital:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Add Vital Reading</Text>
              <TouchableOpacity onPress={onClose} disabled={loading}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView 
              style={styles.form} 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionTitle}>Blood Pressure</Text>
              <View style={styles.bpRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.label}>Systolic</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="120"
                      value={formData.bloodPressureSystolic}
                      onChangeText={(text) => handleInputChange('bloodPressureSystolic', text)}
                      keyboardType="number-pad"
                      placeholderTextColor={Colors.light.textSecondary}
                      editable={!loading}
                    />
                    <Text style={styles.unit}>mmHg</Text>
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Diastolic</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="80"
                      value={formData.bloodPressureDiastolic}
                      onChangeText={(text) => handleInputChange('bloodPressureDiastolic', text)}
                      keyboardType="number-pad"
                      placeholderTextColor={Colors.light.textSecondary}
                      editable={!loading}
                    />
                    <Text style={styles.unit}>mmHg</Text>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Heart Rate</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="72"
                    value={formData.heartRate}
                    onChangeText={(text) => handleInputChange('heartRate', text)}
                    keyboardType="number-pad"
                    placeholderTextColor={Colors.light.textSecondary}
                    editable={!loading}
                  />
                  <Text style={styles.unit}>bpm</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Temperature</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="37.0"
                    value={formData.temperature}
                    onChangeText={(text) => handleInputChange('temperature', text)}
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.light.textSecondary}
                    editable={!loading}
                  />
                  <Text style={styles.unit}>°C</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Oxygen Saturation</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="98"
                    value={formData.oxygenSaturation}
                    onChangeText={(text) => handleInputChange('oxygenSaturation', text)}
                    keyboardType="number-pad"
                    placeholderTextColor={Colors.light.textSecondary}
                    editable={!loading}
                  />
                  <Text style={styles.unit}>%</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Blood Sugar (Fasting)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    value={formData.bloodSugarFasting}
                    onChangeText={(text) => handleInputChange('bloodSugarFasting', text)}
                    keyboardType="number-pad"
                    placeholderTextColor={Colors.light.textSecondary}
                    editable={!loading}
                  />
                  <Text style={styles.unit}>mg/dL</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Weight</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="70"
                    value={formData.weightKg}
                    onChangeText={(text) => handleInputChange('weightKg', text)}
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.light.textSecondary}
                    editable={!loading}
                  />
                  <Text style={styles.unit}>kg</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Any additional notes..."
                  value={formData.notes}
                  onChangeText={(text) => handleInputChange('notes', text)}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={Colors.light.textSecondary}
                  editable={!loading}
                />
              </View>
            </ScrollView>

            {/* Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save Reading'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 12,
    marginTop: 8,
  },
  bpRow: {
    flexDirection: 'row',
    marginBottom: 16,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelButtonText: {
    color: Colors.light.text,
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
