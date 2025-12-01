// components/fitcalc/FitCalcCard.tsx

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FitCalcHistoryEntry } from '../../services/fitCalcService';

export type FitCalcField =
  | {
      key: string;
      label: string;
      type: 'text' | 'number';
      keyboardType?: 'default' | 'numeric';
      helperText?: string;
    }
  | {
      key: string;
      label: string;
      type: 'chips';
      options: { value: string; label: string }[];
    };

type Props = {
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
};

export function FitCalcCard({
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
}: Props) {
  const hasResult = !!resultNode;

  return (
    <View style={styles.card}>
      <View style={styles.inputSection}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}

        {fields.map((field) => {
          if (field.type === 'chips') {
            const value = (inputs[field.key] as string | undefined) ?? '';
            return (
              <View style={styles.field} key={field.key}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={styles.chipRow}>
                  {field.options.map((opt) => {
                    const active = value === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => onChange(field.key, opt.value)}
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
            );
          }

          const value = (inputs[field.key] as string | undefined) ?? '';
          return (
            <View style={styles.field} key={field.key}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                keyboardType={field.keyboardType ?? 'default'}
                placeholder={field.helperText || field.label}
                placeholderTextColor={Colors.light.textSecondary}
                value={value}
                onChangeText={(v) => onChange(field.key, v)}
                style={styles.input}
              />
            </View>
          );
        })}

        <TouchableOpacity style={styles.button} onPress={onCalculate}>
          <Text style={styles.buttonText}>Calculate</Text>
        </TouchableOpacity>

        {hasResult && (
          <View style={styles.resultContainer}>
            {resultNode}
            {resultSaved === false && (
              <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                <Ionicons name="bookmark-outline" size={16} color="#fff" />
                <Text style={styles.saveButtonText}>Save Result</Text>
              </TouchableOpacity>
            )}
            {resultSaved === true && (
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.light.success} />
                <Text style={styles.savedText}>Saved</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Past Calculations</Text>
          {history.map((entry) => {
            const row = renderHistoryRow(entry);
            return (
              <View key={entry.entryId} style={styles.historyCard}>
                <View style={styles.historyCardLeft}>
                  <Text style={styles.historyLine1}>{row.line1}</Text>
                  {row.line2 ? (
                    <Text style={styles.historyLine2}>{row.line2}</Text>
                  ) : null}
                  {row.line3 ? (
                    <Text style={styles.historyLine3}>{row.line3}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => onDeleteHistory(entry.entryId)}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.light.error} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

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
    marginBottom: 12,
  },
  field: {
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chipActive: {
    backgroundColor: Colors.light.primary + '15',
    borderColor: Colors.light.primary,
  },
  chipText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  chipTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  button: {
    marginTop: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.light.cardBackground,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 12,
  },
  saveButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  savedBadge: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  savedText: {
    color: Colors.light.success,
    fontWeight: '600',
    fontSize: 13,
  },
  historySection: {
    marginTop: 4,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  historyCardLeft: {
    flex: 1,
  },
  historyLine1: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  historyLine2: {
    fontSize: 12,
    color: Colors.light.text,
    marginBottom: 2,
  },
  historyLine3: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  deleteButton: {
    padding: 4,
  },
});
