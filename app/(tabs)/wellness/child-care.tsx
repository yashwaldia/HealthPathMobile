// app/(tabs)/wellness/child-care.tsx
// Child Care Profile Selector - Multi-child support
// Last Updated: December 12, 2025 - Complete rewrite with multi-profile support

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import CustomToast from '../../../components/ui/CustomToast';
import ChildProfileCard from '../../../components/wellness/child-care/ChildProfileCard';
import ChildSetupModal from '../../../components/wellness/SetupModals/ChildSetupModal';
import WellnessHeader from '../../../components/wellness/WellnessHeader';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { wellnessService } from '../../../services/wellnessService';
import { ChildProfileSummary } from '../../../types/wellness';

export default function ChildCareScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [childProfiles, setChildProfiles] = useState<ChildProfileSummary[]>([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  useEffect(() => {
    if (user) {
      initializeModule();
    }
  }, [user]);

  const initializeModule = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setChildProfiles([]);
        return;
      }

      // Fetch all child profiles
      const profiles = await wellnessService.getAllChildProfiles(user.uid);
      setChildProfiles(profiles);
      
      console.log(`✅ Loaded ${profiles.length} child profile(s)`);
    } catch (error: any) {
      console.error('❌ Error initializing Child Care:', error);
      
      // Always clear profiles on error
      setChildProfiles([]);
      
      showToast('Failed to load child profiles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeModule();
    setRefreshing(false);
  };

  const handleAddChild = () => {
    setSetupModalVisible(true);
  };

  const handleSetupConfirm = async (data: {
    childName: string;
    birthDate?: string;
    ageInMonths?: number;
    gender?: 'male' | 'female';
  }) => {
    try {
      setSetupModalVisible(false);
      setLoading(true);

      if (!user) return;

      if (data.birthDate) {
        // Mode 1: Birth Date
        await wellnessService.createChildProfile(
          user.uid,
          data.childName,
          data.birthDate,
          data.gender
        );
      } else if (data.ageInMonths !== undefined) {
        // Mode 2: Manual Age
        await wellnessService.createChildProfileManual(
          user.uid,
          data.childName,
          data.ageInMonths,
          data.gender
        );
      } else {
        throw new Error('Invalid setup data');
      }

      // Reload profiles
      await initializeModule();
      
      showToast(`${data.childName}'s profile created successfully!`, 'success');
    } catch (error) {
      console.error('❌ Error creating child profile:', error);
      showToast('Failed to create child profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePress = (childId: string) => {
    // Navigate to individual child tracking screen
    router.push(`/wellness/child-care/${childId}` as any);
  };

  const handleProfileLongPress = (profile: ChildProfileSummary) => {
    Alert.alert(
      profile.childName,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Profile',
          style: 'destructive',
          onPress: () => confirmDeleteProfile(profile),
        },
      ]
    );
  };

  const confirmDeleteProfile = (profile: ChildProfileSummary) => {
    Alert.alert(
      'Delete Child Profile',
      `Are you sure you want to delete ${profile.childName}'s profile? This will permanently remove all tracking data, milestones, and progress.\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteProfile(profile.childId, profile.childName),
        },
      ]
    );
  };

  const deleteProfile = async (childId: string, childName: string) => {
    try {
      if (!user) return;

      setLoading(true);
      await wellnessService.deleteChildProfile(user.uid, childId);

      showToast(`${childName}'s profile deleted`, 'success');

      // Reload profiles
      await initializeModule();
    } catch (error) {
      console.error('❌ Error deleting child profile:', error);
      showToast('Failed to delete profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Loading State
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <WellnessHeader
          title="Child Care"
          showBackButton
          onBackPress={() => router.push('/(tabs)/wellness')}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Child Care...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty State - No Children
  if (childProfiles.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <WellnessHeader
          title="Child Care"
          showBackButton
          onBackPress={() => router.push('/(tabs)/wellness')}
        />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyContent}>
            <Ionicons name="people-outline" size={80} color={Colors.light.textSecondary} />
            <Text style={styles.emptyTitle}>No Children Added</Text>
            <Text style={styles.emptyText}>
              Track your child's growth, milestones, vaccinations, and daily care routine. Add your first child to get started.
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddChild}>
              <Ionicons name="person-add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add First Child</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ChildSetupModal
          visible={setupModalVisible}
          onConfirm={handleSetupConfirm}
          onCancel={() => setSetupModalVisible(false)}
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

  // Profile List - Has Children
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <WellnessHeader
        title="Child Care"
        showBackButton
        onBackPress={() => router.push('/(tabs)/wellness')}
        onAddPress={handleAddChild}
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
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.sectionTitle}>Select a child to track</Text>
          <Text style={styles.sectionSubtitle}>
            {childProfiles.length} {childProfiles.length === 1 ? 'child' : 'children'} added
          </Text>
        </View>

        <View style={styles.spacing} />

        {/* Child Profile Cards */}
        {childProfiles.map((profile) => (
          <ChildProfileCard
            key={profile.childId}
            profile={profile}
            onPress={() => handleProfilePress(profile.childId)}
            onLongPress={() => handleProfileLongPress(profile)}
          />
        ))}

        {/* Add Another Child Button */}
        <TouchableOpacity style={styles.addAnotherButton} onPress={handleAddChild}>
          <View style={styles.addAnotherContent}>
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={24} color={Colors.light.primary} />
            </View>
            <Text style={styles.addAnotherText}>Add Another Child</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.light.textSecondary} />
        </TouchableOpacity>

        <View style={styles.spacing} />

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
          <Text style={styles.infoText}>
            Tap and hold on a child's card to delete their profile.
          </Text>
        </View>

        <View style={styles.spacing} />
      </ScrollView>

      <ChildSetupModal
        visible={setupModalVisible}
        onConfirm={handleSetupConfirm}
        onCancel={() => setSetupModalVisible(false)}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  headerSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.primary + '40',
    borderStyle: 'dashed',
  },
  addAnotherContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.primary + '30',
  },
  addAnotherText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
});
