// components/wellness/WeeklyReportModal.tsx
// Modal to display AI-generated weekly reports
// Last Updated: December 10, 2025

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { WeeklyReport } from '../../types/wellness';

type Props = {
  visible: boolean;
  report: WeeklyReport | null;
  onClose: () => void;
};

export default function WeeklyReportModal({ visible, report, onClose }: Props) {
  if (!report) return null;

  const formattedDate = report.generatedAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconBadge}>
                  <Ionicons name="bar-chart" size={24} color={Colors.light.primary} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Weekly Report</Text>
                  <Text style={styles.headerSubtitle}>Week {report.weekNumber}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            {/* Completion rate badge */}
            <View style={styles.completionBadge}>
              <View style={styles.completionCircle}>
                <Text style={styles.completionPercentage}>
                  {report.completionRate}%
                </Text>
              </View>
              <View style={styles.completionText}>
                <Text style={styles.completionLabel}>Overall Completion</Text>
                <Text style={styles.completionDate}>{formattedDate}</Text>
              </View>
            </View>

            {/* Summary section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={Colors.light.primary}
                />
                <Text style={styles.sectionTitle}>Summary</Text>
              </View>
              <Text style={styles.summaryText}>{report.summary}</Text>
            </View>

            {/* Achievements section */}
            {report.achievements.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trophy" size={18} color="#FFD700" />
                  <Text style={styles.sectionTitle}>Achievements</Text>
                </View>
                <View style={styles.listContainer}>
                  {report.achievements.map((achievement, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={styles.achievementDot} />
                      <Text style={styles.listItemText}>{achievement}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Areas to improve section */}
            {report.areasToImprove.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trending-up" size={18} color="#4ECDC4" />
                  <Text style={styles.sectionTitle}>Areas to Improve</Text>
                </View>
                <View style={styles.listContainer}>
                  {report.areasToImprove.map((area, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={styles.improveDot} />
                      <Text style={styles.listItemText}>{area}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* AI Recommendations section */}
            <View style={[styles.section, styles.recommendationsSection]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb" size={18} color="#FFA502" />
                <Text style={styles.sectionTitle}>AI Recommendations</Text>
              </View>
              <Text style={styles.recommendationsText}>
                {report.aiRecommendations}
              </Text>
            </View>

            {/* Footer note */}
            <View style={styles.footer}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.footerText}>
                This report is AI-generated based on your activity. Consult your
                healthcare provider for medical advice.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 16,
  },
  completionCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.primary + '20',
    borderWidth: 4,
    borderColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  completionText: {
    flex: 1,
  },
  completionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  completionDate: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 12,
  },
  listContainer: {
    gap: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  achievementDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    marginTop: 6,
    marginRight: 10,
  },
  improveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ECDC4',
    marginTop: 6,
    marginRight: 10,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },
  recommendationsSection: {
    backgroundColor: '#FFF8E5',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  recommendationsText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textSecondary,
  },
});
