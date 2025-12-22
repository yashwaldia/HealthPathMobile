import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { SYMPTOM_CATEGORIES } from '../../constants/symptomData';
import { SymptomLog } from '../../types/symptom';

interface SymptomLogCardProps {
  log: SymptomLog;
  onDelete: (symptomId: string) => void;
  onViewAnalysis?: (log: SymptomLog) => void;
}

export default function SymptomLogCard({ log, onDelete, onViewAnalysis }: SymptomLogCardProps) {
  const logDate = log.timestamp?.toDate
    ? log.timestamp.toDate().toLocaleDateString()
    : new Date(log.date).toLocaleDateString();

  const severityColor =
    log.severity <= 2 ? '#10B981' : log.severity === 3 ? '#FBBF24' : '#EF4444';

  const hasAIAnalysis = log.aiAnalysis && log.aiAnalysis.summary;

  return (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={styles.logInfo}>
          <View style={[styles.categoryIcon, { backgroundColor: `${Colors.light.primary}15` }]}>
            <Ionicons
              name={
                (SYMPTOM_CATEGORIES.find((c) => c.id === log.category)?.icon as any) ||
                'medical-outline'
              }
              size={24}
              color={Colors.light.primary}
            />
          </View>
          <View style={styles.logTextContainer}>
            <Text style={styles.logCategory}>{log.categoryName}</Text>
            <Text style={styles.logDate}>{logDate}</Text>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* View AI Analysis Button (only if AI analysis exists) */}
          {hasAIAnalysis && onViewAnalysis && (
            <TouchableOpacity 
              onPress={() => onViewAnalysis(log)} 
              style={styles.viewButton}
            >
              <Ionicons name="eye-outline" size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          )}
          
          {/* Delete Button */}
          <TouchableOpacity onPress={() => onDelete(log.symptomId)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.symptomsContainer}>
        {log.symptoms.map((symptom, index) => (
          <View key={index} style={styles.symptomTag}>
            <Text style={styles.symptomTagText}>{symptom}</Text>
          </View>
        ))}
      </View>

      <View style={styles.logDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="pulse" size={16} color={severityColor} />
          <Text style={[styles.detailText, { color: severityColor }]}>
            Severity: {log.severity}/5
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.detailText}>
            {log.durationValue} {log.duration}
          </Text>
        </View>
        {hasAIAnalysis && (
          <View style={styles.detailItem}>
            <Ionicons name="sparkles" size={16} color={Colors.light.primary} />
            <Text style={[styles.detailText, { color: Colors.light.primary }]}>
              AI Analyzed
            </Text>
          </View>
        )}
      </View>

      {log.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{log.notes}</Text>
        </View>
      )}

      {hasAIAnalysis && (
        <View style={styles.aiSummaryContainer}>
          <View style={styles.aiSummaryHeader}>
            <Text style={styles.aiSummaryLabel}>AI Analysis Available</Text>
            <Ionicons name="checkmark-circle" size={16} color={Colors.light.primary} />
          </View>
          <Text style={styles.aiSummaryText} numberOfLines={2}>
            {log.aiAnalysis?.summary}
          </Text>
          <Text style={styles.viewMoreText}>Tap the eye icon above to view full analysis</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logCard: {
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
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logTextContainer: {
    flex: 1,
  },
  logCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  logDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewButton: {
    padding: 8,
    backgroundColor: `${Colors.light.primary}10`,
    borderRadius: 8,
  },
  deleteButton: {
    padding: 8,
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  symptomTag: {
    backgroundColor: `${Colors.light.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${Colors.light.primary}30`,
  },
  symptomTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  logDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  aiSummaryContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: `${Colors.light.primary}05`,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${Colors.light.primary}20`,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiSummaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  aiSummaryText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
    marginBottom: 6,
  },
  viewMoreText: {
    fontSize: 11,
    color: Colors.light.primary,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
