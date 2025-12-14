// app/(tabs)/wellness/liver-kidney.tsx
// Liver & Kidney Care module screen
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
import LiverKidneyOverviewCard from '../../../components/wellness/liver-kidney/LiverKidneyOverviewCard';
import { Colors } from '../../../constants/colors';
import {
  getPersonalizedSuggestions, KIDNEY_BENEFICIAL_FOODS, KIDNEY_HEALTH_INDICATORS,
  LIVER_BENEFICIAL_FOODS, LIVER_HEALTH_INDICATORS, LIVER_KIDNEY_CONCERNS,
  LIVER_KIDNEY_DAILY_TASKS, LIVER_KIDNEY_LAB_TESTS, LIVER_KIDNEY_WARNING_SIGNS,
} from '../../../constants/liverKidneyData';
import { useAuth } from '../../../context/AuthContext';
import { wellnessService } from '../../../services/wellnessService';
import {
  DailyTask, LiverKidneyProfile, MedicalReminder, PersonalizedSuggestions,
} from '../../../types/wellness';

export default function LiverKidneyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [profile, setProfile] = useState<LiverKidneyProfile | null>(null);
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
  const [condition, setCondition] = useState('general');
  const [age, setAge] = useState('30');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [dietType, setDietType] = useState<'detox' | 'maintenance'>('detox');
  const [setupStep, setSetupStep] = useState<'condition' | 'details'>('condition');

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
      if (!user) {
        setProfile(null);
        return;
      }

      const existingProfile = await wellnessService.getModuleProfile(user.uid, 'liver-kidney');

      if (existingProfile) {
        setProfile(existingProfile as LiverKidneyProfile);
        await loadModuleData(existingProfile as LiverKidneyProfile);
      } else {
        setProfile(null);
        setTodayTasks([]);
        setDailyCompletion(0);
        setMedicalReminders([]);
        setSuggestions({ food: [], exercise: [], mentalHealth: [] });
      }
    } catch (error) {
      console.error('❌ Error initializing module:', error);
      setProfile(null);
      showToast('Failed to load Liver & Kidney module', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPress = () => {
    setCondition('general');
    setAge('30');
    setGender('male');
    setDietType('detox');
    setSetupStep('condition');
    setSetupModalVisible(true);
  };

  const handleConditionNext = () => {
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

      const newProfile = await wellnessService.startLiverKidneyModule(
        user.uid, condition, dietType, ageNum, gender
      );

      setProfile(newProfile);
      await loadModuleData(newProfile);
      showToast('Liver & Kidney Care module started successfully!', 'success');
    } catch (error) {
      console.error('❌ Error starting module:', error);
      showToast('Failed to start Liver & Kidney module', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadModuleData = async (prof: LiverKidneyProfile) => {
    try {
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      setTodayDate(today);

      let tracking = await wellnessService.getDailyTracking(user.uid, 'liver-kidney', today);

      if (!tracking) {
        const tasks = LIVER_KIDNEY_DAILY_TASKS.map((task) => ({
          ...task,
          priority: (task.priority || 'medium') as 'high' | 'medium' | 'low',
        }));
        
        const newTracking = {
          date: today,
          dayNumber: prof.detoxDay,
          tasks,
          metrics: {},
          overallCompletion: 0,
        };
        await wellnessService.saveDailyTracking(user.uid, 'liver-kidney', newTracking);
        setTodayTasks(tasks);
        setDailyCompletion(0);
      } else {
        setTodayTasks(tracking.tasks);
        // ⭐ OPTION A: Calculate daily task completion
        const completed = tracking.tasks.filter(t => t.completed).length;
        const total = tracking.tasks.length;
        setDailyCompletion(total > 0 ? Math.round((completed / total) * 100) : 0);
      }

      const testReminders: MedicalReminder[] = LIVER_KIDNEY_LAB_TESTS.map((test, i) => ({
        reminderId: `test-${i}`,
        title: test.name,
        description: `${test.frequency} - ${test.parameters.join(', ')}`,
        dueDate: test.frequency,
        urgency: 'upcoming' as const,
        completed: false,
      }));
      setMedicalReminders(testReminders);

      const personalizedSuggestions = getPersonalizedSuggestions(prof.condition || 'general');
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

      await wellnessService.toggleTaskCompletion(user.uid, 'liver-kidney', todayDate, taskId);

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
    Alert.alert(reminder.title, reminder.description, [{ text: 'OK' }]);
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Liver & Kidney Care Profile',
      'Are you sure you want to delete your Liver & Kidney Care profile? This will permanently remove all your tracking data, tasks, and progress. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user) return;

              setLoading(true);
              await wellnessService.deleteLiverKidneyModule(user.uid);
              
              showToast('Liver & Kidney Care profile deleted successfully', 'success');
              
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
          title="Liver & Kidney Care"
          showBackButton
          onBackPress={() => router.push('/(tabs)/wellness')}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Liver & Kidney Care...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <WellnessHeader
          title="Liver & Kidney Care"
          showBackButton
          onBackPress={() => router.push('/(tabs)/wellness')}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyEmoji}>🫘</Text>
          <Text style={styles.emptyTitle}>Liver & Kidney Care Not Set Up</Text>
          <Text style={styles.emptyText}>
            Support your liver and kidney health with personalized diet, hydration, and lifestyle guidance.
          </Text>
          <TouchableOpacity style={styles.setupButton} onPress={handleSetupPress}>
            <Ionicons name="medical" size={20} color="#fff" />
            <Text style={styles.setupButtonText}>Start Care Plan</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={setupModalVisible} transparent animationType="fade" onRequestClose={() => setSetupModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyboardAvoid}>
              <View style={styles.modalContainer}>
                {setupStep === 'condition' ? (
                  <>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>What's Your Main Concern?</Text>
                      <Text style={styles.modalSubtitle}>Choose your primary health focus</Text>
                    </View>

                    <ScrollView style={styles.modalBodyScroll} contentContainerStyle={styles.modalBodyContent} showsVerticalScrollIndicator={false}>
                      <View style={styles.optionList}>
                        {LIVER_KIDNEY_CONCERNS.map((item) => (
                          <TouchableOpacity
                            key={item.value}
                            style={[styles.optionItem, condition === item.value && styles.optionItemActive]}
                            onPress={() => setCondition(item.value)}
                          >
                            <View style={[styles.radio, condition === item.value && styles.radioActive]}>
                              {condition === item.value && <View style={styles.radioInner} />}
                            </View>
                            <Text style={[styles.optionText, condition === item.value && styles.optionTextActive]}>
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
                      <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleConditionNext}>
                        <Text style={styles.modalButtonPrimaryText}>Next</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalHeaderRow}>
                        <TouchableOpacity style={styles.modalHeaderIconButton} onPress={() => setSetupStep('condition')}>
                          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
                        </TouchableOpacity>
                        <View style={styles.modalHeaderText}>
                          <Text style={styles.modalTitle}>Personal Details</Text>
                          <Text style={styles.modalSubtitle}>Final step to get started</Text>
                        </View>
                      </View>
                    </View>

                    <ScrollView style={styles.modalBodyScroll} contentContainerStyle={styles.modalBodyContent} showsVerticalScrollIndicator={false}>
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

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Diet Plan</Text>
                        <View style={styles.genderContainer}>
                          <TouchableOpacity
                            style={[styles.genderButton, dietType === 'detox' && styles.genderButtonActive]}
                            onPress={() => setDietType('detox')}
                          >
                            <Ionicons name="leaf" size={24} color={dietType === 'detox' ? '#fff' : Colors.light.text} />
                            <Text style={[styles.genderText, dietType === 'detox' && styles.genderTextActive]}>Detox</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.genderButton, dietType === 'maintenance' && styles.genderButtonActive]}
                            onPress={() => setDietType('maintenance')}
                          >
                            <Ionicons name="fitness" size={24} color={dietType === 'maintenance' ? '#fff' : Colors.light.text} />
                            <Text style={[styles.genderText, dietType === 'maintenance' && styles.genderTextActive]}>Maintenance</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                      <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setSetupStep('condition')}>
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

  const liverStatus = LIVER_HEALTH_INDICATORS[
    (profile.currentLiverStatus?.toLowerCase() || 'good') as keyof typeof LIVER_HEALTH_INDICATORS
  ] || LIVER_HEALTH_INDICATORS.good;
  
  const kidneyStatus = KIDNEY_HEALTH_INDICATORS[
    (profile.currentKidneyStatus?.toLowerCase() || 'good') as keyof typeof KIDNEY_HEALTH_INDICATORS
  ] || KIDNEY_HEALTH_INDICATORS.good;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <WellnessHeader
        title="Liver & Kidney Care"
        subtitle={`Day ${profile.detoxDay} of 30`}
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
          color="#2196F3"
        />

        <View style={styles.spacing} />

        <LiverKidneyOverviewCard
          liverStatus={liverStatus.range}
          liverColor={liverStatus.color}
          liverIcon={liverStatus.icon}
          kidneyStatus={kidneyStatus.range}
          kidneyColor={kidneyStatus.color}
          kidneyIcon={kidneyStatus.icon}
          lastTestDate={profile.lastTestDate}
        />

        <View style={styles.spacing} />

        <DailyChecklistCard
          title="Today's Health Tasks"
          date={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          tasks={todayTasks}
          onToggleTask={handleTaskToggle}
        />

        <View style={styles.spacing} />

        <View style={styles.foodCard}>
          <View style={styles.foodHeader}>
            <Ionicons name="nutrition" size={24} color="#4CAF50" />
            <Text style={styles.foodTitle}>Beneficial Foods</Text>
          </View>
          
          <Text style={styles.foodSectionTitle}>For Liver Health</Text>
          <View style={styles.foodGrid}>
            {LIVER_BENEFICIAL_FOODS.slice(0, 8).map((food, index) => (
              <View key={index} style={styles.foodItem}>
                <Text style={styles.foodEmoji}>{food.emoji}</Text>
                <Text style={styles.foodName}>{food.food}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.foodSectionTitle, { marginTop: 16 }]}>For Kidney Health</Text>
          <View style={styles.foodGrid}>
            {KIDNEY_BENEFICIAL_FOODS.slice(0, 8).map((food, index) => (
              <View key={index} style={styles.foodItem}>
                <Text style={styles.foodEmoji}>{food.emoji}</Text>
                <Text style={styles.foodName}>{food.food}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.spacing} />

        <PersonalizedSuggestionsCard suggestions={suggestions} />

        <View style={styles.spacing} />

        <MedicalRemindersCard reminders={medicalReminders} onReminderPress={handleReminderPress} />

        <View style={styles.spacing} />

        <WarningSignsCard warningsSigns={LIVER_KIDNEY_WARNING_SIGNS} />

        <View style={styles.spacing} />

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete Liver & Kidney Profile</Text>
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
  emptyEmoji: { fontSize: 64 },
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
  modalBodyScroll: { maxHeight: 400 },
  modalBodyContent: { padding: 24, paddingBottom: 8 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 12 },
  modalInput: { backgroundColor: Colors.light.background, borderRadius: 12, padding: 16, fontSize: 16, color: Colors.light.text, borderWidth: 2, borderColor: Colors.light.border },
  optionList: { gap: 10 },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.light.background, borderWidth: 2, borderColor: Colors.light.border, borderRadius: 12, padding: 14 },
  optionItemActive: { backgroundColor: `${Colors.light.primary}10`, borderColor: Colors.light.primary },
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
  foodItem: { width: '22.5%', backgroundColor: Colors.light.background, borderRadius: 12, padding: 8, alignItems: 'center', minHeight: 80, justifyContent: 'center' },
  foodEmoji: { fontSize: 28, marginBottom: 4 },
  foodName: { fontSize: 10, fontWeight: '600', color: Colors.light.text, textAlign: 'center' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.cardBackground, borderWidth: 2, borderColor: '#FF3B30', paddingVertical: 14, borderRadius: 12, gap: 8 },
  deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#FF3B30' },
});
