// components/wellness/WellnessHeader.tsx
// Universal header for ALL wellness modules
// Last Updated: December 13, 2025 - Removed sidebar, added delete button

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

type Props = {
  title: string;
  subtitle?: string;
  
  // LEFT SIDE - Back Button
  showBackButton?: boolean;
  onBackPress?: () => void;
  
  // RIGHT SIDE - Action Buttons
  onAddPress?: () => void;        // Shows + icon (for child profiles)
  onDeletePress?: () => void;     // Shows 🗑️ icon (for deleting module)
  showDelete?: boolean;           // Explicitly show delete button
  deleteColor?: string;           // Custom color for delete icon
};

export default function WellnessHeader({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  onAddPress,
  onDeletePress,
  showDelete = false,
  deleteColor = Colors.light.error || '#FF3B30',
}: Props) {
  return (
    <View style={styles.header}>
      {/* LEFT: Back Button */}
      {showBackButton && onBackPress ? (
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBackPress}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backButton} />
      )}

      {/* CENTER: Title & Subtitle */}
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        )}
      </View>

      {/* RIGHT: Action Buttons (Add and/or Delete) */}
      <View style={styles.rightActionsContainer}>
        {/* Add Button (for child-care multi-profile) */}
        {onAddPress && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onAddPress}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={28} color={Colors.light.primary} />
          </TouchableOpacity>
        )}

        {/* Delete Button (for all modules) */}
        {(showDelete || onDeletePress) && onDeletePress && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onDeletePress}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={24} color={deleteColor} />
          </TouchableOpacity>
        )}

        {/* Empty space if no actions (maintain layout balance) */}
        {!onAddPress && !onDeletePress && !showDelete && (
          <View style={styles.actionButton} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 40,
  },
  actionButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
