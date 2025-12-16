// components/wellness/child-care/VaccinationTrackerCard.tsx
// Shows upcoming vaccines and per-child vaccination status
// Last Updated: December 16, 2025

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { VACCINATION_SCHEDULE } from '../../../constants/childCareData';
import { VaccinationStatus } from '../../../types/wellness';

type Props = {
  childAgeInMonths: number;
  vaccinations: Record<string, VaccinationStatus>; // key: vaccine id or label
};

type ScheduleRow = {
  age: string;
  vaccines: string[];
};

export default function VaccinationTrackerCard({
  childAgeInMonths,
  vaccinations,
}: Props) {
  const schedule = VACCINATION_SCHEDULE as unknown as ScheduleRow[];

  const upcoming = useMemo(() => {
    const ageNum = childAgeInMonths;

    return schedule
      .filter((row) => {
        const match = row.age.match(/(\d+)/);
        if (!match) return false;
        const ageValue = parseInt(match[0], 10);

        // Show roughly next 6 months window
        return ageValue >= ageNum && ageValue <= ageNum + 6;
      })
      .slice(0, 5);
  }, [schedule, childAgeInMonths]);

  const getStatusForLabel = (label: string): VaccinationStatus | null => {
    // vaccinations map in profile uses vaccineId keys; if you map by label, adjust here.
    return (vaccinations[label] as VaccinationStatus) || null;
  };

  const renderStatusChip = (status: VaccinationStatus | null) => {
    if (!status) {
      return (
        <View style={[styles.statusChip, styles.statusUpcoming]}>
          <Text style={styles.statusText}>Planned</Text>
        </View>
      );
    }

    switch (status) {
      case 'Completed':
        return (
          <View style={[styles.statusChip, styles.statusCompleted]}>
            <Ionicons name="checkmark-circle" size={14} color="#0A7F3F" />
            <Text style={[styles.statusText, styles.statusTextCompleted]}>
              Completed
            </Text>
          </View>
        );
      case 'Missed':
        return (
          <View style={[styles.statusChip, styles.statusMissed]}>
            <Ionicons name="alert-circle" size={14} color="#FF3B30" />
            <Text style={[styles.statusText, styles.statusTextMissed]}>
              Missed
            </Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusChip, styles.statusUpcoming]}>
            <Ionicons name="time-outline" size={14} color={Colors.light.primary} />
            <Text style={styles.statusText}>Upcoming</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="medkit-outline" size={20} color={Colors.light.primary} />
          <Text style={styles.title}>Vaccination Tracker</Text>
        </View>
        <Text style={styles.subtitle}>Next 6 months</Text>
      </View>

      {upcoming.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons
            name="checkmark-done-outline"
            size={20}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.emptyText}>
            No scheduled vaccines in the next few months based on the default
            schedule. Always follow your pediatrician’s plan.
          </Text>
        </View>
      ) : (
        upcoming.map((row, index) => (
          <View key={`${row.age}-${index}`} style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.ageLabel}>{row.age}</Text>
              <Text style={styles.vaccineText}>{row.vaccines.join(', ')}</Text>
            </View>
            {renderStatusChip(getStatusForLabel(row.age))}
          </View>
        ))
      )}

      <Text style={styles.disclaimer}>
        This schedule is a general reference and may not match your country’s
        exact program. Always follow your pediatrician’s vaccination advice.
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
    marginBottom: 10,
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
  subtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  statusUpcoming: {
    backgroundColor: Colors.light.primary + '10',
  },
  statusCompleted: {
    backgroundColor: '#E4F8ED',
  },
  statusMissed: {
    backgroundColor: '#FFE5E3',
  },
  statusTextCompleted: {
    color: '#0A7F3F',
  },
  statusTextMissed: {
    color: '#FF3B30',
  },
  emptyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
  },
  emptyText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  disclaimer: {
    marginTop: 8,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
});
