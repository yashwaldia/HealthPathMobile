import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../../constants/colors';
import { vitalsService } from '../../services/vitalsService';
import { extractVitalsFromDocument } from '../../services/aiService';

interface SmartUploadButtonProps {
  userId?: string;
  onUploadComplete: () => void;
}

export default function SmartUploadButton({ userId, onUploadComplete }: SmartUploadButtonProps) {
  const [uploading, setUploading] = useState(false);

  const handleSmartUpload = () => {
    Alert.alert(
      'Smart Upload',
      'Choose how to upload your medical document',
      [
        { text: 'Take Photo', onPress: handleCameraUpload },
        { text: 'Choose from Gallery', onPress: handleImageUpload },
        { text: 'Upload PDF', onPress: handleDocumentUpload },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleCameraUpload = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        await processDocument(result.assets[0].uri, 'image');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access camera.');
    }
  };

  const handleImageUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Photo library permission is needed.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        await processDocument(result.assets[0].uri, 'image');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const type = result.assets[0].mimeType?.includes('pdf') ? 'pdf' : 'image';
        await processDocument(result.assets[0].uri, type);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  const processDocument = async (uri: string, type: 'image' | 'pdf') => {
    if (!userId) return;

    setUploading(true);
    try {
      const extractedData = await extractVitalsFromDocument(uri, type);

      if (extractedData && Object.keys(extractedData).length > 0) {
        await vitalsService.updateLatestVitals(userId, {
          ...extractedData,
          date: new Date().toISOString(),
          source: 'imported',
        });

        await vitalsService.addVitalToHistory(userId, {
          ...extractedData,
          date: new Date().toISOString(),
          source: 'imported',
        });

        Alert.alert(
          'Success!',
          `Extracted: ${Object.keys(extractedData).filter(k => k !== 'notes').join(', ')}`,
          [{ text: 'OK', onPress: onUploadComplete }]
        );
      } else {
        Alert.alert(
          'No Vital Signs Found',
          'Please upload a document with BP, HR, temp, SpO2, or add manually.'
        );
      }
    } catch (error: any) {
      Alert.alert('Processing Error', error?.message || 'Failed to analyze document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleSmartUpload}
      disabled={uploading}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="cloud-upload-outline" size={28} color={Colors.light.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Smart Upload</Text>
        <Text style={styles.subtitle}>
          {uploading ? 'Analyzing document...' : 'Upload vitals report with BP, HR, temp, SpO2'}
        </Text>
      </View>
      {uploading ? (
        <ActivityIndicator size="small" color={Colors.light.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={24} color={Colors.light.textSecondary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.light.primary + '20',
    borderStyle: 'dashed',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});
