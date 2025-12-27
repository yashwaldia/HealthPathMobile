// components/vitals/VitalDetailsModal.tsx
// FIXED VERSION - All hooks before early return

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors } from '../../constants/colors';
import { getVitalStatus } from '../../services/vitalsService';
import { VitalRecord, VitalStatus, VitalType } from '../../types/vitals';

interface VitalDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  vitalData: {
    vitalId: VitalType;
    vitalName: string;
    unit: string;
    icon: string;
    currentValue: string;
    currentStatus: VitalStatus;
    lastUpdated?: Date;
    history: VitalRecord[];
  } | null;
  onAddReading?: () => void;
}

type TimeRange = '7D' | '30D' | '90D' | 'ALL';

const VitalDetailsModal: React.FC<VitalDetailsModalProps> = ({
  visible,
  onClose,
  vitalData,
  onAddReading,
}) => {
  // ✅ ALL HOOKS FIRST - No matter what
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');

  // ✅ Extract values with safe fallbacks
  const vitalId = vitalData?.vitalId || 'heartRate';
  const vitalName = vitalData?.vitalName || '';
  const unit = vitalData?.unit || '';
  const icon = vitalData?.icon || 'pulse';
  const currentValue = vitalData?.currentValue || '--';
  const currentStatus = vitalData?.currentStatus || 'normal';
  const lastUpdated = vitalData?.lastUpdated;
  const history = vitalData?.history || [];

  // Filter history based on time range
  const filteredHistory = useMemo(() => {
    if (!history || history.length === 0) return [];

    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case '7D':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30D':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90D':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case 'ALL':
        return history;
    }

    return history.filter((record) => new Date(record.date) >= cutoffDate);
  }, [history, timeRange]);

  // Extract values for the selected vital
  const getVitalValue = (record: VitalRecord): number | null => {
    switch (vitalId) {
      case 'bloodPressure':
        return record.bloodPressureSystolic || null;
      case 'heartRate':
        return record.heartRate || null;
      case 'temperature':
        return record.temperature || null;
      case 'oxygenSaturation':
        return record.oxygenSaturation || null;
      case 'bloodSugar':
        return record.bloodSugarFasting || null;
      case 'weight':
        return record.weightKg || null;
      default:
        return null;
    }
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (filteredHistory.length === 0) return null;

    // Filter records that have the vital data
    const validRecords = filteredHistory
      .filter((record) => getVitalValue(record) !== null)
      .slice(-10) // Last 10 records
      .reverse(); // Oldest to newest for chart

    if (validRecords.length === 0) return null;

    const labels = validRecords.map((record) => {
      const date = new Date(record.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    // Handle Blood Pressure (dual values)
    if (vitalId === 'bloodPressure') {
      const systolicData = validRecords.map((r) => r.bloodPressureSystolic || 0);
      const diastolicData = validRecords.map((r) => r.bloodPressureDiastolic || 0);

      return {
        labels,
        datasets: [
          {
            data: systolicData,
            color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`, // Blue for systolic
            strokeWidth: 2,
          },
          {
            data: diastolicData,
            color: (opacity = 1) => `rgba(52, 211, 153, ${opacity})`, // Green for diastolic
            strokeWidth: 2,
          },
        ],
        legend: ['Systolic', 'Diastolic'],
      };
    }

    // Single value vitals
    const values = validRecords.map((r) => getVitalValue(r) || 0);

    return {
      labels,
      datasets: [
        {
          data: values,
          color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [filteredHistory, vitalId]);

  // Calculate trend
  const trendData = useMemo(() => {
    if (filteredHistory.length < 2) return null;

    const validRecords = filteredHistory.filter((r) => getVitalValue(r) !== null);
    if (validRecords.length < 2) return null;

    const latest = getVitalValue(validRecords[0]) || 0;
    const previous = getVitalValue(validRecords[1]) || 0;
    const diff = latest - previous;
    const percentage = previous !== 0 ? ((diff / previous) * 100).toFixed(1) : '0.0';

    return {
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      absolute: Math.abs(diff).toFixed(1),
      percentage: Math.abs(Number(percentage)).toFixed(1),
      previousDate: new Date(validRecords[1].date),
    };
  }, [filteredHistory, vitalId]);

  // ✅ NOW CHECK IF DATA IS VALID (after all hooks)
  if (!vitalData) {
    return null;
  }

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;
    if (diffDays < 2) return 'Yesterday';
    if (diffDays < 7) return `${Math.floor(diffDays)} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get status color
  const getStatusColor = (status: VitalStatus) => {
    switch (status) {
      case 'critical':
        return Colors.light.error;
      case 'alert':
        return Colors.light.warning;
      default:
        return Colors.light.success;
    }
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: Colors.light.primary + '15' }]}>
                <Ionicons name={icon as any} size={24} color={Colors.light.primary} />
              </View>
              <Text style={styles.modalTitle}>{vitalName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Latest Value Card */}
            <View style={styles.latestValueCard}>
              <View style={styles.latestValueRow}>
                <View style={styles.latestValueLeft}>
                  <Text style={styles.latestValueLabel}>Current Reading</Text>
                  <View style={styles.valueContainer}>
                    <Text style={styles.latestValue}>{currentValue}</Text>
                    <Text style={styles.latestUnit}>{unit}</Text>
                  </View>
                  {lastUpdated && (
                    <Text style={styles.lastUpdatedText}>{formatDate(lastUpdated)}</Text>
                  )}
                </View>
                <View style={styles.latestValueRight}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(currentStatus) + '20' },
                    ]}
                  >
                    <View
                      style={[styles.statusDot, { backgroundColor: getStatusColor(currentStatus) }]}
                    />
                    <Text
                      style={[styles.statusText, { color: getStatusColor(currentStatus) }]}
                    >
                      {currentStatus === 'normal' ? 'Normal' : currentStatus === 'alert' ? 'Alert' : 'Critical'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Trend Indicator */}
              {trendData && (
                <View style={styles.trendBox}>
                  <Ionicons
                    name={
                      trendData.direction === 'up'
                        ? 'trending-up'
                        : trendData.direction === 'down'
                        ? 'trending-down'
                        : 'remove'
                    }
                    size={16}
                    color={
                      trendData.direction === 'up'
                        ? Colors.light.error
                        : trendData.direction === 'down'
                        ? Colors.light.success
                        : Colors.light.textSecondary
                    }
                  />
                  <Text style={styles.trendText}>
                    {trendData.direction === 'stable'
                      ? 'No change'
                      : `${trendData.direction === 'up' ? 'Increased' : 'Decreased'} by ${
                          trendData.absolute
                        } ${unit} (${trendData.percentage}%)`}{' '}
                    since {formatDate(trendData.previousDate)}
                  </Text>
                </View>
              )}
            </View>

            {/* Time Range Toggle */}
            <View style={styles.timeRangeContainer}>
              {(['7D', '30D', '90D', 'ALL'] as TimeRange[]).map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.timeRangeButton,
                    timeRange === range && styles.timeRangeButtonActive,
                  ]}
                  onPress={() => setTimeRange(range)}
                >
                  <Text
                    style={[
                      styles.timeRangeText,
                      timeRange === range && styles.timeRangeTextActive,
                    ]}
                  >
                    {range}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chart */}
            {chartData ? (
              <View style={styles.chartContainer}>
                <LineChart
                  data={chartData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={{
                    backgroundColor: Colors.light.cardBackground,
                    backgroundGradientFrom: Colors.light.cardBackground,
                    backgroundGradientTo: Colors.light.cardBackground,
                    decimalPlaces: vitalId === 'temperature' ? 1 : 0,
                    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: Colors.light.primary,
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '',
                      stroke: Colors.light.border,
                      strokeWidth: 1,
                    },
                  }}
                  bezier
                  style={styles.chart}
                  withInnerLines
                  withOuterLines
                  withVerticalLines={false}
                  withHorizontalLines
                  withDots
                  withShadow={false}
                  fromZero={false}
                />
                {vitalId === 'bloodPressure' && (
                  <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: 'rgba(74, 144, 226, 1)' }]} />
                      <Text style={styles.legendText}>Systolic</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: 'rgba(52, 211, 153, 1)' }]} />
                      <Text style={styles.legendText}>Diastolic</Text>
                    </View>
                  </View>
                )}
                <Text style={styles.chartCaption}>
                  Showing last {Math.min(filteredHistory.filter((r) => getVitalValue(r) !== null).length, 10)} measurements
                </Text>
              </View>
            ) : (
              <View style={styles.emptyChartContainer}>
                <Ionicons name="analytics-outline" size={48} color={Colors.light.textSecondary} />
                <Text style={styles.emptyChartText}>Not enough data to display chart</Text>
                <Text style={styles.emptyChartSubtext}>Add more readings to see trends</Text>
              </View>
            )}

            {/* History List */}
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Reading History</Text>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((record, index) => {
                  const value = getVitalValue(record);
                  if (value === null) return null;

                  const recordDate = new Date(record.date);
                  const status =
                    vitalId === 'bloodPressure'
                      ? getVitalStatus(
                          'bloodPressure',
                          record.bloodPressureSystolic!,
                          record.bloodPressureDiastolic
                        )
                      : getVitalStatus(vitalId, value);

                  return (
                    <View key={record.id || index} style={styles.historyItem}>
                      <View style={styles.historyLeft}>
                        <View
                          style={[
                            styles.historyStatusDot,
                            { backgroundColor: getStatusColor(status) },
                          ]}
                        />
                        <View style={styles.historyInfo}>
                          <Text style={styles.historyDate}>{formatDate(recordDate)}</Text>
                          <Text style={styles.historyTime}>{formatTime(recordDate)}</Text>
                        </View>
                      </View>
                      <View style={styles.historyRight}>
                        <Text style={styles.historyValue}>
                          {vitalId === 'bloodPressure'
                            ? `${record.bloodPressureSystolic}/${record.bloodPressureDiastolic}`
                            : value}{' '}
                          <Text style={styles.historyUnit}>{unit}</Text>
                        </Text>
                        {record.notes && (
                          <Text style={styles.historyNotes} numberOfLines={1}>
                            {record.notes}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyHistoryContainer}>
                  <Ionicons name="document-text-outline" size={40} color={Colors.light.textSecondary} />
                  <Text style={styles.emptyHistoryText}>No readings yet</Text>
                  <Text style={styles.emptyHistorySubtext}>Start tracking your {vitalName.toLowerCase()}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {onAddReading && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  onClose();
                  onAddReading();
                }}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add New Reading</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  latestValueCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  latestValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  latestValueLeft: {
    flex: 1,
  },
  latestValueLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  latestValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
  },
  latestUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginLeft: 4,
  },
  lastUpdatedText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  latestValueRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.light.primary + '10',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  trendText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: Colors.light.primary + '15',
    borderColor: Colors.light.primary,
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  timeRangeTextActive: {
    color: Colors.light.primary,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    paddingHorizontal: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  chartCaption: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyChartContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    marginHorizontal: 20,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 12,
  },
  emptyChartSubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  historyContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border + '40',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historyStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  historyTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  historyUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  historyNotes: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
    maxWidth: 120,
  },
  emptyHistoryContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 12,
  },
  emptyHistorySubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default VitalDetailsModal;
