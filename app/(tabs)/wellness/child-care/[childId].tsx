// app/(tabs)/wellness/child-care/[childId].tsx
// Individual Child Tracking Screen
// Last Updated: December 13, 2025 - Added weekly AI content integration

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomToast from '../../../../components/ui/CustomToast';
import ChildOverviewCard from '../../../../components/wellness/child-care/ChildOverviewCard';
import DailyChecklistCard from '../../../../components/wellness/DailyChecklistCard';
import MedicalRemindersCard from '../../../../components/wellness/MedicalRemindersCard';
import PersonalizedSuggestionsCard from '../../../../components/wellness/PersonalizedSuggestionsCard';
import ProgressTracker from '../../../../components/wellness/ProgressTracker';
import WarningSignsCard from '../../../../components/wellness/WarningSignsCard';
import WeeklyMilestoneCard from '../../../../components/wellness/WeeklyMilestoneCard';
import WeeklyReportModal from '../../../../components/wellness/WeeklyReportModal';
import WellnessHeader from '../../../../components/wellness/WellnessHeader';
import {
  AGE_MILESTONES,
  CHILD_CARE_WARNING_SIGNS,
  FEEDING_GUIDELINES,
  getAgeGroup,
  getDailyTasksForAge,
  getMilestoneForAge,
  VACCINATION_SCHEDULE,
} from '../../../../constants/childCareData';
import { Colors } from '../../../../constants/colors';
import { useAuth } from '../../../../context/AuthContext';
import { wellnessService } from '../../../../services/wellnessService';
import {
  ChildCareProfile,
  DailyAIContent,
  DailyTask,
  DailyTracking,
  MedicalReminder,
  PersonalizedSuggestions,
  WeeklyReport,
} from '../../../../types/wellness';

export default function IndividualChildCareScreen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ChildCareProfile | null>(null);
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [todayDate, setTodayDate] = useState<string>('');
  const [weeklyReportVisible, setWeeklyReportVisible] = useState(false);
  const [latestReport, setLatestReport] = useState<WeeklyReport | null>(null);
  const [medicalReminders, setMedicalReminders] = useState<MedicalReminder[]>([]);
  const [suggestions, setSuggestions] = useState<PersonalizedSuggestions>({
    food: [],
    exercise: [],
    mentalHealth: [],
  });
  const [todayContent, setTodayContent] = useState<DailyAIContent | null>(null); // ⭐ NEW
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  useEffect(() => {
    if (user && childId) {
      initializeChild();
    }
  }, [user, childId]);

  const initializeChild = async () => {
    try {
      setLoading(true);
      
      if (!user || !childId) {
        setProfile(null);
        return;
      }

      const childProfile = await wellnessService.getChildProfile(user.uid, childId);

      if (!childProfile) {
        console.log('📭 Child profile not found');
        setProfile(null);
        setTodayTasks([]);
        setMedicalReminders([]);
        setLatestReport(null);
        setTodayContent(null); // ⭐ CLEAR AI CONTENT
        setSuggestions({
          food: [],
          exercise: [],
          mentalHealth: [],
        });
        return;
      }

      if (!childProfile.birthDate) {
        console.warn('⚠️ Invalid profile - missing birth date');
        setProfile(null);
        return;
      }

      try {
        const updatedProfile = await wellnessService.updateChildAge(user.uid, childId);
        setProfile(updatedProfile);
        await loadChildData(updatedProfile);
        console.log('✅ Child profile loaded and updated successfully');
      } catch (updateError: any) {
        console.error('❌ Error updating child age:', updateError);
        
        if (updateError?.message?.includes('not found') || updateError?.message?.includes('missing')) {
          console.log('🗑️ Profile appears to be deleted - clearing state');
          setProfile(null);
          setTodayTasks([]);
          setMedicalReminders([]);
          setLatestReport(null);
          setTodayContent(null); // ⭐ CLEAR AI CONTENT
          return;
        }
        
        console.log('📦 Using existing profile as fallback');
        setProfile(childProfile);
        await loadChildData(childProfile);
      }
    } catch (error: any) {
      console.error('❌ Error initializing child:', error);
      
      setProfile(null);
      setTodayTasks([]);
      setMedicalReminders([]);
      setLatestReport(null);
      setTodayContent(null); // ⭐ CLEAR AI CONTENT
      
      showToast('Failed to load child profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadChildData = async (prof: ChildCareProfile) => {
    try {
      if (!user || !childId) return;

      const today = new Date().toISOString().split('T')[0];
      setTodayDate(today);

      // ⭐ STEP 1: Load Weekly AI Content
      let weeklyContent: any = null;
      let todayContentData: any = null;

      try {
        console.log('🤖 Loading weekly AI content...');
        weeklyContent = await wellnessService.getCurrentWeekContent(user.uid, childId, prof);
        
        if (weeklyContent) {
          const { getContentForDay } = await import('../../../../services/childCareAIService');
          todayContentData = getContentForDay(weeklyContent, new Date());
          setTodayContent(todayContentData); // ⭐ STORE IN STATE
          console.log('✅ Weekly AI content loaded successfully');
        }
      } catch (aiError) {
        console.error('⚠️ AI content loading failed, using fallback:', aiError);
        weeklyContent = null;
        todayContentData = null;
        setTodayContent(null); // ⭐ CLEAR STATE ON ERROR
      }

      // ⭐ STEP 2: Load/Set Today's Tasks (AI or Fallback)
      if (todayContentData && todayContentData.tasks && todayContentData.tasks.length > 0) {
        console.log('✅ Using AI-generated tasks for today');
        
        // Check if we already have tracking for today
        const existingTracking = await wellnessService.getChildDailyTracking(user.uid, childId, today);
        
        if (existingTracking) {
          // Use existing tracking (preserves completion status)
          setTodayTasks(existingTracking.tasks);
        } else {
          // Use AI tasks and save them
          setTodayTasks(todayContentData.tasks);
          
          const newTracking: Omit<DailyTracking, 'trackingId' | 'createdAt'> = {
            date: today,
            dayNumber: prof.ageInDays || prof.ageInMonths * 30,
            tasks: todayContentData.tasks,
            metrics: {},
            overallCompletion: 0,
          };
          await wellnessService.saveChildDailyTracking(user.uid, childId, newTracking);
        }
      } else {
        // Fallback: Load from Firestore or generate static tasks
        let tracking = await wellnessService.getChildDailyTracking(user.uid, childId, today);

        if (!tracking) {
          const tasks = getDailyTasksForAge(prof.ageInMonths);
          
          const newTracking: Omit<DailyTracking, 'trackingId' | 'createdAt'> = {
            date: today,
            dayNumber: prof.ageInDays || prof.ageInMonths * 30,
            tasks,
            metrics: {},
            overallCompletion: 0,
          };
          
          await wellnessService.saveChildDailyTracking(user.uid, childId, newTracking);
          setTodayTasks(tasks);
        } else {
          setTodayTasks(tracking.tasks);
        }
      }

      // ⭐ STEP 3: Set Suggestions (AI or Fallback)
      if (todayContentData && todayContentData.feeding && todayContentData.activities) {
        // Use AI-generated suggestions
        setSuggestions({
          food: todayContentData.feeding?.tips || [todayContentData.feeding?.summary || 'Balanced meals'],
          exercise: todayContentData.activities?.afternoon || [
            prof.ageInMonths < 12 ? 'Tummy time daily (15-30 mins)' : 'Active play 1-2 hours daily',
            'Outdoor time for vitamin D and fresh air',
          ],
          mentalHealth: todayContentData.activities?.evening || [
            'Read books together daily',
            'Consistent bedtime routine',
          ],
        });
      } else {
        // Fallback: Use static suggestions
        const ageGroup = getAgeGroup(prof.ageInMonths);
        const feeding = FEEDING_GUIDELINES[ageGroup as keyof typeof FEEDING_GUIDELINES];
        
        setSuggestions({
          food: feeding ? [feeding.primary, feeding.notes] : ['Balanced meals', 'Regular feeding schedule'],
          exercise: [
            prof.ageInMonths < 12 ? 'Tummy time daily (15-30 mins)' : 'Active play 1-2 hours daily',
            'Outdoor time for vitamin D and fresh air',
            prof.ageInMonths >= 12 ? 'Encourage walking and exploration' : 'Support motor skill development',
          ],
          mentalHealth: [
            'Read books together daily',
            'Limit screen time (none for under 2 years)',
            'Consistent bedtime routine',
            prof.ageInMonths >= 12 ? 'Interactive play and socialization' : 'Bonding time through eye contact and touch',
          ],
        });
      }

      // ⭐ STEP 4: Load Medical Reminders (Keep existing logic)
      const vaccineReminders: MedicalReminder[] = VACCINATION_SCHEDULE
        .filter(v => {
          const ageMatch = v.age.match(/(\d+)/);
          if (!ageMatch) return false;
          const vaccinationAge = parseInt(ageMatch[0]);
          return vaccinationAge >= prof.ageInMonths && vaccinationAge <= prof.ageInMonths + 6;
        })
        .slice(0, 5)
        .map((v, i) => ({
          reminderId: `vaccine-${i}`,
          title: `Vaccination: ${v.age}`,
          description: v.vaccines.join(', '),
          dueDate: v.age,
          urgency: 'upcoming' as const,
          completed: false,
        }));
      
      setMedicalReminders(vaccineReminders);

      // Load weekly reports (future implementation)
      setLatestReport(null);

    } catch (error) {
      console.error('❌ Error loading child data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeChild();
    setRefreshing(false);
  };

  const handleTaskToggle = async (taskId: string) => {
    try {
      if (!user || !childId || !todayDate) return;

      const updatedTasks = todayTasks.map((task) =>
        task.taskId === taskId
          ? { ...task, completed: !task.completed }
          : task
      );
      setTodayTasks(updatedTasks);

      const tracking = await wellnessService.getChildDailyTracking(user.uid, childId, todayDate);
      
      if (tracking) {
        const completionRate = (updatedTasks.filter(t => t.completed).length / updatedTasks.length) * 100;
        
        await wellnessService.saveChildDailyTracking(user.uid, childId, {
          ...tracking,
          tasks: updatedTasks,
          overallCompletion: Math.round(completionRate),
        });
      }

      showToast('Task updated', 'success');
    } catch (error) {
      console.error('❌ Error toggling task:', error);
      showToast('Failed to update task', 'error');
    }
  };

  const handleReminderPress = async (reminder: MedicalReminder) => {
    if (!user || !childId) return;

    Alert.alert(
      reminder.title,
      reminder.description + (reminder.completed ? '\n\nCurrently marked as complete.' : ''),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: reminder.completed ? 'Mark Incomplete' : 'Mark Complete',
          onPress: async () => {
            showToast(
              reminder.completed ? 'Reminder marked incomplete' : 'Reminder completed!',
              'success'
            );
          },
        },
      ]
    );
  };

  const handleDeleteProfile = () => {
    if (!profile) return;

    Alert.alert(
      'Delete Child Profile',
      `Are you sure you want to delete ${profile.childName}'s profile? This will permanently remove all tracking data, tasks, and progress.\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user || !childId) return;

              setLoading(true);
              await wellnessService.deleteChildProfile(user.uid, childId);
              
              showToast('Profile deleted successfully', 'success');
              
              setTimeout(() => {
                router.push('/(tabs)/wellness/child-care');
              }, 1000);
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
          title="Child Care"
          showBackButton
          onBackPress={() => router.push('/(tabs)/wellness/child-care')}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <WellnessHeader
          title="Child Care"
          showBackButton
          onBackPress={() => router.push('/(tabs)/wellness/child-care')}
        />
        <View style={styles.loadingContainer}>
          <Ionicons name="warning-outline" size={64} color={Colors.light.textSecondary} />
          <Text style={styles.emptyTitle}>Profile Not Found</Text>
          <Text style={styles.emptyText}>
            This child's profile could not be found. It may have been deleted.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/wellness/child-care')}
          >
            <Text style={styles.backButtonText}>Back to Child Care</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const milestone = getMilestoneForAge(profile.ageInMonths);
  const ageGroup = getAgeGroup(profile.ageInMonths);
  const stageInfo = Object.values(AGE_MILESTONES).find((m) => m.range === milestone.range);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <WellnessHeader
        title={profile.childName}
        subtitle="Growth Tracking"
        showBackButton
        onBackPress={() => router.push('/(tabs)/wellness/child-care')}
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
        {/* Progress Tracker */}
        <ProgressTracker
          currentValue={profile.ageInMonths}
          totalValue={60}
          unit="months"
          label="Growth Progress"
          color="#87CEEB"
        />

        <View style={styles.spacing} />

        {/* Child Overview Card */}
        <ChildOverviewCard
          childName={profile.childName}
          ageInMonths={profile.ageInMonths}
          ageInDays={profile.ageInDays}
          developmentalStage={stageInfo?.label || 'Child'}
          milestoneText={milestone.physical[0] || 'Developing well'}
          gender={profile.gender}
        />

        <View style={styles.spacing} />

        {/* ⭐ Weekly Milestone Card - NOW USES AI DATA */}
        <WeeklyMilestoneCard
          weekNumber={Math.floor(profile.ageInMonths / 4)}
          title={todayContent?.milestones?.tips?.[0] || milestone.range}
          emoji="🎯"
          developmentText={
            todayContent?.milestones?.physical?.[0] || 
            milestone.physical.join(' • ')
          }
          milestones={
            todayContent?.milestones
              ? [
                  ...(todayContent.milestones.cognitive || []),
                  ...(todayContent.milestones.social || []),
                  ...(todayContent.milestones.language || [])
                ].slice(0, 5) // Show first 5 milestones
              : [...milestone.cognitive, ...milestone.social]
          }
          color="#87CEEB"
        />

        <View style={styles.spacing} />

        {/* Daily Checklist */}
        <DailyChecklistCard
          title="Today's Care Routine"
          date={new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
          })}
          tasks={todayTasks}
          onToggleTask={handleTaskToggle}
        />

        <View style={styles.spacing} />

        {/* Personalized Suggestions */}
        <PersonalizedSuggestionsCard suggestions={suggestions} />

        <View style={styles.spacing} />

        {/* Medical Reminders */}
        <MedicalRemindersCard
          reminders={medicalReminders}
          onReminderPress={handleReminderPress}
        />

        <View style={styles.spacing} />

        {/* Warning Signs */}
        <WarningSignsCard warningsSigns={CHILD_CARE_WARNING_SIGNS} />

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
        
        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
          <Text style={styles.disclaimerText}>
            Some content in this module is AI-generated. Always consult your pediatrician for medical advice.
          </Text>
        </View>

        <View style={styles.spacing} />
        
        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteProfile}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete {profile.childName}'s Profile</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  spacing: {
    height: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 2,
    borderColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
