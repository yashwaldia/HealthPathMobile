// app/(tabs)/index.tsx


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../../types/profile';


// --- Notification Imports ---
import { NotificationBell, NotificationModal } from '../../components/Notification/NotificationCenter';
import { getNotifications, markAsRead, clearAllNotifications } from '../../services/appNotificationService';
// ----------------------------


const { width } = Dimensions.get('window');


// Sample health data (will be replaced with real data from Firestore later)
const HEALTH_STATS = {
  calories: { current: 1200, goal: 2200 },
  steps: { current: 6504, goal: 10000 },
  heartRate: { current: 68, unit: 'bpm' },
  sleep: { hours: 7, minutes: 23 },
};


export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('Good Evening');
  const [profile, setProfile] = useState<UserProfile | null>(null);


  // --- Notification State ---
  const [isNotifVisible, setNotifVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);


  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);


  // Load user profile & Notifications
  useEffect(() => {
    if (user?.uid) {
      loadProfile();
      loadNotifications(); // Load notifications when user is ready
    }
  }, [user]);


  const loadProfile = async () => {
    if (!user?.uid) return;
    
    try {
      const userProfile = await profileService.getProfile(user.uid);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };


  // --- Notification Handlers ---
  const loadNotifications = async () => {
    if (!user?.uid) return;
    const data = await getNotifications(user.uid);
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.read).length);
  };


  const handleMarkRead = async (id: string) => {
    if (!user?.uid) return;
    await markAsRead(user.uid, id);
    // Optimistic update
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
  };
  
  const handleClearAll = async () => {
    if (!user?.uid) return;
    await clearAllNotifications(user.uid);
    setNotifications([]);
    setUnreadCount(0);
  };
  // -----------------------------


  // Updated: all buttons active, including AI Report enabled
  const actionButtons = [
    { id: 1, icon: 'fitness-outline', label: 'Vitals', route: '/(tabs)/vitals', active: true },
    { id: 2, icon: 'cloud-upload-outline', label: 'Upload', route: '/smart-upload', active: true },
    { id: 3, icon: 'heart-outline', label: 'Symptoms', route: '/(tabs)/symptoms', active: true },
    { id: 4, icon: 'flask-outline', label: 'Lab Tests', route: 'interpreter', active: true },
    { id: 5, icon: 'bar-chart-outline', label: 'Reports', route: '/(tabs)/reports', active: true },
    { id: 6, icon: 'scan-outline', label: 'Radiology', route: '/(tabs)/radiology-analyzer', active: true },
    { id: 7, icon: 'sparkles-outline', label: 'AI Report', route: '/(tabs)/ai-report', active: true },
    { id: 8, icon: 'pulse-outline', label: 'Biohacking', route: 'biohacking', active: true },
    { id: 9, icon: 'restaurant-outline', label: 'Nutrition', route: 'nutrition-tracker', active: true },
    { id: 10, icon: 'medical-outline', label: 'Medication', route: '/(tabs)/medication-tracker', active: true },
    { id: 11, icon: 'shield-checkmark-outline', label: 'Screening', route: 'screening-tracker', active: true },
    { id: 12, icon: 'people-outline', label: 'Child Health', route: 'child-health', active: true },
    { id: 13, icon: 'time-outline', label: 'History', route: '/(tabs)/history', active: true },
    { id: 14, icon: 'barbell-outline', label: 'FitCalc', route: 'fitcalc', active: true },
    // { id: 15, icon: 'nutrition-outline', label: 'MacroMaster', route: 'macromaster', active: true },
    { id: 16, icon: 'library-outline', label: 'Health Library', route: '/(tabs)/learning', active: true },
    { id: 17, icon: 'settings-outline', label: 'Settings', route: 'settings', active: true },
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
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.appName}>HealthPath</Text>
            
            {/* --- Updated Header Right Side --- */}
            <View style={styles.headerRight}>
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
            {/* --------------------------------- */}
          </View>


          {/* Greeting Section */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              {greeting}, {user?.displayName || profile?.profile?.fullName || 'User'}
            </Text>
          </View>


          {/* Quick Stats Grid - 1x4 Layout */}
          <View style={styles.statsContainer}>
            {/* Calories Card */}
            <View style={styles.statCard}>
              <Ionicons name="flame-outline" size={24} color={Colors.light.primary} style={styles.statIcon} />
              <Text style={styles.statLabel}>Calories</Text>
              <Text style={styles.statValue}>{HEALTH_STATS.calories.current}</Text>
              <Text style={styles.statGoal}>/{HEALTH_STATS.calories.goal}</Text>
            </View>


            {/* Steps Card */}
            <View style={styles.statCard}>
              <Ionicons name="footsteps-outline" size={24} color={Colors.light.primary} style={styles.statIcon} />
              <Text style={styles.statLabel}>Steps</Text>
              <Text style={styles.statValue}>{(HEALTH_STATS.steps.current / 1000).toFixed(1)}k</Text>
              <Text style={styles.statGoal}>/{(HEALTH_STATS.steps.goal / 1000).toFixed(0)}k</Text>
            </View>


            {/* Heart Rate Card */}
            <View style={styles.statCard}>
              <Ionicons name="heart-outline" size={24} color={Colors.light.primary} style={styles.statIcon} />
              <Text style={styles.statLabel}>HR</Text>
              <Text style={styles.statValue}>{HEALTH_STATS.heartRate.current}</Text>
              <Text style={styles.statUnit}>bpm</Text>
            </View>


            {/* Sleep Card */}
            <View style={styles.statCard}>
              <Ionicons name="moon-outline" size={24} color={Colors.light.primary} style={styles.statIcon} />
              <Text style={styles.statLabel}>Sleep</Text>
              <Text style={styles.statValue}>{HEALTH_STATS.sleep.hours}h</Text>
              <Text style={styles.statUnit}>{HEALTH_STATS.sleep.minutes}m</Text>
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
                  <Ionicons 
                    name={button.icon as any} 
                    size={24} 
                    color={Colors.light.primary} 
                  />
                </View>
                <Text style={styles.actionLabel}>
                  {button.label}
                </Text>
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
        {/* -------------------------- */}


      </View>
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
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  // Added style for the right side container
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 10,
    color: Colors.light.text,
  },
  greetingContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 5,
    color: Colors.light.text,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 10,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  statIcon: {
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  statGoal: {
    fontSize: 10,
    color: Colors.light.textLight,
    fontWeight: '600',
    marginTop: 2,
  },
  statUnit: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
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
  actionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 12,
  },
}); 
