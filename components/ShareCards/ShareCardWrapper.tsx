// components/ShareCards/ShareCardWrapper.tsx
/**
 * ShareCardWrapper Component
 * Base wrapper for all share card types with gradient background
 */

import React, { forwardRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CARD_DIMENSIONS } from '@/constants/shareCardConfig';
import { Colors } from '@/constants/colors';

// ============================================================================
// TYPES
// ============================================================================

interface ShareCardWrapperProps {
  children: React.ReactNode;
  backgroundColor?: string;
  gradientColors?: string[];
  testID?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Base wrapper component for share cards
 * Provides consistent sizing, gradient background, and styling
 */
const ShareCardWrapper = forwardRef<View, ShareCardWrapperProps>(
  ({ children, backgroundColor, gradientColors, testID }, ref) => {
    const defaultGradient = [
      Colors.light.primary,
      Colors.light.upload.categories.vitals,
    ];

    const useGradient = gradientColors || defaultGradient;

    return (
      <View ref={ref} style={styles.container} testID={testID}>
        {/* Gradient Background */}
        <LinearGradient
          colors={useGradient}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Content Container */}
        <View style={[styles.content, backgroundColor && { backgroundColor }]}>
          {children}
        </View>
      </View>
    );
  }
);

ShareCardWrapper.displayName = 'ShareCardWrapper';

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: CARD_DIMENSIONS.previewWidth,
    height: CARD_DIMENSIONS.previewHeight,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default ShareCardWrapper;
