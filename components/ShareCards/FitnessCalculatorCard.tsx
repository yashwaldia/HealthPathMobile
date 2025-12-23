// components/ShareCards/FitnessCalculatorCard.tsx
/**
 * Fitness Calculator Result Share Card Component
 * Displays fitness calculation results (BMR, TDEE, VO2max, etc.)
 */

import { Colors } from '@/constants/colors';
import type { FitnessCalculatorCardData } from '@/types/shareCard';
import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ShareCardFooter from './ShareCardFooter';
import ShareCardHeader from './ShareCardHeader';
import ShareCardWrapper from './ShareCardWrapper';

// ============================================================================
// TYPES
// ============================================================================

interface FitnessCalculatorCardProps {
  data: FitnessCalculatorCardData;
}

// ============================================================================
// COMPONENT
// ============================================================================

const FitnessCalculatorCard = forwardRef<View, FitnessCalculatorCardProps>(({ data }, ref) => {
  return (
    <ShareCardWrapper ref={ref} testID="fitness-calculator-card">
      {/* Header */}
      <ShareCardHeader
        userName={data.userName}
        date={new Date(data.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Calculator Type */}
        <View style={styles.calculatorHeader}>
          <View style={styles.calculatorIconContainer}>
            <Ionicons name={data.calculator.icon as any} size={28} color="#FFFFFF" />
          </View>
          <View style={styles.calculatorInfo}>
            <Text style={styles.calculatorType}>{data.calculator.type.toUpperCase()}</Text>
            <Text style={styles.calculatorName}>{data.calculator.name}</Text>
          </View>
        </View>

        {/* Main Result */}
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Your Result</Text>
          <Text style={styles.resultValue}>{data.result.mainValue}</Text>
          {data.result.status && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{data.result.status}</Text>
            </View>
          )}
        </View>

        {/* Breakdown (if available) */}
        {data.breakdown && data.breakdown.length > 0 && (
          <View style={styles.breakdownContainer}>
            <Text style={styles.breakdownTitle}>Breakdown</Text>
            <View style={styles.breakdownList}>
              {data.breakdown.map((item, index) => (
                <View key={index} style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>{item.label}</Text>
                  <Text style={styles.breakdownValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color={Colors.light.primary} />
          <Text style={styles.infoText}>
            Results are calculated based on your profile data and standard health formulas.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <ShareCardFooter motivationalText={data.motivationalText} />
    </ShareCardWrapper>
  );
});

FitnessCalculatorCard.displayName = 'FitnessCalculatorCard';

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  calculatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  calculatorIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calculatorInfo: {
    flex: 1,
  },
  calculatorType: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  calculatorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 2,
  },
  resultContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  breakdownContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 10,
  },
  breakdownList: {
    gap: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  breakdownLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 9,
    color: Colors.light.textSecondary,
    lineHeight: 13,
  },
});

export default FitnessCalculatorCard;
