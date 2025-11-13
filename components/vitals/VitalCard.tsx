import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { VitalCardData, VitalStatus } from '../../types/vitals';
import { timeSince } from '../../services/vitalsService';

interface VitalCardProps {
  card: VitalCardData;
  onPress: () => void;
}

const getStatusColor = (status: VitalStatus) => {
  switch (status) {
    case 'critical': return Colors.light.error;
    case 'alert': return Colors.light.warning;
    default: return Colors.light.success;
  }
};

const VitalCard: React.FC<VitalCardProps> = ({ card, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.vitalCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: Colors.light.background }]}>
          <Ionicons name={card.icon as any} size={24} color={Colors.light.primary} />
        </View>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(card.status) }]} />
      </View>
      <Text style={styles.cardTitle}>{card.title}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.cardValue}>{card.latestValue}</Text>
        <Text style={styles.cardUnit}> {card.unit}</Text>
      </View>
      {card.lastUpdated && <Text style={styles.lastUpdated}>{timeSince(card.lastUpdated)}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  vitalCard: {
    width: '48%',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 140,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.cardBackground,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  cardUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  lastUpdated: {
    fontSize: 10,
    color: Colors.light.textLight,
    fontWeight: '500',
  },
});

export default VitalCard;
