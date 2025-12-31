// app/radiology-analyzer.tsx

import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RadiologyAnalysisModal from '../../components/radiology/RadiologyAnalysisModal';
import { RadiologyEmptyState } from '../../components/radiology/RadiologyEmptyState';
import { RadiologyScanCard } from '../../components/radiology/RadiologyScanCard';
import { RadiologyStatsBar } from '../../components/radiology/RadiologyStatsBar';
import { RadiologyUploadCard } from '../../components/radiology/RadiologyUploadCard';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CustomToast from '../../components/ui/CustomToast';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import {
  analyzeRadiologyScan,
  checkDuplicateRadiologyAnalysis,
  deleteRadiologyAnalysis,
  getAllRadiologyAnalyses,
  saveRadiologyAnalysis,
  toggleFavorite,
} from '../../services/radiologyAnalysisService';
import {
  generateRadiologyPDF,
  shareExportedFile,
} from '../../services/reportExportService';
import { uploadFileToStorage } from '../../services/uploadService';
import { RadiologyAnalysis, RadiologyUploadProgress } from '../../types/radiology';

export default function RadiologyAnalyzerScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [analyses, setAnalyses] = useState<RadiologyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<RadiologyUploadProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const [selectedAnalysis, setSelectedAnalysis] = useState<RadiologyAnalysis | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info'
  ) => {
    setToast({ visible: true, message, type });
  };

  const loadAnalyses = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const data = await getAllRadiologyAnalyses(user.uid);
      setAnalyses(data);
    } catch (error) {
      console.error('Error loading analyses:', error);
      showToast('Failed to load analyses', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalyses();
    setRefreshing(false);
  }, [loadAnalyses]);

  // Upload handlers
  const handleUploadChoice = () => {
    Alert.alert('Upload Radiology Scan', 'Choose upload method', [
      { text: 'Take Photo', onPress: handleCameraUpload },
      { text: 'Choose from Gallery', onPress: handleGalleryUpload },
      { text: 'Upload PDF', onPress: handleDocumentUpload },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleCameraUpload = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showToast('Camera permission is needed', 'warning');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        await processUpload(
          result.assets[0].uri,
          result.assets[0].fileName || 'scan.jpg',
          'image'
        );
      }
    } catch {
      showToast('Failed to access camera', 'error');
    }
  };

  const handleGalleryUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('Photo library permission is needed', 'warning');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        await processUpload(
          result.assets[0].uri,
          result.assets[0].fileName || 'scan.jpg',
          'image'
        );
      }
    } catch {
      showToast('Failed to pick image', 'error');
    }
  };

  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const type = result.assets[0].mimeType?.includes('pdf') ? 'pdf' : 'image';
        await processUpload(result.assets[0].uri, result.assets[0].name, type);
      }
    } catch {
      showToast('Failed to pick document', 'error');
    }
  };

  const processUpload = async (
    uri: string,
    fileName: string,
    type: 'image' | 'pdf'
  ) => {
    if (!user?.uid) return;

    try {
      setUploadProgress({
        status: 'uploading',
        progress: 0,
        message: 'Checking for duplicate...',
        currentFile: fileName,
      });

      const isDuplicate = await checkDuplicateRadiologyAnalysis(user.uid, fileName);
      if (isDuplicate) {
        showToast('This scan has already been uploaded', 'warning');
        setUploadProgress({ status: 'idle', progress: 0, message: '' });
        return;
      }

      setUploadProgress({
        status: 'uploading',
        progress: 10,
        message: 'Uploading scan...',
        currentFile: fileName,
      });

      const uploadedFile = await uploadFileToStorage(
        uri,
        fileName,
        user.uid,
        'radiology_scans',
        (prog) => {
          setUploadProgress({
            status: 'uploading',
            progress: Math.min(40, Math.round((prog.progress / 100) * 40)),
            message: prog.message ?? 'Uploading...',
            currentFile: fileName,
          });
        }
      );

      setUploadProgress({
        status: 'analyzing',
        progress: 50,
        message: 'AI is analyzing your radiology scan...',
        currentFile: fileName,
      });

      const aiAnalysis = await analyzeRadiologyScan(uri, type);

      setUploadProgress({
        status: 'analyzing',
        progress: 80,
        message: 'Saving analysis...',
      });

      const analysisData = {
        fileName: uploadedFile.fileName,
        fileURL: uploadedFile.fileURL,
        fileType: uploadedFile.fileType,
        fileSize: uploadedFile.fileSize,
        mimeType: uploadedFile.mimeType,
        uploadDate: new Date(),
        examType: aiAnalysis.examType,
        bodyPart: aiAnalysis.bodyPart,
        scanDate: new Date().toISOString().split('T')[0],
        summary: aiAnalysis.summary,
        keyFindings: aiAnalysis.keyFindings,
        abnormalities: aiAnalysis.abnormalities || [],
        recommendations: aiAnalysis.recommendations,
        followUpActions: aiAnalysis.followUpActions,
        urgencyLevel: aiAnalysis.urgencyLevel,
        aiModel: 'gemini-2.0-flash-exp',
        confidence: aiAnalysis.confidence,
        analyzedAt: new Date(),
        status: 'analyzed' as const,
      };

      await saveRadiologyAnalysis(user.uid, analysisData);

      setUploadProgress({
        status: 'complete',
        progress: 100,
        message: 'Analysis complete!',
      });

      await loadAnalyses();
      showToast('Radiology scan analyzed successfully!', 'success');

      setTimeout(() => {
        setUploadProgress({ status: 'idle', progress: 0, message: '' });
      }, 2000);
    } catch (error: any) {
      console.error('Upload/analysis error:', error);
      setUploadProgress({
        status: 'error',
        progress: 0,
        message: 'Failed',
        error: error?.message || 'Something went wrong',
      });
      showToast(error?.message || 'Failed to analyze scan', 'error');
    }
  };

  // Delete & export
  const handleDeleteAnalysis = (analysisId: string) => {
    setDeleteTarget(analysisId);
  };

  const confirmDelete = async () => {
    if (!user?.uid || !deleteTarget) return;

    try {
      await deleteRadiologyAnalysis(user.uid, deleteTarget);
      await loadAnalyses();
      showToast('Analysis deleted successfully', 'success');
    } catch {
      showToast('Failed to delete analysis', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleExportAnalysis = async (analysis: RadiologyAnalysis) => {
    try {
      setExporting(true);
      const pdfPath = await generateRadiologyPDF(analysis);
      await shareExportedFile(pdfPath);
    } catch {
      showToast('Failed to export analysis', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (analysisId: string, isFavorite: boolean) => {
    if (!user?.uid) return;

    try {
      await toggleFavorite(user.uid, analysisId, isFavorite);

      // Update local analyses state
      setAnalyses((prevAnalyses) =>
        prevAnalyses.map((analysis) =>
          analysis.analysisId === analysisId
            ? { ...analysis, isFavorite }
            : analysis
        )
      );

      // Update selected analysis if it's the one being toggled
      if (selectedAnalysis?.analysisId === analysisId) {
        setSelectedAnalysis({ ...selectedAnalysis, isFavorite });
      }

      showToast(
        isFavorite ? 'Added to favorites' : 'Removed from favorites',
        'success'
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Failed to update favorite status', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Analysis"
        message="Are you sure you want to delete this radiology analysis? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <RadiologyAnalysisModal
        visible={showAnalysisModal}
        analysis={selectedAnalysis}
        onClose={() => setShowAnalysisModal(false)}
        onToggleFavorite={handleToggleFavorite}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Radiology Analyzer</Text>
        </View>
        <View style={styles.placeholderButton}>
          {exporting && (
            <ActivityIndicator size="small" color={Colors.light.primary} />
          )}
        </View>
      </View>

      {uploadProgress.status !== 'idle' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressContent}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.progressText}>{uploadProgress.message}</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[styles.progressBarFill, { width: `${uploadProgress.progress}%` }]}
            />
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <RadiologyUploadCard
          disabled={uploadProgress.status !== 'idle'}
          onPress={handleUploadChoice}
        />

        <RadiologyStatsBar analyses={analyses} />

        {loading ? (
          <ActivityIndicator
            size="large"
            color={Colors.light.primary}
            style={{ marginTop: 40 }}
          />
        ) : analyses.length === 0 ? (
          <RadiologyEmptyState />
        ) : (
          <View style={styles.analysesSection}>
            <Text style={styles.sectionTitle}>Past Scans ({analyses.length})</Text>
            {analyses.map((a) => (
              <RadiologyScanCard
                key={a.analysisId}
                analysis={a}
                onOpen={(analysis) => {
                  setSelectedAnalysis(analysis);
                  setShowAnalysisModal(true);
                }}
                onDelete={handleDeleteAnalysis}
                onExport={handleExportAnalysis}
              />
            ))}
          </View>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  placeholderButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  progressContainer: {
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  analysesSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
});
