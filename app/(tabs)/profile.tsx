// app/(tabs)/profile.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Animated,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { profileService } from '../../services/profileService';
import { logOut } from '../../services/authService';
import { storageService } from '../../services/storageService';
import { UserProfile } from '../../types/profile';
import EditProfileModal from '../../components/profile/EditProfileModal';

// ✅ NEW: Import notification services
import {
  checkNotificationPermissions,
  requestNotificationPermissions,
  scheduleAllMedicationReminders,
  cancelAllMedicationReminders,
  sendTestNotification,
  getAllScheduledNotifications,
} from '../../services/notificationService';
import { getActiveMedications } from '../../services/medicationService'; // at the top, if not already present

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ✅ NEW: Notification states
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (user) {
      loadProfile();
      checkNotificationStatus(); // ✅ NEW
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      // Start animations after data loads
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
  }, [loading]);

  const loadProfile = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const userProfile = await profileService.getProfile(user.uid);
      
      if (!userProfile) {
        // Create profile if it doesn't exist
        await profileService.createProfile(user.uid, {
          email: user.email || '',
          displayName: user.displayName || 'User',
          photoURL: user.photoURL || null,
        });
        
        const newProfile = await profileService.getProfile(user.uid);
        setProfile(newProfile);
      } else {
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Check notification status
  const checkNotificationStatus = async () => {
    try {
      const permission = await checkNotificationPermissions();
      setHasPermission(permission);
      
      if (permission) {
        const notifications = await getAllScheduledNotifications();
        setScheduledCount(notifications.length);
        setNotificationsEnabled(notifications.length > 0);
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  // ✅ NEW: Toggle notifications
  const handleToggleNotifications = async (value: boolean) => {
    if (!user?.uid) return;

    try {
      if (value) {
        // Enable notifications
        const permission = await requestNotificationPermissions();
        
        if (!permission) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive medication reminders.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Schedule all medication reminders
        Alert.alert(
          'Enabling Notifications',
          'Scheduling medication reminders...',
          [{ text: 'OK' }]
        );
        
        await scheduleAllMedicationReminders(user.uid);
        setNotificationsEnabled(true);
        setHasPermission(true);
        
        // Update profile
        await profileService.updateProfile(user.uid, {
          profile: {
            notificationsEnabled: true,
          },
        });

        
        // Reload to get count
        await checkNotificationStatus();
        
        Alert.alert(
          'Success',
          'Medication reminders have been scheduled! You will receive notifications at your medication times.',
          [{ text: 'OK' }]
        );
      } else {
        // Disable notifications
        Alert.alert(
          'Disable Notifications',
          'This will cancel all medication reminders. Are you sure?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                await cancelAllMedicationReminders();
                setNotificationsEnabled(false);
                
                // Update profile
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
    }
  };

  // ✅ NEW: Test notification
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

  // ✅ NEW: View scheduled notifications
  const handleViewScheduledNotifications = async () => {
    try {
      const notifications = await getAllScheduledNotifications();
      
      if (notifications.length === 0) {
        Alert.alert('No Scheduled Notifications', 'You don\'t have any scheduled medication reminders.');
        return;
      }

      const notificationList = notifications.map((n, index) => {
        const data = n.content.data as any;
        const trigger = n.trigger as any;
        return `${index + 1}. ${data?.medicationName || 'Medication'}\n   Time: ${trigger?.hour || 'N/A'}:00`;
      }).join('\n\n');

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
    await checkNotificationStatus(); // ✅ NEW
    setRefreshing(false);
  };

  const handleUploadPhoto = async () => {
    if (!user?.uid) return;

    setUploadingPhoto(true);
    try {
      // Pick image
      const imageUri = await storageService.pickImage();
      if (!imageUri) {
        setUploadingPhoto(false);
        return;
      }

      // Upload to Firebase Storage
      const downloadURL = await storageService.uploadProfilePhoto(user.uid, imageUri);
      if (!downloadURL) {
        setUploadingPhoto(false);
        return;
      }

      // Update profile with new photo URL
      await profileService.updateProfile(user.uid, {
        photoURL: downloadURL,
      });

      // Reload profile
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
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logOut();
              // Navigate to login screen
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    // Reload profile after save
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

  // Safe getters with default values
  const getProfileValue = (key: keyof UserProfile['profile'], defaultValue = 'Not set'): string => {
    return profile?.profile?.[key]?.toString() || defaultValue;
  };

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
          {/* Header with Avatar */}
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
            
            <Text style={styles.displayName}>
              {profile?.displayName || 'User'}
            </Text>
            <Text style={styles.email}>{profile?.email}</Text>

            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Ionicons name="create-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <InfoCard
              icon="person-outline"
              label="Full Name"
              value={getProfileValue('fullName')}
            />
            <InfoCard
              icon="calendar-outline"
              label="Date of Birth"
              value={profile?.profile?.dob ? profileService.formatDate(profile.profile.dob) : 'Not set'}
            />
            <InfoCard
              icon="transgender-outline"
              label="Gender"
              value={getProfileValue('gender')}
            />
            <InfoCard
              icon="body-outline"
              label="Height"
              value={profile?.profile?.height ? `${profile.profile.height} cm` : 'Not set'}
            />
            <InfoCard
              icon="scale-outline"
              label="Weight"
              value={profile?.profile?.weight ? `${profile.profile.weight} kg` : 'Not set'}
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

          {/* Lifestyle */}
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

          {/* ✅ ENHANCED: App Settings with Notification Controls */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Settings</Text>
            
            {/* Notification Toggle */}
            <View style={styles.notificationCard}>
              <View style={styles.notificationLeft}>
                <Ionicons 
                  name={notificationsEnabled ? "notifications" : "notifications-off"} 
                  size={24} 
                  color={notificationsEnabled ? Colors.light.primary : Colors.light.textSecondary} 
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

            {/* Notification Actions */}
            {notificationsEnabled && (
              <>
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={handleViewScheduledNotifications}
                >
                  <View style={styles.actionLeft}>
                    <Ionicons name="list-outline" size={20} color={Colors.light.primary} />
                    <Text style={styles.actionLabel}>View Scheduled Reminders</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={handleTestNotification}
                >
                  <View style={styles.actionLeft}>
                    <Ionicons name="flask-outline" size={20} color={Colors.light.primary} />
                    <Text style={styles.actionLabel}>Send Test Notification</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </TouchableOpacity>
              </>
            )}

            {/* Permission Warning */}
            {!hasPermission && (
              <View style={styles.warningCard}>
                <Ionicons name="warning-outline" size={20} color="#FF9500" />
                <Text style={styles.warningText}>
                  Notification permissions not granted. Enable in device settings to receive reminders.
                </Text>
              </View>
            )}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Member since {profile?.createdAt ? profileService.formatDate(profile.createdAt) : 'Unknown'}
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
    </SafeAreaView>
  );
}

// Info Card Component
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
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.light.primary + '15',
    borderRadius: 20,
    gap: 6,
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
  // ✅ NEW: Notification card styles
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
