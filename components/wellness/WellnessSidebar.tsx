// components/wellness/WellnessSidebar.tsx
// Side navigation drawer for wellness modules
// Last Updated: December 10, 2025

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { WellnessModuleType } from '../../types/wellness';
import { WELLNESS_MODULES } from '../../constants/wellnessData';

type Props = {
  visible: boolean;
  currentModule: WellnessModuleType | null;
  onClose: () => void;
};

export default function WellnessSidebar({ visible, currentModule, onClose }: Props) {
  const router = useRouter();

  const handleModulePress = (moduleType: WellnessModuleType) => {
    onClose();
    // Navigate to module screen (you can customize routes as needed)
    if (moduleType === 'mother-care') {
      router.push('/wellness/mother-care');
    }
    // Add other module routes as you build them
  };

  const handleHomePress = () => {
    onClose();
    router.push('/wellness');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Side panel */}
        <View style={styles.panel}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Wellness Modules</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            {/* Home button */}
            <TouchableOpacity
              style={[styles.item, currentModule === null && styles.itemActive]}
              onPress={handleHomePress}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: Colors.light.primary + '15' },
                ]}
              >
                <Ionicons
                  name="home-outline"
                  size={20}
                  color={Colors.light.primary}
                />
              </View>
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.itemText,
                    currentModule === null && styles.itemTextActive,
                  ]}
                >
                  Wellness Hub
                </Text>
                <Text style={styles.itemDescription}>View all modules</Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Module list */}
            {WELLNESS_MODULES.map((module) => {
              const isActive = module.moduleType === currentModule;
              return (
                <TouchableOpacity
                  key={module.moduleType}
                  style={[styles.item, isActive && styles.itemActive]}
                  onPress={() => handleModulePress(module.moduleType)}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: module.color + '40' },
                    ]}
                  >
                    <Ionicons
                      name={module.icon as any}
                      size={20}
                      color={module.color}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text
                      style={[
                        styles.itemText,
                        isActive && styles.itemTextActive,
                      ]}
                    >
                      {module.title}
                    </Text>
                    <Text style={styles.itemDescription}>
                      {module.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  panel: {
    width: '72%',
    backgroundColor: Colors.light.cardBackground,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  itemActive: {
    backgroundColor: Colors.light.primary + '15',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  itemTextActive: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  itemDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});
