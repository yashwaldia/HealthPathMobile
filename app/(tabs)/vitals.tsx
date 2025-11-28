import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import CustomToast from '../../components/ui/CustomToast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function VitalsScreen() {
  const router = useRouter();
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
  const [showUploadChoice, setShowUploadChoice] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });

  // Show toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ visible: true, message, type });
  };

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
      showToast('Failed to load vitals data', 'error');
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
      const mergedData = {
        ...latestVitals,
        ...data,
        date: new Date().toISOString(),
        source: 'manual' as const,
      };

      await vitalsService.updateLatestVitals(user.uid, mergedData);
      await vitalsService.addVitalToHistory(user.uid, mergedData);
      
      setAddModalVisible(false);
      onRefresh();
      showToast('Vital record saved successfully', 'success');
    } catch (err) {
      showToast('Failed to save record', 'error');
      console.error(err);
    }
  };

  // --- SMART UPLOAD FEATURE ---
  const handleSmartUpload = () => {
    setShowUploadChoice(true);
  };

  const handleCameraUpload = async () => {
    setShowUploadChoice(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showToast('Camera permission is needed', 'warning');
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
      showToast('Failed to access camera', 'error');
    }
  };

  const handleImageUpload = async () => {
    setShowUploadChoice(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('Photo library permission is needed', 'warning');
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
      showToast('Failed to pick image', 'error');
    }
  };

  const handleDocumentUpload = async () => {
    setShowUploadChoice(false);
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
      showToast('Failed to pick document', 'error');
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
        const mergedData = {
          ...latestVitals,
          ...extractedData,
          date: new Date().toISOString(),
          source: 'imported' as const,
        };

        await vitalsService.updateLatestVitals(user.uid, mergedData);
        await vitalsService.addVitalToHistory(user.uid, mergedData);
        await fetchLatestVitals();

        showToast(
          `Document analyzed! Extracted: ${Object.keys(extractedData).filter(k => k !== 'notes').join(', ')}`,
          'success'
        );
        
        // Auto-open AI insights
        setTimeout(() => setAIInsightsModalVisible(true), 1000);
      } else {
        showToast(
          'No vital signs found. Please upload a document with BP, HR, temp, SpO2, or add manually',
          'warning'
        );
      }
    } catch (error: any) {
      console.error('❌ Document processing error:', error);
      showToast(
        error?.message || 'Failed to analyze document. Please try a clearer image',
        'error'
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Toast */}
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* Upload Choice Dialog */}
      <ConfirmDialog
        visible={showUploadChoice}
        title="Smart Upload"
        message="Choose how you'd like to upload your medical document"
        confirmText="Take Photo"
        cancelText="Cancel"
        type="info"
        onConfirm={handleCameraUpload}
        onCancel={() => setShowUploadChoice(false)}
      />

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Vitals Dashboard</Text>
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

          {/* Additional Upload Options */}
          <View style={styles.uploadOptions}>
            <TouchableOpacity 
              style={styles.uploadOptionButton}
              onPress={handleImageUpload}
              disabled={uploadingDocument}
            >
              <Ionicons name="images-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.uploadOptionText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.uploadOptionButton}
              onPress={handleDocumentUpload}
              disabled={uploadingDocument}
            >
              <Ionicons name="document-text-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.uploadOptionText}>PDF</Text>
            </TouchableOpacity>
          </View>
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

        {/* QUICK ACTIONS - Animated */}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center', // ✅ CENTER THE TEXT
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  addButton: {
    padding: 4,
        width: 40, // Fixed width to balance with back button

  },
  scrollView: {
    flex: 1,
  },
  smartUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
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
  uploadOptions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  uploadOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  uploadOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
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
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
});
