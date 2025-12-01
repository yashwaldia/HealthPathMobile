// components/radiology/RadiologyUploadCard.tsx

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

type UploadCardProps = {
  disabled: boolean;
  onPress: () => void;
};

export function RadiologyUploadCard({ disabled, onPress }: UploadCardProps) {
  return (
    <TouchableOpacity
      style={styles.uploadCard}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.uploadIconContainer}>
        <Ionicons name="cloud-upload-outline" size={32} color={Colors.light.primary} />
      </View>
      <View style={styles.uploadTextContainer}>
        <Text style={styles.uploadTitle}>Upload Radiology Scan</Text>
        <Text style={styles.uploadSubtitle}>X-Ray, CT, MRI, Ultrasound, PET Scan</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={Colors.light.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: Colors.light.primary + '20',
    borderStyle: 'dashed',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uploadTextContainer: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});
