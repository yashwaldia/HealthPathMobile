import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface CustomToastProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onHide: () => void;
  duration?: number;
}

export default function CustomToast({
  visible,
  message,
  type,
  onHide,
  duration = 3000,
}: CustomToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Slide in animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Reset animation values
      translateY.setValue(-100);
      opacity.setValue(0);
      scale.setValue(0.9);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  const config = {
    success: {
      icon: 'checkmark-circle',
      color: '#10B981',
      bg: '#FFFFFF',
      borderColor: '#10B981',
      shadowColor: '#10B981',
    },
    error: {
      icon: 'close-circle',
      color: '#EF4444',
      bg: '#FFFFFF',
      borderColor: '#EF4444',
      shadowColor: '#EF4444',
    },
    info: {
      icon: 'information-circle',
      color: '#3B82F6',
      bg: '#FFFFFF',
      borderColor: '#3B82F6',
      shadowColor: '#3B82F6',
    },
    warning: {
      icon: 'warning',
      color: '#F59E0B',
      bg: '#FFFFFF',
      borderColor: '#F59E0B',
      shadowColor: '#F59E0B',
    },
  };

  const { icon, color, bg, borderColor, shadowColor } = config[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          borderLeftColor: borderColor,
          transform: [{ translateY }, { scale }],
          opacity,
          shadowColor,
        },
      ]}
    >
      {/* Left colored accent bar */}
      <View style={[styles.accentBar, { backgroundColor: color }]} />

      {/* Icon with animated background */}
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>

      {/* Message */}
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>

      {/* Close button */}
      <TouchableOpacity onPress={hideToast} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={20} color={Colors.light.textSecondary} />
      </TouchableOpacity>

      {/* Progress bar */}
      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: color,
            width: `${(duration / 3000) * 100}%`,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    maxWidth: width - 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 9999,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});
