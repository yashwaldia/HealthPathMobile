// components/wellness/MedicalRemindersCard.tsx
// Medical appointments and reminders card
// Last Updated: December 11, 2025 - FIXED checkbox update

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { MedicalReminder, UrgencyLevel } from '../../types/wellness';

type Props = {
  reminders: MedicalReminder[];
  onReminderPress: (reminder: MedicalReminder) => void;
};

const URGENCY_CONFIG: Record<UrgencyLevel, { color: string; icon: string }> = {
  overdue: {
    color: '#FF4757',
    icon: 'alert-circle',
  },
  'due-soon': {
    color: '#FFA502',
    icon: 'warning',
  },
  upcoming: {
    color: '#26DE81',
    icon: 'checkmark-circle',
  },
};

export default function MedicalRemindersCard({ reminders, onReminderPress }: Props) {
  // Sort by urgency (completed items at the end)
  const sortedReminders = [...reminders].sort((a, b) => {
    // Completed items go to the bottom
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    
    // Then sort by urgency
    const urgencyOrder = { overdue: 0, 'due-soon': 1, upcoming: 2 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="calendar-outline" size={20} color={Colors.light.primary} />
        <Text style={styles.headerTitle}>Medical Reminders</Text>
      </View>

      {/* Reminders list */}
      <View style={styles.remindersList}>
        {sortedReminders.map((reminder) => {
          const config = URGENCY_CONFIG[reminder.urgency];
          return (
            <TouchableOpacity
              key={reminder.reminderId}
              style={[
                styles.reminderItem,
                reminder.completed && styles.reminderItemCompleted,
              ]}
              onPress={() => onReminderPress(reminder)}
              activeOpacity={0.7}
            >
              {/* Urgency indicator */}
              <View 
                style={[
                  styles.urgencyBar, 
                  { backgroundColor: reminder.completed ? Colors.light.border : config.color }
                ]} 
              />

              {/* Content */}
              <View style={styles.reminderContent}>
                <View style={styles.reminderHeader}>
                  <Ionicons
                    name={reminder.completed ? 'checkmark-circle' : (config.icon as any)}
                    size={18}
                    color={reminder.completed ? Colors.light.primary : config.color}
                    style={styles.urgencyIcon}
                  />
                  <Text
                    style={[
                      styles.reminderTitle,
                      reminder.completed && styles.reminderTitleCompleted,
                    ]}
                  >
                    {reminder.title}
                  </Text>
                </View>

                <Text style={styles.reminderDescription}>{reminder.description}</Text>

                {/* Date info */}
                <View style={styles.dateRow}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={Colors.light.textSecondary}
                  />
                  <Text style={styles.dateText}>
                    {reminder.dueDateRange || reminder.dueDate}
                  </Text>
                  {reminder.completed && reminder.completedDate && (
                    <Text style={styles.completedBadge}>
                      ✓ Completed
                    </Text>
                  )}
                </View>
              </View>

              {/* Completion checkbox */}
              <View
                style={[
                  styles.checkbox,
                  reminder.completed && styles.checkboxCompleted,
                ]}
              >
                {reminder.completed && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Empty state */}
      {reminders.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons
            name="calendar-outline"
            size={32}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.emptyText}>No medical reminders</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginLeft: 8,
  },
  remindersList: {
    gap: 12,
  },
  reminderItem: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    position: 'relative',
    overflow: 'hidden',
  },
  reminderItemCompleted: {
    opacity: 0.7,
    backgroundColor: Colors.light.background,
  },
  urgencyBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  reminderContent: {
    flex: 1,
    marginLeft: 8,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  urgencyIcon: {
    marginRight: 6,
  },
  reminderTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  reminderTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.light.textSecondary,
  },
  reminderDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  dateText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  completedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
    backgroundColor: Colors.light.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkboxCompleted: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
});
