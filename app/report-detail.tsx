// app/report-detail.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getConfidenceColor } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { getLabReport, updateLabReport, deleteLabReport } from '../services/labReportService';
import { LabReport, TestResult } from '../types/upload';

export default function ReportDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [report, setReport] = useState<LabReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    tests: true,
    insights: true,
    recommendations: true,
  });

  useEffect(() => {
    if (id && user?.uid) {
      loadReport();
    }
  }, [id, user]);

  const loadReport = async () => {
    if (!user?.uid || !id) return;
    
    try {
      setLoading(true);
      const data = await getLabReport(user.uid, id as string);
      setReport(data);
    } catch (error) {
      console.error('Error loading report:', error);
      Alert.alert('Error', 'Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user?.uid || !report) return;
    
    try {
      await updateLabReport(user.uid, report.reportId, {
        isFavorite: !report.isFavorite,
      });
      setReport({ ...report, isFavorite: !report.isFavorite });
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid || !report) return;
            try {
              await deleteLabReport(user.uid, report.reportId);
              Alert.alert('Success', 'Report deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting report:', error);
              Alert.alert('Error', 'Failed to delete report');
            }
          },
        },
      ]
    );
  };

  const openFile = async (fileURL: string) => {
    try {
      const supported = await Linking.canOpenURL(fileURL);
      if (supported) {
        await Linking.openURL(fileURL);
      } else {
        Alert.alert('Error', 'Cannot open this file');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown date';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    if (status === 'normal') return Colors.light.success;
    if (status === 'abnormal') return Colors.light.warning;
    if (status === 'critical') return Colors.light.error;
    return Colors.light.textSecondary;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderTestResult = (test: TestResult, index: number) => (
    <View key={index} style={styles.testCard}>
      <View style={styles.testHeader}>
        <Text style={styles.testName}>{test.testName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(test.status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(test.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(test.status) }]}>
            {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.testValues}>
        <View style={styles.valueRow}>
          <Text style={styles.valueLabel}>Result:</Text>
          <Text style={styles.valueText}>
            {test.value} {test.unit}
          </Text>
        </View>
        {test.normalRange && (
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Normal Range:</Text>
            <Text style={styles.normalRangeText}>{test.normalRange}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderAIInsights = () => {
    if (!report?.aiInterpretation) return null;

    const { summary, keyFindings, recommendations, riskLevel } = report.aiInterpretation;

    return (
      <>
        {/* AI Summary */}
        {summary && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection('insights')}
            >
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="sparkles" size={20} color={Colors.light.upload.analyzing} />
                <Text style={styles.sectionTitle}>AI Health Insights</Text>
              </View>
              <Ionicons 
                name={expandedSections.insights ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={Colors.light.textSecondary} 
              />
            </TouchableOpacity>
            
            {expandedSections.insights && (
              <View style={styles.sectionContent}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryText}>{summary}</Text>
                </View>

                {riskLevel && (
                  <View style={styles.riskLevelCard}>
                    <Text style={styles.riskLabel}>Risk Level</Text>
                    <View style={[
                      styles.riskBadge,
                      { backgroundColor: riskLevel === 'low' ? Colors.light.success + '20' :
                                        riskLevel === 'moderate' ? Colors.light.warning + '20' :
                                        Colors.light.error + '20' }
                    ]}>
                      <Ionicons 
                        name={riskLevel === 'low' ? 'shield-checkmark' : 
                              riskLevel === 'moderate' ? 'warning' : 'alert-circle'} 
                        size={18}
                        color={riskLevel === 'low' ? Colors.light.success :
                               riskLevel === 'moderate' ? Colors.light.warning :
                               Colors.light.error}
                      />
                      <Text style={[
                        styles.riskText,
                        { color: riskLevel === 'low' ? Colors.light.success :
                                 riskLevel === 'moderate' ? Colors.light.warning :
                                 Colors.light.error }
                      ]}>
                        {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Key Findings */}
        {keyFindings && keyFindings.length > 0 && expandedSections.insights && (
          <View style={styles.findingsContainer}>
            <Text style={styles.subsectionTitle}>Key Findings</Text>
            {keyFindings.map((finding, index) => (
              <View key={index} style={styles.findingItem}>
                <Ionicons name="checkbox" size={18} color={Colors.light.primary} />
                <Text style={styles.findingText}>{finding}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection('recommendations')}
            >
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="bulb" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Recommendations</Text>
              </View>
              <Ionicons 
                name={expandedSections.recommendations ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={Colors.light.textSecondary} 
              />
            </TouchableOpacity>
            
            {expandedSections.recommendations && (
              <View style={styles.sectionContent}>
                {recommendations.map((recommendation, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <View style={styles.recommendationNumber}>
                      <Text style={styles.recommendationNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.recommendationText}>{recommendation}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </>
    );
  };

  if (loading) {
    return (
    <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
    <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color={Colors.light.error} />
          <Text style={styles.errorTitle}>Report Not Found</Text>
          <Text style={styles.errorText}>This report may have been deleted or does not exist.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleFavorite} style={styles.headerButton}>
            <Ionicons 
              name={report.isFavorite ? 'star' : 'star-outline'} 
              size={24} 
              color={report.isFavorite ? Colors.light.warning : Colors.light.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={24} color={Colors.light.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Report Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="flask" size={28} color={Colors.light.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.labName}>{report.labName}</Text>
              <Text style={styles.testDate}>{formatDate(report.testDate)}</Text>
              {report.doctorName && (
                <View style={styles.doctorRow}>
                  <Ionicons name="person-outline" size={14} color={Colors.light.textSecondary} />
                  <Text style={styles.doctorName}>Dr. {report.doctorName}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Files */}
          {report.files.length > 0 && (
            <View style={styles.filesSection}>
              <Text style={styles.filesSectionTitle}>Attached Files</Text>
              {report.files.map((file, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.fileItem}
                  onPress={() => openFile(file.fileURL)}
                >
                  <Ionicons 
                    name={file.fileType === 'pdf' ? 'document' : 'image'} 
                    size={20} 
                    color={Colors.light.primary} 
                  />
                  <Text style={styles.fileName} numberOfLines={1}>{file.fileName}</Text>
                  <Ionicons name="open-outline" size={18} color={Colors.light.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Tags */}
          {report.tags.length > 0 && (
            <View style={styles.tagsSection}>
              {report.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Test Results */}
        {report.testResults.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection('tests')}
            >
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="clipboard" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>
                  Test Results ({report.testResults.length})
                </Text>
              </View>
              <Ionicons 
                name={expandedSections.tests ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={Colors.light.textSecondary} 
              />
            </TouchableOpacity>
            
            {expandedSections.tests && (
              <View style={styles.sectionContent}>
                {report.testResults.map((test, index) => renderTestResult(test, index))}
              </View>
            )}
          </View>
        )}

        {/* AI Insights */}
        {renderAIInsights()}

        {/* Notes */}
        {report.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{report.notes}</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerButton: {
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  labName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  testDate: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doctorName: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  filesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  filesSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  tag: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  section: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  testCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  testName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  testValues: {
    gap: 6,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  normalRangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  summaryCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.text,
  },
  riskLevelCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
  },
  riskLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  riskText: {
    fontSize: 14,
    fontWeight: '700',
  },
  findingsContainer: {
    marginTop: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  findingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
  },
  findingText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.text,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.background,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
  },
  recommendationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.text,
  },
  notesCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
