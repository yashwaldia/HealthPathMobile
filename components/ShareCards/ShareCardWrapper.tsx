// components/ShareCards/ShareCardWrapper.tsx

/**
 * ShareCardWrapper Component
 * Base wrapper for all share card types with gradient background
 */

import { Colors } from '@/constants/colors';
import { CARD_DIMENSIONS } from '@/constants/shareCardConfig';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

interface ShareCardWrapperProps {
  children: React.ReactNode;
  backgroundColor?: string;
  gradientColors?: readonly [string, string, ...string[]];
  testID?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Base wrapper component for share cards
 * Provides consistent sizing, gradient background, and styling
 */
const ShareCardWrapper: React.FC<ShareCardWrapperProps> = ({ 
  children, 
  backgroundColor, 
  gradientColors, 
  testID 
}) => {
  const defaultGradient = [
    Colors.light.primary,
    Colors.light.upload.categories.vitals,
  ] as const;

  const useGradient = gradientColors || defaultGradient;

  return (
    <View
      style={styles.container}
      testID={testID}
      collapsable={false}
    >
      {/* Gradient Background */}
      <LinearGradient
        colors={useGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Content Container */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

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
