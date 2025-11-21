// components/upload/UploadProgressBar.tsx

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../constants/colors';
import { UploadProgress } from '../../types/upload';
import { Ionicons } from '@expo/vector-icons';

interface UploadProgressBarProps {
  progress: UploadProgress;
}

export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({ progress }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: progress.progress,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Animate spinner for analyzing state
    if (progress.status === 'analyzing') {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [progress.progress, progress.status]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'uploading':
        return 'cloud-upload-outline';
      case 'analyzing':
        return 'sparkles-outline';
      case 'complete':
        return 'checkmark-circle-outline';
      case 'error':
        return 'close-circle-outline';
      default:
        return 'document-outline';
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'uploading':
        return Colors.light.upload.uploading;
      case 'analyzing':
        return Colors.light.upload.analyzing;
      case 'complete':
        return Colors.light.upload.success;
      case 'error':
        return Colors.light.upload.error;
      default:
        return Colors.light.upload.idle;
    }
  };

  if (progress.status === 'idle') return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={{ transform: [{ rotate: progress.status === 'analyzing' ? spin : '0deg' }] }}>
          <Ionicons 
            name={getStatusIcon() as any} 
            size={24} 
            color={getStatusColor()} 
          />
        </Animated.View>
        <View style={styles.textContainer}>
          <Text style={styles.message}>{progress.message}</Text>
          {progress.currentFile && (
            <Text style={styles.fileName} numberOfLines={1}>
              {progress.currentFile}
            </Text>
          )}
        </View>
        {progress.status !== 'error' && progress.status !== 'complete' && (
          <Text style={styles.percentage}>{Math.round(progress.progress)}%</Text>
        )}
      </View>

      {progress.status !== 'complete' && progress.status !== 'error' && (
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: getStatusColor(),
              },
            ]}
          />
        </View>
      )}

      {progress.error && (
        <Text style={styles.errorText}>{progress.error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  fileName: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
    marginLeft: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.light.upload.progressBackground,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  errorText: {
    fontSize: 12,
    color: Colors.light.error,
    marginTop: 8,
  },
});

