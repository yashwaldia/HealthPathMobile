// components/wellness/DailyChecklistCard.tsx
// Daily task checklist component
// Last Updated: December 11, 2025 - FIXED: task.name

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { DailyTask } from '../../types/wellness';

type Props = {
  title: string;
  date: string;
  tasks: DailyTask[];
  onToggleTask: (taskId: string) => void;
};

export default function DailyChecklistCard({ title, date, tasks, onToggleTask }: Props) {
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const completionPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{date}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{`${completedCount}/${totalCount}`}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${completionPercentage}%` as any }, // TypeScript workaround
          ]}
        />
      </View>

      {/* Task list */}
      <View style={styles.taskList}>
        {tasks.map((task, index) => (
          <TouchableOpacity
            key={task.taskId}
            style={[styles.taskItem, index === tasks.length - 1 && styles.taskItemLast]}
            onPress={() => onToggleTask(task.taskId)}
            activeOpacity={0.7}
          >
            {/* Checkbox */}
            <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
              {task.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>

            {/* Task content */}
            <View style={styles.taskContent}>
              <Text style={[styles.taskName, task.completed && styles.taskNameCompleted]}>
                {task.name}
              </Text>
              {task.description && (
                <Text style={styles.taskDescription}>{task.description}</Text>
              )}
            </View>

            {/* Time badge if exists */}
            {task.reminderTime && !task.completed && (
              <View style={styles.timeBadge}>
                <Ionicons name="time-outline" size={12} color={Colors.light.textSecondary} />
                <Text style={styles.timeText}>{task.reminderTime}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Empty state */}
      {tasks.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={32} color={Colors.light.textSecondary} />
          <Text style={styles.emptyText}>No tasks for today</Text>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  badge: {
    backgroundColor: Colors.light.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
  taskList: {
    gap: 0,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  taskItemLast: {
    borderBottomWidth: 0,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.light.textSecondary,
  },
  taskDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
});
