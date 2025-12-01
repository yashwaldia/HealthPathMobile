// components/fitcalc/FitCalcSidebar.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FitCalcId } from '../../types/fitcalc';

const CALC_TABS: { id: FitCalcId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'bmi', label: 'BMI', icon: 'body-outline' },
  { id: 'bmr', label: 'BMR', icon: 'flame-outline' },
  { id: 'tdee', label: 'TDEE', icon: 'speedometer-outline' },
  { id: 'macros', label: 'Macros', icon: 'restaurant-outline' },
  { id: 'onerm', label: '1RM', icon: 'barbell-outline' },
  { id: 'bodyfat', label: 'Body Fat %', icon: 'scale-outline' },
  { id: 'hrzones', label: 'HR Zones', icon: 'pulse-outline' },
  { id: 'vo2max', label: 'VO₂max', icon: 'trail-sign-outline' },
  { id: 'activity', label: 'Activity Cals', icon: 'walk-outline' },
  { id: 'ratios', label: 'Ratios', icon: 'stats-chart-outline' },
  { id: 'idealweight', label: 'Ideal Weight', icon: 'accessibility-outline' },
  { id: 'water', label: 'Water', icon: 'water-outline' },
  { id: 'running', label: 'Running', icon: 'footsteps-outline' },
  { id: 'protein', label: 'Protein', icon: 'fitness-outline' },
];

type Props = {
  visible: boolean;
  activeId: FitCalcId;
  onSelect: (id: FitCalcId) => void;
  onClose: () => void;
};

export function FitCalcSidebar({ visible, activeId, onSelect, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Calculators</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {CALC_TABS.map((tab) => {
              const isActive = tab.id === activeId;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.item, isActive && styles.itemActive]}
                  onPress={() => {
                    onSelect(tab.id);
                    onClose();
                  }}
                >
                  <Ionicons
                    name={tab.icon}
                    size={20}
                    color={isActive ? Colors.light.primary : Colors.light.textSecondary}
                    style={{ marginRight: 12 }}
                  />
                  <Text style={[styles.itemText, isActive && styles.itemTextActive]}>
                    {tab.label}
                  </Text>
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
  },
  itemActive: {
    backgroundColor: Colors.light.primary + '15',
  },
  itemText: {
    fontSize: 15,
    color: Colors.light.text,
  },
  itemTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
