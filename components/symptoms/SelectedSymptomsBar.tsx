import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import SymptomChip from './SymptomChip';
import { Colors } from '../../constants/colors';

interface SelectedSymptomsBarProps {
  symptoms: string[];
  onRemove: (symptom: string) => void;
}

export default function SelectedSymptomsBar({ symptoms, onRemove }: SelectedSymptomsBarProps) {
  if (symptoms.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selected Symptoms ({symptoms.length})</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {symptoms.map((symptom, index) => (
          <SymptomChip
            key={`${symptom}-${index}`}
            symptom={symptom}
            onRemove={() => onRemove(symptom)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    paddingRight: 16,
  },
});
