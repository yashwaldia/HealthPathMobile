import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { vitalsService } from '../../services/vitalsService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface ExportDataModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
}

export default function ExportDataModal({
  visible,
  onClose,
  userId,
}: ExportDataModalProps) {
  const [loading, setLoading] = useState(false);

  // --- ANIMATION VALUES ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Trigger animation when modal opens
  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);

      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const exportAsCSV = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setLoading(true);
    try {
      const vitalsHistory = await vitalsService.getVitalsHistory(userId, 100);

      if (vitalsHistory.length === 0) {
        Alert.alert('No Data', 'No vitals data available to export.');
        setLoading(false);
        return;
      }

      const headers = [
        'Date',
        'Blood Pressure (Systolic)',
        'Blood Pressure (Diastolic)',
        'Heart Rate (bpm)',
        'Temperature (°C)',
        'Oxygen Saturation (%)',
        'Blood Sugar (mg/dL)',
        'Weight (kg)',
        'Source',
      ];

      const rows = vitalsHistory.map(vital => [
        new Date(vital.date).toLocaleString(),
        vital.bloodPressureSystolic || '',
        vital.bloodPressureDiastolic || '',
        vital.heartRate || '',
        vital.temperature || '',
        vital.oxygenSaturation || '',
        vital.bloodSugarFasting || '',
        vital.weightKg || '',
        vital.source || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const fileName = `HealthPath_Vitals_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert(
        'Export Successful',
        `${vitalsHistory.length} records exported. Would you like to share the file?`,
        [
          {
            text: 'Share',
            onPress: async () => {
              try {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(filePath);
                  onClose();
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to share file.');
              }
            },
          },
          {
            text: 'Done',
            onPress: onClose,
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'Failed to export data.');
    } finally {
      setLoading(false);
    }
  };

  const exportAsJSON = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setLoading(true);
    try {
      const vitalsHistory = await vitalsService.getVitalsHistory(userId, 100);

      if (vitalsHistory.length === 0) {
        Alert.alert('No Data', 'No vitals data available to export.');
        setLoading(false);
        return;
      }

      const jsonData = {
        exportDate: new Date().toISOString(),
        totalRecords: vitalsHistory.length,
        vitals: vitalsHistory,
      };

      const fileName = `HealthPath_Vitals_${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(jsonData, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert(
        'Export Successful',
        `${vitalsHistory.length} records exported. Would you like to share the file?`,
        [
          {
            text: 'Share',
            onPress: async () => {
              try {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(filePath);
                  onClose();
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to share file.');
              }
            },
          },
          {
            text: 'Done',
            onPress: onClose,
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error exporting JSON:', error);
      Alert.alert('Error', 'Failed to export data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="download-outline" size={24} color={Colors.light.primary} />
              <Text style={styles.headerTitle}>Export Data</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            <Text style={styles.description}>
              Export your vitals data in different formats for backup or sharing with your healthcare provider.
            </Text>

            {/* CSV Option */}
            <TouchableOpacity
              style={[styles.exportOption, loading && styles.disabled]}
              onPress={exportAsCSV}
              disabled={loading}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="document-text" size={28} color={Colors.light.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Export as CSV</Text>
                <Text style={styles.optionSubtitle}>
                  Excel-compatible format, easy to open in spreadsheets
                </Text>
              </View>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.light.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={24} color={Colors.light.textSecondary} />
              )}
            </TouchableOpacity>

            {/* JSON Option */}
            <TouchableOpacity
              style={[styles.exportOption, loading && styles.disabled]}
              onPress={exportAsJSON}
              disabled={loading}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="code-slash" size={28} color={Colors.light.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Export as JSON</Text>
                <Text style={styles.optionSubtitle}>
                  Standard data format, preserves all information
                </Text>
              </View>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.light.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={24} color={Colors.light.textSecondary} />
              )}
            </TouchableOpacity>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <View style={styles.infoBullet}>
                <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
                <Text style={styles.infoText}>Your data is exported locally and not sent to any server</Text>
              </View>
              <View style={styles.infoBullet}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.light.primary} />
                <Text style={styles.infoText}>Last 100 vital records will be included</Text>
              </View>
              <View style={styles.infoBullet}>
                <Ionicons name="share-social" size={20} color={Colors.light.primary} />
                <Text style={styles.infoText}>You can share with your doctor or keep for personal records</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Button */}
          <TouchableOpacity style={styles.button} onPress={onClose} disabled={loading}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: '90%',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 200,
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  disabled: {
    opacity: 0.6,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  infoSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  infoBullet: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  button: {
    marginHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
