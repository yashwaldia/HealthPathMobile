/**
 * useShareCard Hook
 * Custom hook for capturing and sharing card components
 */

import type { ShareCardType, ShareResult } from '@/types/shareCard';
import * as FileSystem from 'expo-file-system';
import { useCallback, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import Share from 'react-native-share';
import { captureRef } from 'react-native-view-shot';

interface UseShareCardState {
  isCapturing: boolean;
  isSharing: boolean;
  lastCapturedUri: string | null;
  error: string | null;
}

interface UseShareCardReturn extends UseShareCardState {
  viewRef: React.RefObject<View | null>;
  captureCard: (options?: CaptureOptions) => Promise<string | null>;
  shareCard: (cardType?: ShareCardType) => Promise<ShareResult>;
  captureAndShare: (cardType?: ShareCardType) => Promise<ShareResult>;
  clearError: () => void;
}

interface CaptureOptions {
  format?: 'png' | 'jpg';
  quality?: number;
  width?: number;
  height?: number;
}

export function useShareCard(): UseShareCardReturn {
  const viewRef = useRef<View | null>(null);

  const [state, setState] = useState<UseShareCardState>({
    isCapturing: false,
    isSharing: false,
    lastCapturedUri: null,
    error: null,
  });

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
        width = 1080,
        height = 1920,
      } = options;

      console.log('📸 Capturing with options:', { format, quality, width, height });

      // small delay to ensure layout finished
      await new Promise(resolve => setTimeout(resolve, 200));

      const uri = await captureRef(viewRef.current, {
        format,
        quality,
        width,
        height,
        result: 'tmpfile',
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
      const fileInfo = await FileSystem.getInfoAsync(lastCapturedUri);
      if (!fileInfo.exists) {
        throw new Error('Captured image file not found');
      }

      console.log('📤 Sharing image:', lastCapturedUri);

      const shareOptions = {
        title: cardType
          ? `HealthPath - ${cardType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Card`
          : 'HealthPath - Share Card',
        message: 'Track your health journey with HealthPath! 🏥✨',
        url: lastCapturedUri.startsWith('file://') ? lastCapturedUri : `file://${lastCapturedUri}`,
        type: 'image/png',
        subject: 'My Health Journey',
        failOnCancel: false,
      };

      const result = await Share.open(shareOptions);

      console.log('✅ Share result:', result);

      setState(prev => ({ ...prev, isSharing: false }));

      const shared = result && result.success !== false;

      return {
        success: true,
        imageUri: lastCapturedUri,
        shared,
      };
    } catch (error: any) {
      if (error?.message === 'User did not share' || error?.message?.includes('cancel')) {
        console.log('ℹ️ User cancelled share');
        setState(prev => ({ ...prev, isSharing: false }));
        return {
          success: true,
          imageUri: state.lastCapturedUri!,
          shared: false,
        };
      }

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

  const captureAndShare = useCallback(async (cardType?: ShareCardType): Promise<ShareResult> => {
    console.log('🎯 Starting captureAndShare process...');

    const uri = await captureCard({
      format: 'png',
      quality: 1.0,
      width: 1080,
      height: 1920,
    });

    if (!uri) {
      return {
        success: false,
        error: 'Failed to capture card',
        shared: false,
      };
    }

    console.log('✅ Capture complete, starting share...');

    await new Promise(resolve => setTimeout(resolve, 300));

    return shareCard(cardType);
  }, [captureCard, shareCard]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    viewRef,
    captureCard,
    shareCard,
    captureAndShare,
    clearError,
    ...state,
  };
}

export default useShareCard;
