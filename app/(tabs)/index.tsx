// app/(tabs)/index.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, AppState, Dimensions, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { getVitalStatus, vitalsService } from '../../services/vitalsService';
import { UserProfile } from '../../types/profile';
import { VitalRecord } from '../../types/vitals';

// --- Notification Imports ---
import { NotificationBell, NotificationModal } from '../../components/Notification/NotificationCenter';
import { clearAllNotifications, getNotifications, markAsRead } from '../../services/appNotificationService';

// ✅ NEW: Sleep Timer Imports
import {
  calculateElapsedTime,
  getSleepTimerStatus,
  initializeSleepTimerService,
  updateSleepTimerNotification
} from '../../services/sleepTimerService';
import { SleepTimerState } from '../../types/sleepTimer';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('Good Evening');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestVitals, setLatestVitals] = useState<Partial<VitalRecord>>({});
  const [refreshing, setRefreshing] = useState(false);

  // --- Notification State ---
  const [isNotifVisible, setNotifVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isClearing, setIsClearing] = useState(false);

  // ✅ NEW: Sleep Timer State
  const [sleepTimerActive, setSleepTimerActive] = useState(false);
  const [sleepTimerStart, setSleepTimerStart] = useState<number | null>(null);
  const [sleepTimerElapsed, setSleepTimerElapsed] = useState('0h 0m');

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Load user data on mount
  useEffect(() => {
    if (user?.uid) {
      loadProfile();
      loadVitals();
      loadNotifications();
      checkSleepTimer(); // ✅ NEW: Check sleep timer status
    }
  }, [user]);

  // ✅ NEW: Initialize Sleep Timer Service
  useEffect(() => {
    initializeSleepTimerService();
  }, []);

  // ✅ NEW: Update sleep timer notification when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && sleepTimerActive) {
        console.log('🔄 App became active, updating sleep timer notification...');
        await updateSleepTimerNotification();
        await checkSleepTimer(); // Refresh timer status
      }
    });

    return () => {
      subscription.remove();
    };
  }, [sleepTimerActive]);

  // ✅ NEW: Update elapsed time every minute when timer is active
  useEffect(() => {
    if (!sleepTimerActive || !sleepTimerStart) return;

    const interval = setInterval(() => {
      const elapsed = calculateElapsedTime(sleepTimerStart);
      setSleepTimerElapsed(elapsed.formatted);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [sleepTimerActive, sleepTimerStart]);

  // ✅ NEW: Check Sleep Timer Status
  const checkSleepTimer = async () => {
    try {
      const status: SleepTimerState | null = await getSleepTimerStatus();
      
      if (status?.isRunning) {
        setSleepTimerActive(true);
        setSleepTimerStart(status.startTime);
        const elapsed = calculateElapsedTime(status.startTime);
        setSleepTimerElapsed(elapsed.formatted);
        console.log(`✅ Sleep timer is active: ${elapsed.formatted}`);
      } else {
        setSleepTimerActive(false);
        setSleepTimerStart(null);
        setSleepTimerElapsed('0h 0m');
      }
    } catch (error) {
      console.error('❌ Error checking sleep timer status:', error);
    }
  };

  const loadProfile = async () => {
    if (!user?.uid) return;
    try {
      const userProfile = await profileService.getProfile(user.uid);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadVitals = async () => {
    if (!user?.uid) return;
    try {
      const vitals = await vitalsService.getLatestVitals(user.uid);
      setLatestVitals(vitals);
    } catch (error) {
      console.error('Error loading vitals:', error);
    }
  };

  // --- Notification Handlers ---
  const loadNotifications = async () => {
    if (!user?.uid) return;
    try {
      const data = await getNotifications(user.uid);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadProfile(),
        loadVitals(),
        loadNotifications(),
        checkSleepTimer(), // ✅ NEW: Also refresh sleep timer status
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    if (!user?.uid) return;
    try {
      await markAsRead(user.uid, id);
      const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
      setNotifications(updated);
      setUnreadCount(updated.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleClearAll = async () => {
    if (!user?.uid || isClearing) return;
    try {
      setIsClearing(true);
      console.log('🗑️ Clearing all notifications...');
      await clearAllNotifications(user.uid);
      await loadNotifications();
      console.log('✅ All notifications cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
      Alert.alert('Error', 'Failed to clear notifications. Please try again.');
      await loadNotifications();
    } finally {
      setIsClearing(false);
    }
  };

  // ✅ NEW: Navigate to FitCalc Sleep Timer
  const handleSleepTimerPress = () => {
    router.push('/(tabs)/fitcalc'); // Navigate to FitCalc with sleep timer
  };

  // --- Helper Functions ---
  const calculateBMI = (): number | null => {
    const weight = latestVitals.weightKg || parseFloat(profile?.profile?.weight || '0');
    const heightCm = latestVitals.heightCm || parseFloat(profile?.profile?.height || '0');
    if (weight > 0 && heightCm > 0) {
      const heightM = heightCm / 100;
      return parseFloat((weight / (heightM * heightM)).toFixed(1));
    }
    return null;
  };

  const getStatusColor = (status: 'normal' | 'alert' | 'critical'): string => {
    switch (status) {
      case 'normal': return '#34C759';
      case 'alert': return '#FF9500';
      case 'critical': return '#FF3B30';
      default: return Colors.light.primary;
    }
  };

  // --- Health Stats Data ---
  const bmi = calculateBMI();
  const heartRateValue = latestVitals.heartRate || null;
  const heartRateStatus = heartRateValue ? getVitalStatus('heartRate', heartRateValue) : 'normal';
  const bpSystolic = latestVitals.bloodPressureSystolic;
  const bpDiastolic = latestVitals.bloodPressureDiastolic;
  const bpStatus = (bpSystolic && bpDiastolic) ? getVitalStatus('bloodPressure', bpSystolic, bpDiastolic) : 'normal';
  const bloodSugarValue = latestVitals.bloodSugarFasting || null;
  const bloodSugarStatus = bloodSugarValue ? getVitalStatus('bloodSugar', bloodSugarValue) : 'normal';
  const weightValue = latestVitals.weightKg || parseFloat(profile?.profile?.weight || '0') || null;

  const actionButtons = [
    { id: 1, icon: 'fitness-outline', label: 'Vitals', route: '/(tabs)/vitals', active: true },
    { id: 2, icon: 'cloud-upload-outline', label: 'Upload', route: '/smart-upload', active: true },
    { id: 3, icon: 'heart-outline', label: 'Symptoms', route: '/(tabs)/symptoms', active: true },
    { id: 5, icon: 'bar-chart-outline', label: 'Reports', route: '/(tabs)/reports', active: true },
    { id: 6, icon: 'scan-outline', label: 'Radiology', route: '/(tabs)/radiology-analyzer', active: true },
    { id: 7, icon: 'sparkles-outline', label: 'AI Report', route: '/(tabs)/ai-report', active: true },
    { id: 9, icon: 'restaurant-outline', label: 'Nutrition', route: 'nutrition-tracker', active: true },
    { id: 10, icon: 'medical-outline', label: 'Medication', route: '/(tabs)/medication-tracker', active: true },
    { id: 12, icon: 'people-outline', label: 'Wellness', route: '/(tabs)/wellness', active: true },
    { id: 13, icon: 'time-outline', label: 'History', route: '/(tabs)/history', active: true },
    { id: 14, icon: 'barbell-outline', label: 'FitCalc', route: 'fitcalc', active: true },
    { id: 15, icon: 'share-social-outline', label: 'Share Card', route: '/(tabs)/share-card', active: true },
    { id: 16, icon: 'library-outline', label: 'Health Library', route: '/(tabs)/learning', active: true },
    { id: 17, icon: 'settings-outline', label: 'Settings', route: '/(tabs)/profile', active: true },
  ];

  const handleActionPress = (button: typeof actionButtons[0]) => {
    console.log('Action pressed:', button.label);
    try {
      // @ts-ignore - Dynamic routes
      router.push(button.route);
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Could not navigate to this screen');
    }
  };

  const handleProfilePress = () => {
    router.push('/(tabs)/profile');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.light.primary}
              colors={[Colors.light.primary]}
            />
          }
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.appName}>PI HEALTH</Text>

            <View style={styles.headerRight}>
              {/* ✅ NEW: Sleep Timer Indicator */}
              {sleepTimerActive && (
                <TouchableOpacity onPress={handleSleepTimerPress} style={styles.sleepTimerBadge} activeOpacity={0.7}>
                  <Ionicons name="moon" size={18} color="#FFF" />
                  <Text style={styles.sleepTimerText}>{sleepTimerElapsed}</Text>
                </TouchableOpacity>
              )}

              <NotificationBell
                onPress={() => setNotifVisible(true)}
                unreadCount={unreadCount}
              />

              <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
                {profile?.photoURL ? (
                  <Image source={{ uri: profile.photoURL }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Text style={styles.profileInitial}>
                      {(user?.displayName?.[0] || profile?.profile?.fullName?.[0] || 'U').toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Greeting Section */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              {greeting}, {user?.displayName || profile?.profile?.fullName || 'User'}
            </Text>
          </View>

          {/* Quick Stats Grid - 1x4 Layout */}
          <View style={styles.statsContainer}>
            {/* Heart Rate Card */}
            <View style={styles.statCard}>
              <Ionicons name="pulse" size={24} color={getStatusColor(heartRateStatus)} style={styles.statIcon} />
              <Text style={styles.statLabel}>Heart Rate</Text>
              <Text style={styles.statValue}>{heartRateValue || '--'}</Text>
              <Text style={styles.statUnit}>bpm</Text>
            </View>

            {/* Blood Pressure Card */}
            <View style={styles.statCard}>
              <Ionicons name="heart-circle" size={24} color={getStatusColor(bpStatus)} style={styles.statIcon} />
              <Text style={styles.statLabel}>BP</Text>
              <Text style={styles.statValue}>
                {(bpSystolic && bpDiastolic) ? `${bpSystolic}/${bpDiastolic}` : '--/--'}
              </Text>
              <Text style={styles.statUnit}>mmHg</Text>
            </View>

            {/* Blood Sugar Card */}
            <View style={styles.statCard}>
              <Ionicons name="water" size={24} color={getStatusColor(bloodSugarStatus)} style={styles.statIcon} />
              <Text style={styles.statLabel}>Sugar</Text>
              <Text style={styles.statValue}>{bloodSugarValue || '--'}</Text>
              <Text style={styles.statUnit}>mg/dL</Text>
            </View>

            {/* Weight/BMI Card */}
            <View style={styles.statCard}>
              <Ionicons name="fitness" size={24} color={Colors.light.primary} style={styles.statIcon} />
              <Text style={styles.statLabel}>{bmi ? 'BMI' : 'Weight'}</Text>
              <Text style={styles.statValue}>
                {bmi ? bmi : (weightValue ? weightValue.toFixed(1) : '--')}
              </Text>
              <Text style={styles.statUnit}>{bmi ? 'kg/m²' : 'kg'}</Text>
            </View>
          </View>

          {/* Action Buttons Grid - 4x5 Layout */}
          <View style={styles.actionsContainer}>
            {actionButtons.map((button) => (
              <TouchableOpacity
                key={button.id}
                style={styles.actionButton}
                onPress={() => handleActionPress(button)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={button.icon as any} size={24} color={Colors.light.primary} />
                </View>
                <Text style={styles.actionLabel}>{button.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* --- Notification Modal --- */}
        <NotificationModal
          visible={isNotifVisible}
          onClose={() => setNotifVisible(false)}
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onClearAll={handleClearAll}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1, backgroundColor: Colors.light.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appName: { fontSize: 22, fontWeight: '700', marginTop: 10, color: Colors.light.text },
  greetingContainer: { paddingHorizontal: 20, paddingBottom: 16 },
  greeting: { fontSize: 26, fontWeight: '700', marginTop: 5, color: Colors.light.text },
  profileButton: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden' },
  profileImage: { width: '100%', height: '100%', borderRadius: 25 },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  
  // ✅ NEW: Sleep Timer Badge Styles
  sleepTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B46C1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  sleepTimerText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 10, gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 10,
    paddingVertical: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  statIcon: { marginBottom: 6 },
  statLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 2,
  },
  statUnit: { fontSize: 10, color: Colors.light.textSecondary, fontWeight: '600', textAlign: 'center' },
  actionsContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 20, gap: 12 },
  actionButton: {
    width: (width - 32 - 36) / 4,
    aspectRatio: 0.9,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: { fontSize: 10, fontWeight: '600', color: Colors.light.text, textAlign: 'center', lineHeight: 12 },
});
