// app/radiology-analyzer.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { 
  analyzeRadiologyScan, 
  saveRadiologyAnalysis, 
  getAllRadiologyAnalyses,
  checkDuplicateRadiologyAnalysis,
  deleteRadiologyAnalysis
} from '../services/radiologyAnalysisService';
import { uploadFileToStorage } from '../services/uploadService';
import { RadiologyAnalysis, RadiologyUploadProgress } from '../types/radiology';
import CustomToast from '../components/ui/CustomToast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import RadiologyAnalysisModal from '../components/radiology/RadiologyAnalysisModal'; // NEW IMPORT

export default function RadiologyAnalyzerScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [analyses, setAnalyses] = useState<RadiologyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<RadiologyUploadProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  // Modal states
  const [selectedAnalysis, setSelectedAnalysis] = useState<RadiologyAnalysis | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ visible: true, message, type });
  };

  // Load analyses
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
    Alert.alert(
      'Upload Radiology Scan',
      'Choose upload method',
      [
        { text: 'Take Photo', onPress: handleCameraUpload },
        { text: 'Choose from Gallery', onPress: handleGalleryUpload },
        { text: 'Upload PDF', onPress: handleDocumentUpload },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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
        await processUpload(result.assets[0].uri, result.assets[0].fileName || 'scan.jpg', 'image');
      }
    } catch (error) {
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
        await processUpload(result.assets[0].uri, result.assets[0].fileName || 'scan.jpg', 'image');
      }
    } catch (error) {
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
    } catch (error) {
      showToast('Failed to pick document', 'error');
    }
  };

  const processUpload = async (uri: string, fileName: string, type: 'image' | 'pdf') => {
    if (!user?.uid) return;

    try {
      // Check duplicate
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

      // Upload to Firebase Storage
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

      // Analyze with AI
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

      // Save to Firestore
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

      // Reload analyses
      await loadAnalyses();

      // Show success message
      showToast('Radiology scan analyzed successfully!', 'success');

      // Reset progress
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

  // Delete handler
  const handleDeleteAnalysis = (analysisId: string) => {
    setDeleteTarget(analysisId);
  };

  const confirmDelete = async () => {
    if (!user?.uid || !deleteTarget) return;

    try {
      await deleteRadiologyAnalysis(user.uid, deleteTarget);
      await loadAnalyses();
      showToast('Analysis deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete analysis', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Format date
  const formatDate = (date: any) => {
    if (!date) return 'Unknown date';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'routine':
        return Colors.light.success;
      case 'follow-up-needed':
        return '#FFA500';
      case 'urgent':
        return Colors.light.error;
      case 'emergency':
        return '#DC2626';
      default:
        return Colors.light.textSecondary;
    }
  };

  // Get exam icon
  const getExamIcon = (examType: string): any => {
    switch (examType) {
      case 'X-Ray':
        return 'body-outline';
      case 'CT Scan':
        return 'scan-outline';
      case 'MRI':
        return 'magnet-outline';
      case 'Ultrasound':
        return 'pulse-outline';
      case 'PET Scan':
        return 'nuclear-outline';
      case 'Mammography':
        return 'medical-outline';
      default:
        return 'medical-outline';
    }
  };

  // Render analysis card
  const renderAnalysisCard = (analysis: RadiologyAnalysis) => (
    <TouchableOpacity
      key={analysis.analysisId}
      style={styles.analysisCard}
      onPress={() => {
        setSelectedAnalysis(analysis);
        setShowAnalysisModal(true);
      }}
      onLongPress={() => handleDeleteAnalysis(analysis.analysisId)}
      delayLongPress={500}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIconContainer}>
          <Ionicons name={getExamIcon(analysis.examType)} size={24} color={Colors.light.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.examType}>{analysis.examType}</Text>
          <Text style={styles.bodyPart}>{analysis.bodyPart || 'Unknown area'}</Text>
          <Text style={styles.scanDate}>{formatDate(analysis.uploadDate)}</Text>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(analysis.urgencyLevel) + '20' }]}>
          <View style={[styles.urgencyDot, { backgroundColor: getUrgencyColor(analysis.urgencyLevel) }]} />
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.summary} numberOfLines={2}>
          {analysis.summary}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.findingsCount}>
          <Ionicons name="list-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.findingsText}>
            {analysis.keyFindings.length} finding{analysis.keyFindings.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="scan-outline" size={80} color={Colors.light.border} />
      <Text style={styles.emptyTitle}>No Radiology Scans Yet</Text>
      <Text style={styles.emptyText}>
        Upload your first radiology scan to get AI-powered educational analysis
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Toast */}
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* Delete Confirm Dialog */}
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

      {/* Analysis Detail Modal */}
      <RadiologyAnalysisModal
        visible={showAnalysisModal}
        analysis={selectedAnalysis}
        onClose={() => setShowAnalysisModal(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Radiology Analyzer</Text>
          <Text style={styles.headerSubtitle}>AI-Powered Scan Analysis</Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>

      {/* Upload Progress */}
      {uploadProgress.status !== 'idle' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressContent}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.progressText}>{uploadProgress.message}</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${uploadProgress.progress}%` }]} />
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Upload Card */}
        <TouchableOpacity
          style={styles.uploadCard}
          onPress={handleUploadChoice}
          disabled={uploadProgress.status !== 'idle'}
        >
          <View style={styles.uploadIconContainer}>
            <Ionicons name="cloud-upload-outline" size={32} color={Colors.light.primary} />
          </View>
          <View style={styles.uploadTextContainer}>
            <Text style={styles.uploadTitle}>Upload Radiology Scan</Text>
            <Text style={styles.uploadSubtitle}>
              X-Ray, CT, MRI, Ultrasound, PET Scan
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.light.textSecondary} />
        </TouchableOpacity>

        {/* Stats */}
        {analyses.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{analyses.length}</Text>
              <Text style={styles.statLabel}>Total Scans</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {analyses.filter(a => a.urgencyLevel === 'routine').length}
              </Text>
              <Text style={styles.statLabel}>Routine</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FFA500' }]}>
                {analyses.filter(a => a.urgencyLevel === 'follow-up-needed').length}
              </Text>
              <Text style={styles.statLabel}>Follow-up</Text>
            </View>
          </View>
        )}

        {/* Analyses List */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 40 }} />
        ) : analyses.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.analysesSection}>
            <Text style={styles.sectionTitle}>Past Scans ({analyses.length})</Text>
            {analyses.map(renderAnalysisCard)}
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
  headerSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  placeholderButton: {
    width: 40,
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
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: Colors.light.primary + '20',
    borderStyle: 'dashed',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uploadTextContainer: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
    marginHorizontal: 8,
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
  analysisCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  examType: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  bodyPart: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  scanDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  urgencyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardBody: {
    marginBottom: 12,
  },
  summary: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  findingsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  findingsText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
