import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { vitalsService, getVitalStatus } from '../../services/vitalsService';
import { VitalRecord, VitalCardData, VitalStatus } from '../../types/vitals';
import { useBluetoothVitals } from '../../hooks/useBluetoothVitals';
import { Device } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

// --- IMPORT THE NEW COMPONENTS ---
import VitalCard from '../../components/vitals/VitalCard';
import QuickAddModal from '../../components/vitals/QuickAddModal';
import VitalDetailsModal from '../../components/vitals/VitalDetailsModal';

export default function VitalsScreen() {
  const { user } = useAuth();
  const [latestVitals, setLatestVitals] = useState<Partial<VitalRecord>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // --- MODAL STATES ---
  const [isScanModalVisible, setScanModalVisible] = useState(false);
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isDetailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedVitalId, setSelectedVitalId] = useState<string | null>(null);

  const {
    scanForDevices, stopScan, connectToDevice, disconnectDevice,
    allDevices, connectedDevice, heartRate,
  } = useBluetoothVitals();

  useEffect(() => {
    if (heartRate > 0 && user?.uid) {
      vitalsService.addVitalRecord(user.uid, {
        date: new Date().toISOString(), heartRate, source: 'device',
      }).then(() => onRefresh());
    }
  }, [heartRate, user?.uid]);

  const startScan = () => {
    scanForDevices();
    setScanModalVisible(true);
  };

  const handleDeviceSelection = (device: Device) => {
    connectToDevice(device);
    setScanModalVisible(false);
    stopScan();
  };

  const fetchLatestVitals = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const vitals = await vitalsService.getLatestVitals(user.uid);
      setLatestVitals(vitals);
    } catch (error) {
      console.error("Error fetching vitals:", error);
      Alert.alert('Error', 'Failed to load vitals data. Please check your connection and Firestore rules.');
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
  
  const handleSaveVital = (data: any) => {
    if (!user) return;
    vitalsService.addVitalRecord(user.uid, { ...data, date: new Date().toISOString() })
      .then(() => {
        setAddModalVisible(false);
        onRefresh();
        Alert.alert('Success', 'Vital record saved.');
      })
      .catch(err => {
        Alert.alert('Error', 'Failed to save record.');
        console.error(err);
      });
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

  return (
    <SafeAreaView style={styles.container}>
      <QuickAddModal 
        visible={isAddModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleSaveVital}
      />
      <VitalDetailsModal
        visible={isDetailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        vitalId={selectedVitalId}
      />
      <Modal visible={isScanModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Scan for Devices</Text>
            {allDevices.length === 0 && <ActivityIndicator size="small" color={Colors.light.primary} />}
            <FlatList
              data={allDevices}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.deviceItem} onPress={() => handleDeviceSelection(item)}>
                  <Text style={styles.deviceName}>{item.name || 'Unnamed Device'}</Text>
                  <Text style={styles.deviceId}>{item.id}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => { setScanModalVisible(false); stopScan(); }}>
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Vitals Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {connectedDevice ? `Connected to ${connectedDevice.name}` : 'Track your health metrics'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add-circle" size={32} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />}
      >
        <View style={styles.syncContainer}>
          <Ionicons name="bluetooth" size={24} color={connectedDevice ? Colors.light.success : Colors.light.primary} />
          <View style={styles.syncTextContainer}>
            <Text style={styles.syncTitle}>Health-e Sync</Text>
            <Text style={styles.syncStatus}>
              {connectedDevice ? `Live data from ${connectedDevice.name}` : 'Connect your smartwatch'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.syncButton} 
            onPress={connectedDevice ? disconnectDevice : startScan}
          >
            <Text style={styles.syncButtonText}>{connectedDevice ? 'Disconnect' : 'Connect'}</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 20 }} />}
        
        {!loading && (
            <View style={styles.cardsGrid}>
              {vitalCards.map((card) => (
                <VitalCard key={card.id} card={card} onPress={() => handleCardPress(card.id)} />
              ))}
            </View>
        )}

        {!loading && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Coming Soon', 'View history feature will be available soon!')}
            >
              <Ionicons name="time-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.actionText}>View History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Coming Soon', 'AI Insights coming soon!')}
            >
              <Ionicons name="sparkles-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.actionText}>AI Insights</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Coming Soon', 'Export feature coming soon!')}
            >
              <Ionicons name="download-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.actionText}>Export Data</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 100, // Ensure space for scroll
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
  syncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  syncTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  syncStatus: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  syncButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  syncButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  deviceItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  deviceId: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: Colors.light.textLight,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
