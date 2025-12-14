// components/wellness/skin-hair/SkinHairOverviewCard.tsx
// Enhanced overview card showing comprehensive skin and hair health status
// Last Updated: December 13, 2025


import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';


interface SkinHairOverviewCardProps {
  skinStatus: string;
  skinColor: string;
  skinIcon: string;
  skinDescription?: string;
  skinCharacteristics?: string[];
  hairStatus: string;
  hairColor: string;
  hairIcon: string;
  hairDescription?: string;
  hairCharacteristics?: string[];
  lastCheckupDate?: string;
  onDetailsPress?: () => void;
}


export default function SkinHairOverviewCard({
  skinStatus,
  skinColor,
  skinIcon,
  skinDescription,
  skinCharacteristics,
  hairStatus,
  hairColor,
  hairIcon,
  hairDescription,
  hairCharacteristics,
  lastCheckupDate,
  onDetailsPress,
}: SkinHairOverviewCardProps) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={24} color={Colors.light.primary} />
          <Text style={styles.title}>Health Overview</Text>
        </View>
        {lastCheckupDate && (
          <View style={styles.dateChip}>
            <Ionicons name="calendar-outline" size={14} color={Colors.light.textSecondary} />
            <Text style={styles.dateText}>{lastCheckupDate}</Text>
          </View>
        )}
      </View>


      {/* Status Container */}
      <View style={styles.statusContainer}>
        {/* Skin Status */}
        <View style={styles.statusItem}>
          <View style={[styles.iconContainer, { backgroundColor: skinColor + '15' }]}>
            <Ionicons name={skinIcon as any} size={36} color={skinColor} />
          </View>
          
          <View style={styles.statusContent}>
            <Text style={styles.statusLabel}>Skin Health</Text>
            <Text style={[styles.statusValue, { color: skinColor }]}>{skinStatus}</Text>
            {skinDescription && (
              <Text style={styles.statusDescription}>{skinDescription}</Text>
            )}
          </View>

          {/* Characteristics */}
          {skinCharacteristics && skinCharacteristics.length > 0 && (
            <View style={styles.characteristicsContainer}>
              {skinCharacteristics.slice(0, 3).map((char, index) => (
                <View key={index} style={styles.characteristicItem}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={14} 
                    color={skinColor} 
                  />
                  <Text style={styles.characteristicText} numberOfLines={1}>
                    {char}
                  </Text>
                </View>
              ))}
              {skinCharacteristics.length > 3 && (
                <Text style={styles.moreText}>
                  +{skinCharacteristics.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>


        {/* Hair Status */}
        <View style={styles.statusItem}>
          <View style={[styles.iconContainer, { backgroundColor: hairColor + '15' }]}>
            <Ionicons name={hairIcon as any} size={36} color={hairColor} />
          </View>
          
          <View style={styles.statusContent}>
            <Text style={styles.statusLabel}>Hair Health</Text>
            <Text style={[styles.statusValue, { color: hairColor }]}>{hairStatus}</Text>
            {hairDescription && (
              <Text style={styles.statusDescription}>{hairDescription}</Text>
            )}
          </View>

          {/* Characteristics */}
          {hairCharacteristics && hairCharacteristics.length > 0 && (
            <View style={styles.characteristicsContainer}>
              {hairCharacteristics.slice(0, 3).map((char, index) => (
                <View key={index} style={styles.characteristicItem}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={14} 
                    color={hairColor} 
                  />
                  <Text style={styles.characteristicText} numberOfLines={1}>
                    {char}
                  </Text>
                </View>
              ))}
              {hairCharacteristics.length > 3 && (
                <Text style={styles.moreText}>
                  +{hairCharacteristics.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>
      </View>


      {/* Action Button */}
      <TouchableOpacity 
        style={styles.detailsButton}
        onPress={onDetailsPress}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="information-circle-outline" 
          size={18} 
          color={Colors.light.primary} 
        />
        <Text style={styles.detailsButtonText}>View Detailed Analysis</Text>
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={Colors.light.primary} 
        />
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statusItem: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border + '50',
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusContent: {
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  characteristicsContainer: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border + '50',
  },
  characteristicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  characteristicText: {
    flex: 1,
    fontSize: 11,
    color: Colors.light.text,
    lineHeight: 16,
  },
  moreText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    fontStyle: 'italic',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: Colors.light.primary + '12',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.primary + '20',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
    letterSpacing: 0.2,
  },
});
