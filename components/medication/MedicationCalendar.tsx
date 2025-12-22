// components/medication/MedicationCalendar.tsx
// ✅ COMPACT: Smaller calendar with pill icons instead of names
// Last Updated: December 18, 2025

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Medication } from '../../types/medication';

interface MedicationCalendarProps {
  medications: Medication[];
  onDatePress?: (date: Date) => void;
  showMonthHeader?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const CALENDAR_WIDTH = screenWidth - 48;
const DAY_WIDTH = CALENDAR_WIDTH / 7;

const MedicationCalendar: React.FC<MedicationCalendarProps> = ({
  medications,
  onDatePress,
  showMonthHeader = true,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const changeMonth = useCallback((offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  }, []);

  const { monthGrid, monthName, year } = useMemo(() => {
    const month = currentDate.getMonth();
    const yearNum = currentDate.getFullYear();

    const firstDayOfMonth = new Date(yearNum, month, 1).getDay();
    const daysInMonth = new Date(yearNum, month + 1, 0).getDate();

    const grid: (CalendarDay | null)[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      grid.push(null);
    }

    const getMedsForDay = (day: Date): Medication[] => {
      return medications.filter(med => {
        const start = new Date(med.startDate);
        const duration = med.durationDays ? parseInt(med.durationDays.toString(), 10) : 0;
        
        if (isNaN(start.getTime()) || isNaN(duration) || duration <= 0) {
          return false;
        }

        const end = new Date(start);
        end.setDate(start.getDate() + duration);

        const dayOnly = new Date(day);
        dayOnly.setHours(0, 0, 0, 0);
        const startOnly = new Date(start);
        startOnly.setHours(0, 0, 0, 0);
        const endOnly = new Date(end);
        endOnly.setHours(0, 0, 0, 0);

        return dayOnly >= startOnly && dayOnly < endOnly;
      });
    };

    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(yearNum, month, i);
      const activeMeds = getMedsForDay(dayDate);

      grid.push({
        date: dayDate,
        dayNumber: i,
        activeMedications: activeMeds,
        hasDoses: activeMeds.length > 0,
      });
    }

    return {
      monthGrid: grid,
      monthName: currentDate.toLocaleString('default', { month: 'long' }),
      year: yearNum,
    };
  }, [currentDate, medications]);

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const renderDay = (day: CalendarDay | null, index: number) => {
    if (!day) {
      return <View key={index} style={styles.emptyDay} />;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    const isToday = dayDate.getTime() === today.getTime();

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          day.hasDoses && styles.activeDay,
          isToday && styles.today,
        ]}
        onPress={() => onDatePress?.(day.date)}
        activeOpacity={0.7}
        disabled={!onDatePress}
      >
        <Text
          style={[
            styles.dayNumber,
            day.hasDoses && styles.activeDayNumber,
            isToday && styles.todayNumber,
          ]}
        >
          {day.dayNumber}
        </Text>

        {/* ✅ NEW: Show pill icon instead of names */}
        {day.hasDoses && (
          <View style={styles.pillIconContainer}>
            <Ionicons 
              name="medical" 
              size={16} 
              color="#10B981" 
            />
            {day.activeMedications.length > 1 && (
              <Text style={styles.medCount}>
                {day.activeMedications.length}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {showMonthHeader && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => changeMonth(-1)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={20} color="#6B7280" />
          </TouchableOpacity>

          <Text style={styles.monthHeader}>
            {monthName} {year}
          </Text>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => changeMonth(1)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.weekDaysContainer}>
        {weekDays.map((day, index) => (
          <Text key={index} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.gridContainer}>
        {monthGrid.map((day, index) => renderDay(day, index))}
      </View>
    </View>
  );
};

interface CalendarDay {
  date: Date;
  dayNumber: number;
  activeMedications: Medication[];
  hasDoses: boolean;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  monthHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: DAY_WIDTH,
    height: DAY_WIDTH - 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    margin: 1,
  },
  emptyDay: {
    width: DAY_WIDTH,
    height: DAY_WIDTH - 4,
    margin: 1,
  },
  activeDay: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  today: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  activeDayNumber: {
    color: '#059669',
    fontWeight: '700',
  },
  todayNumber: {
    color: '#2563EB',
    fontWeight: '700',
  },
  // ✅ NEW: Pill icon styles
  pillIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  medCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
});

export default MedicationCalendar;
