// components/ShareCards/ShareCardHeader.tsx
/**
 * ShareCardHeader Component
 * Reusable header for all share cards with logo and app name
 */

import { Colors } from '@/constants/colors';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

interface ShareCardHeaderProps {
  userName?: string;
  date?: string;
  backgroundColor?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ShareCardHeader({
  userName,
  date,
  backgroundColor = Colors.light.primary,
}: ShareCardHeaderProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Logo and App Name */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/android-icon-512.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.appInfo}>
          <Text style={styles.appName}>PI HEALTH</Text>
          <Text style={styles.tagline}>Track. Analyze. Thrive.</Text>
        </View>
      </View>

      {/* User Info (if provided) */}
      {userName && (
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userName}</Text>
          {date && <Text style={styles.date}>{date}</Text>}
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  appInfo: {
    justifyContent: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  date: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
});
