// app/(tabs)/medication-tracker.tsx
// ✅ REDESIGNED: Compact calendar + date popup + smart import button below calendar
// Last Updated: December 18, 2025


import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CircularProgress from '../../components/medication/CircularProgress';
import DoseHistorySection from '../../components/medication/DoseHistorySection';
import MedicationCalendar from '../../components/medication/MedicationCalendar';
import MergeConflictModal from '../../components/medication/MergeConflictModal';
import SmartImportModal from '../../components/medication/SmartImportModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CustomToast from '../../components/ui/CustomToast';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { deleteMedication, getAllMedications, getDoseHistory, logDose } from '../../services/medicationService';
import { smartImportMedications } from '../../services/smartImportService';
import { DoseLog, Medication } from '../../types/medication';
import { getDailySummaryToast, getMotivationalToast } from '../../utils/motivationalMessages';


// Frequency map
const FREQUENCY_MAP: Record<string, number> = {
  'Once a day': 1,
  'Twice a day': 2,
  'Thrice a day': 3,
  'Four times a day': 4,
  'Every 4 hours': 6,
  'Every 6 hours': 4,
  'Every 8 hours': 3,
  'Every 12 hours': 2,
  'As needed': 1,
  'Weekly': 0.14,
  'Custom': 1,
};


export default function MedicationTrackerScreen() {
  const router = useRouter();
  const { user } = useAuth();


  // State
  const [medications, setMedications] = useState<Medication[]>([]);
  const [activeMedications, setActiveMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [dosesMap, setDosesMap] = useState<{ [key: string]: DoseLog[] }>({});


  // Modals
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [showMergeConflict, setShowMergeConflict] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);


  // ✅ NEW: Date popup state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [datePopupVisible, setDatePopupVisible] = useState(false);


  // Toast
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });


  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ visible: true, message, type });
  };


  const loadMedications = useCallback(async () => {
    if (!user?.uid) return;


    try {
      setLoading(true);
      const allMeds = await getAllMedications(user.uid);
      setMedications(allMeds);
      setActiveMedications(allMeds.filter((med) => med.isActive));


      const dosesPromises = allMeds.map(async (med) => {
        if (!med.isActive) return { medicationId: med.medicationId, doses: [] as DoseLog[] };
        const history = await getDoseHistory(user.uid!, med.medicationId, 30);
        return { medicationId: med.medicationId, doses: history };
      });


      const dosesResults = await Promise.all(dosesPromises);
      const newDosesMap: { [key: string]: DoseLog[] } = {};
      dosesResults.forEach((result) => {
        if (result) {
          newDosesMap[result.medicationId] = result.doses;
        }
      });
      setDosesMap(newDosesMap);
    } catch (error) {
      console.error('Error loading medications:', error);
      showToast('Failed to load medications', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMedications();
    setRefreshing(false);
  }, [loadMedications]);


  useEffect(() => {
    loadMedications();
  }, [loadMedications]);


  const handleDeleteMedication = (medicationId: string, name: string) => {
    setDeleteTarget({ id: medicationId, name });
  };


  const confirmDeleteMedication = async () => {
    if (!user?.uid || !deleteTarget) return;


    try {
      await deleteMedication(user.uid, deleteTarget.id);
      await loadMedications();
      showToast(`"${deleteTarget.name}" deleted`, 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete medication', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };


  const handleMarkDoseTaken = async (medication: Medication) => {
    try {
      if (!user?.uid) return;
      const now = new Date();


      await logDose(user.uid, medication.medicationId, {
        scheduledTime: now.toISOString(),
        takenTime: now.toISOString(),
        taken: true,
        skipped: false,
      });


      showToast(`${medication.name} dose taken! ✅`, 'success');
      await loadMedications();
    } catch (error) {
      console.error('Log dose error:', error);
      showToast('Failed to log dose', 'error');
    }
  };


  const getMedicationStatus = (medication: Medication) => {
    const doses = dosesMap[medication.medicationId] || [];
    const { startDate, durationDays, frequency } = medication;
    const start = new Date(startDate);
    const duration = durationDays ? parseInt(durationDays.toString(), 10) : 0;


    if (isNaN(start.getTime()) || (durationDays && isNaN(duration))) {
      return { adherence: 0, dosesTakenToday: 0, expectedDoses: 0, isDue: false, isActive: false };
    }


    const today = new Date();
    let isActiveDateRange = true;
    if (duration > 0) {
      const end = new Date(start);
      end.setDate(start.getDate() + duration);
      isActiveDateRange = today >= start && today < end;
    }


    const todayStr = today.toDateString();
    const dosesTakenToday = doses.filter((d) => {
      const dDate = d.takenTime ? new Date(d.takenTime) : new Date(d.createdAt || '');
      return dDate.toDateString() === todayStr;
    }).length;


    const expectedDosesPerDay = FREQUENCY_MAP[frequency] || 1;
    const daysSinceStart = Math.max(
      0,
      Math.floor(
        (new Date(today.toDateString()).getTime() - new Date(start.toDateString()).getTime()) /
          (1000 * 3600 * 24)
      )
    );
    const totalExpectedDosesSoFar =
      Math.min(daysSinceStart + 1, duration || 9999) * expectedDosesPerDay;
    const totalTaken = doses.length;


    const adherence =
      totalExpectedDosesSoFar > 0
        ? Math.min(100, Math.round((totalTaken / totalExpectedDosesSoFar) * 100))
        : 100;
    const isDueNow = isActiveDateRange && dosesTakenToday < expectedDosesPerDay;


    return {
      adherence,
      dosesTakenToday,
      expectedDoses: expectedDosesPerDay,
      isDue: isDueNow,
      isActive: isActiveDateRange,
    };
  };


  const handleSmartImport = async (extractedMeds: any[]) => {
    if (!user?.uid) return;


    try {
      const results = await smartImportMedications(user.uid, extractedMeds);
      const toastMsg = getMotivationalToast(
        'dose_taken',
        undefined,
        undefined,
        results.addedCount + results.mergedCount
      );
      showToast(toastMsg.message, 'success');
      await loadMedications();
      setShowSmartImport(false);
    } catch (error: any) {
      console.error('Smart import error:', error);
      if (error.conflict) {
        setCurrentConflict(error.conflict);
        setShowMergeConflict(true);
      } else {
        showToast('Import failed: ' + (error.message || 'Unknown error'), 'error');
      }
    }
  };


  // ✅ NEW: Handle date press - show popup with medications
  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    setDatePopupVisible(true);
  };


  // ✅ NEW: Get medications for selected date
  const getMedicationsForDate = (date: Date): Medication[] => {
    return medications.filter(med => {
      const start = new Date(med.startDate);
      const duration = med.durationDays ? parseInt(med.durationDays.toString(), 10) : 0;
      
      if (isNaN(start.getTime()) || isNaN(duration) || duration <= 0) {
        return false;
      }


      const end = new Date(start);
      end.setDate(start.getDate() + duration);


      const dayOnly = new Date(date);
      dayOnly.setHours(0, 0, 0, 0);
      const startOnly = new Date(start);
      startOnly.setHours(0, 0, 0, 0);
      const endOnly = new Date(end);
      endOnly.setHours(0, 0, 0, 0);


      return dayOnly >= startOnly && dayOnly < endOnly;
    });
  };


  const renderMedicationCard = (medication: Medication) => {
    const status = getMedicationStatus(medication);
    const doses = dosesMap[medication.medicationId] || [];
    const isAsNeeded =
      medication.frequency === 'As needed' || medication.frequency === 'Custom';


    return (
      <View key={medication.medicationId} style={styles.medicationCard}>
        <View style={styles.cardHeader}>
          <View style={styles.progressSection}>
            <CircularProgress
              percentage={status.adherence}
              size={60}
              strokeWidth={6}
              showPercentage={false}
              label="Adherence"
            />
            <View style={styles.progressText}>
              <Text style={styles.adherenceText}>{status.adherence}%</Text>
              <Text style={styles.statusText}>
                {status.isDue
                  ? '📅 Due Now'
                  : status.isActive
                  ? '✅ On Track'
                  : '⏸️ Completed'}
              </Text>
            </View>
          </View>


          <View style={styles.medicationInfo}>
            <Text style={styles.medicationName}>{medication.name}</Text>
            <Text style={styles.medicationStrength}>
              {medication.strength} • {medication.dosageForm}
            </Text>
            <Text style={styles.frequencyText}>{medication.frequency}</Text>
          </View>


          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() =>
              handleDeleteMedication(medication.medicationId, medication.name)
            }
          >
            <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
          </TouchableOpacity>
        </View>


        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons
              name="restaurant-outline"
              size={16}
              color={Colors.light.textSecondary}
            />
            <Text style={styles.detailText}>{medication.mealRelation}</Text>
          </View>
          {medication.purpose && (
            <View style={styles.detailItem}>
              <Ionicons
                name="help-circle-outline"
                size={16}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.detailText}>{medication.purpose}</Text>
            </View>
          )}
        </View>


        <DoseHistorySection doseHistory={doses.slice(0, 5)} />


        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              !status.isDue && !isAsNeeded && styles.primaryButtonDisabled,
            ]}
            onPress={() => handleMarkDoseTaken(medication)}
            disabled={!status.isDue && !isAsNeeded}
          >
            <Ionicons
              name={
                status.isDue || isAsNeeded
                  ? 'checkmark-circle'
                  : 'checkmark-done-circle'
              }
              size={20}
              color="white"
            />
            <Text style={styles.primaryButtonText}>
              {isAsNeeded
                ? `Take Now (${status.dosesTakenToday})`
                : status.isDue
                ? `Take Now (${status.dosesTakenToday}/${status.expectedDoses})`
                : `All Done!`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };


  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="medkit-outline"
        size={80}
        color={Colors.light.textSecondary}
      />
      <Text style={styles.emptyStateTitle}>No Medications</Text>
      <Text style={styles.emptyStateSubtitle}>
        Start tracking your medications
      </Text>
      <TouchableOpacity
        style={styles.addButtonEmpty}
        onPress={() => router.push('/add-medication')}
      >
        <Ionicons name="add-circle" size={24} color="white" />
        <Text style={styles.addButtonEmptyText}>Add First Medication</Text>
      </TouchableOpacity>
    </View>
  );


  const displayedMedications = showInactive ? medications : activeMedications;


  const dailySummary = useMemo(() => {
    const totalExpected = activeMedications.reduce((sum, med) => {
      return sum + (FREQUENCY_MAP[med.frequency] || 1);
    }, 0);
    const totalTaken = Object.values(dosesMap).reduce((sum, doses) => {
      return (
        sum +
        doses.filter((d) => {
          const dDate = new Date(d.takenTime || d.createdAt || '');
          return dDate.toDateString() === new Date().toDateString();
        }).length
      );
    }, 0);
    return getDailySummaryToast(
      totalExpected,
      totalTaken,
      activeMedications.length
    );
  }, [activeMedications, dosesMap]);


  // ✅ NEW: Date popup content
  const selectedDateMeds = selectedDate ? getMedicationsForDate(selectedDate) : [];


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />


      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Medication"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDeleteMedication}
        onCancel={() => setDeleteTarget(null)}
      />


      <MergeConflictModal
        visible={showMergeConflict}
        conflict={currentConflict}
        onClose={() => {
          setShowMergeConflict(false);
          setCurrentConflict(null);
        }}
        onResolve={async () => {
          setShowMergeConflict(false);
          await loadMedications();
          showToast('Conflict resolved!', 'success');
        }}
      />


      <SmartImportModal
        visible={showSmartImport}
        onClose={() => setShowSmartImport(false)}
        onSaveAll={handleSmartImport}
      />


      {/* ✅ NEW: Date Popup Modal */}
      <Modal
        visible={datePopupVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePopupVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDatePopupVisible(false)}
        >
          <View style={styles.datePopup}>
            <View style={styles.datePopupHeader}>
              <Text style={styles.datePopupTitle}>
                {selectedDate?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              <TouchableOpacity onPress={() => setDatePopupVisible(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>


            {selectedDateMeds.length === 0 ? (
              <View style={styles.noMedsContainer}>
                <Ionicons name="bandage-outline" size={48} color={Colors.light.textSecondary} />
                <Text style={styles.noMedsText}>No medications scheduled</Text>
              </View>
            ) : (
              <ScrollView style={styles.datePopupScroll}>
                {selectedDateMeds.map((med, index) => (
                  <View key={med.medicationId} style={styles.popupMedCard}>
                    <View style={styles.popupMedIcon}>
                      <Ionicons name="medical" size={24} color={Colors.light.primary} />
                    </View>
                    <View style={styles.popupMedInfo}>
                      <Text style={styles.popupMedName}>{med.name}</Text>
                      <Text style={styles.popupMedDetails}>
                        {med.strength} • {med.frequency}
                      </Text>
                      <Text style={styles.popupMedMeal}>{med.mealRelation}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>


      {/* ✅ UPDATED: Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medication Tracker</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/add-medication')}
        >
          <Ionicons name="add" size={28} color={Colors.light.text} />
        </TouchableOpacity>
      </View>


      {/* ✅ FIXED: Everything moved inside ScrollView */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* ✅ UPDATED: Compact Calendar */}
          <View style={styles.calendarSection}>
            <MedicationCalendar 
              medications={medications}
              onDatePress={handleDatePress}
            />
          </View>


          {/* ✅ NEW: Smart Import Button (below calendar) */}
          <View style={styles.smartImportContainer}>
            <TouchableOpacity
              style={styles.smartImportButton}
              onPress={() => setShowSmartImport(true)}
            >
              <Ionicons name="sparkles" size={20} color="white" />
              <Text style={styles.smartImportButtonText}>
                Smart Import Medications
              </Text>
            </TouchableOpacity>
          </View>


          {/* Filter Toggle */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, !showInactive && styles.filterButtonActive]}
              onPress={() => setShowInactive(false)}
            >
              <Text
                style={[
                  styles.filterText,
                  !showInactive && styles.filterTextActive,
                ]}
              >
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, showInactive && styles.filterButtonActive]}
              onPress={() => setShowInactive(true)}
            >
              <Text
                style={[
                  styles.filterText,
                  showInactive && styles.filterTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
          </View>


          {/* Daily Summary */}
          {activeMedications.length > 0 && (
            <View style={styles.dailySummary}>
              <Text style={styles.dailySummaryText}>{dailySummary.message}</Text>
            </View>
          )}


          {/* Medications List */}
          {displayedMedications.length === 0
            ? renderEmptyState()
            : displayedMedications.map(renderMedicationCard)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  // ✅ UPDATED: Header with back button
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
    textAlign: 'center',
  },
  headerButton: {
    padding: 4,
    width: 40,
    alignItems: 'flex-end',
  },
  // ✅ UPDATED: Smaller calendar
  calendarSection: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  // ✅ NEW: Smart import button container
  smartImportContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  smartImportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  smartImportButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  // ✅ NEW: Date popup modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePopup: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  datePopupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  datePopupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  datePopupScroll: {
    maxHeight: 400,
  },
  noMedsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noMedsText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 12,
  },
  popupMedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 12,
  },
  popupMedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupMedInfo: {
    flex: 1,
  },
  popupMedName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  popupMedDetails: {
    fontSize: 14,
    color: Colors.light.primary,
    marginBottom: 2,
  },
  popupMedMeal: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: Colors.light.background,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  dailySummary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  dailySummaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  progressSection: {
    alignItems: 'center',
    gap: 4,
  },
  progressText: {
    alignItems: 'center',
  },
  adherenceText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statusText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 2,
  },
  medicationStrength: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  frequencyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    gap: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  addButtonEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
  },
  addButtonEmptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});
