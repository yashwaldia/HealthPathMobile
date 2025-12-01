// components/radiology/RadiologyScanCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { RadiologyAnalysis } from '../../types/radiology';

type ScanCardProps = {
  analysis: RadiologyAnalysis;
  onOpen: (analysis: RadiologyAnalysis) => void;
  onDelete: (analysisId: string) => void;
  onExport: (analysis: RadiologyAnalysis) => void;
};

export function RadiologyScanCard({
  analysis,
  onOpen,
  onDelete,
  onExport,
}: ScanCardProps) {
  const formatDate = (date: any) => {
    if (!date) return 'Unknown date';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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

  return (
    <TouchableOpacity
      style={styles.analysisCard}
      activeOpacity={0.9}
      onPress={() => onOpen(analysis)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIconContainer}>
          <Ionicons
            name={getExamIcon(analysis.examType)}
            size={24}
            color={Colors.light.primary}
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.examType}>{analysis.examType}</Text>
          <Text style={styles.bodyPart}>{analysis.bodyPart || 'Unknown area'}</Text>
          <Text style={styles.scanDate}>{formatDate(analysis.uploadDate)}</Text>
        </View>
        <View style={styles.cardActionsRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onDelete(analysis.analysisId)}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onExport(analysis)}
          >
            <Ionicons name="share-outline" size={20} color={Colors.light.primary} />
          </TouchableOpacity>
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
            {analysis.keyFindings.length} finding
            {analysis.keyFindings.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  cardActionsRight: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  iconButton: {
    padding: 4,
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
});
