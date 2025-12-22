// components/ShareCards/ShareCardFooter.tsx
/**
 * ShareCardFooter Component
 * Reusable footer with Google Play badge and download CTA
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

// ============================================================================
// TYPES
// ============================================================================

interface ShareCardFooterProps {
  motivationalText?: string;
  backgroundColor?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ShareCardFooter({
  motivationalText,
  backgroundColor = Colors.light.primary,
}: ShareCardFooterProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Motivational Message */}
      {motivationalText && (
        <View style={styles.messageContainer}>
          <Ionicons name="sparkles" size={14} color="#FFFFFF" />
          <Text style={styles.motivationalText}>{motivationalText}</Text>
        </View>
      )}

      {/* Google Play Badge */}
      <View style={styles.downloadContainer}>
        <Text style={styles.downloadText}>Download PI HEALTH and start your wellness journey</Text>
        <View style={styles.badgeContainer}>
          <Ionicons name="logo-google-playstore" size={16} color="#FFFFFF" />
          <Text style={styles.badgeText}>Available on Google Play</Text>
        </View>
      </View>

      {/* Bottom Icons */}
      <View style={styles.iconRow}>
        <Ionicons name="heart-outline" size={12} color="rgba(255,255,255,0.6)" />
        <Ionicons name="fitness-outline" size={12} color="rgba(255,255,255,0.6)" />
        <Ionicons name="water-outline" size={12} color="rgba(255,255,255,0.6)" />
        <Ionicons name="nutrition-outline" size={12} color="rgba(255,255,255,0.6)" />
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  motivationalText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  downloadContainer: {
    alignItems: 'center',
    gap: 6,
  },
  downloadText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  iconRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
});
