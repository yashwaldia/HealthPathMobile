import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { PathologyTest } from '../../types/learning';

interface TestDetailModalProps {
  visible: boolean;
  test: PathologyTest;
  onClose: () => void;
}

export default function TestDetailModal({
  visible,
  test,
  onClose,
}: TestDetailModalProps) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 500,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.modalContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Test Name & Category */}
            <View style={styles.titleContainer}>
              <Text style={styles.testName}>{test.name}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{test.category}</Text>
              </View>
            </View>

            {/* Purpose */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Purpose</Text>
              </View>
              <Text style={styles.sectionContent}>{test.purpose}</Text>
            </View>

            {/* What it Detects */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="search" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>What it Detects</Text>
              </View>
              <Text style={styles.sectionContent}>{test.detects}</Text>
            </View>

            {/* Normal Range */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="stats-chart" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Normal Range</Text>
              </View>
              <Text style={styles.sectionContent}>{test.normalRange}</Text>
            </View>

            {/* Sample Type */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="water" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Sample Type</Text>
              </View>
              <Text style={styles.sectionContent}>{test.sampleType}</Text>
            </View>

            {/* Interpretation Tips */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Interpretation Tips</Text>
              </View>
              <Text style={styles.sectionContent}>{test.interpretationTips}</Text>
            </View>

            {/* System (if available) */}
            {test.system && (
              <View style={styles.infoCard}>
                <Ionicons name="pulse" size={24} color={Colors.light.primary} />
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoLabel}>Related System</Text>
                  <Text style={styles.infoValue}>{test.system}</Text>
                </View>
              </View>
            )}

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Ionicons name="alert-circle" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.disclaimerText}>
                This information is for educational purposes only. Always consult with
                a healthcare professional for medical advice.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    position: 'relative',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    marginBottom: 12,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  titleContainer: {
    marginBottom: 20,
  },
  testName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.primary + '15',
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.textSecondary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  infoCardContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.primary + '10',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
});
