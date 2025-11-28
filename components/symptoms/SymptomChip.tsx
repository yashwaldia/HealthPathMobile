import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface SymptomChipProps {
  symptom: string;
  onRemove: () => void;
}

export default function SymptomChip({ symptom, onRemove }: SymptomChipProps) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText} numberOfLines={1}>
        {symptom}
      </Text>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <Ionicons name="close-circle" size={18} color={Colors.light.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.light.primary}15`,
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: `${Colors.light.primary}30`,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 4,
    maxWidth: 150,
  },
  removeButton: {
    padding: 2,
  },
});
