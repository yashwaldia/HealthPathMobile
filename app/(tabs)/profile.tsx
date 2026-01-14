// app/(tabs)/profile.tsx

/**
 * Profile Screen - User Profile Management & Account Deletion
 * * ✅ PHASE 1 P0: Enhanced error handling and deletion flow
 * Fixed Edge Cases: 1.1, 3.1, 3.4, 4.1, 4.2, 10.4, 11.1, 11.2
 * * Critical Fixes:
 * - Emergency logout for orphaned auth states
 * - Re-authentication flow for stale sessions
 * - Duplicate deletion prevention
 * - Auth deletion reordered to LAST step
 * - ✅ ADDED: Pre-deletion Auth Check (Prevents Orphans)
 * - ✅ ADDED: Custom UI Components (Toast & Dialog)
 */

import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ✅ Components
import EditProfileModal from '../../components/profile/EditProfileModal';
import DeleteAccountModal from '../../components/profile/DeleteAccountModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog'; // ✅ ADDED
import CustomToast from '../../components/ui/CustomToast';       // ✅ ADDED

import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { logOut } from '../../services/authService';
import {
  cancelAllMedicationReminders,
  checkNotificationPermissions,
  getAllScheduledNotifications,
  requestNotificationPermissions,
  scheduleAllMedicationReminders,
  sendTestNotification,
} from '../../services/notificationService';
import { profileService } from '../../services/profileService';
import { storageService } from '../../services/storageService';
import { PeriodCycleResult, UserProfile } from '../../types/profile';

/**
 * Deletion progress state interface
 */
interface DeletionProgress {
  step: number;
  totalSteps: number;
  currentTask: string;
  details?: string;
}

export default function ProfileScreen() {
  const { 
    user, 
    hasOrphanedAuth, 
    forceLogout, 
    isSessionStale,
    isOnline,
    revalidateSession 
  } = useAuth();
  
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [periodCycle, setPeriodCycle] = useState<PeriodCycleResult | null>(null);

  // ✅ UI State for Custom Components
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState({ message: '', type: 'info' as 'success' | 'error' | 'info' | 'warning' });
  
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  // Initialized with async function to prevent TS errors
  const [confirmDialogConfig, setConfirmDialogConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'warning' as 'danger' | 'warning' | 'info',
    onConfirm: async () => {}, 
    onCancel: () => setConfirmDialogVisible(false),
  });

  // Helper to show toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToastConfig({ message, type });
    setToastVisible(true);
  };

  // Deletion progress state
  const [deletionInProgress, setDeletionInProgress] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState<DeletionProgress>({
    step: 0,
    totalSteps: 4,
    currentTask: '',
  });

  const [reauthModalVisible, setReauthModalVisible] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthenticating, setReauthenticating] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (user) {
      loadProfile();
      checkNotificationStatus();
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, fadeAnim, slideAnim]);

  const loadProfile = async () => {
    if (!user?.uid) return;

    setLoading(true);
    setProfileLoadError(false);
    
    try {
      const userProfile = await profileService.getProfile(user.uid);

      // ✅ FIX 1.1: Detect orphaned auth (auth exists but no profile)
      if (!userProfile) {
        console.warn('⚠️ Profile not found - attempting to create...');
        
        try {
          await profileService.createProfile(user.uid, {
            email: user.email || '',
            displayName: user.displayName || 'User',
            photoURL: user.photoURL || null,
          });

          const newProfile = await profileService.getProfile(user.uid);
          
          if (!newProfile) {
            console.error('🚨 Failed to create profile - orphaned auth detected');
            setProfileLoadError(true);
            setLoading(false);
            return;
          }
          
          setProfile(newProfile);

          if (newProfile?.profile?.gender === 'Female') {
            const cycle = profileService.calculatePeriodCycle(newProfile.profile);
            setPeriodCycle(cycle);
          }
        } catch (createError) {
          console.error('❌ Profile creation failed:', createError);
          setProfileLoadError(true);
          setLoading(false);
          return;
        }
      } else {
        setProfile(userProfile);
        setNotificationsEnabled(userProfile?.profile?.notificationsEnabled ?? true);

        if (userProfile?.profile?.gender === 'Female') {
          const cycle = profileService.calculatePeriodCycle(userProfile.profile);
          setPeriodCycle(cycle);
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading profile:', error);
      setProfileLoadError(true);
      
      if (error?.code === 'permission-denied' || error?.code === 'not-found') {
        console.error('🚨 Profile access denied - likely orphaned auth');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationStatus = async () => {
    try {
      const permission = await checkNotificationPermissions();
      setHasPermission(permission);

      if (permission) {
        const notifications = await getAllScheduledNotifications();
        setScheduledCount(notifications.length);
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (!user?.uid) return;

    try {
      if (value) {
        const permission = await requestNotificationPermissions();

        if (!permission) {
          showToast('Enable notifications in settings to receive reminders', 'warning');
          setNotificationsEnabled(false);
          return;
        }

        await scheduleAllMedicationReminders(user.uid);
        setNotificationsEnabled(true);
        setHasPermission(true);

        await profileService.updateProfile(user.uid, {
          profile: {
            notificationsEnabled: true,
          },
        });

        await checkNotificationStatus();
        showToast('Medication reminders enabled', 'success');
      } else {
        setConfirmDialogConfig({
          title: 'Disable Notifications?',
          message: 'This will cancel all medication reminders. Are you sure?',
          confirmText: 'Disable',
          cancelText: 'Cancel',
          type: 'warning',
          onConfirm: async () => {
            setConfirmDialogVisible(false);
            await cancelAllMedicationReminders();
            setNotificationsEnabled(false);
            await profileService.updateProfile(user.uid, {
              profile: { notificationsEnabled: false },
            });
            await checkNotificationStatus();
            showToast('Reminders cancelled', 'success');
          },
          onCancel: () => {
            setConfirmDialogVisible(false);
            setNotificationsEnabled(true);
          }
        });
        setConfirmDialogVisible(true);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      showToast('Failed to update settings', 'error');
      setNotificationsEnabled(!value);
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      showToast('Test notification sent!', 'success');
    } catch (error) {
      console.error('Error sending test notification:', error);
      showToast('Failed to send notification', 'error');
    }
  };

  const handleViewScheduledNotifications = async () => {
    try {
      const notifications = await getAllScheduledNotifications();

      if (notifications.length === 0) {
        showToast('No scheduled notifications', 'info');
        return;
      }

      const notificationList = notifications
        .map((n, index) => {
          const data = n.content.data as any;
          const trigger = n.trigger as any;
          return `${index + 1}. ${data?.medicationName || 'Medication'} at ${
            trigger?.hour || 'N/A'
          }:00`;
        })
        .join('\n');

      Alert.alert(
        `Scheduled (${notifications.length})`,
        notificationList,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error viewing notifications:', error);
      showToast('Failed to load schedule', 'error');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    await checkNotificationStatus();
    setRefreshing(false);
  };

  const handleUploadPhoto = async () => {
    if (!user?.uid) return;

    setUploadingPhoto(true);
    try {
      const imageUri = await storageService.pickImage();
      if (!imageUri) {
        setUploadingPhoto(false);
        return;
      }

      const downloadURL = await storageService.uploadProfilePhoto(user.uid, imageUri);
      if (!downloadURL) {
        setUploadingPhoto(false);
        return;
      }

      await profileService.updateProfile(user.uid, {
        photoURL: downloadURL,
      });

      await loadProfile();
      showToast('Profile photo updated', 'success');
    } catch (error) {
      console.error('Error uploading photo:', error);
      showToast('Failed to upload photo', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = async () => {
    setConfirmDialogConfig({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await logOut();
          router.replace('/(auth)/login');
        } catch (error) {
          console.error('Logout error:', error);
          showToast('Failed to logout', 'error');
        }
      },
      onCancel: () => setConfirmDialogVisible(false)
    });
    setConfirmDialogVisible(true);
  };

  const handleEmergencyLogout = async () => {
    try {
      await forceLogout();
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('Emergency logout error:', error);
      router.replace('/(auth)/welcome');
    }
  };

  const handleDeleteAccount = () => {
    if (!isOnline) {
      showToast('No internet connection', 'error');
      return;
    }

    if (isSessionStale) {
      setConfirmDialogConfig({
        title: 'Re-authentication Required',
        message: 'For security, please re-authenticate before deleting your account.',
        confirmText: 'Re-authenticate',
        cancelText: 'Cancel',
        type: 'warning',
        onConfirm: async () => {
          setConfirmDialogVisible(false);
          setReauthModalVisible(true);
        },
        onCancel: () => setConfirmDialogVisible(false)
      });
      setConfirmDialogVisible(true);
      return;
    }

    setDeleteModalVisible(true);
  };

  const handleReauthenticate = async () => {
    if (!user?.email) {
      showToast('Email not found. Relogin required.', 'error');
      return;
    }

    if (!reauthPassword.trim()) {
      showToast('Enter password', 'warning');
      return;
    }

    setReauthenticating(true);

    try {
      const credential = auth.EmailAuthProvider.credential(
        user.email,
        reauthPassword
      );

      await user.reauthenticateWithCredential(credential);
      await revalidateSession();
      
      setReauthPassword('');
      setReauthModalVisible(false);
      
      setConfirmDialogConfig({
        title: 'Success',
        message: 'You can now proceed with account deletion.',
        confirmText: 'Delete Account',
        cancelText: 'Cancel',
        type: 'danger',
        onConfirm: async () => {
          setConfirmDialogVisible(false);
          setDeleteModalVisible(true);
        },
        onCancel: () => setConfirmDialogVisible(false)
      });
      setConfirmDialogVisible(true);
    } catch (error: any) {
      console.error('❌ Re-authentication failed:', error);
      showToast('Incorrect password', 'error');
    } finally {
      setReauthenticating(false);
    }
  };

  /**
   * ✅ PHASE 1 P0: Enhanced account deletion with all critical fixes
   * includes Pre-Check to prevent Orphans.
   */
  const handleConfirmDelete = async () => {
    if (!user?.uid) return;

    if (deletionInProgress) {
      showToast('Deletion already in progress', 'warning');
      return;
    }

    try {
      console.log('🗑️ Starting account deletion process...');

      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('No user is currently signed in.');

      // 🛑 CRITICAL FIX: Pre-validate Auth BEFORE deleting data
      try {
        await currentUser.reload();
      } catch (authError: any) {
        console.warn('⚠️ Pre-deletion auth check failed:', authError);
        
        if (authError.code === 'auth/requires-recent-login' || authError.code === 'auth/user-token-expired') {
          setDeletionInProgress(false);
          setConfirmDialogConfig({
            title: 'Security Check Required',
            message: 'Please re-authenticate before we delete your data.',
            confirmText: 'Re-authenticate',
            cancelText: 'Cancel',
            type: 'warning',
            onConfirm: async () => {
              setConfirmDialogVisible(false);
              setTimeout(() => setReauthModalVisible(true), 300);
            },
            onCancel: () => setConfirmDialogVisible(false),
          });
          setConfirmDialogVisible(true);
          return; // ⛔ STOP HERE
        }
        
        if (authError.code === 'auth/network-request-failed') {
          showToast('Network error. Check connection.', 'error');
          return; // ⛔ STOP HERE
        }
        throw authError; 
      }

      // ✅ Auth is valid. Show progress modal and proceed.
      setDeletionInProgress(true);
      setDeleteModalVisible(false);

      // STEP 1: Notifications
      setDeletionProgress({
        step: 1,
        totalSteps: 4,
        currentTask: 'Cancelling notifications',
        details: 'Removing medication reminders...',
      });
      await cancelAllMedicationReminders().catch(e => console.warn(e));
      await new Promise((resolve) => setTimeout(resolve, 500));

      // STEP 2: Storage
      setDeletionProgress({
        step: 2,
        totalSteps: 4,
        currentTask: 'Deleting files',
        details: 'Removing photos and documents...',
      });
      await storageService.deleteAllUserFiles(user.uid, (progress) => {
        setDeletionProgress(prev => ({
          ...prev,
          details: `Removing ${progress.currentPath}...`
        }));
      }).catch(e => console.warn(e));
      await new Promise((resolve) => setTimeout(resolve, 500));

      // STEP 3: Firestore
      setDeletionProgress({
        step: 3,
        totalSteps: 4,
        currentTask: 'Deleting profile data',
        details: 'Removing health records and settings...',
      });
      await profileService.deleteUserProfile(user.uid);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // STEP 4: Auth (LAST)
      setDeletionProgress({
        step: 4,
        totalSteps: 4,
        currentTask: 'Removing account',
        details: 'Finalizing account deletion...',
      });
      await currentUser.delete();

      setDeletionInProgress(false);

      // Success UI
      setConfirmDialogConfig({
        title: 'Account Deleted',
        message: "Your account has been permanently deleted. We're sorry to see you go!",
        confirmText: 'Goodbye',
        cancelText: '',
        type: 'info',
        onConfirm: async () => router.replace('/(auth)/welcome'),
        onCancel: () => router.replace('/(auth)/welcome'),
      });
      setConfirmDialogVisible(true);

    } catch (error: any) {
      console.error('❌ Delete account error:', error);
      setDeletionInProgress(false);

      if (error.code === 'auth/requires-recent-login') {
        setReauthModalVisible(true);
      } else {
        showToast(`Deletion failed: ${error.message || 'Unknown error'}`, 'error');
      }
    }
  };

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    await loadProfile();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
          {hasOrphanedAuth && (
            <View style={styles.orphanedAuthWarning}>
              <Ionicons name="warning" size={24} color="#FF9500" />
              <Text style={styles.orphanedAuthText}>
                Account data issue detected
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (profileLoadError || hasOrphanedAuth) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={80} color="#FF3B30" />
          <Text style={styles.errorTitle}>Profile Load Failed</Text>
          <Text style={styles.errorMessage}>
            {hasOrphanedAuth 
              ? 'Your account data could not be found. This may happen if your account was recently deleted or there was a synchronization issue.'
              : 'Unable to load your profile data. This could be due to network issues or account problems.'}
          </Text>
          <TouchableOpacity style={styles.errorButtonPrimary} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.errorButtonTextPrimary}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.errorButtonSecondary} onPress={handleEmergencyLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.errorButtonTextSecondary}>Logout & Start Fresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getProfileValue = (
    key: keyof UserProfile['profile'],
    defaultValue = 'Not set'
  ): string => {
    return profile?.profile?.[key]?.toString() || defaultValue;
  };

  const fullName =
    profile?.profile?.fullName?.toString().trim() ||
    profile?.displayName?.toString().trim() ||
    'User';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
          />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              {profile?.photoURL ? (
                <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color={Colors.light.primary} />
                </View>
              )}
              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={handleUploadPhoto}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.displayName}>{fullName}</Text>
            <Text style={styles.email}>{profile?.email || 'No email set'}</Text>
            {profile?.phoneNumber && (
              <Text style={styles.email}>{profile.phoneNumber}</Text>
            )}

            {isSessionStale && (
              <View style={styles.sessionWarningBadge}>
                <Ionicons name="time-outline" size={14} color="#FF9500" />
                <Text style={styles.sessionWarningText}>Session may need refresh</Text>
              </View>
            )}

            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Ionicons name="create-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <InfoCard icon="person-outline" label="Full Name" value={fullName} />
            <InfoCard icon="calendar-outline" label="Date of Birth" value={profile?.profile?.dob ? profileService.formatDate(profile.profile.dob) : 'Not set'} />
            <InfoCard icon="transgender-outline" label="Gender" value={getProfileValue('gender')} />
            <InfoCard icon="body-outline" label="Height" value={profile?.profile?.height ? `${profile.profile.height} cm` : 'Not set'} />
            <InfoCard icon="scale-outline" label="Weight" value={profile?.profile?.weight ? `${profile.profile.weight} kg` : 'Not set'} />
          </View>

          {/* Medical Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Information</Text>
            <InfoCard icon="water-outline" label="Blood Group" value={getProfileValue('bloodGroup')} />
            <InfoCard icon="medical-outline" label="Allergies" value={getProfileValue('allergies', 'None')} />
            <InfoCard icon="fitness-outline" label="Medical Conditions" value={getProfileValue('conditions', 'None')} />
            <InfoCard icon="medkit-outline" label="Current Medications" value={getProfileValue('medications', 'None')} />
          </View>

          {/* Lifestyle & Habits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lifestyle & Habits</Text>
            <InfoCard icon="restaurant-outline" label="Diet Type" value={getProfileValue('dietType')} />
            <InfoCard icon="bed-outline" label="Sleep Duration" value={getProfileValue('sleepDuration')} />
            <InfoCard icon="barbell-outline" label="Physical Activity" value={getProfileValue('physicalActivity')} />
          </View>

          {/* Period Tracking */}
          {profile?.profile?.gender === 'Female' && (
            <>
              <View style={styles.section}>
                <View style={styles.periodTrackingHeader}>
                  <Ionicons name="water" size={22} color={Colors.light.primary} />
                  <Text style={styles.sectionTitle}>Period Tracking</Text>
                </View>
                <InfoCard icon="calendar-outline" label="Last Period Start" value={profile?.profile?.periodStartDate ? profileService.formatDate(profile.profile.periodStartDate) : 'Not tracked'} />
                <InfoCard icon="calendar-outline" label="Last Period End" value={profile?.profile?.periodEndDate ? profileService.formatDate(profile.profile.periodEndDate) : 'Not tracked'} />
                <InfoCard icon="time-outline" label="Average Cycle Length" value={profile?.profile?.averageCycleLength ? `${profile.profile.averageCycleLength} days` : 'Not set'} />
                <InfoCard icon="pulse-outline" label="Flow Intensity" value={getProfileValue('flowIntensity', 'Not tracked')} />
              </View>

              {periodCycle?.hasSufficientData && (
                <View style={styles.section}>
                  <View style={styles.periodPredictionsHeader}>
                    <Ionicons name="analytics" size={22} color="#FF6B9D" />
                    <Text style={styles.sectionTitle}>Period Predictions</Text>
                  </View>
                  <View style={styles.highlightCard}>
                    <View style={styles.highlightCardHeader}>
                      <Ionicons name="today" size={24} color="#FF6B9D" />
                      <View style={styles.highlightCardContent}>
                        <Text style={styles.highlightCardTitle}>Current Status</Text>
                        <Text style={styles.highlightCardValue}>Day {periodCycle.cycleDay} of {periodCycle.cycleLength}</Text>
                        <Text style={styles.highlightCardSubtext}>{periodCycle.currentPhase} Phase</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.highlightCard}>
                    <View style={styles.highlightCardHeader}>
                      <Ionicons name="calendar" size={24} color="#FF6B9D" />
                      <View style={styles.highlightCardContent}>
                        <Text style={styles.highlightCardTitle}>Next Period</Text>
                        <Text style={styles.highlightCardValue}>{periodCycle.nextPeriodStart ? profileService.formatDate(periodCycle.nextPeriodStart) : 'Not available'}</Text>
                        <Text style={styles.highlightCardSubtext}>{periodCycle.daysUntilNextPeriod !== undefined && periodCycle.daysUntilNextPeriod >= 0 ? `In ${periodCycle.daysUntilNextPeriod} days` : 'Date may have passed'}</Text>
                      </View>
                    </View>
                  </View>
                  <InfoCard icon="heart-outline" label="Ovulation Date" value={periodCycle.ovulationDate ? profileService.formatDate(periodCycle.ovulationDate) : 'Not available'} />
                  {periodCycle.notes && (
                    <View style={styles.periodNotesCard}>
                      <Ionicons name="information-circle" size={20} color="#FF9500" />
                      <Text style={styles.periodNotesText}>{periodCycle.notes}</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}

          {/* App Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Settings</Text>
            <View style={styles.notificationCard}>
              <View style={styles.notificationLeft}>
                <Ionicons name={notificationsEnabled ? 'notifications' : 'notifications-off'} size={24} color={notificationsEnabled ? Colors.light.primary : Colors.light.textSecondary} />
                <View style={styles.notificationTextContainer}>
                  <Text style={styles.notificationLabel}>Medication Reminders</Text>
                  <Text style={styles.notificationSubtext}>{notificationsEnabled ? `${scheduledCount} reminders scheduled` : 'Enable to receive reminders'}</Text>
                </View>
              </View>
              <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} trackColor={{ false: '#E5E5EA', true: Colors.light.primary + '50' }} thumbColor={notificationsEnabled ? Colors.light.primary : '#F4F3F4'} ios_backgroundColor="#E5E5EA" />
            </View>
            {notificationsEnabled && (
              <>
                <TouchableOpacity style={styles.actionCard} onPress={handleViewScheduledNotifications}>
                  <View style={styles.actionLeft}>
                    <Ionicons name="list-outline" size={20} color={Colors.light.primary} />
                    <Text style={styles.actionLabel}>View Scheduled Reminders</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={handleTestNotification}>
                  <View style={styles.actionLeft}>
                    <Ionicons name="flask-outline" size={20} color={Colors.light.primary} />
                    <Text style={styles.actionLabel}>Send Test Notification</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </TouchableOpacity>
              </>
            )}
            {!hasPermission && (
              <View style={styles.warningCard}>
                <Ionicons name="warning-outline" size={20} color="#FF9500" />
                <Text style={styles.warningText}>Notification permissions not granted. Enable in device settings.</Text>
              </View>
            )}
          </View>

          {/* Delete & Logout */}
          <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount} disabled={deletionInProgress}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Member since {profile?.createdAt ? profileService.formatDate(profile.createdAt) : 'Unknown'}</Text>
          </View>
        </Animated.View>
      </ScrollView>

      <EditProfileModal visible={editModalVisible} onClose={() => setEditModalVisible(false)} profile={profile} onSave={handleSaveProfile} />
      
      <DeleteAccountModal 
        visible={deleteModalVisible} 
        userName={fullName} 
        userEmail={profile?.email || 'your account'} 
        onClose={() => setDeleteModalVisible(false)} 
        onConfirmDelete={handleConfirmDelete} 
      />

      <Modal visible={reauthModalVisible} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.reauthOverlay}>
          <View style={styles.reauthModal}>
            <View style={styles.reauthHeader}>
              <Ionicons name="shield-checkmark" size={32} color={Colors.light.primary} />
              <Text style={styles.reauthTitle}>Re-authentication Required</Text>
              <Text style={styles.reauthSubtitle}>For security, please confirm your password</Text>
            </View>
            <View style={styles.reauthContent}>
              <Text style={styles.reauthLabel}>Password</Text>
              <TextInput 
                style={styles.reauthInput} 
                value={reauthPassword} 
                onChangeText={setReauthPassword} 
                placeholder="Enter your password" 
                placeholderTextColor={Colors.light.textSecondary}
                secureTextEntry 
              />
              <View style={styles.reauthButtons}>
                <TouchableOpacity style={[styles.reauthButton, styles.reauthButtonCancel]} onPress={() => setReauthModalVisible(false)}>
                  <Text style={styles.reauthButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.reauthButton, styles.reauthButtonConfirm]} onPress={handleReauthenticate}>
                  {reauthenticating ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.reauthButtonTextConfirm}>Confirm</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={deletionInProgress} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.progressOverlay}>
          <View style={styles.progressModal}>
            <View style={styles.progressHeader}>
              <Ionicons name="trash" size={32} color="#FF3B30" />
              <Text style={styles.progressTitle}>Deleting Account</Text>
              <Text style={styles.progressSubtitle}>Please wait...</Text>
            </View>
            <View style={styles.progressContent}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <View style={styles.progressSteps}>
                <Text style={styles.progressStepText}>Step {deletionProgress.step} of {deletionProgress.totalSteps}</Text>
                <Text style={styles.progressTaskText}>{deletionProgress.currentTask}</Text>
                {deletionProgress.details && <Text style={styles.progressDetailsText}>{deletionProgress.details}</Text>}
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${(deletionProgress.step / deletionProgress.totalSteps) * 100}%` }]} />
              </View>
              <Text style={styles.progressWarning}>⚠️ Do not close the app or navigate away</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ ADDED: Global UI Components */}
      <ConfirmDialog
        visible={confirmDialogVisible}
        title={confirmDialogConfig.title}
        message={confirmDialogConfig.message}
        confirmText={confirmDialogConfig.confirmText}
        cancelText={confirmDialogConfig.cancelText}
        type={confirmDialogConfig.type}
        onConfirm={confirmDialogConfig.onConfirm}
        onCancel={confirmDialogConfig.onCancel}
      />

      <CustomToast
        visible={toastVisible}
        message={toastConfig.message}
        type={toastConfig.type}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

const InfoCard = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={styles.infoCard}>
    <View style={styles.infoLeft}>
      <Ionicons name={icon as any} size={20} color={Colors.light.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  orphanedAuthWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FF950020',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF950050',
  },
  orphanedAuthText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  errorButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
    width: '100%',
  },
  errorButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B3015',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FF3B3030',
  },
  errorButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  errorHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.light.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.light.primary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  sessionWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF950020',
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  sessionWarningText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.light.primary + '15',
    borderRadius: 20,
    gap: 6,
    marginTop: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  periodTrackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  periodPredictionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  highlightCard: {
    backgroundColor: '#FF6B9D15',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FF6B9D40',
  },
  highlightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  highlightCardContent: {
    flex: 1,
  },
  highlightCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  highlightCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B9D',
    marginBottom: 2,
  },
  highlightCardSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  periodNotesCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FF950015',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FF950050',
  },
  periodNotesText: {
    flex: 1,
    fontSize: 13,
    color: '#FF9500',
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textAlign: 'right',
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  notificationSubtext: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  actionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FF950015',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FF950050',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#FF9500',
    lineHeight: 16,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B3010',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FF3B3030',
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B3020',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 100,
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  // ✅ NEW: Re-authentication modal styles
  reauthOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  reauthModal: {
    backgroundColor: Colors.light.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  reauthHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.primary + '10',
  },
  reauthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 12,
  },
  reauthSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  reauthContent: {
    padding: 24,
  },
  reauthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  reauthInput: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 20,
  },
  reauthButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  reauthButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reauthButtonCancel: {
    backgroundColor: Colors.light.border,
  },
  reauthButtonConfirm: {
    backgroundColor: Colors.light.primary,
  },
  reauthButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  reauthButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Deletion Progress Modal Styles
  progressOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  progressModal: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  progressHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FF3B3010',
  },
  progressTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 12,
  },
  progressSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  progressContent: {
    padding: 24,
    alignItems: 'center',
  },
  progressSteps: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  progressStepText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  progressTaskText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 6,
  },
  progressDetailsText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  progressWarning: {
    fontSize: 12,
    color: '#FF9500',
    textAlign: 'center',
    fontWeight: '500',
  },
});