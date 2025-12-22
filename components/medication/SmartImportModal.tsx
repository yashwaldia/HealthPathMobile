// components/medication/SmartImportModal.tsx
// Two-stage smart import modal: Upload/Text → Review extracted medications
// Last Updated: December 18, 2025

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import {
    extractMedicationsFromImage,
    extractMedicationsFromText,
} from '../../services/geminiMedicationService';
import {
    ExtractedMedication,
    SmartImportInputMode,
    SmartImportStage
} from '../../types/medication';

interface SmartImportModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveAll: (medications: ExtractedMedication[]) => void;
}

const SmartImportModal: React.FC<SmartImportModalProps> = ({
  visible,
  onClose,
  onSaveAll,
}) => {
  const [stage, setStage] = useState<SmartImportStage>('input');
  const [inputMode, setInputMode] = useState<SmartImportInputMode>('upload');
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedMeds, setExtractedMeds] = useState<ExtractedMedication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetModal = () => {
    setStage('input');
    setInputMode('upload');
    setText('');
    setImageUri(null);
    setExtractedMeds([]);
    setIsLoading(false);
    setError('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  /**
   * Pick image from library
   */
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setError('');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  /**
   * Take photo with camera
   */
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera access.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setError('');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  /**
   * Analyze prescription with AI
   */
  const handleAnalyze = async () => {
    if (inputMode === 'upload' && !imageUri) {
      setError('Please upload or take a photo of the prescription');
      return;
    }

    if (inputMode === 'text' && !text.trim()) {
      setError('Please enter prescription details');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let medications: ExtractedMedication[] = [];

      if (inputMode === 'upload' && imageUri) {
        medications = await extractMedicationsFromImage(imageUri);
      } else if (inputMode === 'text') {
        medications = await extractMedicationsFromText(text);
      }

      if (medications.length === 0) {
        setError('AI could not detect any medications. Please try a clearer image or more specific text.');
        return;
      }

      setExtractedMeds(medications);
      setStage('review');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update extracted medication field
   */
  const handleMedChange = (
    index: number,
    field: keyof ExtractedMedication,
    value: string | number
  ) => {
    const updated = [...extractedMeds];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedMeds(updated);
  };

  /**
   * Remove medication from list
   */
  const handleRemoveMed = (index: number) => {
    setExtractedMeds(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Save all reviewed medications
   */
  const handleSave = () => {
    if (extractedMeds.length === 0) {
      Alert.alert('No Medications', 'Please add at least one medication.');
      return;
    }

    onSaveAll(extractedMeds);
    handleClose();
  };

  /**
   * Render Input Stage
   */
  const renderInputStage = () => (
    <View style={styles.stageContainer}>
      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            inputMode === 'upload' && styles.modeButtonActive,
          ]}
          onPress={() => setInputMode('upload')}
        >
          <Ionicons 
            name="image-outline" 
            size={20} 
            color={inputMode === 'upload' ? 'white' : Colors.light.primary} 
          />
          <Text style={[
            styles.modeButtonText,
            inputMode === 'upload' && styles.modeButtonTextActive,
          ]}>
            Upload Prescription
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            inputMode === 'text' && styles.modeButtonActive,
          ]}
          onPress={() => setInputMode('text')}
        >
          <Ionicons 
            name="text-outline" 
            size={20} 
            color={inputMode === 'text' ? 'white' : Colors.light.primary} 
          />
          <Text style={[
            styles.modeButtonText,
            inputMode === 'text' && styles.modeButtonTextActive,
          ]}>
            Paste Text
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input Area */}
      {inputMode === 'upload' ? (
        <View style={styles.uploadContainer}>
          <View style={styles.uploadBox}>
            <Ionicons name="cloud-upload-outline" size={48} color="#9CA3AF" />
            <Text style={styles.uploadText}>
              Upload prescription image or take a photo
            </Text>
            
            <View style={styles.uploadButtons}>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={handlePickImage}
              >
                <Ionicons name="images-outline" size={20} color="white" />
                <Text style={styles.uploadButtonText}>Choose Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera-outline" size={20} color="white" />
                <Text style={styles.uploadButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {imageUri && (
            <View style={styles.selectedFile}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.selectedFileText}>Image selected</Text>
              <TouchableOpacity onPress={() => setImageUri(null)}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.textContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Paracetamol 500mg, 1 tablet thrice a day after food for 7 days..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={8}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );

  /**
   * Render Review Stage
   */
  const renderReviewStage = () => (
    <ScrollView 
      style={styles.reviewContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.reviewTitle}>
        Review Extracted Medications ({extractedMeds.length})
      </Text>

      {extractedMeds.map((med, index) => (
        <View key={index} style={styles.medCard}>
          {/* Delete Button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleRemoveMed(index)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Medication Name *</Text>
            <TextInput
              style={styles.input}
              value={med.name}
              onChangeText={(val) => handleMedChange(index, 'name', val)}
              placeholder="e.g., Paracetamol"
            />
          </View>

          {/* Strength */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Strength</Text>
            <TextInput
              style={styles.input}
              value={med.strength}
              onChangeText={(val) => handleMedChange(index, 'strength', val)}
              placeholder="e.g., 500mg"
            />
          </View>

          {/* Form & Frequency Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Form</Text>
              <TextInput
                style={styles.input}
                value={med.dosageForm}
                onChangeText={(val) => handleMedChange(index, 'dosageForm', val)}
                placeholder="Tablet"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Frequency</Text>
              <TextInput
                style={styles.input}
                value={med.frequency}
                onChangeText={(val) => handleMedChange(index, 'frequency', val)}
                placeholder="Twice a day"
              />
            </View>
          </View>

          {/* Duration & Meal Relation Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Duration</Text>
              <TextInput
                style={styles.input}
                value={med.duration}
                onChangeText={(val) => handleMedChange(index, 'duration', val)}
                placeholder="7 days"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Meal Relation</Text>
              <TextInput
                style={styles.input}
                value={med.mealRelation}
                onChangeText={(val) => handleMedChange(index, 'mealRelation', val)}
                placeholder="After meals"
              />
            </View>
          </View>

          {/* Instructions */}
          {med.instructions && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={med.instructions}
                onChangeText={(val) => handleMedChange(index, 'instructions', val)}
                multiline
                numberOfLines={2}
              />
            </View>
          )}

          {/* Confidence Badge */}
          {med.confidence && med.confidence > 0 && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                AI Confidence: {med.confidence}%
              </Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {stage === 'input' ? '✨ Smart Import' : '📝 Review Medications'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {stage === 'input' ? renderInputStage() : renderReviewStage()}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {stage === 'input' ? (
            <TouchableOpacity
              style={[styles.actionButton, isLoading && styles.disabledButton]}
              onPress={handleAnalyze}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Analyze with AI</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setStage('input')}
              >
                <Ionicons name="arrow-back" size={20} color={Colors.light.primary} />
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSave}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.actionButtonText}>
                  Save All ({extractedMeds.length})
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  stageContainer: {
    flex: 1,
    padding: 20,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    backgroundColor: 'white',
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  modeButtonTextActive: {
    color: 'white',
  },
  uploadContainer: {
    flex: 1,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  selectedFileText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  textContainer: {
    flex: 1,
  },
  textInput: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: 'white',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
  },
  reviewContainer: {
    flex: 1,
    padding: 20,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  medCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.6,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    backgroundColor: 'white',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
});

export default SmartImportModal;
