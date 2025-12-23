// components/ShareCards/MotivationalCard.tsx

/**
 * Motivational Card Component - Handwritten Style with Custom Font
 * 
 * SETUP REQUIRED:
 * 1. Download handwritten font (e.g., Caveat from Google Fonts)
 * 2. Add .ttf files to:
 *    - src/assets/fonts/
 *    - android/app/src/main/assets/fonts/
 * 3. For iOS: Add fonts in Xcode Build Phases → Copy Bundle Resources
 * 4. Update Info.plist with UIAppFonts array
 */

import { Colors } from '@/constants/colors';
import type { MotivationalCardData } from '@/types/motivationalCard';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ShareCardFooter from './ShareCardFooter';
import ShareCardHeader from './ShareCardHeader';
import ShareCardWrapper from './ShareCardWrapper';

interface MotivationalCardProps {
  data: MotivationalCardData;
}

const MotivationalCard: React.FC<MotivationalCardProps> = ({ data }) => {
  return (
    <ShareCardWrapper>
      {/* Header */}
      <ShareCardHeader />

      {/* Content */}
      <View style={styles.content}>
        {/* Decorative background elements */}
        <View style={styles.decorativeBackground}>
          {/* Top left ornament */}
          <View style={[styles.ornament, styles.ornamentTopLeft]} />
          {/* Top right ornament */}
          <View style={[styles.ornament, styles.ornamentTopRight]} />
          {/* Bottom left ornament */}
          <View style={[styles.ornament, styles.ornamentBottomLeft]} />
          {/* Bottom right ornament */}
          <View style={[styles.ornament, styles.ornamentBottomRight]} />
          
          {/* Subtle gradient overlay circles */}
          <View style={styles.gradientCircle1} />
          <View style={styles.gradientCircle2} />
        </View>

        {/* Handwritten quote area */}
        <View style={styles.quoteArea}>
          {/* Decorative top flourish */}
          <View style={styles.flourishTop}>
            <View style={styles.flourishLine} />
            <Text style={styles.flourishDot}>✦</Text>
            <View style={styles.flourishLine} />
          </View>

          {/* Handwritten quote text */}
          <View style={styles.quoteTextArea}>
            <Text style={styles.handwrittenText}>
              {data.quote.text}
            </Text>
          </View>

          {/* Author - original style */}
          <Text style={styles.authorText}>PI HEALTH</Text>

          {/* Decorative bottom flourish */}
          <View style={styles.flourishBottom}>
            <View style={styles.flourishLine} />
            <Text style={styles.flourishDot}>✦</Text>
            <View style={styles.flourishLine} />
          </View>
        </View>
      </View>

      {/* Footer */}
      <ShareCardFooter />
    </ShareCardWrapper>
  );
};

MotivationalCard.displayName = 'MotivationalCard';

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  // Decorative background elements
  decorativeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  ornament: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.04,
  },

  ornamentTopLeft: {
    top: -30,
    left: -30,
    width: 100,
    height: 100,
    backgroundColor: Colors.light.primary,
  },

  ornamentTopRight: {
    top: -10,
    right: -40,
    width: 120,
    height: 120,
    backgroundColor: Colors.light.upload.categories.vitals,
  },

  ornamentBottomLeft: {
    bottom: -20,
    left: 20,
    width: 80,
    height: 80,
    backgroundColor: Colors.light.primary,
  },

  ornamentBottomRight: {
    bottom: -25,
    right: -25,
    width: 90,
    height: 90,
    backgroundColor: Colors.light.upload.categories.vitals,
  },

  gradientCircle1: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.primary,
    opacity: 0.02,
  },

  gradientCircle2: {
    position: 'absolute',
    bottom: '25%',
    right: '15%',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.light.upload.categories.vitals,
    opacity: 0.025,
  },

  // Quote area - handwritten style
  quoteArea: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 0,
    zIndex: 1,
  },

  // Decorative flourishes
  flourishTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    width: '60%',
  },

  flourishBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    width: '60%',
  },

  flourishLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.primary,
    opacity: 0.3,
  },

  flourishDot: {
    fontSize: 16,
    color: Colors.light.primary,
    marginHorizontal: 10,
    opacity: 0.5,
  },

  // Handwritten text area
  quoteTextArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 5,
    paddingVertical: 0,
  },

  handwrittenText: {
    fontFamily: 'Caveat-Regular',
    fontSize: 24,
    lineHeight: 36,
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: 0.3,
    width: '100%',
  },

  // Author text - original style (kept exactly as before)
  authorText: {
    marginTop: 0,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: Colors.light.primary,
    opacity: 0.9,
  },
});

export default MotivationalCard;
