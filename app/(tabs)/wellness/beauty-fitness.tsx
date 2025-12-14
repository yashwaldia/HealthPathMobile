// app/(tabs)/wellness/beauty-fitness.tsx
// Beauty & Fitness module screen
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
import BeautyFitnessOverviewCard from '../../../components/wellness/beauty-fitness/BeautyFitnessOverviewCard';
import DailyChecklistCard from '../../../components/wellness/DailyChecklistCard';
import MedicalRemindersCard from '../../../components/wellness/MedicalRemindersCard';
import PersonalizedSuggestionsCard from '../../../components/wellness/PersonalizedSuggestionsCard';
import ProgressTracker from '../../../components/wellness/ProgressTracker';
import WarningSignsCard from '../../../components/wellness/WarningSignsCard';
import WellnessHeader from '../../../components/wellness/WellnessHeader';
import {
  BEAUTY_FITNESS_CHECKUPS, BEAUTY_FITNESS_DAILY_TASKS, BEAUTY_FITNESS_WARNING_SIGNS,
  FITNESS_GOALS, FITNESS_INDICATORS, FITNESS_LEVELS, getPersonalizedSuggestions,
  HAIR_HEALTHY_FOODS, SKIN_HEALTHY_FOODS, SKIN_TYPES, WORKOUT_TYPES,
} from '../../../constants/beautyFitnessData';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { wellnessService } from '../../../services/wellnessService';
import {
  BeautyFitnessProfile, DailyTask, MedicalReminder, PersonalizedSuggestions,
} from '../../../types/wellness';

export default function BeautyFitnessScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [profile, setProfile] = useState<BeautyFitnessProfile | null>(null);
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
  const [fitnessGoal, setFitnessGoal] = useState('weight-loss');
  const [skinType, setSkinType] = useState('normal');
  const [age, setAge] = useState('30');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState('170');
  const [currentWeight, setCurrentWeight] = useState('70');
  const [targetWeight, setTargetWeight] = useState('65');
  const [fitnessLevel, setFitnessLevel] = useState('beginner');
  const [setupStep, setSetupStep] = useState<'goal' | 'body' | 'details'>('goal');

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

      const existingProfile = await wellnessService.getModuleProfile(user.uid, 'beauty-fitness');

      if (existingProfile) {
        setProfile(existingProfile as BeautyFitnessProfile);
        await loadModuleData(existingProfile as BeautyFitnessProfile);
      } else {
        setProfile(null);
        setTodayTasks([]);
        setDailyCompletion(0);
        setMedicalReminders([]);
        setSuggestions({ food: [], exercise: [], mentalHealth: [] });
      }
    } catch (error) {
      console.error('❌ Error initializing module:', error);
      showToast('Failed to load Beauty & Fitness module', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPress = () => {
    setFitnessGoal('weight-loss');
    setSkinType('normal');
    setAge('30');
    setGender('male');
    setHeight('170');
    setCurrentWeight('70');
    setTargetWeight('65');
    setFitnessLevel('beginner');
    setSetupStep('goal');
    setSetupModalVisible(true);
  };

  const handleGoalNext = () => {
    setSetupStep('body');
  };

  const handleBodyNext = () => {
    setSetupStep('details');
  };

  const handleSetupConfirm = async () => {
    try {
      const ageNum = parseInt(age);
      const heightNum = parseInt(height);
      const currentWeightNum = parseFloat(currentWeight);
      const targetWeightNum = parseFloat(targetWeight);

      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        showToast('Please enter a valid age (1-120)', 'error');
        return;
      }

      if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
        showToast('Please enter a valid height (50-300 cm)', 'error');
        return;
      }

      if (isNaN(currentWeightNum) || currentWeightNum < 20 || currentWeightNum > 500) {
        showToast('Please enter a valid current weight', 'error');
        return;
      }

      if (isNaN(targetWeightNum) || targetWeightNum < 20 || targetWeightNum > 500) {
        showToast('Please enter a valid target weight', 'error');
        return;
      }

      setSetupModalVisible(false);
      setLoading(true);

      if (!user) return;

      const newProfile = await wellnessService.startBeautyFitnessModule(
        user.uid, fitnessGoal, currentWeightNum, heightNum, ageNum, gender, targetWeightNum, fitnessLevel
      );

      setProfile(newProfile);
      await loadModuleData(newProfile);
      showToast('Beauty & Fitness module started successfully!', 'success');
    } catch (error) {
      console.error('❌ Error starting module:', error);
      showToast('Failed to start Beauty & Fitness module', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = () => {
    Alert.alert(
      'Delete Beauty & Fitness Profile',
      'Are you sure you want to delete your Beauty & Fitness profile? This will permanently remove all your tracking data, tasks, and progress.\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user) return;

              setLoading(true);
              await wellnessService.deleteBeautyFitnessModule(user.uid);

              showToast('Beauty & Fitness profile deleted successfully', 'success');

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

  const loadModuleData = async (prof: BeautyFitnessProfile) => {
    try {
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      setTodayDate(today);

      let tracking = await wellnessService.getDailyTracking(user.uid, 'beauty-fitness', today);

      if (!tracking) {
        const tasks = BEAUTY_FITNESS_DAILY_TASKS.map((task) => ({
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
        await wellnessService.saveDailyTracking(user.uid, 'beauty-fitness', newTracking);
        setTodayTasks(tasks);
        setDailyCompletion(0);
      } else {
        setTodayTasks(tracking.tasks);
        // ⭐ OPTION A: Calculate daily task completion
        const completed = tracking.tasks.filter(t => t.completed).length;
        const total = tracking.tasks.length;
        setDailyCompletion(total > 0 ? Math.round((completed / total) * 100) : 0);
      }

      const checkupReminders: MedicalReminder[] = BEAUTY_FITNESS_CHECKUPS.map((checkup: any, i: number) => ({
        reminderId: `checkup-${i}`,
        title: checkup.name,
        description: `${checkup.frequency} - ${checkup.description}`,
        dueDate: checkup.frequency,
        urgency: 'upcoming' as const,
        completed: false,
      }));
      setMedicalReminders(checkupReminders);

      const personalizedSuggestions = getPersonalizedSuggestions(fitnessGoal);
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

      await wellnessService.toggleTaskCompletion(user.uid, 'beauty-fitness', todayDate, taskId);

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

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <WellnessHeader title="Beauty & Fitness" showBackButton onBackPress={() => router.push('/(tabs)/wellness')} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Beauty & Fitness...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <WellnessHeader title="Beauty & Fitness" showBackButton onBackPress={() => router.push('/(tabs)/wellness')} />
        <View style={styles.loadingContainer}>
          <Ionicons name="fitness-outline" size={80} color={Colors.light.textSecondary} />
          <Text style={styles.emptyTitle}>Beauty & Fitness Not Set Up</Text>
          <Text style={styles.emptyText}>
            Get personalized fitness and beauty plan for a healthier lifestyle.
          </Text>
          <TouchableOpacity style={styles.setupButton} onPress={handleSetupPress}>
            <Ionicons name="fitness" size={20} color="#fff" />
            <Text style={styles.setupButtonText}>Start Fitness Plan</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={setupModalVisible} transparent animationType="fade" onRequestClose={() => setSetupModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyboardAvoid}>
              <View style={styles.modalContainer}>
                {setupStep === 'goal' ? (
                  <>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>What's Your Fitness Goal?</Text>
                      <Text style={styles.modalSubtitle}>Choose your primary objective</Text>
                    </View>

                    <ScrollView style={styles.modalBodyScroll} contentContainerStyle={styles.modalBodyContent} showsVerticalScrollIndicator={false}>
                      <View style={styles.optionList}>
                        {FITNESS_GOALS.map((item: any) => (
                          <TouchableOpacity
                            key={item.value}
                            style={[styles.optionItem, fitnessGoal === item.value && styles.optionItemActive]}
                            onPress={() => setFitnessGoal(item.value)}
                          >
                            <View style={[styles.radio, fitnessGoal === item.value && styles.radioActive]}>
                              {fitnessGoal === item.value && <View style={styles.radioInner} />}
                            </View>
                            <Text style={[styles.optionText, fitnessGoal === item.value && styles.optionTextActive]}>
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
                      <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleGoalNext}>
                        <Text style={styles.modalButtonPrimaryText}>Next</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : setupStep === 'body' ? (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalHeaderRow}>
                        <TouchableOpacity style={styles.modalHeaderIconButton} onPress={() => setSetupStep('goal')}>
                          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
                        </TouchableOpacity>
                        <View style={styles.modalHeaderText}>
                          <Text style={styles.modalTitle}>Body Measurements</Text>
                          <Text style={styles.modalSubtitle}>Help us personalize your plan</Text>
                        </View>
                      </View>
                    </View>

                    <ScrollView style={styles.modalBodyScroll} contentContainerStyle={styles.modalBodyContent} showsVerticalScrollIndicator={false}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Height (cm)</Text>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="Enter your height"
                          placeholderTextColor={Colors.light.textSecondary}
                          value={height}
                          onChangeText={setHeight}
                          keyboardType="number-pad"
                          maxLength={3}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Current Weight (kg)</Text>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="Enter current weight"
                          placeholderTextColor={Colors.light.textSecondary}
                          value={currentWeight}
                          onChangeText={setCurrentWeight}
                          keyboardType="decimal-pad"
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Target Weight (kg)</Text>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="Enter target weight"
                          placeholderTextColor={Colors.light.textSecondary}
                          value={targetWeight}
                          onChangeText={setTargetWeight}
                          keyboardType="decimal-pad"
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Skin Type</Text>
                        <View style={styles.optionList}>
                          {SKIN_TYPES.map((item: any) => (
                            <TouchableOpacity
                              key={item.value}
                              style={[styles.optionItem, skinType === item.value && styles.optionItemActive]}
                              onPress={() => setSkinType(item.value)}
                            >
                              <View style={[styles.radio, skinType === item.value && styles.radioActive]}>
                                {skinType === item.value && <View style={styles.radioInner} />}
                              </View>
                              <Text style={[styles.optionText, skinType === item.value && styles.optionTextActive]}>
                                {item.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                      <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setSetupStep('goal')}>
                        <Ionicons name="arrow-back" size={18} color={Colors.light.text} />
                        <Text style={styles.modalButtonSecondaryText}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleBodyNext}>
                        <Text style={styles.modalButtonPrimaryText}>Next</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalHeaderRow}>
                        <TouchableOpacity style={styles.modalHeaderIconButton} onPress={() => setSetupStep('body')}>
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
                        <Text style={styles.inputLabel}>Fitness Level</Text>
                        <View style={styles.optionList}>
                          {FITNESS_LEVELS.map((item: any) => (
                            <TouchableOpacity
                              key={item.value}
                              style={[styles.optionItem, fitnessLevel === item.value && styles.optionItemActive]}
                              onPress={() => setFitnessLevel(item.value)}
                            >
                              <View style={[styles.radio, fitnessLevel === item.value && styles.radioActive]}>
                                {fitnessLevel === item.value && <View style={styles.radioInner} />}
                              </View>
                              <Text style={[styles.optionText, fitnessLevel === item.value && styles.optionTextActive]}>
                                {item.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                      <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setSetupStep('body')}>
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

  const fitnessStatus = (() => {
    if (!profile.heightCm || !profile.currentWeightKg) {
      return FITNESS_INDICATORS.good;
    }

    const currentBmi = profile.currentWeightKg / ((profile.heightCm / 100) ** 2);

    if (currentBmi < 18.5) return FITNESS_INDICATORS.poor;
    if (currentBmi >= 18.5 && currentBmi < 25) return FITNESS_INDICATORS.excellent;
    if (currentBmi >= 25 && currentBmi < 30) return FITNESS_INDICATORS.good;
    return FITNESS_INDICATORS.fair;
  })();

  const bmi = profile.heightCm && profile.currentWeightKg 
    ? (profile.currentWeightKg / ((profile.heightCm / 100) ** 2))
    : undefined;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <WellnessHeader
        title="Beauty & Fitness"
        subtitle={`Day ${profile.currentDay} of 30`}
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
          color="#9C27B0"
        />

        <View style={styles.spacing} />

        <BeautyFitnessOverviewCard
          fitnessStatus={fitnessStatus.range}
          statusColor={fitnessStatus.color}
          statusIcon={fitnessStatus.icon}
          currentWeight={profile.currentWeightKg}
          targetWeight={profile.targetWeightKg}
          bmi={bmi}
          lastWeightCheck={profile.lastWeightCheckDate}
        />

        <View style={styles.spacing} />

        <DailyChecklistCard
          title="Today's Fitness Routine"
          date={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          tasks={todayTasks}
          onToggleTask={handleTaskToggle}
        />

        <View style={styles.spacing} />

        <View style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <Ionicons name="barbell" size={24} color="#9C27B0" />
            <Text style={styles.workoutTitle}>Recommended Workouts</Text>
          </View>
          <View style={styles.workoutGrid}>
            {WORKOUT_TYPES.slice(0, 4).map((workout: any, index: number) => (
              <View key={index} style={styles.workoutItem}>
                <Ionicons name={workout.icon as any} size={32} color={Colors.light.primary} />
                <Text style={styles.workoutName}>{workout.name}</Text>
                <Text style={styles.workoutBenefit}>{workout.benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.spacing} />

        <View style={styles.foodCard}>
          <View style={styles.foodHeader}>
            <Ionicons name="nutrition" size={24} color="#E91E63" />
            <Text style={styles.foodTitle}>Beauty Nutrition</Text>
          </View>

          <Text style={styles.foodSectionTitle}>Skin Health</Text>
          <View style={styles.foodGrid}>
            {SKIN_HEALTHY_FOODS.slice(0, 4).map((food: any, index: number) => (
              <View key={index} style={styles.foodItem}>
                <Text style={styles.foodEmoji}>{food.emoji}</Text>
                <Text style={styles.foodName}>{food.food}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.foodSectionTitle, { marginTop: 16 }]}>Hair Health</Text>
          <View style={styles.foodGrid}>
            {HAIR_HEALTHY_FOODS.slice(0, 4).map((food: any, index: number) => (
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

        <WarningSignsCard warningsSigns={BEAUTY_FITNESS_WARNING_SIGNS} />

        <View style={styles.spacing} />

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteModule}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete Beauty & Fitness Profile</Text>
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
  workoutCard: { backgroundColor: Colors.light.cardBackground, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.light.border },
  workoutHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  workoutTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  workoutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  workoutItem: { width: '47%', backgroundColor: Colors.light.background, borderRadius: 12, padding: 12, alignItems: 'center' },
  workoutName: { fontSize: 13, fontWeight: '600', color: Colors.light.text, marginTop: 8, textAlign: 'center' },
  workoutBenefit: { fontSize: 11, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 4 },
  foodCard: { backgroundColor: Colors.light.cardBackground, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.light.border },
  foodHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  foodTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  foodSectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary, marginBottom: 12 },
  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foodItem: { width: '23%', backgroundColor: Colors.light.background, borderRadius: 12, padding: 8, alignItems: 'center' },
  foodEmoji: { fontSize: 28, marginBottom: 4 },
  foodName: { fontSize: 11, fontWeight: '600', color: Colors.light.text, textAlign: 'center' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.cardBackground, borderWidth: 2, borderColor: '#FF3B30', paddingVertical: 14, borderRadius: 12, gap: 8 },
  deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#FF3B30' },
});
