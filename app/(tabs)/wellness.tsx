// app/(tabs)/wellness.tsx
// Wellness Hub - Main screen showing all wellness modules
// Last Updated: December 14, 2025 - Option A: Shows OVERALL PROGRAM PROGRESS

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WellnessHeader from '../../components/wellness/WellnessHeader';
import WellnessModuleCard from '../../components/wellness/WellnessModuleCard';
import WellnessSidebar from '../../components/wellness/WellnessSidebar';
import { Colors } from '../../constants/colors';
import { WELLNESS_MODULES } from '../../constants/wellnessData';
import { useAuth } from '../../context/AuthContext';
import { wellnessService } from '../../services/wellnessService';
import { ModuleCardData, WellnessModuleType } from '../../types/wellness';

export default function WellnessScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modules, setModules] = useState<ModuleCardData[]>(WELLNESS_MODULES);
  const [activeModules, setActiveModules] = useState<WellnessModuleType[]>([]);

  // ⭐ NEW: Reload modules when screen comes into focus (after returning from module)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadActiveModules();
      }
    }, [user])
  );

  const loadActiveModules = async () => {
    try {
      if (!user) return;

      const active = await wellnessService.getActiveModules(user.uid);
      setActiveModules(active);

      // ⭐ OPTION A: Show OVERALL PROGRAM PROGRESS (Day X of Y)
      const updatedModules = await Promise.all(
        WELLNESS_MODULES.map(async (module) => {
          if (active.includes(module.moduleType)) {
            // Sync progress to get correct percentage based on program days
            const syncedProgress = await wellnessService.syncCompletionPercentage(
              user.uid,
              module.moduleType
            );

            return {
              ...module,
              status: 'active' as const,
              progress: syncedProgress, // Overall program progress (e.g., Day 15/30 = 50%)
            };
          }
          return module;
        })
      );

      setModules(updatedModules);
    } catch (error) {
      console.error('❌ Error loading active modules:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActiveModules();
    setRefreshing(false);
  };

  const handleModulePress = (moduleType: WellnessModuleType) => {
    switch (moduleType) {
      case 'mother-care':
        router.push('/wellness/mother-care');
        break;
      case 'child-care':
        router.push('/wellness/child-care');
        break;
      case 'liver-kidney':
        router.push('/wellness/liver-kidney');
        break;
      case 'skin-hair':
        router.push('/wellness/skin-hair');
        break;
      case 'gut-health':
        router.push('/wellness/gut-health');
        break;
      case 'bone-joint':
        router.push('/wellness/bone-joint');
        break;
      case 'teeth-oral':
        router.push('/wellness/teeth-oral');
        break;
      case 'beauty-fitness':
        router.push('/wellness/beauty-fitness');
        break;
      default:
        console.log(`Navigate to ${moduleType} (coming soon)`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <WellnessHeader
        title="Wellness Hub"
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
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Your Wellness Modules</Text>
          <Text style={styles.headerDescription}>
            Select a module to start your personalized wellness journey
          </Text>
        </View>

        {activeModules.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart" size={20} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>Active Programs</Text>
            </View>
            {modules
              .filter((m) => activeModules.includes(m.moduleType))
              .map((module) => (
                <WellnessModuleCard
                  key={module.moduleType}
                  module={module}
                  onPress={() => handleModulePress(module.moduleType)}
                />
              ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={20} color={Colors.light.text} />
            <Text style={styles.sectionTitle}>
              {activeModules.length > 0 ? 'Other Modules' : 'All Modules'}
            </Text>
          </View>
          {modules
            .filter((m) => !activeModules.includes(m.moduleType))
            .map((module) => (
              <WellnessModuleCard
                key={module.moduleType}
                module={module}
                onPress={() => handleModulePress(module.moduleType)}
              />
            ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.light.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How It Works</Text>
            <Text style={styles.infoText}>
              Choose a module, complete daily tasks, and track your progress. Get
              AI-powered insights and weekly reports.
            </Text>
          </View>
        </View>
      </ScrollView>

      <WellnessSidebar
        visible={sidebarVisible}
        currentModule={null}
        onClose={() => setSidebarVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  headerSection: { marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: Colors.light.text, marginBottom: 8 },
  headerDescription: { fontSize: 14, lineHeight: 20, color: Colors.light.textSecondary },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  infoCard: {
    flexDirection: 'row', backgroundColor: Colors.light.primary + '10', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.light.primary + '30', gap: 12,
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 4 },
  infoText: { fontSize: 13, lineHeight: 18, color: Colors.light.textSecondary },
});
