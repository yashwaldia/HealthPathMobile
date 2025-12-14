// app/(tabs)/wellness/skin-hair.tsx
// Skin & Hair Care module screen
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
import SkinHairOverviewCard from '../../../components/wellness/skin-hair/SkinHairOverviewCard';
import WarningSignsCard from '../../../components/wellness/WarningSignsCard';
import WellnessHeader from '../../../components/wellness/WellnessHeader';
import { Colors } from '../../../constants/colors';
import {
  getPersonalizedSuggestions, HAIR_BENEFICIAL_FOODS, HAIR_HEALTH_INDICATORS,
  HAIR_TYPES, MORNING_SKINCARE_ROUTINE, SKIN_BENEFICIAL_FOODS,
  SKIN_HAIR_CHECKUPS, SKIN_HAIR_CONCERNS, SKIN_HAIR_DAILY_TASKS,
  SKIN_HAIR_WARNING_SIGNS, SKIN_HEALTH_INDICATORS, SKIN_TYPES,
} from '../../../constants/skinHairData';
import { useAuth } from '../../../context/AuthContext';
import { wellnessService } from '../../../services/wellnessService';
import {
  DailyTask, MedicalReminder, PersonalizedSuggestions, SkinHairProfile,
} from '../../../types/wellness';

export default function SkinHairScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [profile, setProfile] = useState<SkinHairProfile | null>(null);
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
  const [concerns, setConcerns] = useState<string[]>(['general']);
  const [skinType, setSkinType] = useState('normal');
  const [hairType, setHairType] = useState('straight');
  const [age, setAge] = useState('30');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [setupStep, setSetupStep] = useState<'concern' | 'types' | 'details'>('concern');

  // ⭐ NEW: Reload module when screen comes into focus with useCallback
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

      const existingProfile = await wellnessService.getModuleProfile(user.uid, 'skin-hair');

      if (existingProfile) {
        setProfile(existingProfile as SkinHairProfile);
        await loadModuleData(existingProfile as SkinHairProfile);
      } else {
        setProfile(null);
        setTodayTasks([]);
        setDailyCompletion(0);
        setMedicalReminders([]);
        setSuggestions({ food: [], exercise: [], mentalHealth: [] });
      }
    } catch (error) {
      console.error('Error initializing module:', error);
      showToast('Failed to load Skin & Hair module', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadModuleData = async (prof: SkinHairProfile) => {
    try {
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      setTodayDate(today);

      let tracking = await wellnessService.getDailyTracking(user.uid, 'skin-hair', today);

      if (!tracking) {
        const tasks = SKIN_HAIR_DAILY_TASKS.map((task) => ({
          ...task,
          priority: (task.priority || 'medium') as 'high' | 'medium' | 'low',
        }));

        await wellnessService.saveDailyTracking(user.uid, 'skin-hair', {
          date: today,
          dayNumber: prof.currentDay,
          tasks,
          metrics: {},
          overallCompletion: 0,
        });
        setTodayTasks(tasks);
        setDailyCompletion(0);
      } else {
        setTodayTasks(tracking.tasks);
        // ⭐ OPTION A: Calculate daily task completion
        const completed = tracking.tasks.filter(t => t.completed).length;
        const total = tracking.tasks.length;
        setDailyCompletion(total > 0 ? Math.round((completed / total) * 100) : 0);
      }

      const checkupReminders: MedicalReminder[] = SKIN_HAIR_CHECKUPS.map((checkup, i) => ({
        reminderId: `checkup-${i}`,
        title: checkup.name,
        description: `${checkup.frequency} - ${checkup.description}`,
        dueDate: checkup.frequency,
        urgency: 'upcoming' as const,
        completed: false,
      }));
      setMedicalReminders(checkupReminders);

      setSuggestions(getPersonalizedSuggestions(
        prof.primaryConcern || prof.concerns?.[0] || 'general'
      ));
    } catch (error) {
      console.error('Error loading module data:', error);
    }
  };

  const handleSetupPress = () => {
    setConcerns(['general']);
    setSkinType('normal');
    setHairType('straight');
    setAge('30');
    setGender('male');
    setSetupStep('concern');
    setSetupModalVisible(true);
  };

  const handleSetupConfirm = async () => {
    try {
      const ageNum = parseInt(age);

      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        showToast('Please enter a valid age (1-120)', 'error');
        return;
      }

      if (concerns.length === 0) {
        showToast('Please select at least one concern', 'error');
        return;
      }

      setSetupModalVisible(false);
      setLoading(true);

      if (!user) return;

      const newProfile = await wellnessService.startSkinHairModule(
        user.uid, concerns, skinType, hairType, ageNum, gender
      );

      setProfile(newProfile);
      await loadModuleData(newProfile);
      showToast('Skin & Hair Care module started successfully!', 'success');
    } catch (error) {
      console.error('Error starting module:', error);
      showToast('Failed to start Skin & Hair module', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = () => {
    Alert.alert(
      'Delete Skin & Hair Care Profile',
      'Are you sure you want to delete your Skin & Hair Care profile? This will permanently remove all your tracking data, tasks, and progress.\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user) return;
              setLoading(true);
              await wellnessService.deleteSkinHairModule(user.uid);
              showToast('Skin & Hair Care profile deleted successfully', 'success');
              setTimeout(() => {
                setLoading(false);
                router.push('/(tabs)/wellness');
              }, 800);
            } catch (error) {
              console.error('Error deleting profile:', error);
              showToast('Failed to delete profile', 'error');
              setLoading(false);
            }
          },
        },
      ]
    );
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

      await wellnessService.toggleTaskCompletion(user.uid, 'skin-hair', todayDate, taskId);

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
      console.error('Error toggling task:', error);
      showToast('Failed to update task', 'error');
    }
  };

  const handleReminderPress = (reminder: MedicalReminder) => {
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
        <WellnessHeader
          title="Skin & Hair Care"
          showBackButton
          onBackPress={() => router.push('/(tabs)/wellness')}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Skin & Hair Care...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <WellnessHeader
          title="Skin & Hair Care"
          showBackButton
          onBackPress={() => router.push('/(tabs)/wellness')}
        />
        <View style={styles.loadingContainer}>
          <Ionicons name="sparkles-outline" size={80} color={Colors.light.textSecondary} />
          <Text style={styles.emptyTitle}>Skin & Hair Care Not Set Up</Text>
          <Text style={styles.emptyText}>
            Get personalized skincare and haircare routines for glowing skin and healthy hair.
          </Text>
          <TouchableOpacity style={styles.setupButton} onPress={handleSetupPress}>
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.setupButtonText}>Start Care Plan</Text>
          </TouchableOpacity>
        </View>

        <SetupModal
          visible={setupModalVisible}
          onClose={() => setSetupModalVisible(false)}
          setupStep={setupStep}
          setSetupStep={setSetupStep}
          concerns={concerns}
          setConcerns={setConcerns}
          skinType={skinType}
          setSkinType={setSkinType}
          hairType={hairType}
          setHairType={setHairType}
          age={age}
          setAge={setAge}
          gender={gender}
          setGender={setGender}
          onConfirm={handleSetupConfirm}
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

  const skinStatus =
    SKIN_HEALTH_INDICATORS[
      profile.currentSkinCondition?.toLowerCase() as keyof typeof SKIN_HEALTH_INDICATORS
    ] || SKIN_HEALTH_INDICATORS.good;
  const hairStatus =
    HAIR_HEALTH_INDICATORS[
      profile.currentHairCondition?.toLowerCase() as keyof typeof HAIR_HEALTH_INDICATORS
    ] || HAIR_HEALTH_INDICATORS.good;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <WellnessHeader
        title="Skin & Hair Care"
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
          color="#00BCD4"
        />

        <View style={styles.spacing} />

        <SkinHairOverviewCard
          skinStatus={skinStatus.range}
          skinColor={skinStatus.color}
          skinIcon={skinStatus.icon}
          hairStatus={hairStatus.range}
          hairColor={hairStatus.color}
          hairIcon={hairStatus.icon}
          lastCheckupDate={profile.lastTreatmentDate}
        />

        <View style={styles.spacing} />

        <DailyChecklistCard
          title="Today's Care Routine"
          date={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          tasks={todayTasks}
          onToggleTask={handleTaskToggle}
        />

        <View style={styles.spacing} />

        <View style={styles.routineCard}>
          <View style={styles.routineHeader}>
            <Ionicons name="sunny" size={24} color="#FFA726" />
            <Text style={styles.routineTitle}>Morning Routine</Text>
          </View>
          <View style={styles.routineSteps}>
            {MORNING_SKINCARE_ROUTINE.map((step) => (
              <View key={step.step} style={styles.routineStep}>
                <View style={styles.routineStepNumber}>
                  <Text style={styles.routineStepNumberText}>{step.step}</Text>
                </View>
                <View style={styles.routineStepContent}>
                  <Text style={styles.routineStepName}>{step.name}</Text>
                  <Text style={styles.routineStepDuration}>{step.duration}</Text>
                </View>
                <Ionicons name={step.icon as any} size={20} color={Colors.light.primary} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.spacing} />

        <View style={styles.foodCard}>
          <View style={styles.foodHeader}>
            <Ionicons name="nutrition" size={24} color="#4CAF50" />
            <Text style={styles.foodTitle}>Beneficial Foods</Text>
          </View>

          <Text style={styles.foodSectionTitle}>For Skin Health</Text>
          <View style={styles.foodGrid}>
            {SKIN_BENEFICIAL_FOODS.slice(0, 4).map((food, index) => (
              <View key={index} style={styles.foodItem}>
                <Text style={styles.foodEmoji}>{food.emoji}</Text>
                <Text style={styles.foodName}>{food.food}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.foodSectionTitle, { marginTop: 16 }]}>For Hair Health</Text>
          <View style={styles.foodGrid}>
            {HAIR_BENEFICIAL_FOODS.slice(0, 4).map((food, index) => (
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

        <WarningSignsCard warningsSigns={SKIN_HAIR_WARNING_SIGNS} />

        <View style={styles.spacing} />

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteModule}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete Skin & Hair Care Profile</Text>
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

// ============================================================================
// SETUP MODAL COMPONENT (unchanged - keeping it as is)
// ============================================================================

interface SetupModalProps {
  visible: boolean;
  onClose: () => void;
  setupStep: 'concern' | 'types' | 'details';
  setSetupStep: (step: 'concern' | 'types' | 'details') => void;
  concerns: string[];
  setConcerns: (value: string[]) => void;
  skinType: string;
  setSkinType: (value: string) => void;
  hairType: string;
  setHairType: (value: string) => void;
  age: string;
  setAge: (value: string) => void;
  gender: 'male' | 'female';
  setGender: (value: 'male' | 'female') => void;
  onConfirm: () => void;
}

function SetupModal({
  visible, onClose, setupStep, setSetupStep, concerns, setConcerns,
  skinType, setSkinType, hairType, setHairType, age, setAge,
  gender, setGender, onConfirm,
}: SetupModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyboardAvoid}>
          <View style={styles.modalContainer}>
            {setupStep === 'concern' && (
              <ConcernStep concerns={concerns} setConcerns={setConcerns} onNext={() => setSetupStep('types')} onCancel={onClose} />
            )}
            {setupStep === 'types' && (
              <TypesStep
                skinType={skinType} setSkinType={setSkinType} hairType={hairType} setHairType={setHairType}
                onBack={() => setSetupStep('concern')} onNext={() => setSetupStep('details')}
              />
            )}
            {setupStep === 'details' && (
              <DetailsStep age={age} setAge={setAge} gender={gender} setGender={setGender} onBack={() => setSetupStep('types')} onConfirm={onConfirm} />
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function ConcernStep({ concerns, setConcerns, onNext, onCancel }: {
  concerns: string[]; setConcerns: (value: string[]) => void; onNext: () => void; onCancel: () => void;
}) {
  const toggleConcern = (value: string) => {
    if (value === 'general') {
      setConcerns(['general']);
    } else {
      const filteredConcerns = concerns.filter((c) => c !== 'general');
      if (concerns.includes(value)) {
        const updated = filteredConcerns.filter((c) => c !== value);
        setConcerns(updated.length > 0 ? updated : ['general']);
      } else {
        if (filteredConcerns.length < 3) {
          setConcerns([...filteredConcerns, value]);
        }
      }
    }
  };

  return (
    <>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>What Are Your Concerns?</Text>
        <Text style={styles.modalSubtitle}>Select up to 3 concerns (or choose General)</Text>
      </View>

      <ScrollView style={styles.modalBodyScroll} contentContainerStyle={styles.modalBodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.optionList}>
          {SKIN_HAIR_CONCERNS.map((item) => {
            const isSelected = concerns.includes(item.value);
            const isDisabled = !isSelected && concerns.length >= 3 && !concerns.includes('general');

            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.optionItem, isSelected && styles.optionItemActive, isDisabled && styles.optionItemDisabled]}
                onPress={() => !isDisabled && toggleConcern(item.value)}
                disabled={isDisabled}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                  {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextActive, isDisabled && styles.optionTextDisabled]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.concernHint}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.light.primary} />
          <Text style={styles.concernHintText}>
            {concerns.length === 0 ? 'Select at least one concern' : concerns.includes('general') ? 'General care selected - covers all areas' : `${concerns.length}/3 concerns selected`}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.modalFooter}>
        <TouchableOpacity style={styles.modalButtonSecondary} onPress={onCancel}>
          <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modalButtonPrimary, concerns.length === 0 && styles.buttonDisabled]} onPress={onNext} disabled={concerns.length === 0}>
          <Text style={styles.modalButtonPrimaryText}>Next</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </>
  );
}

function TypesStep({ skinType, setSkinType, hairType, setHairType, onBack, onNext }: {
  skinType: string; setSkinType: (value: string) => void; hairType: string; setHairType: (value: string) => void; onBack: () => void; onNext: () => void;
}) {
  return (
    <>
      <View style={styles.modalHeader}>
        <View style={styles.modalHeaderRow}>
          <TouchableOpacity style={styles.modalHeaderIconButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
          </TouchableOpacity>
          <View style={styles.modalHeaderText}>
            <Text style={styles.modalTitle}>Your Skin & Hair Type</Text>
            <Text style={styles.modalSubtitle}>Help us personalize your routine</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.modalBodyScroll} contentContainerStyle={styles.modalBodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Skin Type</Text>
          <View style={styles.optionList}>
            {SKIN_TYPES.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.optionItem, skinType === item.value && styles.optionItemActive]}
                onPress={() => setSkinType(item.value)}
              >
                <View style={[styles.radio, skinType === item.value && styles.radioActive]}>
                  {skinType === item.value && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.optionText, skinType === item.value && styles.optionTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Hair Type</Text>
          <View style={styles.optionList}>
            {HAIR_TYPES.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.optionItem, hairType === item.value && styles.optionItemActive]}
                onPress={() => setHairType(item.value)}
              >
                <View style={[styles.radio, hairType === item.value && styles.radioActive]}>
                  {hairType === item.value && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.optionText, hairType === item.value && styles.optionTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.modalFooter}>
        <TouchableOpacity style={styles.modalButtonSecondary} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={Colors.light.text} />
          <Text style={styles.modalButtonSecondaryText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalButtonPrimary} onPress={onNext}>
          <Text style={styles.modalButtonPrimaryText}>Next</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </>
  );
}

function DetailsStep({ age, setAge, gender, setGender, onBack, onConfirm }: {
  age: string; setAge: (value: string) => void; gender: 'male' | 'female'; setGender: (value: 'male' | 'female') => void; onBack: () => void; onConfirm: () => void;
}) {
  return (
    <>
      <View style={styles.modalHeader}>
        <View style={styles.modalHeaderRow}>
          <TouchableOpacity style={styles.modalHeaderIconButton} onPress={onBack}>
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
            <TouchableOpacity style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]} onPress={() => setGender('male')}>
              <Ionicons name="male" size={24} color={gender === 'male' ? '#fff' : Colors.light.text} />
              <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]} onPress={() => setGender('female')}>
              <Ionicons name="female" size={24} color={gender === 'female' ? '#fff' : Colors.light.text} />
              <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>Female</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.modalFooter}>
        <TouchableOpacity style={styles.modalButtonSecondary} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={Colors.light.text} />
          <Text style={styles.modalButtonSecondaryText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalButtonPrimary} onPress={onConfirm}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.modalButtonPrimaryText}>Start Care</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// Styles remain the same...
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
  optionItemDisabled: { opacity: 0.4 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Colors.light.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.background },
  checkboxActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.light.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.light.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.light.primary },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.light.text },
  optionTextActive: { color: Colors.light.primary },
  optionTextDisabled: { color: Colors.light.textSecondary },
  concernHint: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.light.primary + '10', borderRadius: 12, padding: 12, marginTop: 16 },
  concernHintText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.light.primary },
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
  buttonDisabled: { opacity: 0.5 },
  routineCard: { backgroundColor: Colors.light.cardBackground, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.light.border },
  routineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  routineTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  routineSteps: { gap: 12 },
  routineStep: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.light.background, borderRadius: 12, padding: 12 },
  routineStepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  routineStepNumberText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  routineStepContent: { flex: 1 },
  routineStepName: { fontSize: 15, fontWeight: '600', color: Colors.light.text, marginBottom: 2 },
  routineStepDuration: { fontSize: 12, color: Colors.light.textSecondary },
  foodCard: { backgroundColor: Colors.light.cardBackground, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.light.border },
  foodHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  foodTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  foodSectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary, marginBottom: 12 },
  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foodItem: { width: '23%', backgroundColor: Colors.light.background, borderRadius: 12, padding: 8, alignItems: 'center' },
  foodEmoji: { fontSize: 32, marginBottom: 4 },
  foodName: { fontSize: 11, fontWeight: '600', color: Colors.light.text, textAlign: 'center' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.cardBackground, borderWidth: 2, borderColor: '#FF3B30', paddingVertical: 14, borderRadius: 12, gap: 8 },
  deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#FF3B30' },
});
