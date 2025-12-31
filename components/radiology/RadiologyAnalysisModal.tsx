// components/radiology/RadiologyAnalysisModal.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import {
  RadiologyAnalysis,
  getUrgencyColor,
  getUrgencyIcon,
  getUrgencyLabel
} from '../../types/radiology';

interface RadiologyAnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  analysis: RadiologyAnalysis | null;
  onToggleFavorite?: (analysisId: string, isFavorite: boolean) => void;
}

const { width } = Dimensions.get('window');

export default function RadiologyAnalysisModal({
  visible,
  onClose,
  analysis,
  onToggleFavorite,
}: RadiologyAnalysisModalProps) {
  if (!analysis) return null;

  // Inline markdown parser - parses **bold** text
  const parseMarkdownText = (text: string): ReactNode => {
    const parts: ReactNode[] = [];
    const regex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the bold part
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        parts.push(
          <Text key={`text-${key++}`}>{beforeText}</Text>
        );
      }

      // Add the bold text
      parts.push(
        <Text key={`bold-${key++}`} style={{ fontWeight: '700', color: Colors.light.text }}>
          {match[1]}
        </Text>
      );

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      parts.push(
        <Text key={`text-${key++}`}>{remainingText}</Text>
      );
    }

    return parts.length > 0 ? <Text>{parts}</Text> : <Text>{text}</Text>;
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown date';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleToggleFavorite = () => {
    if (analysis && onToggleFavorite) {
      onToggleFavorite(analysis.analysisId, !analysis.isFavorite);
    }
  };

  // Calculate confidence percentage
  const confidencePercent = Math.round((analysis.confidence || 0) * 100);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={Colors.light.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Analysis Details</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={handleToggleFavorite} style={styles.closeButton}>
                <Ionicons
                  name={analysis.isFavorite ? 'star' : 'star-outline'}
                  size={28}
                  color={analysis.isFavorite ? '#FFD700' : Colors.light.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Scan Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.examTypeRow}>
                <Text style={styles.examType}>{analysis.examType}</Text>
                <View
                  style={[
                    styles.urgencyBadge,
                    { backgroundColor: getUrgencyColor(analysis.urgencyLevel) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getUrgencyIcon(analysis.urgencyLevel) as any}
                    size={16}
                    color={getUrgencyColor(analysis.urgencyLevel)}
                  />
                  <Text
                    style={[
                      styles.urgencyText,
                      { color: getUrgencyColor(analysis.urgencyLevel) },
                    ]}
                  >
                    {getUrgencyLabel(analysis.urgencyLevel)}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="body-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.metaText}>{analysis.bodyPart || 'Not specified'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.metaText}>{formatDate(analysis.uploadDate)}</Text>
                </View>
              </View>

              {analysis.facility && (
                <View style={styles.metaItem}>
                  <Ionicons name="business-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.metaText}>{analysis.facility}</Text>
                </View>
              )}

              {analysis.radiologist && (
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.metaText}>Dr. {analysis.radiologist}</Text>
                </View>
              )}
            </View>

            {/* Summary Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Summary</Text>
              </View>
              <Text style={styles.summaryText}>{parseMarkdownText(analysis.summary)}</Text>
            </View>

            {/* Key Findings */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list-outline" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Key Findings</Text>
              </View>
              {analysis.keyFindings.map((finding, index) => (
                <View key={index} style={styles.findingItem}>
                  <View style={styles.findingBullet} />
                  <Text style={styles.findingText}>{parseMarkdownText(finding)}</Text>
                </View>
              ))}
            </View>

            {/* Abnormalities (if any) */}
            {analysis.abnormalities && analysis.abnormalities.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="warning-outline" size={20} color="#FFA500" />
                  <Text style={[styles.sectionTitle, { color: '#FFA500' }]}>
                    Abnormalities Detected
                  </Text>
                </View>
                {analysis.abnormalities.map((abnormality, index) => (
                  <View key={index} style={styles.abnormalityItem}>
                    <Ionicons name="alert-circle" size={16} color="#FFA500" />
                    <Text style={styles.abnormalityText}>{parseMarkdownText(abnormality)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendations */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb-outline" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Recommendations</Text>
              </View>
              {analysis.recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={styles.recommendationNumber}>
                    <Text style={styles.recommendationNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.recommendationText}>
                    {parseMarkdownText(recommendation)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Follow-up Actions */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="checkbox-outline" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Follow-up Actions</Text>
              </View>
              {analysis.followUpActions.map((action, index) => (
                <View key={index} style={styles.actionItem}>
                  <Ionicons name="arrow-forward" size={16} color={Colors.light.primary} />
                  <Text style={styles.actionText}>{parseMarkdownText(action)}</Text>
                </View>
              ))}
            </View>

            {/* AI Confidence */}
            <View style={styles.confidenceSection}>
              <View style={styles.confidenceHeader}>
                <Ionicons name="analytics-outline" size={18} color={Colors.light.textSecondary} />
                <Text style={styles.confidenceLabel}>AI Confidence Score</Text>
              </View>
              <View style={styles.confidenceBarBackground}>
                <View
                  style={[
                    styles.confidenceBarFill,
                    { width: `${confidencePercent}%` as any },
                  ]}
                />
              </View>
              <Text style={styles.confidenceValue}>
                {confidencePercent}%
              </Text>
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimerCard}>
              <View style={styles.disclaimerHeader}>
                <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
                <Text style={styles.disclaimerTitle}>Important Notice</Text>
              </View>
              <Text style={styles.disclaimerText}>
                This AI analysis is for educational purposes only and should not be considered a
                medical diagnosis. Always consult with a licensed healthcare professional or
                radiologist for proper interpretation and medical advice.
              </Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
    paddingVertical: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerLeft: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  examTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  examType: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  section: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
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
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  findingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  findingBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
    marginTop: 8,
    marginRight: 10,
  },
  findingText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  abnormalityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  abnormalityText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  recommendationNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  confidenceSection: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  confidenceBarBackground: {
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
    textAlign: 'right',
  },
  disclaimerCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 50,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F57C00',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#E65100',
    lineHeight: 20,
  },
});
