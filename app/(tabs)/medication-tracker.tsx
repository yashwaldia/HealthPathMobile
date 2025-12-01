// app/(tabs)/medication-tracker.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import {
  getAllMedications,
  deleteMedication,
  logDose,
  getDoseHistory,
} from '../../services/medicationService';
import { Medication, DoseLog } from '../../types/medication';

// UI components
import CustomToast from '../../components/ui/CustomToast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

// Frequency map to calculate expected daily doses
const FREQUENCY_MAP: Record<string, number> = {
  'Once a day': 1,
  'Twice a day': 2,
  'Thrice a day': 3,
  'Four times a day': 4,
  'As needed': 0,
  Custom: 0,
  'Every 4 hours': 6,
  'Every 6 hours': 4,
  'Every 8 hours': 3,
  'Every 12 hours': 2,
  Weekly: 0,
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

  // Store dose history for each medication locally
  const [dosesMap, setDosesMap] = useState<{ [key: string]: DoseLog[] }>({});

  // Toast state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ visible: true, message, type });
  };

  /**
   * Load medications and their dose history
   */
  const loadMedications = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      const allMeds = await getAllMedications(user.uid);
      setMedications(allMeds);
      setActiveMedications(allMeds.filter((med) => med.isActive));

      const dosesPromises = allMeds.map(async (med) => {
        if (!med.isActive) return { medicationId: med.medicationId, doses: [] };
        const history = await getDoseHistory(user.uid!, med.medicationId, 100);
        return { medicationId: med.medicationId, doses: history };
      });

      const dosesResults = await Promise.all(dosesPromises);

      const newDosesMap: { [key: string]: DoseLog[] } = {};
      dosesResults.forEach((result) => {
        newDosesMap[result.medicationId] = result.doses;
      });

      setDosesMap(newDosesMap);
    } catch (error) {
      console.error('Error loading medications:', error);
      showToast('Failed to load medications', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Refresh medications
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMedications();
    setRefreshing(false);
  }, [loadMedications]);



  /**
   * Load medications on mount
   */
  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  /**
   * Handle delete medication (open confirm dialog)
   */
  const handleDeleteMedication = (medicationId: string, name: string) => {
    setDeleteTarget({ id: medicationId, name });
  };

  const confirmDeleteMedication = async () => {
    if (!user?.uid || !deleteTarget) return;

    try {
      await deleteMedication(user.uid, deleteTarget.id);
      await loadMedications();
      showToast(`Medication "${deleteTarget.name}" deleted`, 'success');
    } catch (error) {
      console.error('Delete medication error:', error);
      showToast('Failed to delete medication', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  /**
   * Handle mark dose as taken
   */
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

      showToast(`Dose of ${medication.name} marked as taken`, 'success');
      await loadMedications();
    } catch (error) {
      console.error('Log dose error:', error);
      showToast('Failed to log dose', 'error');
    }
  };

  /**
   * Calculate adherence and status for a single medication
   */
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
      const dDate = d.takenTime ? new Date(d.takenTime) : new Date(d.createdAt);
      return dDate.toDateString() === todayStr;
    }).length;

    if (frequency === 'As needed' || frequency === 'Custom' || frequency === 'Weekly') {
      return {
        adherence: 100,
        dosesTakenToday,
        expectedDoses: 0,
        isDue: true,
        isActive: isActiveDateRange,
      };
    }

    const expectedDosesPerDay = FREQUENCY_MAP[frequency] || 1;

    const daysSinceStart = Math.max(
      0,
      Math.floor((today.getTime() - start.getTime()) / (1000 * 3600 * 24))
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

  /**
   * Render medication card
   */
  const renderMedicationCard = (medication: Medication) => {
    const { adherence, dosesTakenToday, expectedDoses, isDue } = getMedicationStatus(medication);

    const adherenceColor =
      adherence >= 80 ? Colors.light.success : adherence >= 60 ? '#FFA500' : Colors.light.error;
    const isAsNeeded = medication.frequency === 'As needed' || medication.frequency === 'Custom';

    return (
      <View key={medication.medicationId} style={styles.medicationCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.medicationInfo}>
            <View style={[styles.iconContainer, { backgroundColor: Colors.light.cardBackground }]}>
              <Ionicons name="medkit" size={24} color={Colors.light.primary} />
            </View>
            <View style={styles.medicationText}>
              <Text style={styles.medicationName}>{medication.name}</Text>
              <Text style={styles.medicationStrength}>
                {medication.strength} • {medication.dosageForm}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteMedication(medication.medicationId, medication.name)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
          </TouchableOpacity>
        </View>

        {/* Details */}
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.detailText}>{medication.frequency}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="restaurant-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.detailText}>{medication.mealRelation}</Text>
          </View>
          {medication.purpose && (
            <View style={styles.detailRow}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.detailText}>{medication.purpose}</Text>
            </View>
          )}
        </View>

        {/* Adherence Bar */}
        <View style={styles.adherenceContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.adherenceLabel}>Adherence</Text>
            <Text style={[styles.adherencePercentage, { color: adherenceColor }]}>
              {adherence}%
            </Text>
          </View>
          <View style={styles.adherenceBarBackground}>
            <View
              style={[
                styles.adherenceBarFill,
                { width: `${adherence}%`, backgroundColor: adherenceColor },
              ]}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.takeButton,
              !isDue && !isAsNeeded && styles.disabledButton,
            ]}
            onPress={() => handleMarkDoseTaken(medication)}
            disabled={!isDue && !isAsNeeded}
          >
            <Ionicons
              name={isDue || isAsNeeded ? 'checkmark-circle' : 'checkmark-done-circle'}
              size={20}
              color={!isDue && !isAsNeeded ? Colors.light.textSecondary : '#FFFFFF'}
            />
            <Text
              style={[
                styles.takeButtonText,
                !isDue && !isAsNeeded && { color: Colors.light.textSecondary },
              ]}
            >
              {isAsNeeded
                ? `Take Now (${dosesTakenToday})`
                : isDue
                ? `Take Now (${dosesTakenToday}/${expectedDoses})`
                : `All Done (${dosesTakenToday}/${expectedDoses})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              showToast('Edit medication will be available soon', 'info');
            }}
          >
            <Ionicons name="create-outline" size={20} color={Colors.light.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="medkit-outline" size={80} color={Colors.light.border} />
      <Text style={styles.emptyStateTitle}>No Medications Yet</Text>
      <Text style={styles.emptyStateText}>
        Add your first medication to start tracking your doses and adherence.
      </Text>
    </View>
  );

  const displayedMedications = showInactive ? medications : activeMedications;

  const overallAdherence = useMemo(() => {
    const activeMeds = medications.filter((m) => m.isActive);
    if (activeMeds.length === 0) return 0;

    const sumAdherence = activeMeds.reduce((sum, med) => {
      return sum + getMedicationStatus(med).adherence;
    }, 0);

    return Math.round(sumAdherence / activeMeds.length);
  }, [medications, dosesMap]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Toast */}
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Medication"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDeleteMedication}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medication Tracker</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{activeMedications.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{medications.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              { color: overallAdherence >= 80 ? Colors.light.success : Colors.light.primary },
            ]}
          >
            {overallAdherence}%
          </Text>
          <Text style={styles.statLabel}>Adherence</Text>
        </View>
      </View>

      {/* Filter Toggle */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, !showInactive && styles.filterButtonActive]}
          onPress={() => setShowInactive(false)}
        >
          <Text style={[styles.filterText, !showInactive && styles.filterTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, showInactive && styles.filterButtonActive]}
          onPress={() => setShowInactive(true)}
        >
          <Text style={[styles.filterText, showInactive && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
      </View>

      {/* Medications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {displayedMedications.length === 0 ? renderEmptyState() : displayedMedications.map(renderMedicationCard)}
        </ScrollView>
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          showToast('Add medication will be available soon', 'info');
        }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    marginTop: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.light.border,
    alignSelf: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  medicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medicationText: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  medicationStrength: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  cardDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  adherenceContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  adherenceLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  adherenceBarBackground: {
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  adherenceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  adherencePercentage: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  takeButton: {
    backgroundColor: Colors.light.primary,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  takeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
