import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { VitalRecord } from '../../types/vitals';
import AIInsightsModal from './AIInsightsModal';
import ExportDataModal from './ExportDataModal';

interface QuickActionsBarProps {
  userId?: string;
  latestVitals: Partial<VitalRecord>;
}

export default function QuickActionsBar({ userId, latestVitals }: QuickActionsBarProps) {
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const handleViewHistory = () => {
    Alert.alert('Coming Soon', 'View history feature will be available soon!');
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity style={styles.actionButton} onPress={handleViewHistory}>
          <Ionicons name="time-outline" size={20} color={Colors.light.primary} />
          <Text style={styles.actionText}>View History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => setShowAIInsights(true)}>
          <Ionicons name="sparkles-outline" size={20} color={Colors.light.primary} />
          <Text style={styles.actionText}>AI Insights</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => setShowExport(true)}>
          <Ionicons name="download-outline" size={20} color={Colors.light.primary} />
          <Text style={styles.actionText}>Export Data</Text>
        </TouchableOpacity>
      </View>

      <AIInsightsModal
        visible={showAIInsights}
        onClose={() => setShowAIInsights(false)}
        userId={userId}
        latestVitals={latestVitals}
      />

      <ExportDataModal
        visible={showExport}
        onClose={() => setShowExport(false)}
        userId={userId}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 100,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
});
