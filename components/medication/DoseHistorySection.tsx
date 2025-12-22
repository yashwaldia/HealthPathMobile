// components/medication/DoseHistorySection.tsx
// Recent dose history display for medication cards
// Last Updated: December 18, 2025

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { DoseLog } from '../../types/medication';
import { formatDateForDisplay } from '../../utils/dateHelpers';

interface DoseHistorySectionProps {
  /**
   * Array of recent dose logs
   */
  doseHistory: DoseLog[];
  /**
   * Maximum number of doses to show (default: 5)
   */
  limit?: number;
  /**
   * Show empty state message
   */
  showEmptyState?: boolean;
}

const DoseHistorySection: React.FC<DoseHistorySectionProps> = ({
  doseHistory = [],
  limit = 5,
  showEmptyState = true,
}) => {
  const recentDoses = doseHistory.slice(0, limit);

  const renderDoseItem = ({ item }: { item: DoseLog }) => {
    const displayTime = item.takenTime || item.scheduledTime;
    const doseDate = new Date(displayTime);
    
    const isTaken = item.taken;
    const statusIcon = isTaken ? 'checkmark-circle' : 'time-outline';
    const statusColor = isTaken ? '#10B981' : '#F59E0B';
    
    return (
      <View style={styles.doseItem}>
        <Ionicons 
          name={statusIcon as any} 
          size={16} 
          color={statusColor}
          style={styles.statusIcon}
        />
        <View style={styles.doseInfo}>
          <Text style={styles.doseTime}>
            {doseDate.toLocaleString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </Text>
          <Text style={styles.doseDate}>
            {formatDateForDisplay(doseDate.toISOString().split('T')[0], 'short')}
          </Text>
        </View>
        {item.notes && (
          <Text style={styles.doseNotes} numberOfLines={1}>
            {item.notes}
          </Text>
        )}
      </View>
    );
  };

  if (recentDoses.length === 0 && showEmptyState) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="medkit-outline" size={24} color="#9CA3AF" />
        <Text style={styles.emptyText}>No doses taken yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Doses</Text>
      <FlatList
        data={recentDoses}
        renderItem={renderDoseItem}
        keyExtractor={(item) => item.doseId}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
      {doseHistory.length > limit && (
        <Text style={styles.showMore}>+{doseHistory.length - limit} more</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  list: {
    maxHeight: 100,
  },
  doseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  statusIcon: {
    marginRight: 10,
    width: 20,
  },
  doseInfo: {
    flex: 1,
  },
  doseTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  doseDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  doseNotes: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 26,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  showMore: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default DoseHistorySection;
