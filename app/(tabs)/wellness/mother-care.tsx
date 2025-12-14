// app/(tabs)/wellness/mother-care.tsx
// Mother Care module screen
// Last Updated: December 14, 2025 - Option A: Shows DAILY TASK COMPLETION + Overall Pregnancy Progress

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomToast from '../../../components/ui/CustomToast';
import DailyChecklistCard from '../../../components/wellness/DailyChecklistCard';
import MedicalRemindersCard from '../../../components/wellness/MedicalRemindersCard';
import PersonalizedSuggestionsCard from '../../../components/wellness/PersonalizedSuggestionsCard';
import ProgressTracker from '../../../components/wellness/ProgressTracker';
import EnhancedLMPModal from '../../../components/wellness/SetupModals/EnhancedLMPModal';
import WarningSignsCard from '../../../components/wellness/WarningSignsCard';
import WeeklyMilestoneCard from '../../../components/wellness/WeeklyMilestoneCard';
import WeeklyReportModal from '../../../components/wellness/WeeklyReportModal';
import WellnessHeader from '../../../components/wellness/WellnessHeader';
import PregnancyOverviewCard from '../../../components/wellness/mother-care/PregnancyOverviewCard';
import { Colors } from '../../../constants/colors';
import {
  MEDICAL_REMINDERS_TEMPLATE, MOTHER_CARE_WARNING_SIGNS, TRIMESTER_DATA,
  calculateDueDate, getDailyTasksForTrimester, getMilestoneForWeek,
} from '../../../constants/motherCareData';
import { useAuth } from '../../../context/AuthContext';
import { wellnessService } from '../../../services/wellnessService';
import {
  DailyTask, DailyTracking, MedicalReminder, MotherCareProfile,
  PersonalizedSuggestions, WeeklyReport,
} from '../../../types/wellness';

export default function MotherCareScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [profile, setProfile] = useState<MotherCareProfile | null>(null);
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [todayDate, setTodayDate] = useState<string>('');
  const [dailyCompletion, setDailyCompletion] = useState(0); // ⭐ NEW: Today's task completion %
  const [weeklyReportVisible, setWeeklyReportVisible] = useState(false);
  const [latestReport, setLatestReport] = useState<WeeklyReport | null>(null);
  const [medicalReminders, setMedicalReminders] = useState<MedicalReminder[]>([]);
  const [suggestions, setSuggestions] = useState<PersonalizedSuggestions>({
    food: [], exercise: [], mentalHealth: [],
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // ⭐ NEW: Reload on screen focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        initializeModule();
      }
    }, [user])
  );

  const initializeModule = async () => {
    try {
      setLoading(true);
      if (!user) {
        setProfile(null);
        return;
      }

      const existingProfile = await wellnessService.getModuleProfile(user.uid, 'mother-care');

      if (!existingProfile) {
        console.log('📭 No Mother Care profile found - showing setup screen');
        setProfile(null);
        setTodayTasks([]);
        setDailyCompletion(0);
        setMedicalReminders([]);
        setLatestReport(null);
        setSuggestions({ food: [], exercise: [], mentalHealth: [] });
        return;
      }

      const motherProfile = existingProfile as MotherCareProfile;
      
      if (!motherProfile.lmpDate) {
        console.warn('⚠️ Invalid profile - missing LMP date');
        setProfile(null);
        return;
      }

      try {
        const updatedProfile = await wellnessService.updatePregnancyProgress(user.uid);
        setProfile(updatedProfile);
        await loadModuleData(updatedProfile);
        console.log('✅ Profile loaded and updated successfully');
      } catch (updateError: any) {
        console.error('❌ Error updating pregnancy progress:', updateError);
        
        if (updateError?.message?.includes('not found') || updateError?.message?.includes('missing')) {
          console.log('🗑️ Profile appears to be deleted - clearing state');
          setProfile(null);
          setTodayTasks([]);
          setDailyCompletion(0);
          setMedicalReminders([]);
          setLatestReport(null);
          return;
        }
        
        console.log('📦 Using existing profile as fallback');
        setProfile(motherProfile);
        await loadModuleData(motherProfile);
      }
    } catch (error: any) {
      console.error('❌ Error initializing module:', error);
      setProfile(null);
      setTodayTasks([]);
      setDailyCompletion(0);
      setMedicalReminders([]);
      setLatestReport(null);
      showToast('Failed to load Mother Care module', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPress = () => {
    setSetupModalVisible(true);
  };

  const handleSetupConfirm = async (data: { 
    motherName: string; 
    lmpDate?: string; 
    currentWeek?: number; 
    currentDay?: number 
  }) => {
    try {
      setSetupModalVisible(false);
      setLoading(true);

      if (!user) return;

      let newProfile: MotherCareProfile;

      if (data.lmpDate) {
        const dueDate = calculateDueDate(data.lmpDate);
        newProfile = await wellnessService.startMotherCareModule(
          user.uid, data.motherName, data.lmpDate, dueDate
        );
      } else if (data.currentWeek !== undefined && data.currentDay !== undefined) {
        newProfile = await wellnessService.startMotherCareModuleManual(
          user.uid, data.motherName, data.currentWeek, data.currentDay
        );
      } else {
        throw new Error('Invalid setup data');
      }

      setProfile(newProfile);
      await loadModuleData(newProfile);
      showToast(`Welcome, ${data.motherName}! Your journey begins now.`, 'success');
    } catch (error) {
      console.error('❌ Error starting module:', error);
      showToast('Failed to start Mother Care module', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadModuleData = async (prof: MotherCareProfile) => {
    try {
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      setTodayDate(today);

      let tracking = await wellnessService.getDailyTracking(user.uid, 'mother-care', today);

      if (!tracking) {
        const tasks = getDailyTasksForTrimester(prof.trimester);
        
        const newTracking: Omit<DailyTracking, 'trackingId' | 'createdAt'> = {
          date: today,
          dayNumber: prof.currentDay || prof.currentDayOfPregnancy || 1,
          tasks,
          metrics: {},
          overallCompletion: 0,
        };
        
        await wellnessService.saveDailyTracking(user.uid, 'mother-care', newTracking);
        setTodayTasks(tasks);
        setDailyCompletion(0);
      } else {
        setTodayTasks(tracking.tasks);
        // ⭐ OPTION A: Calculate daily task completion
        const completed = tracking.tasks.filter(t => t.completed).length;
        const total = tracking.tasks.length;
        setDailyCompletion(total > 0 ? Math.round((completed / total) * 100) : 0);
      }

      const reminders = await wellnessService.getMedicalReminders(user.uid, 'mother-care');
      setMedicalReminders(reminders.length > 0 ? reminders : MEDICAL_REMINDERS_TEMPLATE);

      const reports = await wellnessService.getWeeklyReports(user.uid, 'mother-care', 1);
      if (reports.length > 0) {
        setLatestReport(reports[0]);
      }

      const trimesterIndex = Math.max(0, Math.min(prof.trimester - 1, TRIMESTER_DATA.length - 1));
      const trimesterData = TRIMESTER_DATA[trimesterIndex];

      setSuggestions({
        food: trimesterData?.nutritionTips || ['Eat a balanced diet', 'Stay hydrated', 'Take prenatal vitamins'],
        exercise: trimesterData?.exerciseTips || ['Light walking', 'Prenatal yoga', 'Swimming'],
        mentalHealth: [
          'Practice deep breathing for 5-10 minutes daily',
          'Connect with other expecting mothers',
          'Get adequate sleep (7-9 hours)',
        ],
      });
    } catch (error) {
      console.error('❌ Error loading module data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeModule();
    setRefreshing(false);
  };

  // ⭐ UPDATED: Option A - Updates daily task completion only
  const handleTaskToggle = async (taskId: string) => {
    try {
      if (!user || !todayDate) return;

      await wellnessService.toggleTaskCompletion(user.uid, 'mother-care', todayDate, taskId);

      // Update local tasks
      const updatedTasks = todayTasks.map((task) =>
        task.taskId === taskId ? { ...task, completed: !task.completed } : task
      );
      setTodayTasks(updatedTasks);

      // ⭐ OPTION A: Recalculate DAILY completion (not overall program progress)
      const completed = updatedTasks.filter(t => t.completed).length;
      const total = updatedTasks.length;
      const newDailyCompletion = total > 0 ? Math.round((completed / total) * 100) : 0;
      setDailyCompletion(newDailyCompletion);

      showToast('Task updated', 'success');
    } catch (error) {
      console.error('❌ Error toggling task:', error);
      showToast('Failed to update task', 'error');
    }
  };

  const handleReminderPress = async (reminder: MedicalReminder) => {
    if (!user) return;

    Alert.alert(
      reminder.title,
      reminder.description + (reminder.completed ? '\n\nCurrently marked as complete.' : ''),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: reminder.completed ? 'Mark Incomplete' : 'Mark Complete',
          onPress: async () => {
            try {
              await wellnessService.updateMedicalReminderStatus(
                user.uid, 'mother-care', reminder.reminderId,
                !reminder.completed, !reminder.completed ? todayDate : undefined
              );

              const updatedReminders = await wellnessService.getMedicalReminders(user.uid, 'mother-care');
              setMedicalReminders(updatedReminders);

              showToast(
                reminder.completed ? 'Reminder marked incomplete' : 'Reminder completed!',
                'success'
              );
            } catch (error) {
              console.error('❌ Error updating reminder:', error);
              showToast('Failed to update reminder', 'error');
            }
          },
        },
      ]
    );
  };

  const handleDeleteProfile = () => {
    Alert.alert(
      'Delete Mother Care Profile',
      'Are you sure you want to delete your Mother Care profile? This will permanently remove all your pregnancy tracking data, tasks, and progress.\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user) return;

              setLoading(true);
              await wellnessService.deleteMotherCareModule(user.uid);
              
              setProfile(null);
              setTodayTasks([]);
              setDailyCompletion(0);
              setMedicalReminders([]);
              setLatestReport(null);
              setSuggestions({ food: [], exercise: [], mentalHealth: [] });
              
              showToast('Profile deleted successfully', 'success');
              
              setTimeout(() => {
                setLoading(false);
                router.push('/(tabs)/wellness');
              }, 800);
            } catch (error) {
              console.error('❌ Error deleting profile:', error);
              showToast('Failed to delete profile', 'error');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <WellnessHeader
          title="Mother Care"
          showBackButton
          onBackPress={() => router.push('/(tabs)/wellness')}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Mother Care...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <WellnessHeader
          title="Mother Care"
          showBackButton
          onBackPress={() => router.push('/(tabs)/wellness')}
        />
        <View style={styles.loadingContainer}>
          <Ionicons name="woman-outline" size={64} color={Colors.light.textSecondary} />
          <Text style={styles.emptyTitle}>Mother Care Not Set Up</Text>
          <Text style={styles.emptyText}>
            Set up your pregnancy tracking by entering either your Last Menstrual Period (LMP) date or your current pregnancy week.
          </Text>
          <TouchableOpacity style={styles.setupButton} onPress={handleSetupPress}>
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={styles.setupButtonText}>Set Up Now</Text>
          </TouchableOpacity>
        </View>

        <EnhancedLMPModal
          visible={setupModalVisible}
          onConfirm={handleSetupConfirm}
          onCancel={() => setSetupModalVisible(false)}
        />
      </SafeAreaView>
    );
  }

  const milestone = getMilestoneForWeek(profile.currentWeekOfPregnancy);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <WellnessHeader
        title="Mother Care"
        showBackButton
        onBackPress={() => router.push('/(tabs)/wellness')}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.light.primary}
          />
        }
      >
        <View style={styles.greetingCard}>
          <View style={styles.greetingContent}>
            <Text style={styles.greetingTitle}>Welcome, {profile.motherName}! 👋</Text>
            <Text style={styles.greetingSubtitle}>Your pregnancy journey, day by day</Text>
          </View>
          <Ionicons name="heart" size={32} color="#FFB6C1" />
        </View>

        <View style={styles.spacing} />

        {/* ⭐ OPTION A: Today's Task Completion (updates immediately when tasks are checked) */}
        <ProgressTracker
          currentValue={todayTasks.filter(t => t.completed).length}
          totalValue={todayTasks.length}
          unit="tasks"
          label="Today's Progress"
          color="#4CAF50"
        />

        <View style={styles.spacing} />

        <PregnancyOverviewCard
          currentWeek={profile.currentWeekOfPregnancy}
          currentDay={profile.currentDayOfPregnancy}
          trimester={profile.trimester}
          dueDate={profile.dueDate}
          babySize={milestone.babySize}
          babySizeEmoji={milestone.babySizeEmoji}
        />

        <View style={styles.spacing} />

        <WeeklyMilestoneCard
          weekNumber={profile.currentWeekOfPregnancy}
          title={milestone.babySize}
          emoji={milestone.babySizeEmoji}
          developmentText={milestone.development}
          milestones={[milestone.motherChanges]}
          color="#FFB6C1"
        />

        <View style={styles.spacing} />

        <DailyChecklistCard
          title="Today's Tasks"
          date={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          tasks={todayTasks}
          onToggleTask={handleTaskToggle}
        />

        <View style={styles.spacing} />

        <PersonalizedSuggestionsCard suggestions={suggestions} />

        <View style={styles.spacing} />

        <MedicalRemindersCard
          reminders={medicalReminders}
          onReminderPress={handleReminderPress}
        />

        <View style={styles.spacing} />

        <WarningSignsCard warningsSigns={MOTHER_CARE_WARNING_SIGNS} />

        {latestReport && (
          <>
            <View style={styles.spacing} />
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => setWeeklyReportVisible(true)}
            >
              <Ionicons name="bar-chart" size={20} color="#fff" />
              <Text style={styles.reportButtonText}>View Weekly Report</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.spacing} />
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
          <Text style={styles.disclaimerText}>
            Some content in this module is AI-generated. Always consult your healthcare provider for medical advice.
          </Text>
        </View>

        <View style={styles.spacing} />
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteProfile}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete Mother Care Profile</Text>
        </TouchableOpacity>

        <View style={styles.spacing} />
      </ScrollView>

      <WeeklyReportModal
        visible={weeklyReportVisible}
        report={latestReport}
        onClose={() => setWeeklyReportVisible(false)}
      />

      <CustomToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  spacing: { height: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 16, color: Colors.light.textSecondary, marginTop: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.light.text, marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptyText: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center', marginBottom: 24, paddingHorizontal: 20, lineHeight: 20 },
  setupButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.light.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  setupButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  greetingCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.light.cardBackground,
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#FFB6C1' + '30',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  greetingContent: { flex: 1 },
  greetingTitle: { fontSize: 20, fontWeight: '700', color: Colors.light.text, marginBottom: 4 },
  greetingSubtitle: { fontSize: 14, color: Colors.light.textSecondary, lineHeight: 20 },
  reportButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.primary, paddingVertical: 14, borderRadius: 12, gap: 8 },
  reportButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  disclaimerCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.light.cardBackground, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.light.primary + '30', gap: 10 },
  disclaimerText: { flex: 1, fontSize: 12, color: Colors.light.textSecondary, lineHeight: 18 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.cardBackground, borderWidth: 2, borderColor: '#FF3B30', paddingVertical: 14, borderRadius: 12, gap: 8 },
  deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#FF3B30' },
});
