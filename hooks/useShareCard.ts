// hooks/useShareCard.ts
/**
 * useShareCard Hook
 * Custom hook for capturing and sharing card components
 */

import { useState, useRef, useCallback } from 'react';
import { View, Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import * as FileSystem from 'expo-file-system';
import type { ShareResult, ShareCardType } from '@/types/shareCard';
import { validateCardData } from '@/utils/shareCardHelpers';

// ============================================================================
// HOOK STATE TYPES
// ============================================================================

interface UseShareCardState {
  isCapturing: boolean;
  isSharing: boolean;
  lastCapturedUri: string | null;
  error: string | null;
}

interface UseShareCardReturn extends UseShareCardState {
  viewRef: React.RefObject<View | null>; // ✅ FIXED: Allow null
  captureCard: (options?: CaptureOptions) => Promise<string | null>;
  shareCard: (cardType?: ShareCardType) => Promise<ShareResult>;
  captureAndShare: (cardType?: ShareCardType) => Promise<ShareResult>;
  clearError: () => void;
}

interface CaptureOptions {
  format?: 'png' | 'jpg' | 'jpeg'; // ✅ FIXED: Added 'jpeg'
  quality?: number; // 0-1 for jpg
  width?: number;
  height?: number;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for share card functionality
 * Handles view capture and native sharing
 */
export function useShareCard(): UseShareCardReturn {
  const viewRef = useRef<View | null>(null); // ✅ FIXED: Allow null
  
  const [state, setState] = useState<UseShareCardState>({
    isCapturing: false,
    isSharing: false,
    lastCapturedUri: null,
    error: null,
  });

  // ============================================================================
  // CAPTURE CARD AS IMAGE
  // ============================================================================

  const captureCard = useCallback(async (options: CaptureOptions = {}): Promise<string | null> => {
    if (!viewRef.current) {
      setState(prev => ({ ...prev, error: 'View reference not found' }));
      return null;
    }

    setState(prev => ({ ...prev, isCapturing: true, error: null }));

    try {
      const {
        format = 'png',
        quality = 1.0,
        width,
        height,
      } = options;

      // ✅ CORRECT: captureRef from react-native-view-shot
      const uri = await captureRef(viewRef as any, {
        format,
        quality,
        width,
        height,
        result: 'tmpfile', // Save to temp directory
      });

      console.log('✅ Card captured successfully:', uri);

      setState(prev => ({
        ...prev,
        isCapturing: false,
        lastCapturedUri: uri,
      }));

      return uri;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture card';
      console.error('❌ Error capturing card:', error);
      
      setState(prev => ({
        ...prev,
        isCapturing: false,
        error: errorMessage,
      }));

      Alert.alert('Capture Failed', errorMessage);
      return null;
    }
  }, []);

  // ============================================================================
  // SHARE CARD IMAGE
  // ============================================================================

  const shareCard = useCallback(async (cardType?: ShareCardType): Promise<ShareResult> => {
    const { lastCapturedUri } = state;

    if (!lastCapturedUri) {
      const error = 'No captured image to share. Please capture first.';
      setState(prev => ({ ...prev, error }));
      Alert.alert('Share Failed', error);
      return { success: false, error, shared: false };
    }

    setState(prev => ({ ...prev, isSharing: true, error: null }));

    try {
      // Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(lastCapturedUri);
      
      if (!fileInfo.exists) {
        throw new Error('Captured image file not found');
      }

      // ✅ CORRECT: Prepare share options for react-native-share
      const shareOptions = {
        title: cardType 
          ? `PI HEALTH - ${cardType.replace('-', ' ').toUpperCase()} Card`
          : 'PI HEALTH - Share Card',
        message: 'Track. Analyze. Thrive with PI HEALTH! 🏥✨\n\nDownload now: https://play.google.com/store/apps/details?id=com.ab1224.HealthPathMobile',
        url: lastCapturedUri.startsWith('file://') ? lastCapturedUri : `file://${lastCapturedUri}`,
        type: 'image/png',
        subject: 'My Health Journey with PI HEALTH',
        failOnCancel: false, // Don't throw error if user cancels
      };

      // ✅ CORRECT: Open native share dialog
      const result = await Share.open(shareOptions);

      console.log('✅ Share result:', result);

      setState(prev => ({ ...prev, isSharing: false }));

      // Check if user actually shared (not cancelled)
      const shared = result && result.success !== false;

      return {
        success: true,
        imageUri: lastCapturedUri,
        shared,
      };
    } catch (error: any) {
      // User cancelled share dialog
      if (error.message === 'User did not share' || error.message?.includes('cancel')) {
        console.log('ℹ️ User cancelled share');
        setState(prev => ({ ...prev, isSharing: false }));
        return {
          success: true,
          imageUri: lastCapturedUri,
          shared: false,
        };
      }

      // Actual error occurred
      const errorMessage = error instanceof Error ? error.message : 'Failed to share card';
      console.error('❌ Error sharing card:', error);
      
      setState(prev => ({
        ...prev,
        isSharing: false,
        error: errorMessage,
      }));

      Alert.alert('Share Failed', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        shared: false,
      };
    }
  }, [state.lastCapturedUri]);

  // ============================================================================
  // CAPTURE AND SHARE (COMBINED)
  // ============================================================================

  const captureAndShare = useCallback(async (cardType?: ShareCardType): Promise<ShareResult> => {
    // First capture
    const uri = await captureCard({
      format: 'png',
      quality: 1.0,
    });

    if (!uri) {
      return {
        success: false,
        error: 'Failed to capture card',
        shared: false,
      };
    }

    // Small delay to ensure capture is complete
    await new Promise(resolve => setTimeout(resolve, 300));

    // Then share
    return shareCard(cardType);
  }, [captureCard, shareCard]);

  // ============================================================================
  // CLEAR ERROR
  // ============================================================================

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ============================================================================
  // RETURN HOOK VALUES
  // ============================================================================

  return {
    viewRef,
    captureCard,
    shareCard,
    captureAndShare,
    clearError,
    ...state,
  };
}

// ============================================================================
// HOOK WITH DATA VALIDATION
// ============================================================================

interface UseShareCardWithDataProps {
  cardType: ShareCardType;
  data: Record<string, any>;
}

/**
 * Extended hook with automatic data validation
 */
export function useShareCardWithData({ cardType, data }: UseShareCardWithDataProps) {
  const shareCardHook = useShareCard();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateAndCapture = useCallback(async (options?: CaptureOptions) => {
    setIsValidating(true);
    setValidationError(null);

    const validation = validateCardData(cardType, data);

    if (!validation.available) {
      setValidationError(validation.reason || 'Data validation failed');
      Alert.alert('Cannot Generate Card', validation.reason || 'Missing required data');
      setIsValidating(false);
      return null;
    }

    setIsValidating(false);
    return shareCardHook.captureCard(options);
  }, [cardType, data, shareCardHook]);

  const validateAndShare = useCallback(async () => {
    setIsValidating(true);
    setValidationError(null);

    const validation = validateCardData(cardType, data);

    if (!validation.available) {
      setValidationError(validation.reason || 'Data validation failed');
      Alert.alert('Cannot Share Card', validation.reason || 'Missing required data');
      setIsValidating(false);
      return {
        success: false,
        error: validation.reason,
        shared: false,
      };
    }

    setIsValidating(false);
    return shareCardHook.captureAndShare(cardType);
  }, [cardType, data, shareCardHook]);

  return {
    ...shareCardHook,
    isValidating,
    validationError,
    validateAndCapture,
    validateAndShare,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default useShareCard;
