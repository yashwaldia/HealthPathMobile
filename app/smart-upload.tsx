// app/smart-upload.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

import { UploadButton } from '../components/upload/UploadButton';
import { FilePreview } from '../components/upload/FilePreview';
import { UploadProgressBar } from '../components/upload/UploadProgressBar';
import { ClassificationCard } from '../components/upload/ClassificationCard';

import { showFilePickerOptions, PickedFile } from '../services/filePickerService';
import { uploadFileToStorage } from '../services/uploadService';
import { classifyDocument, extractLabResults, generateInterpretation } from '../services/classificationService';
import { saveLabReport, checkDuplicateReport } from '../services/labReportService';
import { addMedication } from '../services/medicationService';

import { UploadProgress, ClassificationResult, UploadedFile } from '../types/upload';
import { DosageForm, FrequencyType, MealRelation } from '../types/medication';

export default function SmartUploadScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const [selectedFiles, setSelectedFiles] = useState<PickedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Handle quick capture from Plus button
  useEffect(() => {
    if (params.quickCapture === 'true' && params.fileUri) {
      const quickFile: PickedFile = {
        uri: params.fileUri as string,
        name: params.fileName as string,
        size: parseInt(params.fileSize as string) || 0,
        type: params.fileType as 'image' | 'pdf',
        mimeType: params.fileMimeType as string,
      };
      
      console.log('📸 Quick capture detected, auto-loading file:', quickFile.name);
      setSelectedFiles([quickFile]);
      
      // Auto-trigger upload and analysis after a brief delay
      setTimeout(() => {
        handleUploadAndAnalyze([quickFile]);
      }, 500);
    }
  }, [params.quickCapture]);

  const handleSelectFiles = async () => {
    try {
      const files = await showFilePickerOptions(false);
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

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setClassification(null);
    setUploadedFiles([]);
  };

  const handleUploadAndAnalyze = async (filesToUpload?: PickedFile[]) => {
    const files = filesToUpload || selectedFiles;
    if (files.length === 0 || !user?.uid) return;
    const file = files[0];

    try {
      setUploadProgress({
        status: 'uploading',
        progress: 0,
        message: 'Checking for duplicate...',
        currentFile: file.name,
      });

      const isDuplicate = await checkDuplicateReport(user.uid, file.name);
      if (isDuplicate) {
        setUploadProgress({
          status: 'idle',
          progress: 0,
          message: '',
        });
        Alert.alert(
          'Duplicate File',
          'A report with this file name has already been uploaded. Please upload a different file.',
          [{ text: 'OK' }]
        );
        return;
      }
    } catch (error) {
      setUploadProgress({
        status: 'idle',
        progress: 0,
        message: '',
      });
      Alert.alert('Error', 'Could not verify if file is duplicate. Try again.');
      return;
    }

    try {
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
        (prog) => {
          setUploadProgress({
            status: 'uploading',
            progress: Math.min(50, Math.round((prog.progress / 100) * 50)),
            message: prog.message ?? 'Uploading file...',
            currentFile: file.name,
          });
        }
      );

      setUploadedFiles([uploadedFile]);

      setUploadProgress({
        status: 'analyzing',
        progress: 50,
        message: 'AI is analyzing your document...',
        currentFile: file.name,
      });

      const classificationResult = await classifyDocument(file.uri, file.name);
      console.log('📊 Classification result:', JSON.stringify(classificationResult, null, 2));
      setClassification(classificationResult);

      setUploadProgress({
        status: 'complete',
        progress: 90,
        message: 'Ready to save!',
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

  const mapFrequency = (aiFrequency?: string): FrequencyType => {
    if (!aiFrequency) return 'Once a day';
    const freq = aiFrequency.toLowerCase();
    if (freq.includes('once') || freq.includes('1 time')) return 'Once a day';
    if (freq.includes('twice') || freq.includes('2 time')) return 'Twice a day';
    if (freq.includes('thrice') || freq.includes('three') || freq.includes('3 time')) return 'Thrice a day';
    if (freq.includes('four') || freq.includes('4 time')) return 'Four times a day';
    if (freq.includes('every 4 hour')) return 'Every 4 hours';
    if (freq.includes('every 6 hour')) return 'Every 6 hours';
    if (freq.includes('every 8 hour')) return 'Every 8 hours';
    if (freq.includes('every 12 hour')) return 'Every 12 hours';
    if (freq.includes('needed') || freq.includes('sos')) return 'As needed';
    if (freq.includes('week')) return 'Weekly';
    return 'Once a day';
  };

  const mapDosageForm = (aiForm?: string): DosageForm => {
    if (!aiForm) return 'Tablet';
    const form = aiForm.toLowerCase();
    if (form.includes('tablet')) return 'Tablet';
    if (form.includes('capsule') || form.includes('cap')) return 'Capsule';
    if (form.includes('syrup') || form.includes('liquid')) return 'Syrup';
    if (form.includes('injection') || form.includes('inject')) return 'Injection';
    if (form.includes('cream')) return 'Cream';
    if (form.includes('ointment')) return 'Ointment';
    if (form.includes('drop')) return 'Drops';
    if (form.includes('inhaler')) return 'Inhaler';
    if (form.includes('patch')) return 'Patch';
    return 'Other';
  };

  const mapMealRelation = (aiRelation?: string): MealRelation => {
    if (!aiRelation) return 'After meals';
    const relation = aiRelation.toLowerCase();
    if (relation.includes('before') || relation.includes('pre')) return 'Before meals';
    if (relation.includes('after') || relation.includes('post')) return 'After meals';
    if (relation.includes('with') || relation.includes('during')) return 'With meals';
    if (relation.includes('empty stomach') || relation.includes('empty')) return 'Empty stomach';
    return 'Any time';
  };

  const parseDuration = (duration?: string): number | undefined => {
    if (!duration) return undefined;
    const durationLower = duration.toLowerCase();
    const match = durationLower.match(/(\d+)\s*(day|week|month)/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      if (unit === 'day') return value;
      if (unit === 'week') return value * 7;
      if (unit === 'month') return value * 30;
    }
    return undefined;
  };

  const handleConfirmAndSave = async () => {
    console.log('🚀 Starting handleConfirmAndSave...');
    console.log('Classification:', classification);
    console.log('User ID:', user?.uid);
    console.log('Uploaded files:', uploadedFiles);

    if (!classification || !user?.uid || uploadedFiles.length === 0) {
      console.log('❌ Missing required data for save');
      return;
    }

    try {
      setUploadProgress({
        status: 'saving',
        progress: 75,
        message: 'Saving to your health records...',
      });

      // Check if medications exist
      const extractedMeds = (classification as any).extractedMedications;
      console.log('💊 Extracted medications:', extractedMeds);
      console.log('💊 Medications count:', extractedMeds?.length || 0);

      let medicationsSaved = 0;

      // Save medications if found
      if (Array.isArray(extractedMeds) && extractedMeds.length > 0) {
        console.log('💊 Starting to save', extractedMeds.length, 'medications...');
        
        const medicationPromises = extractedMeds.map(async (med: any, index: number) => {
          try {
            console.log(`💊 Saving medication ${index + 1}/${extractedMeds.length}:`, med.name);
            
            const durationDays = parseDuration(med.duration);
            const startDate = med.startDate || new Date().toISOString().split('T')[0];
            let endDate: string | undefined;
            if (durationDays) {
              const start = new Date(startDate);
              start.setDate(start.getDate() + durationDays);
              endDate = start.toISOString().split('T')[0];
            }

            const medicationData = {
              name: med.name,
              strength: med.strength || 'As prescribed',
              dosageForm: mapDosageForm(med.dosageForm),
              frequency: mapFrequency(med.frequency),
              mealRelation: mapMealRelation(med.mealRelation),
              startDate,
              durationDays,
              endDate,
              prescribedBy: med.prescribedBy || classification.doctorName,
              instructions: med.instructions,
              reminderEnabled: false,
              prescriptionImage: uploadedFiles[0]?.fileURL,
              isActive: true,
            };

            console.log(`💊 Medication data for ${med.name}:`, medicationData);
            await addMedication(user.uid, medicationData);
            console.log(`✅ Successfully saved medication: ${med.name}`);
            return true;
          } catch (error) {
            console.error(`❌ Failed to save medication ${med.name}:`, error);
            return false;
          }
        });

        const results = await Promise.all(medicationPromises);
        medicationsSaved = results.filter(r => r === true).length;
        console.log(`✅ Saved ${medicationsSaved}/${extractedMeds.length} medications`);
      }

      // ALWAYS save lab report (regardless of medications)
      console.log('📄 Saving lab report to Firestore...');
      let testResults = [];
      let aiInterpretation = undefined;
      
      if (classification.category === 'pathology_report' && classification.extractedText) {
        const labData = await extractLabResults(classification.extractedText);
        testResults = labData.testResults || [];
        aiInterpretation = await generateInterpretation(testResults);
      }

      const reportData: any = {
        testDate: classification.testDate || new Date().toISOString().split('T')[0],
        reportType: classification.category === 'pathology_report' ? 'pathology' : 'other',
        labName: classification.labName || 'Unknown Lab',
        doctorName: classification.doctorName,
        files: uploadedFiles,
        testResults,
        tags: classification.detectedTests || [],
        notes: classification.reasoning || '',
      };
      if (aiInterpretation !== undefined) reportData.aiInterpretation = aiInterpretation;

      await saveLabReport(user.uid, reportData);
      console.log('✅ Lab report saved successfully');

      setUploadProgress({
        status: 'complete',
        progress: 100,
        message: 'Saved successfully!',
      });

      // Show success message
      if (medicationsSaved > 0) {
        Alert.alert(
          'Success!',
          `✅ Lab report saved\n💊 ${medicationsSaved} medication${medicationsSaved > 1 ? 's' : ''} added to tracker`,
          [
            { text: 'View Medications', onPress: () => router.push('/(tabs)/medication-tracker') },
            { text: 'View Reports', onPress: () => router.push('/(tabs)') },
            { text: 'Upload Another', onPress: () => {
                setSelectedFiles([]); setClassification(null); setUploadedFiles([]);
                setUploadProgress({ status: 'idle', progress: 0, message: '' });
            }},
          ]
        );
      } else {
        Alert.alert(
          'Success!',
          'Your document has been analyzed and saved to your health records.',
          [
            { text: 'View Report', onPress: () => router.push('/(tabs)') },
            { text: 'Upload Another', onPress: () => {
                setSelectedFiles([]); setClassification(null); setUploadedFiles([]);
                setUploadProgress({ status: 'idle', progress: 0, message: '' });
            }},
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error in handleConfirmAndSave:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
      setUploadProgress({
        status: 'error',
        progress: 0,
        message: 'Save failed',
        error: 'Could not save to database',
      });
    }
  };

  const handleEditClassification = () => {
    Alert.alert(
      'Edit Classification',
      'Classification editing feature coming soon! For now, you can confirm or upload a different file.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        <View style={styles.descriptionCard}>
          <Ionicons name="sparkles" size={28} color={Colors.light.primary} />
          <Text style={styles.descriptionTitle}>
            AI-Powered Document Analysis
          </Text>
          <Text style={styles.descriptionText}>
            Upload any medical document. Our AI will automatically detect, classify, and route it to the right place.
          </Text>
        </View>

        {selectedFiles.length === 0 && (
          <UploadButton
            onPress={handleSelectFiles}
            loading={uploadProgress.status === 'uploading' || uploadProgress.status === 'analyzing'}
          />
        )}

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
              onPress={() => handleUploadAndAnalyze()}
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

        {uploadProgress.status !== 'idle' && (
          <UploadProgressBar progress={uploadProgress} />
        )}

        {classification && uploadProgress.status === 'complete' && (
          <ClassificationCard
            classification={classification}
            onEdit={handleEditClassification}
            onConfirm={handleConfirmAndSave}
          />
        )}

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
