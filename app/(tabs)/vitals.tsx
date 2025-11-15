import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { vitalsService, getVitalStatus } from '../../services/vitalsService';
import { VitalRecord, VitalCardData } from '../../types/vitals';
import { extractVitalsFromDocument } from '../../services/aiService';

// --- IMPORT COMPONENTS ---
import VitalCard from '../../components/vitals/VitalCard';
import QuickAddModal from '../../components/vitals/QuickAddModal';
import VitalDetailsModal from '../../components/vitals/VitalDetailsModal';
import AIInsightsModal from '../../components/vitals/AIInsightsModal';
import ExportDataModal from '../../components/vitals/ExportDataModal';

export default function VitalsScreen() {
  const { user } = useAuth();
  const [latestVitals, setLatestVitals] = useState<Partial<VitalRecord>>({});
  const [vitalsHistory, setVitalsHistory] = useState<VitalRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  
  // --- MODAL STATES ---
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isDetailsModalVisible, setDetailsModalVisible] = useState(false);
  const [isAIInsightsModalVisible, setAIInsightsModalVisible] = useState(false);
  const [isExportModalVisible, setExportModalVisible] = useState(false);
  const [selectedVitalId, setSelectedVitalId] = useState<string | null>(null);

  // --- ANIMATION VALUES ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const uploadFadeAnim = useRef(new Animated.Value(0)).current;
  const uploadSlideAnim = useRef(new Animated.Value(50)).current;
  const cardsFadeAnim = useRef(new Animated.Value(0)).current;
  const cardsSlideAnim = useRef(new Animated.Value(50)).current;
  const actionsFadeAnim = useRef(new Animated.Value(0)).current;
  const actionsSlideAnim = useRef(new Animated.Value(50)).current;

  // Trigger animations when data loads
  useEffect(() => {
    if (!loading) {
      // Staggered animation sequence
      Animated.sequence([
        // Header animation (already visible, so we animate upload button first)
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
        ]),
      ]).start();

      // Smart Upload button with slight delay
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(uploadFadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(uploadSlideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      }, 100);

      // Cards with more delay
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(cardsFadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(cardsSlideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      }, 200);

      // Actions with most delay
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(actionsFadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(actionsSlideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      }, 300);
    }
  }, [loading]);

  const fetchLatestVitals = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const vitals = await vitalsService.getLatestVitals(user.uid);
      const history = await vitalsService.getVitalsHistory(user.uid, 20);
      setLatestVitals(vitals);
      setVitalsHistory(history);
    } catch (error) {
      console.error("Error fetching vitals:", error);
      Alert.alert('Error', 'Failed to load vitals data.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user) {
      fetchLatestVitals();
    }
  }, [user, fetchLatestVitals]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLatestVitals().then(() => setRefreshing(false));
  }, [fetchLatestVitals]);
  
  const handleCardPress = (vitalId: string) => {
    setSelectedVitalId(vitalId);
    setDetailsModalVisible(true);
  };
  
  const handleSaveVital = async (data: Partial<VitalRecord>) => {
    if (!user) return;
    
    try {
      // Merge new data with existing vitals to preserve untouched values
      const mergedData = {
        ...latestVitals, // Keep all existing vitals
        ...data, // Overwrite only the fields user changed
        date: new Date().toISOString(),
        source: 'manual' as const,
      };

      // Update latest vitals (merges with existing)
      await vitalsService.updateLatestVitals(user.uid, mergedData);
      
      // Save to history
      await vitalsService.addVitalToHistory(user.uid, mergedData);
      
      setAddModalVisible(false);
      onRefresh();
      Alert.alert('Success', 'Vital record saved successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to save record.');
      console.error(err);
    }
  };

  // --- SMART UPLOAD FEATURE ---
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
        await processUploadedDocument(result.assets[0].uri, 'image');
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
        await processUploadedDocument(result.assets[0].uri, 'image');
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
        await processUploadedDocument(result.assets[0].uri, type);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  const processUploadedDocument = async (uri: string, type: 'image' | 'pdf') => {
    if (!user?.uid) return;

    setUploadingDocument(true);
    
    try {
      console.log('📄 Processing document:', uri, 'Type:', type);
      
      const extractedData = await extractVitalsFromDocument(uri, type);
      
      console.log('📊 Extracted data:', extractedData);
      
      if (extractedData && Object.keys(extractedData).length > 0) {
        // Merge with existing vitals
        const mergedData = {
          ...latestVitals,
          ...extractedData,
          date: new Date().toISOString(),
          source: 'imported' as const,
        };

        // Save to Firebase
        await vitalsService.updateLatestVitals(user.uid, mergedData);

        // Also save to history
        await vitalsService.addVitalToHistory(user.uid, mergedData);

        // Refresh dashboard
        await fetchLatestVitals();

        // Show AI insights automatically for uploaded documents
        Alert.alert(
          'Success!', 
          `Medical document analyzed successfully.\n\nExtracted: ${Object.keys(extractedData).filter(k => k !== 'notes').join(', ')}\n\nGenerating AI insights...`,
          [{ 
            text: 'View Insights', 
            onPress: () => setAIInsightsModalVisible(true)
          }]
        );
      } else {
        Alert.alert(
          'No Vital Signs Found',
          'This document appears to be a lab report. Please upload a document with BP, HR, temp, SpO2, or add data manually.'
        );
      }
    } catch (error: any) {
      console.error('❌ Document processing error:', error);
      Alert.alert(
        'Processing Error',
        error?.message || 'Failed to analyze the document. Please try a clearer image.'
      );
    } finally {
      setUploadingDocument(false);
    }
  };

  const vitalCards: VitalCardData[] = [
    {
      id: 'bloodPressure',
      title: 'Blood Pressure',
      icon: 'heart-circle',
      latestValue: latestVitals.bloodPressureSystolic && latestVitals.bloodPressureDiastolic
        ? `${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic}` : '--/--',
      unit: 'mmHg',
      status: latestVitals.bloodPressureSystolic
        ? getVitalStatus('bloodPressure', latestVitals.bloodPressureSystolic, latestVitals.bloodPressureDiastolic) : 'normal',
      lastUpdated: latestVitals.date ? new Date(latestVitals.date) : undefined,
    },
    {
      id: 'heartRate',
      title: 'Heart Rate',
      icon: 'pulse',
      latestValue: latestVitals.heartRate?.toString() || '--',
      unit: 'bpm',
      status: latestVitals.heartRate ? getVitalStatus('heartRate', latestVitals.heartRate) : 'normal',
      lastUpdated: latestVitals.date ? new Date(latestVitals.date) : undefined,
    },
    {
      id: 'bloodSugar',
      title: 'Blood Sugar',
      icon: 'water',
      latestValue: latestVitals.bloodSugarFasting?.toString() || '--',
      unit: 'mg/dL',
      status: latestVitals.bloodSugarFasting ? getVitalStatus('bloodSugar', latestVitals.bloodSugarFasting) : 'normal',
      lastUpdated: latestVitals.date ? new Date(latestVitals.date) : undefined,
    },
    {
      id: 'temperature',
      title: 'Temperature',
      icon: 'thermometer',
      latestValue: latestVitals.temperature?.toFixed(1) || '--',
      unit: '°C',
      status: latestVitals.temperature ? getVitalStatus('temperature', latestVitals.temperature) : 'normal',
      lastUpdated: latestVitals.date ? new Date(latestVitals.date) : undefined,
    },
    {
      id: 'oxygenSaturation',
      title: 'Oxygen Level',
      icon: 'fitness',
      latestValue: latestVitals.oxygenSaturation?.toString() || '--',
      unit: '%',
      status: latestVitals.oxygenSaturation ? getVitalStatus('oxygenSaturation', latestVitals.oxygenSaturation) : 'normal',
      lastUpdated: latestVitals.date ? new Date(latestVitals.date) : undefined,
    },
    {
      id: 'weight',
      title: 'Weight',
      icon: 'scale',
      latestValue: latestVitals.weightKg?.toFixed(1) || '--',
      unit: 'kg',
      status: 'normal',
      lastUpdated: latestVitals.date ? new Date(latestVitals.date) : undefined,
    },
  ];

  // Memoize currentVitals to prevent unnecessary re-renders of the modal
  const memoizedCurrentVitals = useMemo(() => latestVitals, [
    latestVitals.bloodPressureSystolic,
    latestVitals.bloodPressureDiastolic,
    latestVitals.heartRate,
    latestVitals.temperature,
    latestVitals.oxygenSaturation,
    latestVitals.bloodSugarFasting,
    latestVitals.weightKg,
    latestVitals.notes,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Modals */}
      <QuickAddModal 
        visible={isAddModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleSaveVital}
        currentVitals={memoizedCurrentVitals}
      />
      <VitalDetailsModal
        visible={isDetailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        vitalId={selectedVitalId}
      />
      <AIInsightsModal
        visible={isAIInsightsModalVisible}
        onClose={() => setAIInsightsModalVisible(false)}
        latestVitals={latestVitals}
      />
      <ExportDataModal
        visible={isExportModalVisible}
        onClose={() => setExportModalVisible(false)}
        userId={user?.uid}
      />

      {/* Header - Animated */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View>
          <Text style={styles.headerTitle}>Vitals Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track your health metrics</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add-circle" size={32} color={Colors.light.primary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />}
      >
        {/* SMART UPLOAD BUTTON - Animated */}
        <Animated.View
          style={{
            opacity: uploadFadeAnim,
            transform: [{ translateY: uploadSlideAnim }],
          }}
        >
          <TouchableOpacity 
            style={styles.smartUploadContainer}
            onPress={handleSmartUpload}
            disabled={uploadingDocument}
          >
            <View style={styles.uploadIconContainer}>
              <Ionicons 
                name="cloud-upload-outline" 
                size={28} 
                color={Colors.light.primary} 
              />
            </View>
            <View style={styles.uploadTextContainer}>
              <Text style={styles.uploadTitle}>Smart Upload</Text>
              <Text style={styles.uploadSubtitle}>
                {uploadingDocument ? 'Analyzing document...' : 'Upload medical reports & auto-fill vitals'}
              </Text>
            </View>
            {uploadingDocument ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={24} color={Colors.light.textSecondary} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* VITALS CARDS GRID - Animated */}
        {loading && <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 20 }} />}
        
        {!loading && (
          <Animated.View 
            style={[
              styles.cardsGrid,
              {
                opacity: cardsFadeAnim,
                transform: [{ translateY: cardsSlideAnim }],
              }
            ]}
          >
            {vitalCards.map((card) => (
              <VitalCard key={card.id} card={card} onPress={() => handleCardPress(card.id)} />
            ))}
          </Animated.View>
        )}

        {/* QUICK ACTIONS - THREE BUTTONS AT BOTTOM - Animated */}
        {!loading && (
          <Animated.View 
            style={[
              styles.quickActions,
              {
                opacity: actionsFadeAnim,
                transform: [{ translateY: actionsSlideAnim }],
              }
            ]}
          >
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Coming Soon', 'View history feature will be available soon!')}
            >
              <Ionicons name="time-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.actionText}>View History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setAIInsightsModalVisible(true)}
            >
              <Ionicons name="sparkles-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.actionText}>AI Insights</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setExportModalVisible(true)}
            >
              <Ionicons name="download-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.actionText}>Export Data</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  addButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  smartUploadContainer: {
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
  uploadIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 100,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
});
