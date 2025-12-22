// components/medication/CircularProgress.tsx
// SVG Circular Progress Indicator for medication adherence
// Last Updated: December 18, 2025

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  /**
   * Adherence percentage (0-100)
   */
  percentage: number;
  /**
   * Size of the circular progress (default: 80)
   */
  size?: number;
  /**
   * Width of the stroke (default: 8)
   */
  strokeWidth?: number;
  /**
   * Color for the progress arc
   */
  strokeColor?: string;
  /**
   * Background color for the track
   */
  trackColor?: string;
  /**
   * Color for the percentage text
   */
  textColor?: string;
  /**
   * Show percentage text in center (default: true)
   */
  showPercentage?: boolean;
  /**
   * Additional label below percentage
   */
  label?: string;
  /**
   * Font size for percentage text
   */
  textSize?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage = 0,
  size = 80,
  strokeWidth = 8,
  strokeColor = '#10B981', // Green by default
  trackColor = '#E5E7EB',
  textColor = '#374151',
  showPercentage = true,
  label,
  textSize = 14,
}) => {
  // Clamp percentage between 0-100
  const safePercentage = Math.max(0, Math.min(100, Math.round(percentage)));
  
  // Dynamic stroke color based on percentage (same as desktop)
  const getStrokeColor = (): string => {
    if (safePercentage >= 75) return '#10B981'; // Green
    if (safePercentage >= 50) return '#F59E0B'; // Yellow/Orange
    return '#EF4444'; // Red
  };
  
  const finalStrokeColor = strokeColor || getStrokeColor();
  
  // SVG Calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeOpacity={0.3}
        />
        
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={finalStrokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeOpacity={0.9}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      
      {/* Center content */}
      {showPercentage && (
        <View style={[styles.centerContent, { width: size, height: size }]}>
          <Text 
            style={[
              styles.percentageText, 
              { 
                color: textColor || finalStrokeColor,
                fontSize: textSize,
              }
            ]}
            numberOfLines={1}
          >
            {safePercentage}%
          </Text>
          
          {label && (
            <Text style={[styles.labelText, { color: textColor }]}>
              {label}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    includeFontPadding: false,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
    includeFontPadding: false,
  },
});

export default CircularProgress;

// Pre-styled variants for quick use
export const MedicationAdherenceProgress: React.FC<{
  adherence: number;
  size?: number;
}> = ({ adherence, size = 80 }) => (
  <CircularProgress
    percentage={adherence}
    size={size}
    strokeWidth={8}
    showPercentage={true}
    label="Adherence"
    textSize={14}
  />
);

export const CompactProgress: React.FC<{
  percentage: number;
  size?: number;
}> = ({ percentage, size = 60 }) => (
  <CircularProgress
    percentage={percentage}
    size={size}
    strokeWidth={6}
    showPercentage={true}
    label=""
    textSize={12}
  />
);

export const LargeProgress: React.FC<{
  percentage: number;
  label?: string;
}> = ({ percentage, label = "Progress" }) => (
  <CircularProgress
    percentage={percentage}
    size={100}
    strokeWidth={10}
    showPercentage={true}
    label={label}
    textSize={18}
  />
);
