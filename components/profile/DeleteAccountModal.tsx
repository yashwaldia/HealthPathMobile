// components/profile/DeleteAccountModal.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';

interface DeleteAccountModalProps {
  visible: boolean;
  userName: string;
  userEmail: string;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
}

interface DeletionStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
}

export default function DeleteAccountModal({
  visible,
  userName,
  userEmail,
  onClose,
  onConfirmDelete,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionSteps, setDeletionSteps] = useState<DeletionStep[]>([
    { id: 'notifications', label: 'Cancelling notifications', status: 'pending' },
    { id: 'storage', label: 'Deleting files from storage', status: 'pending' },
    { id: 'database', label: 'Removing database records', status: 'pending' },
    { id: 'auth', label: 'Deleting authentication account', status: 'pending' },
  ]);

  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      // Reset state when modal opens
      setConfirmText('');
      setIsConfirmed(false);
      setIsDeleting(false);
      setDeletionSteps([
        { id: 'notifications', label: 'Cancelling notifications', status: 'pending' },
        { id: 'storage', label: 'Deleting files from storage', status: 'pending' },
        { id: 'database', label: 'Removing database records', status: 'pending' },
        { id: 'auth', label: 'Deleting authentication account', status: 'pending' },
      ]);

      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 600,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const updateStepStatus = (stepId: string, status: DeletionStep['status']) => {
    setDeletionSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      // Simulate step-by-step deletion with status updates
      // Step 1: Notifications
      updateStepStatus('notifications', 'processing');
      await new Promise((resolve) => setTimeout(resolve, 800));
      updateStepStatus('notifications', 'complete');

      // Step 2: Storage
      updateStepStatus('storage', 'processing');
      await new Promise((resolve) => setTimeout(resolve, 1200));
      updateStepStatus('storage', 'complete');

      // Step 3: Database
      updateStepStatus('database', 'processing');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateStepStatus('database', 'complete');

      // Step 4: Auth (actual deletion happens here)
      updateStepStatus('auth', 'processing');
      await onConfirmDelete(); // This calls the actual deletion function
      updateStepStatus('auth', 'complete');

      // Success - modal will close automatically in parent component
    } catch (error) {
      console.error('Delete error in modal:', error);
      // Mark current step as error
      const processingStep = deletionSteps.find((s) => s.status === 'processing');
      if (processingStep) {
        updateStepStatus(processingStep.id, 'error');
      }
      setIsDeleting(false);
    }
  };

  const canDelete = confirmText.toUpperCase() === 'DELETE' && isConfirmed;

  const dataToDelete = [
    { icon: 'person-outline', text: 'Your profile and health data' },
    { icon: 'pulse-outline', text: 'All vitals records' },
    { icon: 'medkit-outline', text: 'Medications & reminders' },
    { icon: 'document-text-outline', text: 'Lab reports and documents' },
    { icon: 'water-outline', text: 'Period tracking data (if applicable)' },
    { icon: 'heart-outline', text: 'Wellness module data' },
    { icon: 'images-outline', text: 'All photos and files' },
    { icon: 'settings-outline', text: 'All app preferences' },
  ];

  const getStepIcon = (status: DeletionStep['status']) => {
    switch (status) {
      case 'complete':
        return <Ionicons name="checkmark-circle" size={20} color="#10B981" />;
      case 'processing':
        return <ActivityIndicator size="small" color={Colors.light.primary} />;
      case 'error':
        return <Ionicons name="close-circle" size={20} color="#EF4444" />;
      default:
        return <View style={styles.stepIconPending} />;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={isDeleting ? undefined : onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={isDeleting ? undefined : onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          {/* ✅ REMOVED SafeAreaView - Modal doesn't need it */}
          <Animated.View
            style={[
              styles.modalContainer,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Deletion Progress Overlay */}
            {isDeleting && (
              <View style={styles.deletionOverlay}>
                <View style={styles.deletionCard}>
                  <View style={styles.deletionHeader}>
                    <View style={styles.deletionIconContainer}>
                      <Ionicons name="trash" size={32} color="#EF4444" />
                    </View>
                    <Text style={styles.deletionTitle}>Deleting Account</Text>
                    <Text style={styles.deletionSubtitle}>
                      Please wait while we delete your account
                    </Text>
                  </View>

                  <View style={styles.stepsContainer}>
                    {deletionSteps.map((step) => (
                      <View key={step.id} style={styles.stepRow}>
                        {getStepIcon(step.status)}
                        <Text
                          style={[
                            styles.stepText,
                            step.status === 'complete' && styles.stepTextComplete,
                            step.status === 'error' && styles.stepTextError,
                          ]}
                        >
                          {step.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Main Modal Content */}
            {!isDeleting && (
              <>
                {/* Header with gradient */}
                <View style={styles.header}>
                  <View style={styles.headerGradient}>
                    <Ionicons name="warning" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={styles.headerTitle}>Delete Account</Text>
                  <Text style={styles.headerSubtitle}>
                    This action cannot be undone
                  </Text>
                </View>

                <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Warning Message */}
                  <View style={styles.warningBox}>
                    <Ionicons name="alert-circle" size={24} color="#EF4444" />
                    <View style={styles.warningTextContainer}>
                      <Text style={styles.warningTitle}>Permanent Action</Text>
                      <Text style={styles.warningText}>
                        {userName}, your account and all associated data will be
                        permanently deleted. This cannot be recovered.
                      </Text>
                    </View>
                  </View>

                  {/* What will be deleted */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      The following will be permanently deleted:
                    </Text>

                    {dataToDelete.map((item, index) => (
                      <View key={index} style={styles.dataItem}>
                        <Ionicons
                          name={item.icon as any}
                          size={18}
                          color="#EF4444"
                        />
                        <Text style={styles.dataItemText}>{item.text}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Confirmation Input */}
                  <View style={styles.section}>
                    <Text style={styles.confirmLabel}>
                      Type <Text style={styles.confirmKeyword}>DELETE</Text> to
                      confirm:
                    </Text>
                    <TextInput
                      style={styles.confirmInput}
                      value={confirmText}
                      onChangeText={setConfirmText}
                      placeholder="Type DELETE here"
                      placeholderTextColor={Colors.light.textSecondary}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Checkbox Confirmation */}
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setIsConfirmed(!isConfirmed)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isConfirmed && styles.checkboxChecked,
                      ]}
                    >
                      {isConfirmed && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={styles.checkboxText}>
                      I understand this action is permanent and cannot be undone
                    </Text>
                  </TouchableOpacity>

                  {/* Account Info */}
                  <View style={styles.accountInfo}>
                    <Ionicons name="mail-outline" size={16} color={Colors.light.textSecondary} />
                    <Text style={styles.accountInfoText}>{userEmail}</Text>
                  </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      !canDelete && styles.deleteButtonDisabled,
                    ]}
                    onPress={handleDelete}
                    disabled={!canDelete}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash" size={20} color="#FFFFFF" />
                    <Text style={styles.deleteButtonText}>Delete Forever</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  scrollView: {
    maxHeight: 400,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  dataItemText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  confirmKeyword: {
    fontWeight: '700',
    color: '#EF4444',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  confirmInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 2,
    borderColor: Colors.light.border,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  accountInfoText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20, // ✅ FIXED: Minimal padding, no extra safe area
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: Colors.light.border,
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Deletion Progress Overlay
  deletionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  deletionCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    padding: 32,
    width: '85%',
    maxWidth: 400,
  },
  deletionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  deletionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deletionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  deletionSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIconPending: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  stepText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  stepTextComplete: {
    color: '#10B981',
    fontWeight: '600',
  },
  stepTextError: {
    color: '#EF4444',
    fontWeight: '600',
  },
});
