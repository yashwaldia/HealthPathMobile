// components/nutrition/NutritionSidebar.tsx

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
import { Colors } from '../../constants/colors';

export type NutritionMode = 'dashboard' | 'image-compare';

type MenuItem = {
  id: NutritionMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description?: string;
};

const NUTRITION_TABS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Nutrition Dashboard',
    icon: 'grid-outline',
    description: 'Overview, logs, and predictors',
  },
  {
    id: 'image-compare',
    label: 'Image Comparator',
    icon: 'images-outline',
    description: 'Compare two meal photos with AI',
  },
];

type Props = {
  visible: boolean;
  activeId: NutritionMode;
  onSelect: (id: NutritionMode) => void;
  onClose: () => void;
};

export function NutritionSidebar({ visible, activeId, onSelect, onClose }: Props) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Side panel */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Nutrition Tools</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {NUTRITION_TABS.map((tab) => {
              const isActive = tab.id === activeId;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.item,
                    isActive && styles.itemActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelect(tab.id);
                    onClose();
                  }}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name={tab.icon}
                      size={20}
                      color={isActive ? Colors.light.primary : Colors.light.text}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text
                      style={[
                        styles.itemText,
                        isActive && styles.itemTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                    {tab.description && (
                      <Text style={styles.itemDescription} numberOfLines={2}>
                        {tab.description}
                      </Text>
                    )}
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
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  itemActive: {
    backgroundColor: Colors.light.primary + '15',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#EDF2F7',
  },
  textContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 15,
    color: Colors.light.text,
  },
  itemTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 2,
  },
});
