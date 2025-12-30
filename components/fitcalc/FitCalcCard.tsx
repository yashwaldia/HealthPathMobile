// components/fitcalc/FitCalcCard.tsx

import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { memo, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { FitCalcHistoryEntry } from '../../services/fitCalcService';
import { FitCalcId } from '../../types/fitcalc';

// ============================================================================
// TYPES
// ============================================================================

export type FitCalcField =
  | {
      key: string;
      label: string;
      type: 'text' | 'number';
      keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'phone-pad';
      helperText?: string;
    }
  | {
      key: string;
      label: string;
      type: 'chips';
      options: { value: string; label: string }[];
    }
  | {
      key: string;
      label: string;
      type: 'slider';
      min: number;
      max: number;
      step: number;
      helperText?: string;
    };

type Props = {
  calculatorId: FitCalcId;
  title: string;
  description?: string;
  fields: FitCalcField[];
  inputs: Record<string, string | undefined>;
  resultNode: React.ReactNode;
  resultSaved?: boolean;
  history: FitCalcHistoryEntry[];
  onChange: (fieldKey: string, value: string) => void;
  onCalculate: () => void;
  onSave: () => void;
  onDeleteHistory: (entryId: string) => void;
  renderHistoryRow: (entry: FitCalcHistoryEntry) => {
    line1: string;
    line2?: string;
    line3?: string;
  };
  sleepTimerSection?: React.ReactNode;
};

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

const ChipField = memo(
  ({
    field,
    value,
    onChange,
  }: {
    field: Extract<FitCalcField, { type: 'chips' }>;
    value: string;
    onChange: (key: string, val: string) => void;
  }) => (
    <View style={styles.field}>
      <Text style={styles.label}>{field.label}</Text>
      <View style={styles.chipRow}>
        {field.options.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(field.key, opt.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.chipText, active && styles.chipTextActive]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  )
);

ChipField.displayName = 'ChipField';

const InputField = memo(
  ({
    field,
    value,
    onChange,
  }: {
    field: Extract<FitCalcField, { type: 'text' | 'number' }>;
    value: string;
    onChange: (key: string, val: string) => void;
  }) => (
    <View style={styles.field}>
      <Text style={styles.label}>{field.label}</Text>
      <TextInput
        keyboardType={field.keyboardType ?? 'default'}
        placeholder={field.helperText || field.label}
        placeholderTextColor={Colors.light.textSecondary}
        value={value}
        onChangeText={(v) => onChange(field.key, v)}
        style={styles.input}
        returnKeyType="done"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  )
);

InputField.displayName = 'InputField';

const SliderField = memo(
  ({
    field,
    value,
    onChange,
  }: {
    field: Extract<FitCalcField, { type: 'slider' }>;
    value: string;
    onChange: (key: string, val: string) => void;
  }) => {
    const numericValue = parseFloat(value) || field.min;

    return (
      <View style={styles.field}>
        <View style={styles.sliderHeader}>
          <Text style={styles.label}>{field.label}</Text>
          <View style={styles.sliderValueBadge}>
            <Text style={styles.sliderValueText}>{numericValue}</Text>
          </View>
        </View>
        
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderMinMax}>{field.min}</Text>
          <Slider
            style={styles.slider}
            value={numericValue}
            onValueChange={(val) => onChange(field.key, val.toFixed(0))}
            minimumValue={field.min}
            maximumValue={field.max}
            step={field.step}
            minimumTrackTintColor={Colors.light.primary}
            maximumTrackTintColor={Colors.light.border}
            thumbTintColor={Colors.light.primary}
          />
          <Text style={styles.sliderMinMax}>{field.max}</Text>
        </View>
        
        {field.helperText && (
          <Text style={styles.sliderHelperText}>{field.helperText}</Text>
        )}
      </View>
    );
  }
);

SliderField.displayName = 'SliderField';

const HistoryCard = memo(
  ({
    entry,
    renderRow,
    onDelete,
  }: {
    entry: FitCalcHistoryEntry;
    renderRow: (entry: FitCalcHistoryEntry) => {
      line1: string;
      line2?: string;
      line3?: string;
    };
    onDelete: (id: string) => void;
  }) => {
    const row = renderRow(entry);
    
    return (
      <View style={styles.historyCard}>
        <View style={styles.historyCardLeft}>
          <Text style={styles.historyLine1}>{row.line1}</Text>
          {row.line2 && <Text style={styles.historyLine2}>{row.line2}</Text>}
          {row.line3 && <Text style={styles.historyLine3}>{row.line3}</Text>}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(entry.entryId)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.6}
        >
          <Ionicons 
            name="trash-outline" 
            size={18} 
            color={Colors.light.error}
          />
        </TouchableOpacity>
      </View>
    );
  }
);

HistoryCard.displayName = 'HistoryCard';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const FitCalcCard = memo(function FitCalcCard({
  calculatorId,
  title,
  description,
  fields,
  inputs,
  resultNode,
  resultSaved,
  history,
  onChange,
  onCalculate,
  onSave,
  onDeleteHistory,
  renderHistoryRow,
  sleepTimerSection,
}: Props) {
  const hasResult = !!resultNode;

  const handleFieldChange = useCallback(
    (fieldKey: string, value: string) => {
      onChange(fieldKey, value);
    },
    [onChange]
  );

  const renderField = useCallback(
    (field: FitCalcField) => {
      const value = (inputs[field.key] as string | undefined) ?? '';

      if (field.type === 'chips') {
        return (
          <ChipField
            key={field.key}
            field={field}
            value={value}
            onChange={handleFieldChange}
          />
        );
      }

      if (field.type === 'slider') {
        return (
          <SliderField
            key={field.key}
            field={field}
            value={value}
            onChange={handleFieldChange}
          />
        );
      }

      return (
        <InputField
          key={field.key}
          field={field}
          value={value}
          onChange={handleFieldChange}
        />
      );
    },
    [inputs, handleFieldChange]
  );

  const getButtonConfig = () => {
    switch (calculatorId) {
      case 'sleepgraph':
        return {
          icon: 'stats-chart-outline' as const,
          text: 'Load Sleep Data',
        };
      default:
        return {
          icon: 'calculator-outline' as const,
          text: 'Calculate',
        };
    }
  };

  const buttonConfig = getButtonConfig();

  const renderSleepGraphInfo = () => {
    if (calculatorId !== 'sleepgraph') return null;

    return (
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Ionicons 
            name="information-circle" 
            size={22} 
            color={Colors.light.primary} 
          />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Sleep History Tracker</Text>
            <Text style={styles.infoText}>
              View your sleep patterns from the last 30 days. This automatically pulls data from your sleep tracking sessions.
            </Text>
          </View>
        </View>
        <View style={styles.quickTipsBox}>
          <Text style={styles.quickTipsTitle}>📊 What you'll see:</Text>
          <Text style={styles.quickTip}>• Average sleep duration</Text>
          <Text style={styles.quickTip}>• Sleep consistency score</Text>
          <Text style={styles.quickTip}>• Weekly trends and patterns</Text>
          <Text style={styles.quickTip}>• Longest & shortest sessions</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.inputSection}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}

        {sleepTimerSection && sleepTimerSection}

        {renderSleepGraphInfo()}

        {fields.map(renderField)}

        <TouchableOpacity
          style={styles.button}
          onPress={onCalculate}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={buttonConfig.icon} 
            size={20} 
            color="#FFFFFF" 
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>{buttonConfig.text}</Text>
        </TouchableOpacity>

        {hasResult && (
          <View style={styles.resultContainer}>
            {resultNode}
            
            {resultSaved === false && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={onSave}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name="bookmark-outline" 
                  size={18} 
                  color="#FFFFFF" 
                />
                <Text style={styles.saveButtonText}>Save Result</Text>
              </TouchableOpacity>
            )}
            
            {resultSaved === true && (
              <View style={styles.savedBadge}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={18} 
                  color={Colors.light.success} 
                />
                <Text style={styles.savedText}>Saved to History</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {history.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Ionicons 
              name="time-outline" 
              size={20} 
              color={Colors.light.text} 
            />
            <Text style={styles.historyTitle}>Past Calculations</Text>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {history.map((entry) => (
              <HistoryCard
                key={entry.entryId}
                entry={entry}
                renderRow={renderHistoryRow}
                onDelete={onDeleteHistory}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
});

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  inputSection: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  
  infoSection: {
    gap: 12,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.light.primary + '10',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  quickTipsBox: {
    backgroundColor: Colors.light.background,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  quickTipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 10,
  },
  quickTip: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.light.text,
    fontSize: 14,
    backgroundColor: Colors.light.background,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  chipActive: {
    backgroundColor: Colors.light.primary + '15',
    borderColor: Colors.light.primary,
  },
  chipText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.light.primary,
    fontWeight: '700',
  },

  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderValueBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  sliderValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderMinMax: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    width: 24,
    textAlign: 'center',
  },
  sliderHelperText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  button: {
    marginTop: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  resultContainer: {
    marginTop: 16,
  },
  saveButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  savedBadge: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    backgroundColor: Colors.light.success + '10',
    borderRadius: 8,
  },
  savedText: {
    color: Colors.light.success,
    fontWeight: '600',
    fontSize: 13,
  },
  historySection: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyCardLeft: {
    flex: 1,
  },
  historyLine1: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  historyLine2: {
    fontSize: 12,
    color: Colors.light.text,
    marginBottom: 4,
  },
  historyLine3: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  deleteButton: {
    padding: 4,
    alignSelf: 'flex-start',
  },
});
