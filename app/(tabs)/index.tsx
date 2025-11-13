import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

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

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Action button data with professional Ionicons - ALL features from website sidebar
  const actionButtons = [
    { id: 1, icon: 'fitness-outline', label: 'Vitals', route: '/(tabs)/vitals' },
    { id: 2, icon: 'cloud-upload-outline', label: 'Upload', route: 'smart-upload' },
    { id: 3, icon: 'heart-outline', label: 'Symptoms', route: 'symptom-selector' },
    { id: 4, icon: 'flask-outline', label: 'Lab Tests', route: 'interpreter' },
    { id: 5, icon: 'bar-chart-outline', label: 'Reports', route: 'dashboard' },
    { id: 6, icon: 'scan-outline', label: 'Radiology', route: 'radiology-analyzer' },
    { id: 7, icon: 'sparkles-outline', label: 'AI Report', route: 'ai-report' },
    { id: 8, icon: 'pulse-outline', label: 'Biohacking', route: 'biohacking' },
    { id: 9, icon: 'restaurant-outline', label: 'Nutrition', route: 'nutrition-tracker' },
    { id: 10, icon: 'medical-outline', label: 'Medication', route: 'medication-tracker' },
    { id: 11, icon: 'shield-checkmark-outline', label: 'Screening', route: 'screening-tracker' },
    { id: 12, icon: 'people-outline', label: 'Child Health', route: 'child-health' },
    { id: 13, icon: 'time-outline', label: 'History', route: 'historical' },
    { id: 14, icon: 'barbell-outline', label: 'FitCalc', route: 'fitcalc' },
    { id: 15, icon: 'nutrition-outline', label: 'MacroMaster', route: 'macromaster' },
    { id: 16, icon: 'book-outline', label: 'Directory', route: 'directory' },
    { id: 17, icon: 'body-outline', label: 'Radiology Dir', route: 'radiology-directory' },
    { id: 18, icon: 'school-outline', label: 'Learning', route: 'learning' },
    { id: 19, icon: 'settings-outline', label: 'Settings', route: 'settings' },
  ];

  const handleActionPress = (label: string, route: string) => {
    console.log('Action pressed:', label);
    
    // Navigate to the Vitals screen if the route matches
    if (route === '/(tabs)/vitals') {
      router.push(route);
    } else {
      Alert.alert('Coming Soon', `${label} feature will be available soon!`);
    }
  };

  const handleProfilePress = () => {
    Alert.alert('Profile', 'Profile feature coming soon!');
    // Later: router.push('/(tabs)/profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.appName}>HealthPath</Text>
          <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profileInitial}>
                {(user?.displayName?.[0] || 'U').toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Greeting Section */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>
            {greeting}, {user?.displayName || 'User'}
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

        {/* Action Buttons Grid - 4x5 Layout (19 items) */}
        <View style={styles.actionsContainer}>
          {actionButtons.map((button) => (
            <TouchableOpacity
              key={button.id}
              style={styles.actionButton}
              onPress={() => handleActionPress(button.label, button.route)}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Add padding to prevent bottom nav overlap
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
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

  // Stats Container - 1x4 Layout
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

  // Action Grid - 4 columns layout
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    width: (width - 32 - 36) / 4, // (screen width - horizontal padding - gaps) / 4 columns
    aspectRatio: 0.9, // Slightly taller than square for better text fit
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
