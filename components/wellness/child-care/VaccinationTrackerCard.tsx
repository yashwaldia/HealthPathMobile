// components/wellness/child-care/VaccinationTrackerCard.tsx
// Interactive vaccination tracker with status updates
// Last Updated: December 17, 2025 - ✅ Shows ALL vaccines with auto-status calculation

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { VACCINATION_SCHEDULE } from '../../../constants/childCareData';
import { Colors } from '../../../constants/colors';
import { VaccinationStatus } from '../../../types/wellness';

type Props = {
  childAgeInMonths: number;
  vaccinations: Record<string, VaccinationStatus>;
  onUpdateStatus: (vaccineId: string, status: VaccinationStatus | null) => void;
};

export default function VaccinationTrackerCard({
  childAgeInMonths,
  vaccinations,
  onUpdateStatus,
}: Props) {
  // Calculate child's age in weeks for accurate status
  const childAgeInWeeks = useMemo(() => childAgeInMonths * 4.33, [childAgeInMonths]);

  // Get status for each vaccine (manual override or auto-calculated)
  const getVaccineStatus = (vaccineId: string, dueAgeInWeeks: number): VaccinationStatus => {
    // Check if manually marked
    if (vaccinations[vaccineId] === 'Completed') return 'Completed';
    if (vaccinations[vaccineId] === 'Missed') return 'Missed';

    // Auto-calculate based on child's age
    const weeksDifference = childAgeInWeeks - dueAgeInWeeks;

    if (weeksDifference < -4) {
      // More than 4 weeks before due date
      return 'Upcoming';
    } else if (weeksDifference >= -4 && weeksDifference <= 4) {
      // Within 4 weeks window (before or after due date)
      return 'Pending';
    } else {
      // More than 4 weeks overdue
      return 'Missed';
    }
  };

  // Process all vaccines with their statuses
  const allVaccinesWithStatus = useMemo(() => {
    return VACCINATION_SCHEDULE.map((vaccine) => ({
      ...vaccine,
      status: getVaccineStatus(vaccine.id, vaccine.ageInWeeks),
    }));
  }, [childAgeInWeeks, vaccinations]);

  // Calculate completion statistics
  const stats = useMemo(() => {
    const completed = allVaccinesWithStatus.filter((v) => v.status === 'Completed').length;
    const total = allVaccinesWithStatus.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  }, [allVaccinesWithStatus]);

  const handleStatusPress = (vaccineId: string, vaccineName: string, currentStatus: VaccinationStatus) => {
    Alert.alert(
      vaccineName,
      `Current status: ${currentStatus}\n\nUpdate vaccination status:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Completed',
          onPress: () => onUpdateStatus(vaccineId, 'Completed'),
        },
        {
          text: 'Mark Missed',
          style: 'destructive',
          onPress: () => onUpdateStatus(vaccineId, 'Missed'),
        },
        // Show reset option if manually marked
        ...(vaccinations[vaccineId]
          ? [
              {
                text: 'Reset Status',
                onPress: () => onUpdateStatus(vaccineId, null),
              },
            ]
          : []),
      ]
    );
  };

  const renderStatusChip = (
    vaccineId: string,
    vaccineName: string,
    status: VaccinationStatus
  ) => {
    const isManuallySet = vaccinations[vaccineId] !== undefined;

    switch (status) {
      case 'Completed':
        return (
          <TouchableOpacity
            style={[styles.statusChip, styles.statusCompleted]}
            onPress={() => handleStatusPress(vaccineId, vaccineName, status)}
          >
            <Ionicons name="checkmark-circle" size={14} color="#0A7F3F" />
            <Text style={[styles.statusText, styles.statusTextCompleted]}>
              Done
            </Text>
          </TouchableOpacity>
        );
      case 'Missed':
        return (
          <TouchableOpacity
            style={[styles.statusChip, styles.statusMissed]}
            onPress={() => handleStatusPress(vaccineId, vaccineName, status)}
          >
            <Ionicons name="alert-circle" size={14} color="#FF3B30" />
            <Text style={[styles.statusText, styles.statusTextMissed]}>
              Missed
            </Text>
          </TouchableOpacity>
        );
      case 'Pending':
        return (
          <TouchableOpacity
            style={[styles.statusChip, styles.statusPending]}
            onPress={() => handleStatusPress(vaccineId, vaccineName, status)}
          >
            <Ionicons name="time-outline" size={14} color="#FFB020" />
            <Text style={[styles.statusText, styles.statusTextPending]}>
              Due Now
            </Text>
          </TouchableOpacity>
        );
      case 'Upcoming':
      default:
        return (
          <TouchableOpacity
            style={[styles.statusChip, styles.statusUpcoming]}
            onPress={() => handleStatusPress(vaccineId, vaccineName, status)}
          >
            <Ionicons name="calendar-outline" size={14} color={Colors.light.primary} />
            <Text style={styles.statusText}>Upcoming</Text>
          </TouchableOpacity>
        );
    }
  };

  return (
    <View style={styles.card}>
      {/* Header with Progress */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="medkit-outline" size={20} color={Colors.light.primary} />
          <Text style={styles.title}>Vaccination Tracker</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>
            {stats.completed}/{stats.total}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[styles.progressBarFill, { width: `${stats.percentage}%` }]}
          />
        </View>
        <Text style={styles.progressLabel}>{stats.percentage}% Complete</Text>
      </View>

      {/* All Vaccines List */}
      {allVaccinesWithStatus.map((vaccine, index) => (
        <View
          key={vaccine.id}
          style={[styles.row, index === 0 && { borderTopWidth: 0 }]}
        >
          <View style={styles.rowLeft}>
            <Text style={styles.ageLabel}>{vaccine.ageDescription}</Text>
            <Text style={styles.vaccineText}>{vaccine.name}</Text>
          </View>
          {renderStatusChip(vaccine.id, vaccine.name, vaccine.status)}
        </View>
      ))}

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={Colors.light.primary}
        />
        <Text style={styles.infoText}>
          Tap any vaccine to update its status. Status is auto-calculated based on child's age.
        </Text>
      </View>

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        This schedule follows the Indian immunization program. Always consult your pediatrician.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  progressBadge: {
    backgroundColor: Colors.light.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border + '40',
  },
  rowLeft: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },
  ageLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  vaccineText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 4,
    minWidth: 90,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  statusUpcoming: {
    backgroundColor: Colors.light.primary + '15',
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
  },
  statusCompleted: {
    backgroundColor: '#E4F8ED',
    borderWidth: 1,
    borderColor: '#0A7F3F' + '30',
  },
  statusPending: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFB020' + '30',
  },
  statusMissed: {
    backgroundColor: '#FFE5E3',
    borderWidth: 1,
    borderColor: '#FF3B30' + '30',
  },
  statusTextCompleted: {
    color: '#0A7F3F',
  },
  statusTextPending: {
    color: '#FFB020',
  },
  statusTextMissed: {
    color: '#FF3B30',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  disclaimer: {
    marginTop: 4,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
});
