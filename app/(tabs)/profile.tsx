// app/(tabs)/profile.tsx

/**
 * Profile Screen - User Profile Management & Account Deletion
 * 
 * ✅ PHASE 1 P0: Enhanced error handling and deletion flow
 * Fixed Edge Cases: 1.1, 3.1, 3.4, 4.1, 4.2, 10.4, 11.1, 11.2
 * 
 * Critical Fixes:
 * - Emergency logout for orphaned auth states
 * - Re-authentication flow for stale sessions
 * - Duplicate deletion prevention
 * - Auth deletion reordered to LAST step
 */

import { Ionicons } from '@expo/vector-icons';
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
import EditProfileModal from '../../components/profile/EditProfileModal';
import DeleteAccountModal from '../../components/profile/DeleteAccountModal';
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
import auth from '@react-native-firebase/auth';

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
  // ✅ ENHANCED: Use new auth context features
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

  // Deletion progress state
  const [deletionInProgress, setDeletionInProgress] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState<DeletionProgress>({
    step: 0,
    totalSteps: 4,
    currentTask: '',
  });

  // ✅ NEW: Re-authentication state (Edge Case 3.1, 11.1, 11.2)
  const [reauthModalVisible, setReauthModalVisible] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthenticating, setReauthenticating] = useState(false);

  // ✅ NEW: Profile load error state (Edge Case 1.1, 10.4)
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

  /**
   * ✅ PHASE 1 P0: Enhanced profile loading with orphaned auth detection
   * Edge Case 1.1, 10.4: Emergency logout if profile fails to load
   */
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
            // Still no profile after creation - this is orphaned auth
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
      
      // ✅ FIX 1.1, 10.4: Set error state instead of just alert
      setProfileLoadError(true);
      
      // Check if this is a permission/not-found error (orphaned auth)
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
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive medication reminders.',
            [{ text: 'OK' }]
          );
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

        Alert.alert(
          'Success',
          'Medication reminders have been enabled! You will receive notifications at your medication times.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Disable Notifications',
          'This will cancel all medication reminders. Are you sure?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setNotificationsEnabled(true);
              },
            },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                await cancelAllMedicationReminders();
                setNotificationsEnabled(false);

                await profileService.updateProfile(user.uid, {
                  profile: {
                    notificationsEnabled: false,
                  },
                });

                await checkNotificationStatus();

                Alert.alert('Success', 'All medication reminders have been cancelled.');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
      setNotificationsEnabled(!value);
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      Alert.alert(
        'Test Notification Sent',
        'You should receive a test notification in 2 seconds!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleViewScheduledNotifications = async () => {
    try {
      const notifications = await getAllScheduledNotifications();

      if (notifications.length === 0) {
        Alert.alert(
          'No Scheduled Notifications',
          "You don't have any scheduled medication reminders."
        );
        return;
      }

      const notificationList = notifications
        .map((n, index) => {
          const data = n.content.data as any;
          const trigger = n.trigger as any;
          return `${index + 1}. ${data?.medicationName || 'Medication'}\n   Time: ${
            trigger?.hour || 'N/A'
          }:00`;
        })
        .join('\n\n');

      Alert.alert(
        `Scheduled Notifications (${notifications.length})`,
        notificationList,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error viewing notifications:', error);
      Alert.alert('Error', 'Failed to load scheduled notifications');
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

      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logOut();
            router.replace('/(auth)/login');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  /**
   * ✅ NEW: Emergency logout handler for orphaned auth
   * Edge Case 1.1, 10.4: Force logout when profile cannot be loaded
   */
  const handleEmergencyLogout = async () => {
    Alert.alert(
      'Logout Required',
      'Your profile data could not be loaded. This may be due to account issues. Please logout and try logging in again.',
      [
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await forceLogout();
              router.replace('/(auth)/welcome');
            } catch (error) {
              console.error('Emergency logout error:', error);
              // Even if logout fails, navigate away
              router.replace('/(auth)/welcome');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  /**
   * Open delete account modal
   */
  const handleDeleteAccount = () => {
    // ✅ FIX 7.1: Check network connectivity
    if (!isOnline) {
      Alert.alert(
        'No Internet Connection',
        'Account deletion requires an active internet connection. Please check your network and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    // ✅ FIX 3.1: Check if session is stale
    if (isSessionStale) {
      Alert.alert(
        'Re-authentication Required',
        'For security, you need to re-enter your password before deleting your account.',
        [
          {
            text: 'Re-authenticate',
            onPress: () => setReauthModalVisible(true),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    setDeleteModalVisible(true);
  };

  /**
   * ✅ NEW: Handle re-authentication
   * Edge Case 3.1, 11.1, 11.2: Re-authenticate before deletion
   */
  const handleReauthenticate = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'Email not found. Please logout and login again.');
      return;
    }

    if (!reauthPassword.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setReauthenticating(true);

    try {
      const credential = auth.EmailAuthProvider.credential(
        user.email,
        reauthPassword
      );

      await user.reauthenticateWithCredential(credential);
      
      console.log('✅ Re-authentication successful');
      
      // Revalidate session
      await revalidateSession();
      
      // Clear password and close modal
      setReauthPassword('');
      setReauthModalVisible(false);
      
      // Show success and proceed to deletion
      Alert.alert(
        'Authentication Successful',
        'You can now proceed with account deletion.',
        [
          {
            text: 'Delete Account',
            style: 'destructive',
            onPress: () => setDeleteModalVisible(true),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Re-authentication failed:', error);
      
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Incorrect password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert(
          'Too Many Attempts',
          'Too many failed attempts. Please try again later.'
        );
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert('Error', 'Network error. Please check your connection.');
      } else {
        Alert.alert('Error', `Re-authentication failed: ${error.message}`);
      }
    } finally {
      setReauthenticating(false);
    }
  };

  /**
   * ✅ PHASE 1 P0: Enhanced account deletion with all critical fixes
   * 
   * CRITICAL FIXES APPLIED:
   * - Edge Case 3.4, 4.1: Auth deletion is LAST step (not first)
   * - Edge Case 4.2: Prevents duplicate deletion requests
   * - Edge Case 3.1: Re-authentication check before deletion
   * - Edge Case 11.1, 11.2: Handles recent login requirement
   * - Better error handling and recovery
   */
  const handleConfirmDelete = async () => {
    if (!user?.uid) return;

    // ✅ FIX 4.2: Prevent duplicate deletion requests
    if (deletionInProgress) {
      console.warn('⚠️ Deletion already in progress');
      return;
    }

    try {
      console.log('🗑️ Starting account deletion process...');

      const currentUser = auth().currentUser;

      if (!currentUser) {
        throw new Error('No user is currently signed in.');
      }

      // ✅ Show progress modal
      setDeletionInProgress(true);
      setDeleteModalVisible(false); // Close confirmation modal

      // ============================================
      // STEP 1: Cancel all notifications
      // ============================================
      setDeletionProgress({
        step: 1,
        totalSteps: 4,
        currentTask: 'Cancelling notifications',
        details: 'Removing medication reminders...',
      });

      console.log('🗑️ Step 1: Cancelling notifications...');
      try {
        await cancelAllMedicationReminders();
        console.log('✅ Notifications cancelled');
      } catch (error) {
        console.warn('⚠️ Notification cleanup failed, continuing...', error);
      }

      // Small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // ============================================
      // STEP 2: Delete all files from Storage
      // ============================================
      setDeletionProgress({
        step: 2,
        totalSteps: 4,
        currentTask: 'Deleting files',
        details: 'Removing photos and documents...',
      });

      console.log('🗑️ Step 2: Deleting all files from Storage...');
      try {
        await storageService.deleteAllUserFiles(user.uid, (progress) => {
          setDeletionProgress({
            step: 2,
            totalSteps: 4,
            currentTask: 'Deleting files',
            details: `Removing ${progress.currentPath}... (${progress.deletedCount}/${progress.totalCount})`,
          });
        });
        console.log('✅ All files deleted from Storage');
      } catch (error) {
        console.warn('⚠️ Storage cleanup failed, continuing...', error);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      // ============================================
      // STEP 3: Delete user data from Firestore
      // ============================================
      setDeletionProgress({
        step: 3,
        totalSteps: 4,
        currentTask: 'Deleting profile data',
        details: 'Removing health records and settings...',
      });

      console.log('🗑️ Step 3: Deleting all data from Firestore...');
      await profileService.deleteUserProfile(user.uid);
      console.log('✅ All data deleted from Firestore');

      await new Promise((resolve) => setTimeout(resolve, 500));

      // ============================================
      // ✅ FIX 3.4, 4.1: STEP 4 - Delete Firebase Auth account (LAST)
      // Auth is deleted LAST to maintain authentication throughout cleanup
      // This ensures Firestore security rules don't block deletion
      // ============================================
      setDeletionProgress({
        step: 4,
        totalSteps: 4,
        currentTask: 'Removing account',
        details: 'Finalizing account deletion...',
      });

      console.log('🗑️ Step 4 (FINAL): Deleting Firebase Auth account...');
      await currentUser.delete();
      console.log('✅ Firebase Auth account deleted');

      // ✅ Success - hide progress and show success message
      setDeletionInProgress(false);

      setTimeout(() => {
        Alert.alert(
          'Account Deleted',
          "Your account has been permanently deleted. We're sorry to see you go!",
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/welcome'),
            },
          ],
          { cancelable: false }
        );
      }, 300);
    } catch (error: any) {
      console.error('❌ Delete account error:', error);
      
      // ✅ FIX 4.2: Reset deletion lock
      setDeletionInProgress(false);

      // ✅ FIX 3.1, 11.1, 11.2: Enhanced error handling with re-auth prompt
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Re-authentication Required',
          'For security reasons, please re-enter your password to complete account deletion.',
          [
            {
              text: 'Re-authenticate',
              onPress: () => setReauthModalVisible(true),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert(
          'Network Error',
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert(
          'Too Many Attempts',
          'Please wait a few minutes before trying again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          `Failed to delete account: ${
            error.message || 'Unknown error'
          }. Please try again or contact support.`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    await loadProfile();
  };

  /**
   * ✅ NEW: Loading with orphaned auth detection
   * Edge Case 1.1, 10.4: Show emergency logout if profile load failed
   */
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
          
          {/* ✅ NEW: Show orphaned auth warning if detected */}
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

  /**
   * ✅ NEW: Profile load error screen with emergency logout
   * Edge Case 1.1, 10.4: Recovery UI for orphaned auth
   */
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
          
          <TouchableOpacity 
            style={styles.errorButtonPrimary} 
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.errorButtonTextPrimary}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.errorButtonSecondary} 
            onPress={handleEmergencyLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.errorButtonTextSecondary}>Logout & Start Fresh</Text>
          </TouchableOpacity>

          <Text style={styles.errorHint}>
            If this problem persists, contact support
          </Text>
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

            {/* ✅ NEW: Session status indicator */}
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
            <InfoCard
              icon="calendar-outline"
              label="Date of Birth"
              value={
                profile?.profile?.dob
                  ? profileService.formatDate(profile.profile.dob)
                  : 'Not set'
              }
            />
            <InfoCard
              icon="transgender-outline"
              label="Gender"
              value={getProfileValue('gender')}
            />
            <InfoCard
              icon="body-outline"
              label="Height"
              value={
                profile?.profile?.height ? `${profile.profile.height} cm` : 'Not set'
              }
            />
            <InfoCard
              icon="scale-outline"
              label="Weight"
              value={
                profile?.profile?.weight ? `${profile.profile.weight} kg` : 'Not set'
              }
            />
          </View>

          {/* Medical Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Information</Text>

            <InfoCard
              icon="water-outline"
              label="Blood Group"
              value={getProfileValue('bloodGroup')}
            />
            <InfoCard
              icon="medical-outline"
              label="Allergies"
              value={getProfileValue('allergies', 'None')}
            />
            <InfoCard
              icon="fitness-outline"
              label="Medical Conditions"
              value={getProfileValue('conditions', 'None')}
            />
            <InfoCard
              icon="medkit-outline"
              label="Current Medications"
              value={getProfileValue('medications', 'None')}
            />
          </View>

          {/* Lifestyle & Habits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lifestyle & Habits</Text>

            <InfoCard
              icon="restaurant-outline"
              label="Diet Type"
              value={getProfileValue('dietType')}
            />
            <InfoCard
              icon="bed-outline"
              label="Sleep Duration"
              value={getProfileValue('sleepDuration')}
            />
            <InfoCard
              icon="barbell-outline"
              label="Physical Activity"
              value={getProfileValue('physicalActivity')}
            />
          </View>

          {/* Period Tracking Section - Only show if gender is Female */}
          {profile?.profile?.gender === 'Female' && (
            <>
              <View style={styles.section}>
                <View style={styles.periodTrackingHeader}>
                  <Ionicons name="water" size={22} color={Colors.light.primary} />
                  <Text style={styles.sectionTitle}>Period Tracking</Text>
                </View>

                <InfoCard
                  icon="calendar-outline"
                  label="Last Period Start"
                  value={
                    profile?.profile?.periodStartDate
                      ? profileService.formatDate(profile.profile.periodStartDate)
                      : 'Not tracked'
                  }
                />
                <InfoCard
                  icon="calendar-outline"
                  label="Last Period End"
                  value={
                    profile?.profile?.periodEndDate
                      ? profileService.formatDate(profile.profile.periodEndDate)
                      : 'Not tracked'
                  }
                />
                <InfoCard
                  icon="time-outline"
                  label="Average Cycle Length"
                  value={
                    profile?.profile?.averageCycleLength
                      ? `${profile.profile.averageCycleLength} days`
                      : 'Not set'
                  }
                />
                <InfoCard
                  icon="pulse-outline"
                  label="Flow Intensity"
                  value={getProfileValue('flowIntensity', 'Not tracked')}
                />
              </View>

              {/* Period Predictions Section */}
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
                        <Text style={styles.highlightCardValue}>
                          Day {periodCycle.cycleDay} of {periodCycle.cycleLength}
                        </Text>
                        <Text style={styles.highlightCardSubtext}>
                          {periodCycle.currentPhase} Phase
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.highlightCard}>
                    <View style={styles.highlightCardHeader}>
                      <Ionicons name="calendar" size={24} color="#FF6B9D" />
                      <View style={styles.highlightCardContent}>
                        <Text style={styles.highlightCardTitle}>Next Period</Text>
                        <Text style={styles.highlightCardValue}>
                          {periodCycle.nextPeriodStart
                            ? profileService.formatDate(periodCycle.nextPeriodStart)
                            : 'Not available'}
                        </Text>
                        <Text style={styles.highlightCardSubtext}>
                          {periodCycle.daysUntilNextPeriod !== undefined &&
                          periodCycle.daysUntilNextPeriod >= 0
                            ? `In ${periodCycle.daysUntilNextPeriod} days`
                            : 'Date may have passed'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <InfoCard
                    icon="heart-outline"
                    label="Ovulation Date"
                    value={
                      periodCycle.ovulationDate
                        ? profileService.formatDate(periodCycle.ovulationDate)
                        : 'Not available'
                    }
                  />

                  <InfoCard
                    icon="flower-outline"
                    label="Fertile Window"
                    value={
                      periodCycle.fertileWindowStart && periodCycle.fertileWindowEnd
                        ? `${new Date(
                            periodCycle.fertileWindowStart
                          ).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })} - ${new Date(
                            periodCycle.fertileWindowEnd
                          ).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}`
                        : 'Not available'
                    }
                  />

                  {periodCycle.notes && (
                    <View style={styles.periodNotesCard}>
                      <Ionicons name="information-circle" size={20} color="#FF9500" />
                      <Text style={styles.periodNotesText}>{periodCycle.notes}</Text>
                    </View>
                  )}
                </View>
              )}

              {periodCycle && !periodCycle.hasSufficientData && (
                <View style={styles.section}>
                  <View style={styles.periodPredictionsHeader}>
                    <Ionicons name="analytics" size={22} color="#FF6B9D" />
                    <Text style={styles.sectionTitle}>Period Predictions</Text>
                  </View>

                  <View style={styles.periodNotesCard}>
                    <Ionicons name="information-circle" size={20} color="#FF9500" />
                    <Text style={styles.periodNotesText}>
                      {periodCycle.notes || 'Add your period data to see predictions'}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          {/* App Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Settings</Text>

            <View style={styles.notificationCard}>
              <View style={styles.notificationLeft}>
                <Ionicons
                  name={notificationsEnabled ? 'notifications' : 'notifications-off'}
                  size={24}
                  color={
                    notificationsEnabled
                      ? Colors.light.primary
                      : Colors.light.textSecondary
                  }
                />
                <View style={styles.notificationTextContainer}>
                  <Text style={styles.notificationLabel}>Medication Reminders</Text>
                  <Text style={styles.notificationSubtext}>
                    {notificationsEnabled
                      ? `${scheduledCount} reminders scheduled`
                      : 'Enable to receive reminders'}
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: '#E5E5EA', true: Colors.light.primary + '50' }}
                thumbColor={notificationsEnabled ? Colors.light.primary : '#F4F3F4'}
                ios_backgroundColor="#E5E5EA"
              />
            </View>

            {notificationsEnabled && (
              <>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={handleViewScheduledNotifications}
                >
                  <View style={styles.actionLeft}>
                    <Ionicons
                      name="list-outline"
                      size={20}
                      color={Colors.light.primary}
                    />
                    <Text style={styles.actionLabel}>View Scheduled Reminders</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.light.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={handleTestNotification}
                >
                  <View style={styles.actionLeft}>
                    <Ionicons
                      name="flask-outline"
                      size={20}
                      color={Colors.light.primary}
                    />
                    <Text style={styles.actionLabel}>Send Test Notification</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.light.textSecondary}
                  />
                </TouchableOpacity>
              </>
            )}

            {!hasPermission && (
              <View style={styles.warningCard}>
                <Ionicons name="warning-outline" size={20} color="#FF9500" />
                <Text style={styles.warningText}>
                  Notification permissions not granted. Enable in device settings to
                  receive reminders.
                </Text>
              </View>
            )}
          </View>

          {/* Delete Account Button */}
          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
            disabled={deletionInProgress}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Member since{' '}
              {profile?.createdAt
                ? profileService.formatDate(profile.createdAt)
                : 'Unknown'}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />

      {/* Delete Account Confirmation Modal */}
      <DeleteAccountModal
        visible={deleteModalVisible}
        userName={fullName}
        userEmail={profile?.email || 'your account'}
        onClose={() => setDeleteModalVisible(false)}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* ✅ NEW: Re-authentication Modal */}
      <Modal
        visible={reauthModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.reauthOverlay}>
          <View style={styles.reauthModal}>
            <View style={styles.reauthHeader}>
              <Ionicons name="shield-checkmark" size={32} color={Colors.light.primary} />
              <Text style={styles.reauthTitle}>Re-authentication Required</Text>
              <Text style={styles.reauthSubtitle}>
                For security, please confirm your password
              </Text>
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
                autoCapitalize="none"
                autoCorrect={false}
                editable={!reauthenticating}
              />

              <View style={styles.reauthButtons}>
                <TouchableOpacity
                  style={[styles.reauthButton, styles.reauthButtonCancel]}
                  onPress={() => {
                    setReauthModalVisible(false);
                    setReauthPassword('');
                  }}
                  disabled={reauthenticating}
                >
                  <Text style={styles.reauthButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reauthButton, styles.reauthButtonConfirm]}
                  onPress={handleReauthenticate}
                  disabled={reauthenticating || !reauthPassword.trim()}
                >
                  {reauthenticating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.reauthButtonTextConfirm}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deletion Progress Modal */}
      <Modal
        visible={deletionInProgress}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
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
                <Text style={styles.progressStepText}>
                  Step {deletionProgress.step} of {deletionProgress.totalSteps}
                </Text>
                <Text style={styles.progressTaskText}>
                  {deletionProgress.currentTask}
                </Text>
                {deletionProgress.details && (
                  <Text style={styles.progressDetailsText}>
                    {deletionProgress.details}
                  </Text>
                )}
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${
                        (deletionProgress.step / deletionProgress.totalSteps) * 100
                      }%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.progressWarning}>
                ⚠️ Do not close the app or navigate away
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const InfoCard = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
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
  // ✅ NEW: Orphaned auth warning styles
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
  // ✅ NEW: Error container styles
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
  // ✅ NEW: Session warning badge
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
