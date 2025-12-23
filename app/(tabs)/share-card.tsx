// app/(tabs)/share-card.tsx

/**
 * Share Card Screen - Motivational Cards
 * Using React Native Skia for reliable screenshots on RN 0.81
 * Auto-generates card on mount for instant experience
 */

import { Colors } from '@/constants/colors';
import motivationalCardService from '@/services/motivationalCardService';
import type { MotivationalCardData } from '@/types/motivationalCard';
import { Ionicons } from '@expo/vector-icons';
import { makeImageFromView } from '@shopify/react-native-skia';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Share from 'react-native-share';

// Import motivational card component
import MotivationalCard from '@/components/ShareCards/MotivationalCard';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ShareCardScreen() {
  const router = useRouter();
  const [cardData, setCardData] = useState<MotivationalCardData | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const cardViewRef = useRef<View>(null);

  // ============================================================================
  // GENERATE MOTIVATIONAL CARD
  // ============================================================================

  const generateMotivationalCard = async () => {
    setIsLoading(true);

    try {
      const result = await motivationalCardService.generateMotivationalCardData({
        theme: 'light',
        includeUserName: false,
        includeTimeGreeting: true,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate motivational card');
      }

      setCardData(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate card';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate card on mount
  useEffect(() => {
    generateMotivationalCard();
  }, []);

  // ============================================================================
  // SHARE HANDLER - Using React Native Skia
  // ============================================================================

  const handleShare = async () => {
    if (!cardData) {
      Alert.alert('Error', 'No card to share');
      return;
    }

    if (!cardViewRef.current) {
      Alert.alert('Error', 'Card view not ready');
      return;
    }

    setIsCapturing(true);
    setIsSharing(true);

    try {
      console.log('🎯 Starting capture process with Skia...');

      // Wait for layout to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture using Skia's makeImageFromView - WORKS WITH RN 0.81!
      const snapshot = await makeImageFromView(cardViewRef);

      if (!snapshot) {
        throw new Error('Failed to capture card');
      }

      console.log('✅ Skia snapshot created');

      // Encode to base64
      const base64 = snapshot.encodeToBase64();
      
      if (!base64) {
        throw new Error('Failed to encode image');
      }

      console.log('✅ Image encoded to base64');

      // Save to temp file using legacy FileSystem API
      const tempPath = `${FileSystem.cacheDirectory}motivational-card-${Date.now()}.png`;
      
      await FileSystem.writeAsStringAsync(tempPath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('✅ Image saved to:', tempPath);

      // Share the captured image
      const shareOptions = {
        title: 'PI HEALTH - Motivational Card',
        message: 'Track your health journey with PI HEALTH! 🏥✨',
        url: tempPath,
        type: 'image/png',
        subject: 'My Health Journey',
        failOnCancel: false,
      };

      const shareResult = await Share.open(shareOptions);

      console.log('✅ Share result:', shareResult);

      if (shareResult && shareResult.success !== false) {
        Alert.alert('Success', 'Motivational card shared successfully! 🎉');
      }

      // Clean up temp file
      try {
        await FileSystem.deleteAsync(tempPath, { idempotent: true });
      } catch (cleanupError) {
        console.log('⚠️ Failed to cleanup temp file:', cleanupError);
      }
    } catch (error: any) {
      if (error?.message === 'User did not share' || error?.message?.includes('cancel')) {
        console.log('ℹ️ User cancelled share');
      } else {
        console.error('❌ Error:', error);
        Alert.alert('Share Failed', error.message || 'Failed to share card');
      }
    } finally {
      setIsCapturing(false);
      setIsSharing(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - Consistent with other screens */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Card</Text>
        <View style={styles.placeholderButton} />
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Generating your motivational card...</Text>
        </View>
      ) : (
        /* Card Preview - Full Screen */
        <View style={styles.mainContainer}>
          {/* Beautiful Heading Section */}
          <View style={styles.headingSection}>
            <Text style={styles.headingSubtitle}>
              Share this motivational card with your friends and inspire their health journey ✨
            </Text>
          </View>

          {/* Card Display - Centered */}
          <View style={styles.cardContainer}>
            <View ref={cardViewRef} collapsable={false} style={styles.captureWrapper}>
              <MotivationalCard data={cardData!} />
            </View>
          </View>

          {/* Action Buttons - Fixed at bottom */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={generateMotivationalCard}
              disabled={isCapturing || isSharing}
            >
              <Ionicons name="refresh" size={20} color={Colors.light.primary} />
              <Text style={styles.regenerateButtonText}>New Quote</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
              disabled={isCapturing || isSharing}
            >
              {isCapturing || isSharing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="share-social" size={20} color="#FFFFFF" />
                  <Text style={styles.shareButtonText}>Share Card</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES - Optimized for full-screen card display
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  // Header - Consistent pattern
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholderButton: {
    width: 40, // Balance back button for centered title
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },

  // Main Container - Full screen layout
  mainContainer: {
    flex: 1,
    paddingVertical: 20,
  },

  // Beautiful Heading Section
  headingSection: {
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 15,
    marginBottom: 0,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.light.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  headingSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },

  // Card Container - Centered with flex
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captureWrapper: {
    backgroundColor: 'transparent',
  },

  // Action Buttons - Fixed at bottom
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  regenerateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  regenerateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
