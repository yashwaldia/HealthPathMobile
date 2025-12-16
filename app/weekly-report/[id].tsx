// app/weekly-report/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';

interface WeeklyReport {
  weekStartDate: string;
  weekEndDate: string;
  aiSummary: string;
  dataPoints: {
    vitals: number;
    medications: number;
    labs: number;
  };
  generatedAt: any;
}

export default function WeeklyReportScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid && id) {
      fetchReport();
    }
  }, [user, id]);

const fetchReport = async () => {
  try {
    const reportId = Array.isArray(id) ? id[0] : id;
    if (!reportId || !user?.uid) return;

    const docSnap = await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('weeklyReports')
      .doc(reportId as string)
      .get();

    if (docSnap.exists()) {
      setReport(docSnap.data() as WeeklyReport);
    } else {
      console.log('No such report!');
    }
  } catch (error) {
    console.error('Error fetching report:', error);
  } finally {
    setLoading(false);
  }
};


  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weekly Insight</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.light.border} />
          <Text style={styles.errorText}>Report not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Insight</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Range Chip */}
        <View style={styles.dateContainer}>
          <View style={styles.dateChip}>
            <Ionicons name="calendar-outline" size={14} color={Colors.light.primary} />
            <Text style={styles.dateText}>
              {formatDate(report.weekStartDate)} - {formatDate(report.weekEndDate)}
            </Text>
          </View>
        </View>

        {/* AI Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            <Text style={styles.summaryTitle}>AI Health Summary</Text>
          </View>
          <Text style={styles.summaryBody}>{report.aiSummary}</Text>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Activity Breakdown</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="pulse"
            value={report.dataPoints.vitals}
            label="Vitals Logged"
            color={Colors.light.success}
          />
          <StatCard
            icon="medkit"
            value={report.dataPoints.medications}
            label="Active Meds"
            color={Colors.light.primary}
          />
          <StatCard
            icon="document-text"
            value={report.dataPoints.labs}
            label="Labs Uploaded"
            color={Colors.light.warning}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = ({ icon, value, label, color }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },

  dateContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },

  summaryCard: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryBody: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 24,
    opacity: 0.95,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
});
