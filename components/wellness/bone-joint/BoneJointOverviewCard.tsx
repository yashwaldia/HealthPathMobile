// components/wellness/bone-joint/BoneJointOverviewCard.tsx
// Overview card showing bone and joint health status
// Last Updated: December 11, 2025

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';

interface BoneJointOverviewCardProps {
  mobilityStatus: string;
  statusColor: string;
  statusIcon: string;
  lastCheckupDate?: string;
  painLevel?: number;
  affectedJoints?: string[];
}

export default function BoneJointOverviewCard({
  mobilityStatus,
  statusColor,
  statusIcon,
  lastCheckupDate,
  painLevel,
  affectedJoints,
}: BoneJointOverviewCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="body" size={24} color={Colors.light.primary} />
        <Text style={styles.title}>Bone & Joint Health</Text>
      </View>

      <View style={styles.statusContainer}>
        {/* Main Status */}
        <View style={styles.mainStatus}>
          <View style={[styles.iconContainer, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name={statusIcon as any} size={48} color={statusColor} />
          </View>
          <Text style={styles.statusLabel}>Mobility Status</Text>
          <Text style={[styles.statusValue, { color: statusColor }]}>{mobilityStatus}</Text>
        </View>

        {/* Additional Metrics */}
        <View style={styles.metricsContainer}>
          {painLevel !== undefined && (
            <View style={styles.metricItem}>
              <Ionicons name="pulse" size={20} color={Colors.light.textSecondary} />
              <Text style={styles.metricLabel}>Pain Level</Text>
              <Text style={styles.metricValue}>{painLevel}/10</Text>
            </View>
          )}

          {affectedJoints && affectedJoints.length > 0 && (
            <View style={styles.metricItem}>
              <Ionicons name="alert-circle" size={20} color={Colors.light.textSecondary} />
              <Text style={styles.metricLabel}>Affected Areas</Text>
              <Text style={styles.metricValue}>{affectedJoints.length}</Text>
            </View>
          )}
        </View>
      </View>

      {affectedJoints && affectedJoints.length > 0 && (
        <View style={styles.jointsSection}>
          <Text style={styles.jointsLabel}>Affected Joints:</Text>
          <View style={styles.jointsTags}>
            {affectedJoints.slice(0, 3).map((joint, index) => (
              <View key={index} style={styles.jointTag}>
                <Text style={styles.jointTagText}>{joint}</Text>
              </View>
            ))}
            {affectedJoints.length > 3 && (
              <View style={styles.jointTag}>
                <Text style={styles.jointTagText}>+{affectedJoints.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {lastCheckupDate && (
        <View style={styles.footer}>
          <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.footerText}>Last checkup: {lastCheckupDate}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.infoButton}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.light.primary} />
        <Text style={styles.infoButtonText}>View detailed analysis</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statusContainer: {
    marginBottom: 16,
  },
  mainStatus: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 2,
  },
  jointsSection: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  jointsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  jointsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  jointTag: {
    backgroundColor: Colors.light.primary + '15',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  jointTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
});
