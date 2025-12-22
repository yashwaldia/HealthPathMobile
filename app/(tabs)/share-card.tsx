// app/(tabs)/share-card.tsx
/**
 * Share Card Screen
 * Main UI for selecting and sharing health cards
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useShareCard } from '@/hooks/useShareCard';
import { Colors } from '@/constants/colors';
import type { ShareCardType, ShareCardData } from '@/types/shareCard';
import { getEnabledCardTemplates } from '@/constants/shareCardConfig';
import shareCardService from '@/services/shareCardService';

// Import all card components
import BMIShareCard from '@/components/ShareCards/BMIShareCard';
import HeartRateShareCard from '@/components/ShareCards/HeartRateShareCard';
import BloodPressureShareCard from '@/components/ShareCards/BloodPressureShareCard';
import VitalsSummaryCard from '@/components/ShareCards/VitalsSummaryCard';
import WeeklyReportCard from '@/components/ShareCards/WeeklyReportCard';
import WellnessProgressCard from '@/components/ShareCards/WellnessProgressCard';
import MotherCareCard from '@/components/ShareCards/MotherCareCard';
import ChildGrowthCard from '@/components/ShareCards/ChildGrowthCard';
import FitnessCalculatorCard from '@/components/ShareCards/FitnessCalculatorCard';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ShareCardScreen() {
  const [selectedCardType, setSelectedCardType] = useState<ShareCardType | null>(null);
  const [cardData, setCardData] = useState<ShareCardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { viewRef, captureAndShare, isCapturing, isSharing } = useShareCard();

  // ============================================================================
  // FETCH CARD DATA
  // ============================================================================

  const generateCardData = async (type: ShareCardType) => {
    setIsLoading(true);
    setError(null);

    try {
      let data: ShareCardData | null = null;

      switch (type) {
        case 'bmi':
          data = await shareCardService.generateBMICardData();
          break;
        case 'heart-rate':
          data = await shareCardService.generateHeartRateCardData();
          break;
        case 'blood-pressure':
          data = await shareCardService.generateBloodPressureCardData();
          break;
        // Add other cases as needed
        default:
          throw new Error('Card type not yet implemented');
      }

      if (!data) {
        throw new Error('Failed to generate card data. Please check your health data.');
      }

      setCardData(data);
      setSelectedCardType(type);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate card';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // SHARE HANDLER
  // ============================================================================

  const handleShare = async () => {
    if (!cardData) {
      Alert.alert('Error', 'No card to share');
      return;
    }

    const result = await captureAndShare(selectedCardType || undefined);

    if (result.success && result.shared) {
      Alert.alert('Success', 'Card shared successfully!');
    }
  };

  // ============================================================================
  // RENDER CARD COMPONENT
  // ============================================================================

  const renderCard = () => {
    if (!cardData) return null;

    switch (cardData.cardType) {
      case 'bmi':
        return <BMIShareCard ref={viewRef} data={cardData} />;
      case 'heart-rate':
        return <HeartRateShareCard ref={viewRef} data={cardData} />;
      case 'blood-pressure':
        return <BloodPressureShareCard ref={viewRef} data={cardData} />;
      case 'vitals-summary':
        return <VitalsSummaryCard ref={viewRef} data={cardData} />;
      case 'weekly-report':
        return <WeeklyReportCard ref={viewRef} data={cardData} />;
      case 'wellness-progress':
        return <WellnessProgressCard ref={viewRef} data={cardData} />;
      case 'mother-care':
        return <MotherCareCard ref={viewRef} data={cardData} />;
      case 'child-growth':
        return <ChildGrowthCard ref={viewRef} data={cardData} />;
      case 'fitness-calculator':
        return <FitnessCalculatorCard ref={viewRef} data={cardData} />;
      default:
        return null;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const cardTemplates = getEnabledCardTemplates();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Share Health Card</Text>
        <Text style={styles.headerSubtitle}>Select a card type to share your health progress</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card Type Selector */}
        {!selectedCardType && (
          <View style={styles.cardGrid}>
            {cardTemplates.map((template) => (
              <TouchableOpacity
                key={template.type}
                style={styles.cardOption}
                onPress={() => generateCardData(template.type)}
                disabled={isLoading}
              >
                <View style={styles.cardOptionIcon}>
                  <Ionicons name={template.icon as any} size={32} color={Colors.light.primary} />
                </View>
                <Text style={styles.cardOptionName}>{template.name}</Text>
                <Text style={styles.cardOptionDescription}>{template.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Generating card...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={Colors.light.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setError(null)}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Card Preview */}
        {cardData && !isLoading && !error && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Preview</Text>
            <View style={styles.cardPreview}>{renderCard()}</View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setSelectedCardType(null);
                  setCardData(null);
                }}
              >
                <Ionicons name="arrow-back" size={20} color={Colors.light.primary} />
                <Text style={styles.secondaryButtonText}>Change Card</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleShare}
                disabled={isCapturing || isSharing}
              >
                {isCapturing || isSharing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="share-social" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Share Card</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  content: {
    flex: 1,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  cardOption: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardOptionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardOptionDescription: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.light.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewContainer: {
    padding: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  cardPreview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
