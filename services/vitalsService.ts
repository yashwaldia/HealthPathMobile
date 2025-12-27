// services/vitalsService.ts
// Vitals service with chart helper functions
// Updated: December 25, 2025 - Added helper functions for chart and trend analysis

import firestore from '@react-native-firebase/firestore';
import { VitalRecord, VitalType } from '../types/vitals';

const VITALS_COLLECTION = 'vitals';
const LATEST_VITALS_COLLECTION = 'latestVitals'; // New collection for dashboard display

export const vitalsService = {
  /**
   * Update or create the latest vitals record for dashboard display
   * This REPLACES the old data with new data
   */
  async updateLatestVitals(
    userId: string,
    data: Omit<VitalRecord, 'id' | 'userId'>
  ): Promise<string> {
    try {
      // Use user ID as document ID - this ensures only ONE record per user
      const docRef = firestore()
        .collection(LATEST_VITALS_COLLECTION)
        .doc(userId);

      await docRef.set(
        {
          ...data,
          userId,
          date: data.date || new Date().toISOString(),
          source: data.source || 'manual',
        },
        { merge: false } // REPLACE, not merge
      );

      return userId;
    } catch (error) {
      console.error('Error updating latest vitals:', error);
      throw new Error('Failed to save vital record');
    }
  },

  /**
   * Add vital record to history (optional - for keeping historical data)
   * This creates a new record each time for history tracking
   */
  async addVitalToHistory(
    userId: string,
    data: Omit<VitalRecord, 'id' | 'userId'>
  ): Promise<string> {
    try {
      const historyRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('vitalsHistory');
      const docRef = historyRef.doc(); // Auto-generate ID

      await docRef.set({
        ...data,
        userId,
        date: data.date || new Date().toISOString(),
        source: data.source || 'manual',
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding vital to history:', error);
      throw new Error('Failed to save vital history');
    }
  },

  /**
   * Get the latest vitals for dashboard display
   * Returns only ONE record per user
   */
  async getLatestVitals(userId: string): Promise<Partial<VitalRecord>> {
    try {
      const docSnap = await firestore()
        .collection(LATEST_VITALS_COLLECTION)
        .doc(userId)
        .get();

      if (!docSnap.exists) {
        return {};
      }

      const data = docSnap.data();
      if (!data) {
        return {};
      }

      return {
        id: docSnap.id,
        ...data,
      } as VitalRecord;
    } catch (error) {
      console.error('Error fetching latest vitals:', error);
      return {};
    }
  },

  /**
   * Get vitals history for charts and trends
   */
  async getVitalsHistory(
    userId: string,
    recordLimit?: number
  ): Promise<VitalRecord[]> {
    try {
      let queryRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('vitalsHistory')
        .orderBy('date', 'desc');

      if (recordLimit) {
        queryRef = queryRef.limit(recordLimit);
      }

      const snapshot = await queryRef.get();
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as VitalRecord));
    } catch (error) {
      console.error('Error fetching vitals history:', error);
      return [];
    }
  },

  /**
   * Delete the latest vitals (clears dashboard)
   */
  async deleteLatestVitals(userId: string): Promise<void> {
    try {
      await firestore()
        .collection(LATEST_VITALS_COLLECTION)
        .doc(userId)
        .delete();
    } catch (error) {
      console.error('Error deleting latest vitals:', error);
      throw new Error('Failed to delete vitals');
    }
  },

  /**
   * Get vitals within date range from history
   */
  async getVitalsInRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<VitalRecord[]> {
    try {
      const snapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('vitalsHistory')
        .where('date', '>=', startDate.toISOString())
        .where('date', '<=', endDate.toISOString())
        .orderBy('date', 'desc')
        .get();

      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as VitalRecord));
    } catch (error) {
      console.error('Error fetching vitals in range:', error);
      return [];
    }
  },
};

// ========================================
// VITAL STATUS & TIME HELPERS (Existing)
// ========================================

/**
 * Helper function to calculate vital status
 */
export const getVitalStatus = (
  type: string,
  value1: number,
  value2?: number
): 'normal' | 'alert' | 'critical' => {
  if (isNaN(value1)) return 'normal';

  switch (type) {
    case 'bloodPressure':
      if (!value2 || isNaN(value2)) return 'normal';
      if (value1 < 90 || value2 < 60) return 'alert'; // Low
      if (value1 >= 140 || value2 >= 90) return 'critical'; // High
      if (value1 >= 121 || value2 >= 81) return 'alert'; // Elevated
      return 'normal';

    case 'bloodSugar':
      if (value1 < 70) return 'alert'; // Low
      if (value1 >= 126) return 'critical'; // High
      if (value1 >= 100) return 'alert'; // Prediabetic range
      return 'normal';

    case 'heartRate':
    case 'pulseRate':
      if (value1 < 60 || value1 > 100) return 'alert';
      return 'normal';

    case 'oxygenSaturation':
      if (value1 < 92) return 'critical';
      if (value1 < 95) return 'alert';
      return 'normal';

    case 'temperature':
      if (value1 < 35) return 'alert'; // Hypothermia
      if (value1 >= 38) return 'critical'; // Fever
      if (value1 > 37.2) return 'alert'; // Slightly elevated
      return 'normal';

    default:
      return 'normal';
  }
};

/**
 * Helper to format time since last reading
 */
export const timeSince = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  return 'Just now';
};

// ========================================
// ✅ NEW HELPER FUNCTIONS FOR CHARTS
// ========================================

/**
 * Extract the value for a specific vital type from a record
 * @param record - The vital record
 * @param vitalType - The type of vital to extract
 * @returns The value or null if not present
 */
export const getVitalValue = (
  record: VitalRecord,
  vitalType: VitalType
): number | null => {
  switch (vitalType) {
    case 'bloodPressure':
      return record.bloodPressureSystolic || null;
    case 'heartRate':
      return record.heartRate || null;
    case 'temperature':
      return record.temperature || null;
    case 'oxygenSaturation':
      return record.oxygenSaturation || null;
    case 'bloodSugar':
      return record.bloodSugarFasting || null;
    case 'weight':
      return record.weightKg || null;
    case 'sleep':
      return record.sleepHours || null;
    default:
      return null;
  }
};

/**
 * Get the field name for a specific vital type
 * @param vitalType - The type of vital
 * @returns The field name in VitalRecord
 */
export const getVitalFieldName = (vitalType: VitalType): keyof VitalRecord => {
  const mapping: Record<VitalType, keyof VitalRecord> = {
    bloodPressure: 'bloodPressureSystolic',
    heartRate: 'heartRate',
    temperature: 'temperature',
    oxygenSaturation: 'oxygenSaturation',
    bloodSugar: 'bloodSugarFasting',
    weight: 'weightKg',
    sleep: 'sleepHours',
  };
  return mapping[vitalType];
};

/**
 * Calculate trend between two values
 * @param current - Current value
 * @param previous - Previous value
 * @returns Trend data with direction, percentage, and absolute change
 */
export const calculateTrend = (
  current: number,
  previous: number
): {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  absolute: number;
} => {
  const diff = current - previous;
  const percentage = previous !== 0 ? (diff / previous) * 100 : 0;

  return {
    direction: diff > 0.1 ? 'up' : diff < -0.1 ? 'down' : 'stable',
    percentage: Math.abs(percentage),
    absolute: Math.abs(diff),
  };
};

/**
 * Format date for chart labels (short format)
 * @param dateString - ISO date string
 * @returns Formatted date like "12/25"
 */
export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

/**
 * Format date for display (relative or absolute)
 * @param date - Date object
 * @returns Formatted date string
 */
export const formatDateDisplay = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;
  if (diffDays < 2) return 'Yesterday';
  if (diffDays < 7) return `${Math.floor(diffDays)} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/**
 * Format time for display
 * @param date - Date object
 * @returns Formatted time like "7:30 PM"
 */
export const formatTimeDisplay = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Filter vitals history by time range
 * @param history - Array of vital records
 * @param timeRange - Time range to filter ('7D', '30D', '90D', 'ALL')
 * @returns Filtered array of records
 */
export const filterHistoryByTimeRange = (
  history: VitalRecord[],
  timeRange: '7D' | '30D' | '90D' | 'ALL'
): VitalRecord[] => {
  if (timeRange === 'ALL' || !history || history.length === 0) {
    return history;
  }

  const now = new Date();
  const cutoffDate = new Date();

  switch (timeRange) {
    case '7D':
      cutoffDate.setDate(now.getDate() - 7);
      break;
    case '30D':
      cutoffDate.setDate(now.getDate() - 30);
      break;
    case '90D':
      cutoffDate.setDate(now.getDate() - 90);
      break;
  }

  return history.filter((record) => new Date(record.date) >= cutoffDate);
};

/**
 * Format vital history for chart visualization
 * @param history - Array of vital records
 * @param vitalType - Type of vital to chart
 * @param maxPoints - Maximum number of data points (default 10)
 * @returns Chart-ready data with labels and datasets
 */
export const formatVitalHistoryForChart = (
  history: VitalRecord[],
  vitalType: VitalType,
  maxPoints: number = 10
): {
  labels: string[];
  datasets: { data: number[]; color?: (opacity: number) => string }[];
} | null => {
  if (!history || history.length === 0) return null;

  // Filter records that have the vital data
  const validRecords = history
    .filter((record) => getVitalValue(record, vitalType) !== null)
    .slice(0, maxPoints) // Take first N records (already sorted desc)
    .reverse(); // Reverse to get oldest to newest for chart

  if (validRecords.length === 0) return null;

  const labels = validRecords.map((record) => formatDateShort(record.date));

  // Handle Blood Pressure (dual values)
  if (vitalType === 'bloodPressure') {
    const systolicData = validRecords.map((r) => r.bloodPressureSystolic || 0);
    const diastolicData = validRecords.map((r) => r.bloodPressureDiastolic || 0);

    return {
      labels,
      datasets: [
        {
          data: systolicData,
          color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`, // Blue
        },
        {
          data: diastolicData,
          color: (opacity = 1) => `rgba(52, 211, 153, ${opacity})`, // Green
        },
      ],
    };
  }

  // Single value vitals
  const values = validRecords.map((r) => getVitalValue(r, vitalType) || 0);

  return {
    labels,
    datasets: [
      {
        data: values,
        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
      },
    ],
  };
};

/**
 * Get statistics from vital history
 * @param history - Array of vital records
 * @param vitalType - Type of vital
 * @returns Statistics object with min, max, average
 */
export const getVitalStatistics = (
  history: VitalRecord[],
  vitalType: VitalType
): {
  min: number;
  max: number;
  average: number;
  count: number;
} | null => {
  const values = history
    .map((record) => getVitalValue(record, vitalType))
    .filter((val): val is number => val !== null);

  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;

  return {
    min,
    max,
    average,
    count: values.length,
  };
};
