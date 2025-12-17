// components/wellness/child-care/GrowthChartCard.tsx
// Shows recent height/weight trend + visual chart
// Last Updated: December 17, 2025 - ✅ Added visual growth chart

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors } from '../../../constants/colors';
import { GrowthRecord } from '../../../types/wellness';

type Props = {
  growthRecords: GrowthRecord[];
  onAddRecord: () => void;
};

export default function GrowthChartCard({ growthRecords, onAddRecord }: Props) {
  const [activeMetric, setActiveMetric] = useState<'weight' | 'height'>('weight');

  const sorted = useMemo(
    () =>
      [...growthRecords].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [growthRecords]
  );

  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  const trendText = useMemo(() => {
    if (!latest || !previous) return 'Add a few records to see trends over time.';

    const latestW = parseFloat(latest.weightKg || '0');
    const prevW = parseFloat(previous.weightKg || '0');
    const diffW = latestW - prevW;

    if (isNaN(diffW) || diffW === 0) {
      return 'Weight has been stable compared to the previous record.';
    }
    if (diffW > 0) {
      return `Weight increased by ${diffW.toFixed(1)} kg since the last record.`;
    }
    return `Weight decreased by ${Math.abs(diffW).toFixed(1)} kg since the last record.`;
  }, [latest, previous]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (sorted.length === 0) return null;

    const weights = sorted.map((r) => parseFloat(r.weightKg || '0')).filter(w => w > 0);
    const heights = sorted.map((r) => parseFloat(r.heightCm || '0')).filter(h => h > 0);
    const labels = sorted.map((r) => {
      const date = new Date(r.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    return {
      weight: {
        labels: labels.slice(-6), // Last 6 records
        datasets: [{ data: weights.slice(-6) }],
      },
      height: {
        labels: labels.slice(-6),
        datasets: [{ data: heights.slice(-6) }],
      },
    };
  }, [sorted]);

  const screenWidth = Dimensions.get('window').width - 64; // Account for padding

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="stats-chart" size={20} color={Colors.light.primary} />
          <Text style={styles.title}>Growth Trend</Text>
        </View>
        <Text style={styles.badge}>
          {sorted.length} {sorted.length === 1 ? 'record' : 'records'}
        </Text>
      </View>

      {latest ? (
        <>
          {/* Latest Values */}
          <View style={styles.latestRow}>
            <View style={styles.latestItem}>
              <Text style={styles.label}>Latest Date</Text>
              <Text style={styles.value}>{latest.date}</Text>
            </View>
            <View style={styles.latestItem}>
              <Text style={styles.label}>Height</Text>
              <Text style={styles.value}>
                {latest.heightCm ? `${latest.heightCm} cm` : '—'}
              </Text>
            </View>
            <View style={styles.latestItem}>
              <Text style={styles.label}>Weight</Text>
              <Text style={styles.value}>
                {latest.weightKg ? `${latest.weightKg} kg` : '—'}
              </Text>
            </View>
          </View>

          {/* Trend Text */}
          <View style={styles.trendBox}>
            <Ionicons
              name="trending-up-outline"
              size={18}
              color={Colors.light.primary}
            />
            <Text style={styles.trendText}>{trendText}</Text>
          </View>

          {/* Chart (only if 2+ records) */}
          {sorted.length >= 2 && chartData && (
            <>
              {/* Toggle Buttons */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    activeMetric === 'weight' && styles.toggleButtonActive,
                  ]}
                  onPress={() => setActiveMetric('weight')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      activeMetric === 'weight' && styles.toggleTextActive,
                    ]}
                  >
                    Weight (kg)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    activeMetric === 'height' && styles.toggleButtonActive,
                  ]}
                  onPress={() => setActiveMetric('height')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      activeMetric === 'height' && styles.toggleTextActive,
                    ]}
                  >
                    Height (cm)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Line Chart */}
              <View style={styles.chartContainer}>
                <LineChart
                  data={
                    activeMetric === 'weight'
                      ? chartData.weight
                      : chartData.height
                  }
                  width={screenWidth}
                  height={220}
                  chartConfig={{
                    backgroundColor: Colors.light.cardBackground,
                    backgroundGradientFrom: Colors.light.cardBackground,
                    backgroundGradientTo: Colors.light.cardBackground,
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      `rgba(107, 114, 128, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '5',
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
              </View>

              <Text style={styles.chartCaption}>
                Showing last {Math.min(sorted.length, 6)} measurements
              </Text>
            </>
          )}
        </>
      ) : (
        <View style={styles.emptyBox}>
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.emptyText}>
            No growth records yet. Add your child's height and weight to start tracking.
          </Text>
        </View>
      )}

      {/* Add Record Button */}
      <TouchableOpacity style={styles.addButton} onPress={onAddRecord}>
        <Ionicons name="add-circle" size={20} color={Colors.light.primary} />
        <Text style={styles.addButtonText}>Add New Measurement</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Growth data is for educational tracking only. Always consult your
        pediatrician for medical advice.
      </Text>
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
    backgroundColor: Colors.light.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  latestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  latestItem: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  trendBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.light.primary + '10',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  trendText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  emptyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  emptyText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.light.primary + '15',
    borderColor: Colors.light.primary,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  toggleTextActive: {
    color: Colors.light.primary,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    borderRadius: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  chartCaption: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary + '15',
    borderWidth: 2,
    borderColor: Colors.light.primary + '30',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  disclaimer: {
    marginTop: 4,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
});
