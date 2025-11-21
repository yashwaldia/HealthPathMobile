// components/upload/UploadButton.tsx

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface UploadButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
}

export const UploadButton: React.FC<UploadButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  title = 'Upload Medical Document',
  subtitle = 'Take photo, select from gallery, or choose PDF',
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.primary} />
        ) : (
          <Ionicons name="cloud-upload-outline" size={48} color={Colors.light.primary} />
        )}
      </View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.pillsContainer}>
        <View style={styles.pill}>
          <Ionicons name="camera" size={16} color={Colors.light.primary} />
          <Text style={styles.pillText}>Camera</Text>
        </View>
        <View style={styles.pill}>
          <Ionicons name="images" size={16} color={Colors.light.primary} />
          <Text style={styles.pillText}>Gallery</Text>
        </View>
        <View style={styles.pill}>
          <Ionicons name="document" size={16} color={Colors.light.primary} />
          <Text style={styles.pillText}>PDF</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.light.upload.dropZone.border,
    marginVertical: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
});
