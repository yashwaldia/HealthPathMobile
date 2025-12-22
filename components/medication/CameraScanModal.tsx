// components/medication/CameraScanModal.tsx
// Quick gallery picker + AI extraction (no camera needed)
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
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { extractSingleMedicationFromImage } from '../../services/geminiMedicationService';
import { ExtractedMedication } from '../../types/medication';

interface CameraScanModalProps {
  visible: boolean;
  onClose: () => void;
  onMedicationExtracted: (medication: ExtractedMedication) => void;
}

const CameraScanModal: React.FC<CameraScanModalProps> = ({
  visible,
  onClose,
  onMedicationExtracted,
}) => {
  const [stage, setStage] = useState<'picker' | 'processing' | 'result'>('picker');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [extractedMed, setExtractedMed] = useState<ExtractedMedication | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetModal = () => {
    setStage('picker');
    setCapturedUri(null);
    setExtractedMed(null);
    setIsProcessing(false);
  };

  /**
   * Pick image from gallery
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
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true);
        setCapturedUri(result.assets[0].uri);
        setStage('processing');
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  /**
   * Process image with AI
   */
  const processImage = async (uri: string) => {
    try {
      const medication = await extractSingleMedicationFromImage(uri);
      
      if (!medication) {
        Alert.alert(
          'No Medication Found',
          'Could not detect medication details. Please try a clearer photo.',
          [
            { text: 'Try Again', onPress: () => setStage('picker') },
            { text: 'Cancel', onPress: onClose },
          ]
        );
        setIsProcessing(false);
        return;
      }

      setExtractedMed(medication);
      setStage('result');
    } catch (error: any) {
      console.error('Error processing image:', error);
      Alert.alert(
        'Processing Failed',
        error.message || 'Failed to analyze image. Please try again.',
        [
          { text: 'Try Again', onPress: () => setStage('picker') },
          { text: 'Cancel', onPress: onClose },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Use extracted medication
   */
  const handleUseExtracted = () => {
    if (extractedMed) {
      onMedicationExtracted(extractedMed);
      onClose();
    }
  };

  /**
   * Render picker view
   */
  const renderPickerView = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close-outline" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📸 Quick Scan</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.pickerCard}>
          <Ionicons name="image-outline" size={80} color="#D1D5DB" />
          <Text style={styles.pickerTitle}>Select Prescription Photo</Text>
          <Text style={styles.pickerSubtitle}>
            Choose a photo of medication label or prescription
          </Text>
          
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handlePickImage}
          >
            <Ionicons name="images-outline" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  /**
   * Render processing view
   */
  const renderProcessingView = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close-outline" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⏳ Processing...</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.processingTitle}>✨ Analyzing with AI</Text>
        <Text style={styles.processingText}>
          Extracting medication details...
        </Text>
      </View>
    </View>
  );

  /**
   * Render result view
   */
  const renderResultView = () => {
    if (!extractedMed) return null;

    return (
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-outline" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>✅ Results</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.successTitle}>Medication Detected!</Text>
            <Text style={styles.successSubtitle}>Review the details below</Text>
          </View>

          <View style={styles.resultCard}>
            <ResultRow icon="medical-outline" label="Name" value={extractedMed.name} primary />
            {extractedMed.strength && (
              <ResultRow icon="flask-outline" label="Strength" value={extractedMed.strength} />
            )}
            {extractedMed.dosageForm && (
              <ResultRow icon="clipboard-outline" label="Form" value={extractedMed.dosageForm} />
            )}
            {extractedMed.frequency && (
              <ResultRow icon="time-outline" label="Frequency" value={extractedMed.frequency} />
            )}
            {extractedMed.mealRelation && (
              <ResultRow icon="restaurant-outline" label="Meal Relation" value={extractedMed.mealRelation} />
            )}
            {extractedMed.duration && (
              <ResultRow icon="calendar-outline" label="Duration" value={extractedMed.duration} />
            )}
            
            {extractedMed.confidence && extractedMed.confidence > 0 && (
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>AI Confidence: {extractedMed.confidence}%</Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleUseExtracted}>
              <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Use This Medication</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStage('picker')}>
              <Ionicons name="image-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.secondaryButtonText}>Pick Another Photo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {stage === 'picker' && renderPickerView()}
        {stage === 'processing' && renderProcessingView()}
        {stage === 'result' && renderResultView()}
      </SafeAreaView>
    </Modal>
  );
};

const ResultRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  primary?: boolean;
}> = ({ icon, label, value, primary = false }) => (
  <View style={styles.resultRow}>
    <View style={styles.resultRowHeader}>
      <Ionicons 
        name={icon as any} 
        size={18} 
        color={primary ? Colors.light.primary : '#6B7280'} 
      />
      <Text style={[styles.resultLabel, primary && styles.primaryLabel]}>
        {label}
      </Text>
    </View>
    <Text style={[styles.resultValue, primary && styles.primaryValue]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
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
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  pickerCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  pickerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  processingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  successBanner: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    gap: 16,
  },
  resultRow: {
    gap: 8,
  },
  resultRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  primaryLabel: {
    color: Colors.light.primary,
  },
  resultValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    marginLeft: 26,
  },
  primaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  actionButtons: {
    marginTop: 24,
    gap: 12,
    paddingHorizontal: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
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

export default CameraScanModal;
