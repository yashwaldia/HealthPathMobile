// components/wellness/WarningSignsCard.tsx
// Emergency warning signs display card
// Last Updated: December 11, 2025 - FIXED: Support both data structures

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

// Support both the proper WarningSSign type and the simpler structure from data files
type WarningSign = {
  signId?: string;
  symptom?: string;
  action?: string;
  severity?: 'critical' | 'urgent' | 'caution';
  icon?: string;
  // Alternative structure from data files
  category?: string;
  emoji?: string;
  signs?: string[];
};

type Props = {
  warningsSigns: WarningSign[];
};

const SEVERITY_CONFIG = {
  critical: {
    color: '#FF4757',
    backgroundColor: '#FFE5E8',
    borderColor: '#FF4757',
  },
  urgent: {
    color: '#FFA502',
    backgroundColor: '#FFF4E5',
    borderColor: '#FFA502',
  },
  caution: {
    color: '#FFC048',
    backgroundColor: '#FFF8E5',
    borderColor: '#FFC048',
  },
};

export default function WarningSignsCard({ warningsSigns }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Convert data format if needed
  const convertedSigns: WarningSign[] = warningsSigns.flatMap((sign) => {
    if (sign.signs && sign.category) {
      // This is the grouped format from data files
      return sign.signs.map((s, i) => ({
        signId: `${sign.category}-${i}`,
        symptom: s,
        action: 'Contact your healthcare provider',
        severity: (sign.category?.includes('Emergency') ? 'critical' : 'urgent') as 'critical' | 'urgent',
        icon: 'alert-circle',
      }));
    }
    // Already in the correct format
    return [sign];
  });

  const displayedSigns = expanded ? convertedSigns : convertedSigns.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.alertBadge}>
            <Ionicons name="warning" size={18} color="#FF4757" />
          </View>
          <Text style={styles.headerTitle}>Warning Signs</Text>
        </View>
        <Text style={styles.headerSubtitle}>When to seek medical help</Text>
      </View>

      {/* Warning signs list */}
      <View style={styles.signsList}>
        {displayedSigns.map((sign) => {
          const config = SEVERITY_CONFIG[sign.severity || 'urgent'];
          return (
            <View
              key={sign.signId}
              style={[
                styles.signItem,
                { backgroundColor: config.backgroundColor, borderLeftColor: config.borderColor },
              ]}
            >
              <View style={styles.signHeader}>
                <Ionicons
                  name={(sign.icon || 'alert-circle') as any}
                  size={20}
                  color={config.color}
                  style={styles.signIcon}
                />
                <Text style={[styles.signSymptom, { color: config.color }]}>
                  {sign.symptom}
                </Text>
              </View>
              <Text style={styles.signAction}>{sign.action}</Text>
            </View>
          );
        })}
      </View>

      {/* Show more/less button */}
      {convertedSigns.length > 3 && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.expandButtonText}>
            {expanded ? 'Show Less' : `Show ${convertedSigns.length - 3} More`}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.light.primary}
          />
        </TouchableOpacity>
      )}

      {/* Emergency note */}
      <View style={styles.emergencyNote}>
        <Ionicons name="call" size={16} color="#FF4757" />
        <Text style={styles.emergencyText}>
          In case of emergency, call your doctor or emergency services immediately
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFE5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 36,
  },
  signsList: {
    gap: 10,
  },
  signItem: {
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
  },
  signHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  signIcon: {
    marginRight: 8,
  },
  signSymptom: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  signAction: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
    marginLeft: 28,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
    gap: 6,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  emergencyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E8',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  emergencyText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#FF4757',
    lineHeight: 16,
  },
});
