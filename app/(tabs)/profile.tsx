// app/(tabs)/profile.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EditProfileModal from '../../components/profile/EditProfileModal';
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

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  
  // ✅ NEW: Period cycle predictions state
  const [periodCycle, setPeriodCycle] = useState<PeriodCycleResult | null>(null);

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
    try {
      const userProfile = await profileService.getProfile(user.uid);

      if (!userProfile) {
        await profileService.createProfile(user.uid, {
          email: user.email || '',
          displayName: user.displayName || 'User',
          photoURL: user.photoURL || null,
        });

        const newProfile = await profileService.getProfile(user.uid);
        setProfile(newProfile);
        
        // ✅ Calculate period cycle for new profile
        if (newProfile?.profile?.gender === 'Female') {
          const cycle = profileService.calculatePeriodCycle(newProfile.profile);
          setPeriodCycle(cycle);
        }
      } else {
        setProfile(userProfile);
        setNotificationsEnabled(userProfile?.profile?.notificationsEnabled ?? true);
        
        // ✅ Calculate period cycle if user is female
        if (userProfile?.profile?.gender === 'Female') {
          const cycle = profileService.calculatePeriodCycle(userProfile.profile);
          setPeriodCycle(cycle);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
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

  // ✅ Unified "full name" resolver used in both header and Basic Info
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

            {/* ✅ Header name uses unified fullName */}
            <Text style={styles.displayName}>
              {fullName}
            </Text>
            <Text style={styles.email}>{profile?.email || 'No email set'}</Text>
            {profile?.phoneNumber && (
              <Text style={styles.email}>{profile.phoneNumber}</Text>
            )}

            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Ionicons name="create-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            {/* ✅ Basic Info "Full Name" uses the same unified fullName */}
            <InfoCard
              icon="person-outline"
              label="Full Name"
              value={fullName}
            />
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

          {/* ✅ PERIOD TRACKING SECTION - Only show if gender is Female */}
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

              {/* ✅ NEW: PERIOD PREDICTIONS SECTION */}
              {periodCycle?.hasSufficientData && (
                <View style={styles.section}>
                  <View style={styles.periodPredictionsHeader}>
                    <Ionicons name="analytics" size={22} color="#FF6B9D" />
                    <Text style={styles.sectionTitle}>Period Predictions</Text>
                  </View>

                  {/* Current Status Card - Highlighted */}
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

                  {/* Next Period Card - Highlighted */}
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

                  {/* Additional Predictions */}
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
                        ? `${new Date(periodCycle.fertileWindowStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(periodCycle.fertileWindowEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : 'Not available'
                    }
                  />

                  {/* Warning/Notes if any */}
                  {periodCycle.notes && (
                    <View style={styles.periodNotesCard}>
                      <Ionicons name="information-circle" size={20} color="#FF9500" />
                      <Text style={styles.periodNotesText}>{periodCycle.notes}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Show message if insufficient data */}
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

      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
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
  // Period tracking header with icon
  periodTrackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  // ✅ NEW: Period predictions header
  periodPredictionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  // ✅ NEW: Highlighted card for important predictions
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
  // ✅ NEW: Period notes/warning card
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
});
