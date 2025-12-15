// components/wellness/SetupModals/EnhancedLMPModal.tsx
// Enhanced setup modal with mother name, LMP date picker OR current week/day input
// Last Updated: December 15, 2025 - Fixed keyboard handling for button layout


import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Alert,
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
  onConfirm: (data: { motherName: string; lmpDate?: string; currentWeek?: number; currentDay?: number }) => void;
  onCancel: () => void;
};


type SetupMode = 'lmp' | 'manual';


export default function EnhancedLMPModal({ visible, onConfirm, onCancel }: Props) {
  const [mode, setMode] = useState<SetupMode>('lmp');
  const [motherName, setMotherName] = useState('');
  
  // ⭐ DATE PICKER STATES
  const [lmpDate, setLmpDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [currentWeek, setCurrentWeek] = useState('');
  const [currentDay, setCurrentDay] = useState('');


  const handleConfirm = () => {
    // Validate mother name (required for both modes)
    if (!motherName || motherName.trim().length === 0) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }


    if (mode === 'lmp') {
      // Validate that date is not in future
      const today = new Date();
      if (lmpDate > today) {
        Alert.alert('Invalid Date', 'LMP date cannot be in the future');
        return;
      }


      // Format date as YYYY-MM-DD
      const formattedDate = lmpDate.toISOString().split('T')[0];
      onConfirm({ motherName: motherName.trim(), lmpDate: formattedDate });
    } else {
      const week = parseInt(currentWeek);
      const day = parseInt(currentDay);
      
      if (isNaN(week) || week < 1 || week > 42) {
        Alert.alert('Invalid Week', 'Please enter a valid week (1-42)');
        return;
      }
      if (isNaN(day) || day < 0 || day > 6) {
        Alert.alert('Invalid Day', 'Please enter a valid day (0-6)');
        return;
      }
      onConfirm({ motherName: motherName.trim(), currentWeek: week, currentDay: day });
    }
  };


  const handleCancel = () => {
    setMotherName('');
    setLmpDate(new Date());
    setCurrentWeek('');
    setCurrentDay('');
    setMode('lmp');
    setShowDatePicker(false);
    onCancel();
  };


  // ⭐ DATE PICKER HANDLERS
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setLmpDate(selectedDate);
    }
  };


  const handleDatePickerDone = () => {
    setShowDatePicker(false);
  };


  // Format date for display
  const formatDateForDisplay = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Setup Mother Care</Text>
              <Text style={styles.modalSubtitle}>
                Let's personalize your pregnancy journey
              </Text>
            </View>


            <ScrollView 
              style={styles.modalBody} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* Mother Name Input */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Your Name</Text>
                <Text style={styles.inputHint}>
                  How should we address you?
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Sarah"
                  placeholderTextColor={Colors.light.textSecondary + '80'}
                  value={motherName}
                  onChangeText={setMotherName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>


              <View style={styles.divider} />


              {/* Mode Selection */}
              <Text style={styles.sectionTitle}>Pregnancy Details</Text>
              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'lmp' && styles.modeButtonActive]}
                  onPress={() => setMode('lmp')}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color={mode === 'lmp' ? Colors.light.primary : Colors.light.textSecondary}
                  />
                  <Text style={[styles.modeButtonText, mode === 'lmp' && styles.modeButtonTextActive]}>
                    LMP Date
                  </Text>
                </TouchableOpacity>


                <TouchableOpacity
                  style={[styles.modeButton, mode === 'manual' && styles.modeButtonActive]}
                  onPress={() => setMode('manual')}
                >
                  <Ionicons
                    name="create-outline"
                    size={24}
                    color={mode === 'manual' ? Colors.light.primary : Colors.light.textSecondary}
                  />
                  <Text style={[styles.modeButtonText, mode === 'manual' && styles.modeButtonTextActive]}>
                    Current Week
                  </Text>
                </TouchableOpacity>
              </View>


              {/* LMP Mode - WITH DATE PICKER */}
              {mode === 'lmp' ? (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Last Menstrual Period (LMP) Date</Text>
                  <Text style={styles.inputHint}>
                    Select the first day of your last period before pregnancy
                  </Text>


                  {/* ⭐ DATE PICKER BUTTON */}
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <View style={styles.datePickerContent}>
                      <Ionicons name="calendar" size={20} color={Colors.light.primary} />
                      <Text style={styles.datePickerText}>
                        {formatDateForDisplay(lmpDate)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={Colors.light.textSecondary} />
                  </TouchableOpacity>


                  {/* ⭐ DATE PICKER COMPONENT */}
                  {showDatePicker && (
                    <>
                      {Platform.OS === 'ios' ? (
                        <View style={styles.iosDatePickerContainer}>
                          <View style={styles.iosDatePickerHeader}>
                            <TouchableOpacity onPress={handleDatePickerDone}>
                              <Text style={styles.datePickerDoneButton}>Done</Text>
                            </TouchableOpacity>
                          </View>
                          <DateTimePicker
                            value={lmpDate}
                            mode="date"
                            display="spinner"
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                            textColor={Colors.light.text}
                          />
                        </View>
                      ) : (
                        <DateTimePicker
                          value={lmpDate}
                          mode="date"
                          display="default"
                          onChange={handleDateChange}
                          maximumDate={new Date()}
                        />
                      )}
                    </>
                  )}


                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={16} color={Colors.light.primary} />
                    <Text style={styles.infoText}>
                      Select a date within the last 9 months
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Current Pregnancy Week & Day</Text>
                  <Text style={styles.inputHint}>
                    Enter your current week and day if you already know (from doctor/ultrasound)
                  </Text>
                  
                  <View style={styles.rowInputs}>
                    <View style={styles.rowInputContainer}>
                      <Text style={styles.rowInputLabel}>Week (1-42)</Text>
                      <TextInput
                        style={styles.rowInput}
                        placeholder="12"
                        placeholderTextColor={Colors.light.textSecondary + '80'}
                        value={currentWeek}
                        onChangeText={setCurrentWeek}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>


                    <View style={styles.rowInputContainer}>
                      <Text style={styles.rowInputLabel}>Day (0-6)</Text>
                      <TextInput
                        style={styles.rowInput}
                        placeholder="4"
                        placeholderTextColor={Colors.light.textSecondary + '80'}
                        value={currentDay}
                        onChangeText={setCurrentDay}
                        keyboardType="number-pad"
                        maxLength={1}
                      />
                    </View>
                  </View>


                  <View style={styles.exampleBox}>
                    <Ionicons name="information-circle" size={16} color={Colors.light.primary} />
                    <Text style={styles.exampleText}>
                      Example: If doctor said "12 weeks and 4 days", enter Week: 12, Day: 4
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>


            {/* Footer - FIXED POSITION */}
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
                <Text style={styles.modalButtonPrimaryText}>Start Journey</Text>
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
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 24,
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
  // ⭐ DATE PICKER STYLES
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
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  rowInputContainer: {
    flex: 1,
  },
  rowInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  rowInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    borderWidth: 2,
    borderColor: Colors.light.border,
    textAlign: 'center',
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
    backgroundColor: Colors.light.cardBackground,
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
