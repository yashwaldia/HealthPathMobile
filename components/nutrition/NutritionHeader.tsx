// components/nutrition/NutritionHeader.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';

export default function NutritionHeader() {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {/* Left: back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="chevron-back"
          size={22}
          color={Colors.light.text}
        />
      </TouchableOpacity>

      {/* Center: title */}
      <View style={styles.center}>
        <Text style={styles.title}>Nutrition Dashboard</Text>
        {/* Optional subtitle if you want later */}
        {/* <Text style={styles.subtitle}>Track meals and nutrients</Text> */}
      </View>

      {/* Right: empty space for symmetry */}
      <View style={styles.right} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});
