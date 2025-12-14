// app/(tabs)/wellness/gut-health.tsx
// Gut Health module screen
// Last Updated: December 14, 2025 - Option A: Shows DAILY TASK COMPLETION

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomToast from '../../../components/ui/CustomToast';
import DailyChecklistCard from '../../../components/wellness/DailyChecklistCard';
import MedicalRemindersCard from '../../../components/wellness/MedicalRemindersCard';
import PersonalizedSuggestionsCard from '../../../components/wellness/PersonalizedSuggestionsCard';
import ProgressTracker from '../../../components/wellness/ProgressTracker';
import WarningSignsCard from '../../../components/wellness/WarningSignsCard';
import WellnessHeader from '../../../components/wellness/WellnessHeader';
import GutHealthOverviewCard from '../../../components/wellness/gut-health/GutHealthOverviewCard';
import { Colors } from '../../../constants/colors';
import {
  DIET_TYPES, DIGESTIVE_HEALTH_INDICATORS, GUT_CONCERNS, GUT_FRIENDLY_FOODS,
  GUT_HEALTH_DAILY_TASKS, GUT_HEALTH_TESTS, GUT_HEALTH_WARNING_SIGNS,
  PROBIOTIC_FOODS, SEVERITY_LEVELS, getPersonalizedSuggestions,
} from '../../../constants/gutHealthData';
import { useAuth } from '../../../context/AuthContext';
import { wellnessService } from '../../../services/wellnessService';
import {
  DailyTask, GutHealthProfile, MedicalReminder, PersonalizedSuggestions,
} from '../../../types/wellness';

export default function GutHealthScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [profile, setProfile] = useState<GutHealthProfile | null>(null);
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [todayDate, setTodayDate] = useState<string>('');
  const [dailyCompletion, setDailyCompletion] = useState(0); // ⭐ NEW: Today's task completion %
  const [medicalReminders, setMedicalReminders] = useState<MedicalReminder[]>([]);
  const [suggestions, setSuggestions] = useState<PersonalizedSuggestions>({
    food: [], exercise: [], mentalHealth: [],
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [concern, setConcern] = useState('general');
  const [dietType, setDietType] = useState('vegetarian');
  const [age, setAge] = useState('30');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [severityLevel, setSeverityLevel] = useState('mild');
  const [setupStep, setSetupStep] = useState<'concern' | 'diet' | 'details'>('concern');

  // ⭐ FIXED: Reload module when screen comes into focus with useCallback
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
      if (!user) return;

      const existingProfile = await wellnessService.getModuleProfile(user.uid, 'gut-health');

      if (existingProfile) {
        setProfile(existingProfile as GutHealthProfile);
        await loadModuleData(existingProfile as GutHealthProfile);
      } else {
        setProfile(null);
        setTodayTasks([]);
        setDailyCompletion(0);
        setMedicalReminders([]);
        setSuggestions({ food: [], exercise: [], mentalHealth: [] });
      }
    } catch (error) {
      console.error('❌ Error initializing module:', error);
      showToast('Failed to load Gut Health module', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPress = () => {
    setConcern('general');
    setDietType('vegetarian');
    setAge('30');
    setGender('male');
    setSeverityLevel('mild');
    setSetupStep('concern');
    setSetupModalVisible(true);
  };

  const handleConcernNext = () => {
    setSetupStep('diet');
  };

  const handleDietNext = () => {
    setSetupStep('details');
  };

  const handleSetupConfirm = async () => {
    try {
      const ageNum = parseInt(age);

      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        showToast('Please enter a valid age (1-120)', 'error');
        return;
      }

      setSetupModalVisible(false);
      setLoading(true);

      if (!user) return;

      const newProfile = await wellnessService.startGutHealthModule(
        user.uid, concern, dietType, ageNum, gender, severityLevel
      );

      setProfile(newProfile);
      await loadModuleData(newProfile);
      showToast('Gut Health module started successfully!', 'success');
    } catch (error) {
      console.error('❌ Error starting module:', error);
      showToast('Failed to start Gut Health module', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadModuleData = async (prof: GutHealthProfile) => {
    try {
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      setTodayDate(today);

      let tracking = await wellnessService.getDailyTracking(user.uid, 'gut-health', today);

      if (!tracking) {
        const tasks = GUT_HEALTH_DAILY_TASKS.map(task => ({
          ...task,
          priority: (task.priority || 'medium') as 'high' | 'medium' | 'low',
        }));

        const newTracking = {
          date: today,
          dayNumber: prof.currentDay,
          tasks,
          metrics: {},
          overallCompletion: 0,
        };
        await wellnessService.saveDailyTracking(user.uid, 'gut-health', newTracking);
        setTodayTasks(tasks);
        setDailyCompletion(0);
      } else {
        setTodayTasks(tracking.tasks);
        // ⭐ OPTION A: Calculate daily task completion
        const completed = tracking.tasks.filter(t => t.completed).length;
        const total = tracking.tasks.length;
        setDailyCompletion(total > 0 ? Math.round((completed / total) * 100) : 0);
      }

      const testReminders: MedicalReminder[] = GUT_HEALTH_TESTS.map((test, i) => ({
        reminderId: `test-${i}`,
        title: test.name,
        description: `${test.frequency} - ${test.description}`,
        dueDate: test.frequency,
        urgency: 'upcoming' as const,
        completed: false,
      }));
      setMedicalReminders(testReminders);

      const personalizedSuggestions = getPersonalizedSuggestions(prof.concern);
      setSuggestions(personalizedSuggestions);
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

      await wellnessService.toggleTaskCompletion(user.uid, 'gut-health', todayDate, taskId);

      const updatedTasks = todayTasks.map(task =>
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
    Alert.alert(reminder.title, reminder.description, [{ text: 'OK' }]);
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Gut Health Profile',
      'Are you sure you want to delete your Gut Health profile? This will permanently remove all your tracking data, tasks, and progress.\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user) return;

              setLoading(true);
              await wellnessService.deleteGutHealthModule(user.uid);

              showToast('Gut Health profile deleted successfully', 'success');

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
        <WellnessHeader title="Gut Health" showBackButton onBackPress={() => router.push('/(tabs)/wellness')} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Gut Health...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <WellnessHeader title="Gut Health" showBackButton onBackPress={() => router.push('/(tabs)/wellness')} />
        <View style={styles.loadingContainer}>
          <Ionicons name="nutrition-outline" size={80} color={Colors.light.textSecondary} />
          <Text style={styles.emptyTitle}>Gut Health Not Set Up</Text>
          <Text style={styles.emptyText}>
            Get personalized digestive health plan for optimal gut wellness. Track your symptoms, food intake, and progress.
          </Text>
          <TouchableOpacity style={styles.setupButton} onPress={handleSetupPress}>
            <Ionicons name="nutrition" size={20} color="#fff" />
            <Text style={styles.setupButtonText}>Start Health Plan</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={setupModalVisible} transparent animationType="fade" onRequestClose={() => setSetupModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyboardAvoid}>
              <View style={styles.modalContainer}>
                {setupStep === 'concern' ? (
                  <>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>What's Your Main Concern?</Text>
                      <Text style={styles.modalSubtitle}>Choose your primary digestive issue</Text>
                    </View>

                    <ScrollView style={styles.modalBodyScroll} contentContainerStyle={styles.modalBodyContent} showsVerticalScrollIndicator={false}>
                      <View style={styles.optionList}>
                        {GUT_CONCERNS.map(item => (
                          <TouchableOpacity
                            key={item.value}
                            style={[styles.optionItem, concern === item.value && styles.optionItemActive]}
                            onPress={() => setConcern(item.value)}
                          >
                            <View style={[styles.radio, concern === item.value && styles.radioActive]}>
                              {concern === item.value && <View style={styles.radioInner} />}
                            </View>
                            <Text style={[styles.optionText, concern === item.value && styles.optionTextActive]}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                      <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setSetupModalVisible(false)}>
                        <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleConcernNext}>
                        <Text style={styles.modalButtonPrimaryText}>Next</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : setupStep === 'diet' ? (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalHeaderRow}>
                        <TouchableOpacity style={styles.modalHeaderIconButton} onPress={() => setSetupStep('concern')}>
                          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
                        </TouchableOpacity>
                        <View style={styles.modalHeaderText}>
                          <Text style={styles.modalTitle}>Your Diet Type</Text>
                          <Text style={styles.modalSubtitle}>Help us personalize your plan</Text>
                        </View>
                      </View>
                    </View>

                    <ScrollView style={styles.modalBodyScroll} contentContainerStyle={styles.modalBodyContent} showsVerticalScrollIndicator={false}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Diet Type</Text>
                        <View style={styles.optionList}>
                          {DIET_TYPES.map(item => (
                            <TouchableOpacity
                              key={item.value}
                              style={[styles.optionItem, dietType === item.value && styles.optionItemActive]}
                              onPress={() => setDietType(item.value)}
                            >
                              <View style={[styles.radio, dietType === item.value && styles.radioActive]}>
                                {dietType === item.value && <View style={styles.radioInner} />}
                              </View>
                              <Text style={[styles.optionText, dietType === item.value && styles.optionTextActive]}>
                                {item.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {concern !== 'general' && (
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Severity Level</Text>
                          <View style={styles.optionList}>
                            {SEVERITY_LEVELS.map(item => (
                              <TouchableOpacity
                                key={item.value}
                                style={[styles.optionItem, severityLevel === item.value && styles.optionItemActive]}
                                onPress={() => setSeverityLevel(item.value)}
                              >
                                <View style={[styles.radio, severityLevel === item.value && styles.radioActive]}>
                                  {severityLevel === item.value && <View style={styles.radioInner} />}
                                </View>
                                <Text style={[styles.optionText, severityLevel === item.value && styles.optionTextActive]}>
                                  {item.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}
                    </ScrollView>

                    <View style={styles.modalFooter}>
                      <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setSetupStep('concern')}>
                        <Ionicons name="arrow-back" size={18} color={Colors.light.text} />
                        <Text style={styles.modalButtonSecondaryText}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleDietNext}>
                        <Text style={styles.modalButtonPrimaryText}>Next</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalHeaderRow}>
                        <TouchableOpacity style={styles.modalHeaderIconButton} onPress={() => setSetupStep('diet')}>
                          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
                        </TouchableOpacity>
                        <View style={styles.modalHeaderText}>
                          <Text style={styles.modalTitle}>Personal Details</Text>
                          <Text style={styles.modalSubtitle}>Final step to get started</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.modalBody}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Age</Text>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="Enter your age"
                          placeholderTextColor={Colors.light.textSecondary}
                          value={age}
                          onChangeText={setAge}
                          keyboardType="number-pad"
                          maxLength={3}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Gender</Text>
                        <View style={styles.genderContainer}>
                          <TouchableOpacity
                            style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                            onPress={() => setGender('male')}
                          >
                            <Ionicons name="male" size={24} color={gender === 'male' ? '#fff' : Colors.light.text} />
                            <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>Male</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                            onPress={() => setGender('female')}
                          >
                            <Ionicons name="female" size={24} color={gender === 'female' ? '#fff' : Colors.light.text} />
                            <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>Female</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    <View style={styles.modalFooter}>
                      <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setSetupStep('diet')}>
                        <Ionicons name="arrow-back" size={18} color={Colors.light.text} />
                        <Text style={styles.modalButtonSecondaryText}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSetupConfirm}>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.modalButtonPrimaryText}>Start Plan</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        <CustomToast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
        />
      </SafeAreaView>
    );
  }

  const digestiveStatus =
    DIGESTIVE_HEALTH_INDICATORS[
      profile.currentDigestiveHealth?.toLowerCase() as keyof typeof DIGESTIVE_HEALTH_INDICATORS
    ] || DIGESTIVE_HEALTH_INDICATORS.good;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <WellnessHeader
        title="Gut Health"
        subtitle={`Day ${profile.currentDay} of ${profile.programDuration}`}
        showBackButton
        onBackPress={() => router.push('/(tabs)/wellness')}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.light.primary} />
        }
      >
        {/* ⭐ OPTION A: Today's Task Completion (updates immediately when tasks are checked) */}
        <ProgressTracker
          currentValue={todayTasks.filter(t => t.completed).length}
          totalValue={todayTasks.length}
          unit="tasks"
          label="Today's Progress"
          color="#FF9800"
        />

        <View style={styles.spacing} />

        <GutHealthOverviewCard
          digestiveStatus={digestiveStatus.range}
          statusColor={digestiveStatus.color}
          statusIcon={digestiveStatus.icon}
          lastCheckupDate={profile.lastCheckupDate}
        />

        <View style={styles.spacing} />

        <DailyChecklistCard
          title="Today's Gut Care"
          date={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          tasks={todayTasks}
          onToggleTask={handleTaskToggle}
        />

        <View style={styles.spacing} />

        <View style={styles.foodCard}>
          <View style={styles.foodHeader}>
            <Ionicons name="restaurant" size={24} color="#4CAF50" />
            <Text style={styles.foodTitle}>Foods for Gut Health</Text>
          </View>

          <Text style={styles.foodSectionTitle}>Gut-Friendly Foods</Text>
          <View style={styles.foodGrid}>
            {GUT_FRIENDLY_FOODS.slice(0, 4).map((food, index) => (
              <View key={index} style={styles.foodItem}>
                <Text style={styles.foodEmoji}>{food.emoji}</Text>
                <Text style={styles.foodName}>{food.food}</Text>
                <Text style={styles.foodBenefit}>{food.benefit}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.foodSectionTitle, { marginTop: 16 }]}>Probiotic Foods</Text>
          <View style={styles.foodGrid}>
            {PROBIOTIC_FOODS.slice(0, 4).map((food, index) => (
              <View key={index} style={styles.foodItem}>
                <Text style={styles.foodEmoji}>{food.emoji}</Text>
                <Text style={styles.foodName}>{food.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.spacing} />

        <PersonalizedSuggestionsCard suggestions={suggestions} />

        <View style={styles.spacing} />

        <MedicalRemindersCard reminders={medicalReminders} onReminderPress={handleReminderPress} />

        <View style={styles.spacing} />

        <WarningSignsCard warningsSigns={GUT_HEALTH_WARNING_SIGNS} />

        <View style={styles.spacing} />

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete Gut Health Profile</Text>
        </TouchableOpacity>

        <View style={styles.spacing} />
      </ScrollView>

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
  emptyTitle: { fontSize: 24, fontWeight: '700', color: Colors.light.text, marginTop: 24, marginBottom: 12, textAlign: 'center' },
  emptyText: { fontSize: 15, color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 32 },
  setupButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.light.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 14, shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  setupButtonText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalKeyboardAvoid: { width: '100%', maxWidth: 440 },
  modalContainer: { backgroundColor: Colors.light.cardBackground, borderRadius: 24, width: '100%', maxHeight: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  modalHeader: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalHeaderIconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.background },
  modalHeaderText: { flex: 1 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: Colors.light.text, marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: Colors.light.textSecondary, lineHeight: 20 },
  modalBody: { padding: 24 },
  modalBodyScroll: { maxHeight: 400 },
  modalBodyContent: { padding: 24, paddingBottom: 8 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 12 },
  modalInput: { backgroundColor: Colors.light.background, borderRadius: 12, padding: 16, fontSize: 16, color: Colors.light.text, borderWidth: 2, borderColor: Colors.light.border },
  optionList: { gap: 10 },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.light.background, borderWidth: 2, borderColor: Colors.light.border, borderRadius: 12, padding: 14 },
  optionItemActive: { backgroundColor: Colors.light.primary + '10', borderColor: Colors.light.primary },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.light.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.light.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.light.primary },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.light.text },
  optionTextActive: { color: Colors.light.primary },
  genderContainer: { flexDirection: 'row', gap: 12 },
  genderButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.light.background, borderWidth: 2, borderColor: Colors.light.border, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 12 },
  genderButtonActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  genderText: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  genderTextActive: { color: '#fff' },
  modalFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20, borderTopWidth: 1, borderTopColor: Colors.light.border, backgroundColor: Colors.light.cardBackground },
  modalButtonSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.light.background, borderWidth: 2, borderColor: Colors.light.border, minHeight: 48 },
  modalButtonSecondaryText: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  modalButtonPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.light.primary, minHeight: 48, shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  modalButtonPrimaryText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  foodCard: { backgroundColor: Colors.light.cardBackground, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.light.border },
  foodHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  foodTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  foodSectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary, marginBottom: 12 },
  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foodItem: { width: '23%', backgroundColor: Colors.light.background, borderRadius: 12, padding: 8, alignItems: 'center' },
  foodEmoji: { fontSize: 28, marginBottom: 4 },
  foodName: { fontSize: 11, fontWeight: '600', color: Colors.light.text, textAlign: 'center' },
  foodBenefit: { fontSize: 9, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 2 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.cardBackground, borderWidth: 2, borderColor: '#FF3B30', paddingVertical: 14, borderRadius: 12, gap: 8 },
  deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#FF3B30' },
});
