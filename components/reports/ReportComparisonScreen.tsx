// components/reports/ReportComparisonScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { LabReport } from '../../types/upload';
import { compareMultipleReports, ComparisonResult } from '../../services/reportComparisonAIService';

// Props interface with strict typing
interface ReportComparisonScreenProps {
  reports: LabReport[];
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function ReportComparisonScreen({
  reports,
  onShowToast,
}: ReportComparisonScreenProps) {
  // State management with explicit types
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  // Filter only analyzed reports (for validation)
  const analyzedReports = reports.filter(
    (report) => report.aiInterpretation && report.aiInterpretation.summary
  );

  // Helper: Check if report is analyzed
  const isReportAnalyzed = (report: LabReport): boolean => {
    return !!(report.aiInterpretation && report.aiInterpretation.summary);
  };

  /**
   * Toggle report selection (max 3 reports, min 2 for comparison)
   */
  const toggleReportSelection = (reportId: string) => {
    // Find the report
    const report = reports.find((r) => r.reportId === reportId);

    // Check if report is analyzed before allowing selection
    if (!report || !isReportAnalyzed(report)) {
      onShowToast('Please analyze this report before comparing', 'info');
      return;
    }

    setSelectedReportIds((prev) => {
      if (prev.includes(reportId)) {
        // Deselect
        return prev.filter((id) => id !== reportId);
      } else {
        // Select (max 3)
        if (prev.length >= 3) {
          onShowToast('You can select up to 3 reports only', 'info');
          return prev;
        }
        return [...prev, reportId];
      }
    });

    // Clear previous comparison when selection changes
    setComparisonResult(null);
  };

  /**
   * Handle comparison with AI
   */
  const handleCompare = async () => {
    if (selectedReportIds.length < 2) {
      onShowToast('Please select at least 2 reports to compare', 'info');
      return;
    }

    setLoading(true);
    setComparisonResult(null);

    try {
      console.log('🔄 Starting report comparison...');

      // Get selected report objects
      const selectedReports = analyzedReports.filter((report) =>
        selectedReportIds.includes(report.reportId)
      );

      // Call AI comparison service
      const result = await compareMultipleReports(selectedReports);

      console.log('✅ Comparison complete:', result);
      setComparisonResult(result);
      onShowToast('Comparison complete!', 'success');
    } catch (error: any) {
      console.error('❌ Comparison error:', error);
      onShowToast(
        error?.message || 'Failed to compare reports. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear all selections and results
   */
  const handleReset = () => {
    setSelectedReportIds([]);
    setComparisonResult(null);
  };

  /**
   * Get risk level badge color
   */
  const getRiskLevelColor = (riskLevel: string): string => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return Colors.light.success;
      case 'moderate':
        return Colors.light.warning;
      case 'high':
        return Colors.light.error;
      default:
        return Colors.light.textSecondary;
    }
  };

  /**
   * Render report selection card
   */
  const renderReportCard = (report: LabReport) => {
    const isSelected = selectedReportIds.includes(report.reportId);
    const isAnalyzed = isReportAnalyzed(report);
    const reportDate =
      report.testDate ||
      (report.uploadDate instanceof Date
        ? report.uploadDate.toLocaleDateString()
        : new Date(report.uploadDate as any).toLocaleDateString());

    return (
      <TouchableOpacity
        key={report.reportId}
        style={[
          styles.reportCard,
          isSelected && styles.reportCardSelected,
          !isAnalyzed && styles.reportCardDisabled,
        ]}
        onPress={() => toggleReportSelection(report.reportId)}
        activeOpacity={0.7}
        disabled={!isAnalyzed}
      >
        {/* Selection Indicator */}
        <View
          style={[
            styles.selectionIndicator,
            isSelected && styles.selectionIndicatorActive,
            !isAnalyzed && styles.selectionIndicatorDisabled,
          ]}
        >
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>

        {/* Report Info */}
        <View style={styles.reportCardContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Text
              style={[styles.reportCardTitle, !isAnalyzed && styles.disabledText]}
              numberOfLines={1}
            >
              {report.labName || 'Medical Report'}
            </Text>
            {/* Show "Not Analyzed" badge */}
            {!isAnalyzed && (
              <View style={styles.notAnalyzedBadge}>
                <Text style={styles.notAnalyzedText}>Not Analyzed</Text>
              </View>
            )}
          </View>
          <Text style={[styles.reportCardDate, !isAnalyzed && styles.disabledText]}>
            {reportDate}
          </Text>

          {/* Risk Level Badge - Only for analyzed */}
          {isAnalyzed && report.aiInterpretation?.riskLevel && (
            <View
              style={[
                styles.riskBadge,
                {
                  backgroundColor:
                    getRiskLevelColor(report.aiInterpretation.riskLevel) + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.riskBadgeText,
                  { color: getRiskLevelColor(report.aiInterpretation.riskLevel) },
                ]}
              >
                {report.aiInterpretation.riskLevel.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Selection Count Badge */}
        {isSelected && (
          <View style={styles.selectionBadge}>
            <Text style={styles.selectionBadgeText}>
              {selectedReportIds.indexOf(report.reportId) + 1}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Render comparison table
   */
  const renderComparisonTable = () => {
    if (!comparisonResult) return null;

    const { reports: comparedReports, comparison } = comparisonResult;

    return (
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Ionicons name="git-compare" size={20} color={Colors.light.primary} />
          <Text style={styles.resultTitle}>Comparison Analysis</Text>
        </View>

        {/* Comparison Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={[styles.tableCell, styles.tableCellHeader, styles.firstColumn]}>
              Category
            </Text>
            {comparedReports.map((report, index) => (
              <Text
                key={report.reportId}
                style={[styles.tableCell, styles.tableCellHeader]}
                numberOfLines={2}
              >
                Report {index + 1}
              </Text>
            ))}
          </View>

          {/* Date Row */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.categoryCell, styles.firstColumn]}>
              Test Date
            </Text>
            {comparedReports.map((report) => (
              <Text key={report.reportId} style={styles.tableCell}>
                {report.date || 'N/A'}
              </Text>
            ))}
          </View>

          {/* Risk Level Row */}
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={[styles.tableCell, styles.categoryCell, styles.firstColumn]}>
              Health Status
            </Text>
            {comparedReports.map((report) => (
              <View key={report.reportId} style={styles.tableCellCenter}>
                <View
                  style={[
                    styles.miniRiskBadge,
                    {
                      backgroundColor:
                        getRiskLevelColor(report.riskLevel || 'moderate') + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.miniRiskBadgeText,
                      {
                        color: getRiskLevelColor(report.riskLevel || 'moderate'),
                      },
                    ]}
                  >
                    {(report.riskLevel || 'N/A').toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Number of Tests Row */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.categoryCell, styles.firstColumn]}>
              Tests Conducted
            </Text>
            {comparedReports.map((report) => (
              <Text key={report.reportId} style={styles.tableCell}>
                {report.testsCount || 0} tests
              </Text>
            ))}
          </View>

          {/* Abnormal Tests Row */}
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={[styles.tableCell, styles.categoryCell, styles.firstColumn]}>
              Issues Found
            </Text>
            {comparedReports.map((report) => (
              <Text key={report.reportId} style={styles.tableCell}>
                {report.abnormalCount || 0}
              </Text>
            ))}
          </View>
        </View>

        {/* AI Insights */}
        <View style={styles.insightsBox}>
          <View style={styles.insightsHeader}>
            <Ionicons name="bulb" size={18} color="#9F7AEA" />
            <Text style={styles.insightsTitle}>AI Insights</Text>
          </View>
          <Text style={styles.insightsText}>{comparison.overallTrend}</Text>

          {/* Key Changes */}
          {comparison.keyChanges && comparison.keyChanges.length > 0 && (
            <View style={styles.changesSection}>
              <Text style={styles.changesSectionTitle}>Key Changes:</Text>
              {comparison.keyChanges.map((change, index) => (
                <View key={index} style={styles.changeItem}>
                  <View style={styles.changeBullet} />
                  <Text style={styles.changeText}>{change}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {comparison.recommendations && comparison.recommendations.length > 0 && (
            <View style={styles.changesSection}>
              <Text style={styles.changesSectionTitle}>Recommendations:</Text>
              {comparison.recommendations.map((rec, index) => (
                <View key={index} style={styles.changeItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={Colors.light.success}
                    style={{ marginTop: 2, marginRight: 8 }}
                  />
                  <Text style={styles.changeText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Compare Health Reports</Text>
          <Text style={styles.subtitle}>
            Select 2-3 analyzed reports to see how your health has changed over time
          </Text>
        </View>

        {/* Selection Info */}
        <View style={styles.selectionInfo}>
          <Ionicons name="information-circle" size={18} color={Colors.light.primary} />
          <Text style={styles.selectionInfoText}>
            {selectedReportIds.length === 0
              ? 'Tap on reports to select them'
              : `${selectedReportIds.length} report${selectedReportIds.length > 1 ? 's' : ''} selected`}
          </Text>
        </View>

        {/* Reports List - UPDATED: Show ALL reports */}
        {reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={Colors.light.textLight} />
            <Text style={styles.emptyTitle}>No Reports Found</Text>
            <Text style={styles.emptyText}>Upload your medical reports to get started</Text>
          </View>
        ) : analyzedReports.length < 2 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={Colors.light.textLight} />
            <Text style={styles.emptyTitle}>Need More Analyzed Reports</Text>
            <Text style={styles.emptyText}>
              You need at least 2 analyzed reports to use comparison feature. Analyze pending
              reports first.
            </Text>
          </View>
        ) : (
          <View style={styles.reportsGrid}>
            {reports.map(renderReportCard)}
          </View>
        )}

        {/* Action Buttons */}
        {analyzedReports.length >= 2 && (
          <View style={styles.actionsRow}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
                <Text style={styles.loadingText}>
                  Comparing reports with AI... This may take a moment.
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.compareButton,
                    selectedReportIds.length < 2 && styles.compareButtonDisabled,
                  ]}
                  onPress={handleCompare}
                  disabled={selectedReportIds.length < 2}
                  activeOpacity={0.7}
                >
                  <Ionicons name="git-compare" size={20} color="#fff" />
                  <Text style={styles.compareButtonText}>Compare with AI</Text>
                </TouchableOpacity>

                {(selectedReportIds.length > 0 || comparisonResult) && (
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleReset}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh" size={18} color="#718096" />
                    <Text style={styles.resetButtonText}>Reset</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {/* Comparison Result */}
        {!loading && renderComparisonTable()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '10',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  selectionInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
    flex: 1,
  },
  reportsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reportCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '05',
  },
  reportCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#F7FAFC',
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectionIndicatorActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  selectionIndicatorDisabled: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F7FAFC',
  },
  reportCardContent: {
    flex: 1,
  },
  reportCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  reportCardDate: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 6,
  },
  disabledText: {
    color: '#A0AEC0',
  },
  notAnalyzedBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  notAnalyzedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  riskBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  selectionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  selectionBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  compareButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  compareButtonDisabled: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  compareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resetButtonText: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  emptyContainer: {
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
    color: '#718096',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  table: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableRowEven: {
    backgroundColor: '#F7FAFC',
  },
  tableHeaderRow: {
    backgroundColor: '#EDF2F7',
  },
  tableCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 12,
    color: Colors.light.text,
    textAlign: 'center',
  },
  tableCellHeader: {
    fontWeight: '700',
    fontSize: 11,
    color: '#4A5568',
  },
  tableCellCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  categoryCell: {
    fontWeight: '600',
    textAlign: 'left',
  },
  firstColumn: {
    flex: 1.2,
  },
  miniRiskBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  miniRiskBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  insightsBox: {
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#9F7AEA',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  insightsText: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 20,
    marginBottom: 12,
  },
  changesSection: {
    marginTop: 12,
  },
  changesSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
  },
  changeItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  changeBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9F7AEA',
    marginTop: 6,
    marginRight: 8,
  },
  changeText: {
    flex: 1,
    fontSize: 12,
    color: '#718096',
    lineHeight: 18,
  },
});
