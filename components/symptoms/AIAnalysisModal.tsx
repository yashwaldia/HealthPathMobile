import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { SymptomAIAnalysis } from '../../services/symptomService';

interface AIAnalysisModalProps {
  visible: boolean;
  analysis: SymptomAIAnalysis | null;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}

export default function AIAnalysisModal({
  visible,
  analysis,
  onClose,
  onSave,
  saving,
}: AIAnalysisModalProps) {
  if (!analysis) return null;

  const urgencyConfig = {
    low: { color: '#10B981', icon: 'checkmark-circle', label: 'Low Risk' },
    medium: { color: '#FBBF24', icon: 'alert-circle', label: 'Monitor' },
    high: { color: '#F97316', icon: 'warning', label: 'Seek Care Soon' },
    emergency: { color: '#EF4444', icon: 'medical', label: 'Emergency - Seek Immediate Care' },
  };

  const urgency = urgencyConfig[analysis.urgency];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Symptom Analysis</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentContainer}>
            {/* Urgency Badge */}
            <View style={[styles.urgencyBadge, { backgroundColor: `${urgency.color}15` }]}>
              <Ionicons name={urgency.icon as any} size={24} color={urgency.color} />
              <Text style={[styles.urgencyText, { color: urgency.color }]}>
                {urgency.label}
              </Text>
            </View>

            {/* Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <Text style={styles.summaryText}>{analysis.summary}</Text>
            </View>

            {/* Possible Conditions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Possible Conditions</Text>
              {analysis.possibleConditions.map((condition, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.listText}>{condition}</Text>
                </View>
              ))}
            </View>

            {/* Recommendations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {analysis.recommendations.map((rec, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.light.primary} />
                  <Text style={styles.listText}>{rec}</Text>
                </View>
              ))}
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Ionicons name="information-circle" size={20} color={Colors.light.textSecondary} />
              <Text style={styles.disclaimerText}>{analysis.disclaimer}</Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={onSave}
            disabled={saving}
          >
            {saving ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <>
                <Ionicons name="save" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Analysis</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  urgencyText: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.text,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
    marginTop: 7,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: `${Colors.light.textSecondary}10`,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: Colors.light.primary,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
