// app/smart-upload.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

// Components
import { UploadButton } from '../components/upload/UploadButton';
import { FilePreview } from '../components/upload/FilePreview';
import { UploadProgressBar } from '../components/upload/UploadProgressBar';
import { ClassificationCard } from '../components/upload/ClassificationCard';

// Services
import { showFilePickerOptions, PickedFile } from '../services/filePickerService';
import { uploadFileToStorage } from '../services/uploadService';
import { classifyDocument, extractLabResults, generateInterpretation } from '../services/classificationService';
import { saveLabReport } from '../services/labReportService';

// Types
import { UploadProgress, ClassificationResult, UploadedFile } from '../types/upload';

export default function SmartUploadScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [selectedFiles, setSelectedFiles] = useState<PickedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  /**
   * Handle file selection
   */
  const handleSelectFiles = async () => {
    try {
      const files = await showFilePickerOptions(false); // Single file for now
      if (files.length > 0) {
        setSelectedFiles(files);
        setClassification(null);
        setUploadedFiles([]);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  };

  /**
   * Remove selected file
   */
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setClassification(null);
    setUploadedFiles([]);
  };

  /**
   * Upload and analyze file
   */
  const handleUploadAndAnalyze = async () => {
    if (selectedFiles.length === 0 || !user?.uid) return;

    try {
      const file = selectedFiles[0];

      // Step 1: Upload to Firebase Storage
      setUploadProgress({
        status: 'uploading',
        progress: 0,
        message: 'Uploading file...',
        currentFile: file.name,
      });

      const uploadedFile = await uploadFileToStorage(
        file.uri,
        file.name,
        user.uid,
        'lab_reports',
        setUploadProgress
      );

      setUploadedFiles([uploadedFile]);

      // Step 2: AI Classification
      setUploadProgress({
        status: 'analyzing',
        progress: 50,
        message: 'AI is analyzing your document...',
        currentFile: file.name,
      });

      const classificationResult = await classifyDocument(file.uri, file.name);
      setClassification(classificationResult);

      // Step 3: Complete
      setUploadProgress({
        status: 'complete',
        progress: 100,
        message: 'Analysis complete!',
      });

    } catch (error) {
      console.error('Error uploading and analyzing:', error);
      setUploadProgress({
        status: 'error',
        progress: 0,
        message: 'Upload failed',
        error: 'Something went wrong. Please try again.',
      });
    }
  };

  /**
   * Confirm and save to Firestore
   */
  const handleConfirmAndSave = async () => {
    if (!classification || !user?.uid || uploadedFiles.length === 0) return;

    try {
      setUploadProgress({
        status: 'saving',
        progress: 75,
        message: 'Saving to your health records...',
      });

      // Extract structured data for pathology reports
      let testResults = [];
      let aiInterpretation = undefined;

      if (classification.category === 'pathology_report' && classification.extractedText) {
        // Extract lab results
        const labData = await extractLabResults(classification.extractedText);
        testResults = labData.testResults || [];

        // Generate AI interpretation
        aiInterpretation = await generateInterpretation(testResults);
      }

      // Save to Firestore
      const reportId = await saveLabReport(user.uid, {
        testDate: classification.testDate || new Date().toISOString().split('T')[0],
        reportType: classification.category === 'pathology_report' ? 'pathology' : 'other',
        labName: classification.labName || 'Unknown Lab',
        doctorName: classification.doctorName,
        files: uploadedFiles,
        testResults,
        aiInterpretation,
        tags: classification.detectedTests || [],
        notes: classification.reasoning || '',
      });

      setUploadProgress({
        status: 'complete',
        progress: 100,
        message: 'Saved successfully!',
      });

      // Show success message
      Alert.alert(
        'Success!',
        'Your document has been analyzed and saved to your health records.',
        [
          {
            text: 'View Report',
            onPress: () => {
              router.push('/(tabs)');
            },
          },
          {
            text: 'Upload Another',
            onPress: () => {
              setSelectedFiles([]);
              setClassification(null);
              setUploadedFiles([]);
              setUploadProgress({ status: 'idle', progress: 0, message: '' });
            },
          },
        ]
      );

    } catch (error) {
      console.error('Error saving report:', error);
      Alert.alert('Error', 'Failed to save report. Please try again.');
      setUploadProgress({
        status: 'error',
        progress: 0,
        message: 'Save failed',
        error: 'Could not save to database',
      });
    }
  };

  /**
   * Edit classification
   */
  const handleEditClassification = () => {
    Alert.alert(
      'Edit Classification',
      'Classification editing feature coming soon! For now, you can confirm or upload a different file.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Upload</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <View style={styles.descriptionCard}>
          <Ionicons name="sparkles" size={28} color={Colors.light.primary} />
          <Text style={styles.descriptionTitle}>
            AI-Powered Document Analysis
          </Text>
          <Text style={styles.descriptionText}>
            Upload any medical document. Our AI will automatically detect, classify, and route it to the right place.
          </Text>
        </View>

        {/* Upload Button */}
        {selectedFiles.length === 0 && (
          <UploadButton
            onPress={handleSelectFiles}
            loading={uploadProgress.status === 'uploading' || uploadProgress.status === 'analyzing'}
          />
        )}

        {/* File Preview */}
        {selectedFiles.length > 0 && !classification && (
          <>
            <FilePreview
              files={selectedFiles}
              onRemove={handleRemoveFile}
              showRemove={uploadProgress.status !== 'uploading' && uploadProgress.status !== 'analyzing'}
            />

            <TouchableOpacity
              style={[
                styles.analyzeButton,
                (uploadProgress.status === 'uploading' || uploadProgress.status === 'analyzing') && styles.analyzeButtonDisabled
              ]}
              onPress={handleUploadAndAnalyze}
              disabled={uploadProgress.status === 'uploading' || uploadProgress.status === 'analyzing'}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="sparkles" 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.analyzeButtonText}>
                Analyze with AI
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Upload Progress */}
        {uploadProgress.status !== 'idle' && (
          <UploadProgressBar progress={uploadProgress} />
        )}

        {/* Classification Result */}
        {classification && uploadProgress.status === 'complete' && (
          <ClassificationCard
            classification={classification}
            onEdit={handleEditClassification}
            onConfirm={handleConfirmAndSave}
          />
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Supported Documents</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="flask" size={20} color={Colors.light.upload.categories.pathology} />
            <Text style={styles.infoText}>Lab Reports (Blood, Urine, etc.)</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="scan" size={20} color={Colors.light.upload.categories.radiology} />
            <Text style={styles.infoText}>Radiology Scans (X-Ray, CT, MRI)</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="medical" size={20} color={Colors.light.upload.categories.medication} />
            <Text style={styles.infoText}>Prescriptions & Medications</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="pulse" size={20} color={Colors.light.upload.categories.vitals} />
            <Text style={styles.infoText}>Vital Signs Records</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="bandage" size={20} color={Colors.light.upload.categories.vaccination} />
            <Text style={styles.infoText}>Vaccination Cards</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  descriptionCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  analyzeButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 16,
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
  infoSection: {
    marginTop: 32,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
