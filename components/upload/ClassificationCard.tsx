// components/upload/ClassificationCard.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getCategoryColor, getConfidenceColor } from '../../constants/colors';
import { ClassificationResult, CATEGORY_METADATA } from '../../types/upload';

interface ClassificationCardProps {
  classification: ClassificationResult;
  onEdit?: () => void;
  onConfirm?: () => void;
}

export const ClassificationCard: React.FC<ClassificationCardProps> = ({
  classification,
  onEdit,
  onConfirm,
}) => {
  const categoryMeta = CATEGORY_METADATA[classification.category];
  const categoryColor = getCategoryColor(classification.category);
  const confidenceColor = getConfidenceColor(classification.confidence);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: categoryColor + '20' }]}>
          <Ionicons 
            name={categoryMeta.icon as any} 
            size={24} 
            color={categoryColor} 
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Document Classified</Text>
          <Text style={styles.subtitle}>AI analyzed your document</Text>
        </View>
        <Ionicons name="checkmark-circle" size={28} color={Colors.light.success} />
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Category</Text>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '15' }]}>
          <Ionicons name={categoryMeta.icon as any} size={18} color={categoryColor} />
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {categoryMeta.label}
          </Text>
        </View>
        <Text style={styles.categoryDescription}>
          {categoryMeta.description}
        </Text>
      </View>

      {/* Confidence Score */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Confidence</Text>
        <View style={styles.confidenceRow}>
          <View style={styles.confidenceBar}>
            <View 
              style={[
                styles.confidenceFill, 
                { 
                  width: `${classification.confidence * 100}%`,
                  backgroundColor: confidenceColor,
                }
              ]} 
            />
          </View>
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
            {Math.round(classification.confidence * 100)}%
          </Text>
        </View>
      </View>

      {/* Detected Information */}
      {classification.detectedTests && classification.detectedTests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Detected Tests</Text>
          {classification.detectedTests.map((test, index) => (
            <View key={index} style={styles.detectedItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.light.success} />
              <Text style={styles.detectedText}>{test}</Text>
            </View>
          ))}
        </View>
      )}

      {classification.labName && (
        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.infoText}>Lab: {classification.labName}</Text>
        </View>
      )}

      {classification.testDate && (
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.infoText}>
            Date: {new Date(classification.testDate).toLocaleDateString()}
          </Text>
        </View>
      )}

      {classification.doctorName && (
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.infoText}>Doctor: {classification.doctorName}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {onEdit && (
          <TouchableOpacity
            style={[styles.button, styles.editButton]}
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={Colors.light.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
        {onConfirm && (
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={onConfirm}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>Confirm & Save</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.upload.progressBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 45,
  },
  detectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  detectedText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  editButton: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  confirmButton: {
    backgroundColor: Colors.light.primary,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
