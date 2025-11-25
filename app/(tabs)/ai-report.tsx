// app/(tabs)/ai-report.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  UIManager,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getAllLabReports, saveAIAnalysisToReport } from '../../services/labReportService';
import { analyzeLabReportWithAI } from '../../services/reportAnalysisAIService';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { LabReport } from '../../types/upload';
import {
  generatePDFReport,
  generateDOCXReport,
  generateCSVReport,
  shareExportedFile,
  downloadFile,
} from '../../services/reportExportService';
import * as FileSystem from 'expo-file-system';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AIReportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  
  // Modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [exportedFilePath, setExportedFilePath] = useState<string>('');
  const [exportedFormat, setExportedFormat] = useState<string>('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const data = await getAllLabReports(user.uid);
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  }, []);

  const toggleExpand = (reportId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  /**
   * Analyze report with AI on-demand
   */
  const analyzeReport = async (report: LabReport) => {
    if (!user?.uid) return;

    setAnalyzingId(report.reportId);
    
    try {
      // Call AI analysis service
      const analysis = await analyzeLabReportWithAI(report);
      
      // Save analysis to Firestore
      await saveAIAnalysisToReport(user.uid, report.reportId, analysis);
      
      // Update local state with complete analysis object including analyzedAt
      setReports(prevReports => 
        prevReports.map(r => 
          r.reportId === report.reportId 
            ? {
                ...r,
                aiInterpretation: {
                  summary: analysis.summary,
                  keyFindings: analysis.keyFindings,
                  recommendations: analysis.recommendations,
                  riskLevel: analysis.riskLevel,
                  abnormalTests: analysis.abnormalTests,
                  analyzedAt: analysis.analyzedAt,
                  confidence: analysis.confidence,
                },
                status: 'analyzed',
              }
            : r
        )
      );

      // Auto-expand to show analysis
      setExpandedIds(prev => {
        const newSet = new Set(prev);
        newSet.add(report.reportId);
        return newSet;
      });

      Alert.alert('Success', 'AI analysis completed!');
    } catch (error: any) {
      console.error('Error analyzing report:', error);
      Alert.alert('Analysis Failed', error.message || 'Failed to analyze report. Please try again.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const exportSingleReport = async (report: LabReport, format: 'pdf' | 'docx' | 'csv') => {
    setExportingId(report.reportId);
    setShowExportModal(false);
    
    try {
      let filePath: string;
      
      if (format === 'pdf') {
        filePath = await generatePDFReport([report]);
      } else if (format === 'docx') {
        filePath = await generateDOCXReport([report]);
      } else {
        filePath = await generateCSVReport([report]);
      }

      setExportedFilePath(filePath);
      setExportedFormat(format.toUpperCase());
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error exporting report:', error);
      Alert.alert('Error', error.message || 'Failed to export report.');
    } finally {
      setExportingId(null);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadFile(exportedFilePath);
      setShowSuccessModal(false);
      
      // Show success and offer to share
      Alert.alert(
        'Download Complete',
        `Report saved successfully as ${exportedFormat}. Would you like to share it?`,
        [
          {
            text: 'Done',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save file.');
    }
  };

  const handleShare = async () => {
    try {
      setShowSuccessModal(false);
      await shareExportedFile(exportedFilePath);
    } catch (error) {
      Alert.alert('Error', 'Failed to share file.');
    }
  };

  const showExportOptions = (report: LabReport) => {
    setSelectedReport(report);
    setShowExportModal(true);
  };

  const renderReportCard = ({ item }: { item: LabReport }) => {
    const isExpanded = expandedIds.has(item.reportId);
    const isExporting = exportingId === item.reportId;
    const isAnalyzing = analyzingId === item.reportId;
    const reportDate = item.uploadDate instanceof Date
      ? item.uploadDate.toLocaleDateString()
      : new Date(item.uploadDate as any).toLocaleDateString();

    const hasAIAnalysis = item.aiInterpretation && item.aiInterpretation.summary;

    return (
      <View style={styles.reportCard}>
        {/* Report Header */}
        <View style={styles.reportHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={28} color={Colors.light.primary} />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle} numberOfLines={2}>
              {item.labName || 'Medical Report'}
            </Text>
            <Text style={styles.reportDate}>{item.testDate || reportDate}</Text>
            <View style={styles.reportMeta}>
              <Text style={styles.metaText}>
                {item.testResults?.length || 0} tests
              </Text>
              <View style={styles.metaDivider} />
              <Text style={[styles.metaText, hasAIAnalysis ? styles.analyzedText : styles.pendingTextMeta]}>
                {hasAIAnalysis ? 'Analyzed' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        {/* AI Analyze Button - Show if has analysis */}
        {hasAIAnalysis && (
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => toggleExpand(item.reportId)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="sparkles"
              size={16}
              color={Colors.light.primary}
              style={styles.aiButtonIcon}
            />
            <Text style={styles.aiButtonText}>
              {isExpanded ? 'Hide AI Summary' : 'Show AI Summary'}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={Colors.light.primary}
            />
          </TouchableOpacity>
        )}

        {/* Analyze Button - Show if NO analysis */}
        {!hasAIAnalysis && (
          <TouchableOpacity
            style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
            onPress={() => analyzeReport(item)}
            disabled={isAnalyzing}
            activeOpacity={0.7}
          >
            {isAnalyzing ? (
              <>
                <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                <Text style={styles.analyzeButtonText}>Analyzing...</Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color="white" style={styles.aiButtonIcon} />
                <Text style={styles.analyzeButtonText}>Get AI Analysis</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Expanded AI Summary */}
        {isExpanded && hasAIAnalysis && item.aiInterpretation && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <Ionicons name="analytics" size={18} color={Colors.light.primary} />
              <Text style={styles.summaryHeaderText}>AI Analysis</Text>
            </View>

            {/* Overall Status */}
            {item.aiInterpretation.riskLevel && (
              <View
                style={[
                  styles.statusBadge,
                  item.aiInterpretation.riskLevel === 'low' && styles.statusLow,
                  item.aiInterpretation.riskLevel === 'moderate' && styles.statusModerate,
                  item.aiInterpretation.riskLevel === 'high' && styles.statusHigh,
                ]}
              >
                <Text style={styles.statusText}>
                  Overall Status: {item.aiInterpretation.riskLevel.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Summary Text */}
            <Text style={styles.summaryText}>
              {item.aiInterpretation.summary}
            </Text>

            {/* Key Findings */}
            {item.aiInterpretation.keyFindings && item.aiInterpretation.keyFindings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Findings:</Text>
                {item.aiInterpretation.keyFindings.map((finding, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{finding}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendations */}
            {item.aiInterpretation.recommendations && item.aiInterpretation.recommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recommendations:</Text>
                {item.aiInterpretation.recommendations.map((rec, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Export Button for Individual Report */}
            <TouchableOpacity
              style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
              onPress={() => showExportOptions(item)}
              disabled={isExporting}
              activeOpacity={0.7}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={18} color="white" />
                  <Text style={styles.exportButtonText}>Export This Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
    <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Report Analysis</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Report Analysis</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Reports List */}
      <FlatList
        data={reports}
        renderItem={renderReportCard}
        keyExtractor={(item) => item.reportId}
        contentContainerStyle={[
          styles.listContent,
          reports.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={Colors.light.textLight} />
            <Text style={styles.emptyTitle}>No Reports Found</Text>
            <Text style={styles.emptyText}>Upload your medical reports to get AI analysis</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Export Format Selection Modal */}
      <Modal
        visible={showExportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Export Report</Text>
            <Text style={styles.modalSubtitle}>Choose export format</Text>

            {/* Export Format Buttons */}
            <View style={styles.exportOptionsContainer}>
              <TouchableOpacity
                style={styles.exportOptionButton}
                onPress={() => selectedReport && exportSingleReport(selectedReport, 'pdf')}
                activeOpacity={0.7}
              >
                <Ionicons name="document-text" size={32} color={Colors.light.primary} />
                <Text style={styles.exportOptionText}>PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportOptionButton}
                onPress={() => selectedReport && exportSingleReport(selectedReport, 'docx')}
                activeOpacity={0.7}
              >
                <Ionicons name="document" size={32} color={Colors.light.primary} />
                <Text style={styles.exportOptionText}>DOCX</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportOptionButton}
                onPress={() => selectedReport && exportSingleReport(selectedReport, 'csv')}
                activeOpacity={0.7}
              >
                <Ionicons name="grid" size={32} color={Colors.light.primary} />
                <Text style={styles.exportOptionText}>CSV</Text>
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowExportModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Export Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.light.success} />
            </View>
            
            <Text style={styles.modalTitle}>Export Successful</Text>
            <Text style={styles.modalSubtitle}>
              Report exported as {exportedFormat}
            </Text>

            {/* Action Buttons */}
            <View style={styles.successActionsContainer}>
              <TouchableOpacity
                style={styles.successActionButton}
                onPress={handleDownload}
                activeOpacity={0.7}
              >
                <Ionicons name="download-outline" size={24} color="white" />
                <Text style={styles.successActionText}>Download</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.successActionButton}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Ionicons name="share-outline" size={24} color="white" />
                <Text style={styles.successActionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Updated styles section for ai-report.tsx
// Replace your existing styles object with this:

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
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // ✅ CORRECT: Matches Home and Health Library screens
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.textLight,
    marginHorizontal: 6,
  },
  analyzedText: {
    color: Colors.light.success,
  },
  pendingTextMeta: {
    color: Colors.light.textLight,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.light.primary + '20',
  },
  aiButtonIcon: {
    marginRight: 6,
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
    marginRight: 6,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  summaryContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginLeft: 8,
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  statusLow: {
    backgroundColor: Colors.light.success + '15',
  },
  statusModerate: {
    backgroundColor: Colors.light.warning + '15',
  },
  statusHigh: {
    backgroundColor: Colors.light.error + '15',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.text,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.textSecondary,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  exportOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  exportOptionButton: {
    flex: 1,
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.primary + '20',
  },
  exportOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
    marginTop: 8,
  },
  modalCancelButton: {
    backgroundColor: Colors.light.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  successActionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  successActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});