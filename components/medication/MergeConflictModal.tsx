// components/medication/MergeConflictModal.tsx
// AI-powered duplicate detection and merge resolution UI
// Last Updated: December 18, 2025

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { getMedicationComparisonSuggestion } from '../../services/geminiMedicationService';
import { MedicationComparisonResult, MergeConflict } from '../../types/medication';

interface MergeConflictModalProps {
  visible: boolean;
  conflict: MergeConflict | null;
  onClose: () => void;
  onResolve: (decision: 'add_new' | 'merge', keep?: 'existing' | 'new') => void;
}

const MergeConflictModal: React.FC<MergeConflictModalProps> = ({
  visible,
  conflict,
  onClose,
  onResolve,
}) => {
  const [aiSuggestion, setAiSuggestion] = useState<MedicationComparisonResult | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  if (!conflict) return null;

  const { existingMed, newMed } = conflict;

  /**
   * Fetch AI comparison suggestion
   */
  const handleGetAISuggestion = async () => {
    setIsLoadingSuggestion(true);
    try {
      const suggestion = await getMedicationComparisonSuggestion(
        existingMed.name,
        newMed.name || '',
        existingMed.genericName,
        newMed.genericName,
        newMed.classification
      );
      setAiSuggestion(suggestion);
    } catch (error) {
      console.error('Failed to get AI suggestion:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  /**
   * Handle merge decision
   */
  const handleMerge = (keep: 'existing' | 'new') => {
    onResolve('merge', keep);
    setAiSuggestion(null);
  };

  /**
   * Handle add as new
   */
  const handleAddNew = () => {
    onResolve('add_new');
    setAiSuggestion(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={false}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🔍 Duplicate Detected</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Alert Banner */}
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={24} color="#F59E0B" />
            <Text style={styles.alertText}>
              AI detected a similar medication. Both are classified as{' '}
              <Text style={styles.boldText}>{newMed.classification}</Text>.
            </Text>
          </View>

          {/* Comparison Cards */}
          <View style={styles.comparisonContainer}>
            {/* Existing Medication */}
            <View style={styles.medCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="medical" size={20} color="#6B7280" />
                <Text style={styles.cardTitle}>Existing Medication</Text>
              </View>

              <View style={styles.medDetails}>
                <DetailRow label="Name" value={existingMed.name} />
                <DetailRow label="Strength" value={existingMed.strength} />
                <DetailRow label="Schedule" value={existingMed.frequency} />
                <DetailRow 
                  label="Meal" 
                  value={existingMed.mealRelation} 
                />
                {existingMed.genericName && (
                  <DetailRow 
                    label="Generic" 
                    value={existingMed.genericName} 
                    secondary 
                  />
                )}
              </View>
            </View>

            {/* VS Divider */}
            <View style={styles.vsDivider}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            {/* New Medication */}
            <View style={[styles.medCard, styles.newMedCard]}>
              <View style={styles.cardHeader}>
                <Ionicons name="add-circle" size={20} color="#10B981" />
                <Text style={styles.cardTitle}>New from Import</Text>
              </View>

              <View style={styles.medDetails}>
                <DetailRow label="Name" value={newMed.name || 'N/A'} />
                <DetailRow label="Strength" value={newMed.strength || 'N/A'} />
                <DetailRow label="Schedule" value={newMed.frequency || 'N/A'} />
                <DetailRow 
                  label="Meal" 
                  value={newMed.mealRelation || 'N/A'} 
                />
                {newMed.genericName && (
                  <DetailRow 
                    label="Generic" 
                    value={newMed.genericName} 
                    secondary 
                  />
                )}
                {newMed.confidence && newMed.confidence > 0 && (
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      AI Confidence: {newMed.confidence}%
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* AI Suggestion Section */}
          <View style={styles.aiSection}>
            {!aiSuggestion && !isLoadingSuggestion && (
              <TouchableOpacity
                style={styles.askAiButton}
                onPress={handleGetAISuggestion}
              >
                <Ionicons name="sparkles" size={20} color={Colors.light.primary} />
                <Text style={styles.askAiText}>Ask AI to Compare</Text>
              </TouchableOpacity>
            )}

            {isLoadingSuggestion && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <Text style={styles.loadingText}>Getting AI suggestion...</Text>
              </View>
            )}

            {aiSuggestion && (
              <View style={styles.suggestionCard}>
                <View style={styles.suggestionHeader}>
                  <Ionicons name="bulb" size={20} color="#F59E0B" />
                  <Text style={styles.suggestionTitle}>AI Suggestion</Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {aiSuggestion.confidence}% confident
                    </Text>
                  </View>
                </View>
                <Text style={styles.suggestionReasoning}>
                  {aiSuggestion.reasoning}
                </Text>
                {aiSuggestion.recommendedAction && (
                  <View style={styles.recommendationBox}>
                    <Text style={styles.recommendationLabel}>Recommendation:</Text>
                    <Text style={styles.recommendationText}>
                      {aiSuggestion.recommendedAction}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Text style={styles.actionsTitle}>Choose an Action:</Text>

            {/* Merge Options */}
            <View style={styles.actionCard}>
              <View style={styles.actionHeader}>
                <Ionicons name="git-merge" size={20} color="#10B981" />
                <Text style={styles.actionTitle}>Merge Medications</Text>
              </View>
              <Text style={styles.actionDescription}>
                Combine both entries. You can choose which details to keep.
              </Text>
              
              <View style={styles.mergeButtons}>
                <TouchableOpacity
                  style={styles.mergeButton}
                  onPress={() => handleMerge('existing')}
                >
                  <Text style={styles.mergeButtonText}>
                    Keep Existing Details
                  </Text>
                  <Text style={styles.mergeButtonSubtext}>
                    Update schedule only
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mergeButton}
                  onPress={() => handleMerge('new')}
                >
                  <Text style={styles.mergeButtonText}>
                    Keep New Details
                  </Text>
                  <Text style={styles.mergeButtonSubtext}>
                    Replace with imported
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Add as New */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleAddNew}
              activeOpacity={0.7}
            >
              <View style={styles.actionHeader}>
                <Ionicons name="add-circle" size={20} color="#3B82F6" />
                <Text style={styles.actionTitle}>Add as Separate Medication</Text>
              </View>
              <Text style={styles.actionDescription}>
                Keep both medications separate in your list.
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

/**
 * Detail Row Component
 */
const DetailRow: React.FC<{
  label: string;
  value: string;
  secondary?: boolean;
}> = ({ label, value, secondary = false }) => (
  <View style={styles.detailRow}>
    <Text style={[styles.detailLabel, secondary && styles.secondaryLabel]}>
      {label}:
    </Text>
    <Text style={[styles.detailValue, secondary && styles.secondaryValue]}>
      {value}
    </Text>
  </View>
);

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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginBottom: 20,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
  },
  comparisonContainer: {
    marginBottom: 24,
  },
  medCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  newMedCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  medDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 80,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  secondaryLabel: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  secondaryValue: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#6B7280',
  },
  vsDivider: {
    alignItems: 'center',
    marginVertical: 8,
  },
  vsText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  aiSection: {
    marginBottom: 24,
  },
  askAiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    backgroundColor: 'white',
  },
  askAiText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  suggestionCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  suggestionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  suggestionReasoning: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationBox: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actionsContainer: {
    gap: 12,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  actionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  mergeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mergeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  mergeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  mergeButtonSubtext: {
    fontSize: 11,
    color: 'white',
    marginTop: 2,
    opacity: 0.9,
  },
});

export default MergeConflictModal;
