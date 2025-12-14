import React, { useState, useEffect, useRef } from 'react';
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
import { UserProfile, ProfileData } from '../../types/profile';
import { profileService } from '../../services/profileService';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: () => void;
}

export default function EditProfileModal({
  visible,
  onClose,
  profile,
  onSave,
}: EditProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPhoneNumber, setFormPhoneNumber] = useState<string>('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible && profile) {
      // Initialize form with current profile data
      setFormData(profile.profile || {});
      setFormEmail(profile.email || '');
      setFormPhoneNumber(profile.phoneNumber || '');

      // Start animations
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
    }
  }, [visible, profile, fadeAnim, slideAnim]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!profile?.uid) return;

    // Optional: simple validation
    const trimmedEmail = formEmail.trim();
    const trimmedPhone = formPhoneNumber.trim();

    if (!trimmedEmail) {
      Alert.alert('Validation', 'Email is required.');
      return;
    }

    setLoading(true);
    try {
      // Use updateProfile so we can update top-level + nested profile together
      await profileService.updateProfile(profile.uid, {
        email: trimmedEmail,
        phoneNumber: trimmedPhone || null,
        profile: formData,
      });

      Alert.alert('Success', 'Profile updated successfully!');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
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
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Edit Profile</Text>
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
              {/* Account Info */}
              <Text style={styles.sectionTitle}>Account Info</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={formEmail}
                  onChangeText={setFormEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={Colors.light.textSecondary}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your mobile number"
                  value={formPhoneNumber}
                  onChangeText={setFormPhoneNumber}
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.light.textSecondary}
                  editable={!loading}
                />
              </View>

              {/* Basic Information */}
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={formData.fullName || ''}
                  onChangeText={(text) => handleInputChange('fullName', text)}
                  placeholderTextColor={Colors.light.textSecondary}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1990-01-01"
                  value={formData.dob || ''}
                  onChangeText={(text) => handleInputChange('dob', text)}
                  placeholderTextColor={Colors.light.textSecondary}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderContainer}>
                  {['Male', 'Female', 'Other', 'Prefer not to say'].map(
                    (gender) => (
                      <TouchableOpacity
                        key={gender}
                        style={[
                          styles.genderButton,
                          formData.gender === gender && styles.genderButtonActive,
                        ]}
                        onPress={() =>
                          handleInputChange('gender', gender as any)
                        }
                        disabled={loading}
                      >
                        <Text
                          style={[
                            styles.genderButtonText,
                            formData.gender === gender &&
                              styles.genderButtonTextActive,
                          ]}
                        >
                          {gender}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.label}>Height (cm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="170"
                    value={formData.height || ''}
                    onChangeText={(text) => handleInputChange('height', text)}
                    keyboardType="number-pad"
                    placeholderTextColor={Colors.light.textSecondary}
                    editable={!loading}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="70"
                    value={formData.weight || ''}
                    onChangeText={(text) => handleInputChange('weight', text)}
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.light.textSecondary}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Medical Information */}
              <Text style={styles.sectionTitle}>Medical Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Blood Group</Text>
                <View style={styles.bloodGroupContainer}>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(
                    (bg) => (
                      <TouchableOpacity
                        key={bg}
                        style={[
                          styles.bloodGroupButton,
                          formData.bloodGroup === bg &&
                            styles.bloodGroupButtonActive,
                        ]}
                        onPress={() =>
                          handleInputChange('bloodGroup', bg as any)
                        }
                        disabled={loading}
                      >
                        <Text
                          style={[
                            styles.bloodGroupButtonText,
                            formData.bloodGroup === bg &&
                              styles.bloodGroupButtonTextActive,
                          ]}
                        >
                          {bg}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Allergies (comma-separated)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g., Peanuts, Penicillin"
                  value={formData.allergies || ''}
                  onChangeText={(text) =>
                    handleInputChange('allergies', text)
                  }
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={Colors.light.textSecondary}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Medical Conditions</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g., Diabetes, Hypertension"
                  value={formData.conditions || ''}
                  onChangeText={(text) =>
                    handleInputChange('conditions', text)
                  }
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={Colors.light.textSecondary}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Medications</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g., Aspirin 100mg daily"
                  value={formData.medications || ''}
                  onChangeText={(text) =>
                    handleInputChange('medications', text)
                  }
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={Colors.light.textSecondary}
                  editable={!loading}
                />
              </View>

              {/* Lifestyle & Habits */}
              <Text style={styles.sectionTitle}>Lifestyle & Habits</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Diet Type</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Vegetarian, Vegan, Non-vegetarian"
                  value={formData.dietType || ''}
                  onChangeText={(text) => handleInputChange('dietType', text)}
                  placeholderTextColor={Colors.light.textSecondary}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sleep Duration</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 7-8 hours"
                  value={formData.sleepDuration || ''}
                  onChangeText={(text) =>
                    handleInputChange('sleepDuration', text)
                  }
                  placeholderTextColor={Colors.light.textSecondary}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Physical Activity Level</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Moderate, Active, Sedentary"
                  value={formData.physicalActivity || ''}
                  onChangeText={(text) =>
                    handleInputChange('physicalActivity', text)
                  }
                  placeholderTextColor={Colors.light.textSecondary}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Exercise Routine</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g., Running 3x week, Gym 5x week"
                  value={formData.exerciseRoutine || ''}
                  onChangeText={(text) =>
                    handleInputChange('exerciseRoutine', text)
                  }
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
                style={[
                  styles.button,
                  styles.saveButton,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save Changes'}
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
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
    marginTop: 16,
  },
  row: {
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
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  genderButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  bloodGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodGroupButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minWidth: 50,
    alignItems: 'center',
  },
  bloodGroupButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  bloodGroupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  bloodGroupButtonTextActive: {
    color: '#FFFFFF',
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
